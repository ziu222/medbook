locals {
  common_tags = merge(var.tags, {
    Module = "api"
  })
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.name}"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name = "api-gateway-log-group"
  })
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.name}-api"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = merge(local.common_tags, {
    Name = "lambda-role"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "lambda_database_secret" {
  statement {
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      var.database_secret_arn,
      var.vnpay_secret_arn,
      aws_secretsmanager_secret.gemini.arn,
    ]
  }
}

resource "aws_iam_role_policy" "lambda_database_secret" {
  name   = "read-database-secret"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_database_secret.json
}

data "aws_iam_policy_document" "lambda_notification_queue" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [var.notification_queue_arn]
  }
}

resource "aws_iam_role_policy" "lambda_notification_queue" {
  name   = "send-notifications"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_notification_queue.json
}

resource "aws_cloudwatch_log_group" "api_lambda" {
  name              = "/aws/lambda/${var.name}-api"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name = "api-lambda-log-group"
  })
}

resource "aws_lambda_function" "api" {
  function_name = "${var.name}-api"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = var.image_uri
  architectures = ["x86_64"]

  memory_size                    = var.memory_size
  timeout                        = 30
  reserved_concurrent_executions = var.reserved_concurrency
  publish                        = true

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_security_group_id]
  }

  environment {
    variables = {
      APP_ENV                = "production"
      DB_HOST                = var.database_host
      DB_PORT                = tostring(var.database_port)
      DB_NAME                = var.database_name
      DB_USER                = var.database_username
      DB_SECRET_ARN          = var.database_secret_arn
      COGNITO_USER_POOL_ID   = var.cognito_user_pool_id
      COGNITO_APP_CLIENT_ID  = var.cognito_app_client_id
      NOTIFICATION_QUEUE_URL = var.notification_queue_url
      VNPAY_SECRET_ARN       = var.vnpay_secret_arn
      VNPAY_PAY_URL          = var.vnpay_pay_url
      VNPAY_RETURN_URL       = var.vnpay_return_url
      GEMINI_MODEL           = "gemini-3.5-flash-lite"
      GEMINI_SECRET_ARN      = aws_secretsmanager_secret.gemini.arn
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.api_lambda,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
    aws_iam_role_policy.lambda_database_secret,
    aws_iam_role_policy.lambda_notification_queue,
  ]

  tags = merge(local.common_tags, {
    Name = "api-lambda-function"
  })
}

resource "aws_lambda_alias" "api" {
  name             = "live"
  description      = "Currently deployed API version"
  function_name    = aws_lambda_function.api.function_name
  function_version = aws_lambda_function.api.version
}

resource "aws_apigatewayv2_api" "main" {
  name          = var.name
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["authorization", "content-type"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_origins = ["*"]
    max_age       = 3600
  }

  tags = merge(local.common_tags, {
    Service = "api"
  })
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito"

  jwt_configuration {
    audience = [var.cognito_app_client_id]
    issuer   = "https://${var.cognito_user_pool_endpoint}"
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.api.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "default" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "$default"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "health" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /api/health"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "public_catalog" {
  for_each = toset([
    "GET /api/specialties",
    "GET /api/doctors",
    "GET /api/doctors/{doctor_id}",
    "GET /api/doctors/{doctor_id}/availability",
    "GET /api/doctors/{doctor_id}/reviews",
    "GET /api/facilities",
    "GET /api/facilities/{facility_id}",
  ])

  api_id             = aws_apigatewayv2_api.main.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "vnpay_ipn" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /api/payments/vnpay/ipn"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "cors_preflight" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "OPTIONS /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      routeKey         = "$context.routeKey"
      status           = "$context.status"
      responseLength   = "$context.responseLength"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  tags = merge(local.common_tags, {
    Service = "api"
  })
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  qualifier     = aws_lambda_alias.api.name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
