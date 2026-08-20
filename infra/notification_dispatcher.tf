data "aws_iam_policy_document" "notification_scheduler_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "notification_scheduler" {
  name               = "${local.name}-notification-scheduler"
  assume_role_policy = data.aws_iam_policy_document.notification_scheduler_assume_role.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "notification_scheduler" {
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [module.api.lambda_alias_arn]
  }
}

resource "aws_iam_role_policy" "notification_scheduler" {
  name   = "invoke-notification-dispatcher"
  role   = aws_iam_role.notification_scheduler.id
  policy = data.aws_iam_policy_document.notification_scheduler.json
}

resource "aws_scheduler_schedule" "notification_dispatcher" {
  name                = "${local.name}-notification-dispatcher"
  schedule_expression = "rate(1 minute)"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = module.api.lambda_alias_arn
    role_arn = aws_iam_role.notification_scheduler.arn
    input    = jsonencode({ operation = "dispatch-notifications" })
  }
}
