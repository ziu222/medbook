locals {
  sender_email = "no-reply@${var.domain_name}"
  common_tags = merge(var.tags, {
    Module  = "notifications"
    Service = "worker"
  })
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

data "cloudflare_zone" "this" {
  filter = {
    name = var.cloudflare_zone_name
  }
}

resource "aws_ses_domain_identity" "this" {
  domain = var.domain_name
}

resource "cloudflare_dns_record" "ses_verification" {
  zone_id = data.cloudflare_zone.this.id
  name    = "_amazonses.${var.domain_name}"
  type    = "TXT"
  content = aws_ses_domain_identity.this.verification_token
  ttl     = 60
  proxied = false
}

resource "aws_ses_domain_dkim" "this" {
  domain = aws_ses_domain_identity.this.domain
}

resource "cloudflare_dns_record" "ses_dkim" {
  count = 3

  zone_id = data.cloudflare_zone.this.id
  name    = "${aws_ses_domain_dkim.this.dkim_tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  content = "${aws_ses_domain_dkim.this.dkim_tokens[count.index]}.dkim.amazonses.com"
  ttl     = 60
  proxied = false
}

resource "aws_ses_domain_identity_verification" "this" {
  domain = aws_ses_domain_identity.this.id

  depends_on = [cloudflare_dns_record.ses_verification]
}

resource "aws_sqs_queue" "dead_letter" {
  name                        = "${var.name}-notification-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = false
  sqs_managed_sse_enabled     = true
  message_retention_seconds   = 1209600

  tags = merge(local.common_tags, {
    Name = "notification-dlq"
  })
}

resource "aws_sqs_queue" "notifications" {
  name                        = "${var.name}-notifications.fifo"
  fifo_queue                  = true
  content_based_deduplication = false
  sqs_managed_sse_enabled     = true
  visibility_timeout_seconds  = 60
  message_retention_seconds   = 345600
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dead_letter.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.common_tags, {
    Name = "notifications"
  })
}

data "aws_iam_policy_document" "worker_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "worker" {
  name               = "${var.name}-notification-worker"
  assume_role_policy = data.aws_iam_policy_document.worker_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "worker_basic" {
  role       = aws_iam_role.worker.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "worker" {
  statement {
    actions = [
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ReceiveMessage",
    ]
    resources = [aws_sqs_queue.notifications.arn]
  }

  statement {
    actions   = ["cognito-idp:AdminGetUser"]
    resources = [var.cognito_user_pool_arn]
  }

  statement {
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"
      values   = [local.sender_email]
    }
  }

  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.vnpay_secret_arn]
  }

  statement {
    actions = ["lambda:InvokeFunction"]
    resources = [
      "arn:${data.aws_partition.current.partition}:lambda:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:function:${var.api_function_name}",
    ]
  }
}

resource "aws_iam_role_policy" "worker" {
  name   = "send-cancellation-email"
  role   = aws_iam_role.worker.id
  policy = data.aws_iam_policy_document.worker.json
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/lambda/${var.name}-notification-worker"
  retention_in_days = 30
  tags              = local.common_tags
}

resource "aws_lambda_function" "worker" {
  function_name = "${var.name}-notification-worker"
  role          = aws_iam_role.worker.arn
  package_type  = "Image"
  image_uri     = var.image_uri
  architectures = ["x86_64"]
  memory_size   = 256
  timeout       = 30

  environment {
    variables = {
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
      SES_FROM_EMAIL       = local.sender_email
      VNPAY_SECRET_ARN     = var.vnpay_secret_arn
      VNPAY_PAY_URL        = var.vnpay_pay_url
      VNPAY_RETURN_URL     = var.vnpay_return_url
      VNPAY_API_URL        = var.vnpay_api_url
      API_FUNCTION_NAME    = var.api_function_name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.worker,
    aws_iam_role_policy.worker,
    aws_iam_role_policy_attachment.worker_basic,
    aws_ses_domain_identity_verification.this,
  ]

  tags = merge(local.common_tags, {
    Name = "notification-worker"
  })
}

resource "aws_lambda_event_source_mapping" "notifications" {
  event_source_arn        = aws_sqs_queue.notifications.arn
  function_name           = aws_lambda_function.worker.arn
  batch_size              = 5
  function_response_types = ["ReportBatchItemFailures"]
}


