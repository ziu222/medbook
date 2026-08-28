data "aws_caller_identity" "current" {}

resource "aws_cognito_user_pool" "this" {
  name                     = "${var.name}-users"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "MedBook — mã xác thực của bạn"
    email_message        = "Mã xác thực MedBook của bạn là {####}"
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  lambda_config {
    post_confirmation = aws_lambda_function.post_confirmation.arn
  }

  tags = merge(var.tags, {
    Module = "cognito"
    Name   = "user-pool"
  })
}

resource "aws_cognito_user_pool_client" "spa" {
  name         = "${var.name}-spa"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret                      = false
  prevent_user_existence_errors        = "ENABLED"
  supported_identity_providers         = ["COGNITO"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.name}-${data.aws_caller_identity.current.account_id}"
  user_pool_id = aws_cognito_user_pool.this.id
}

resource "aws_cognito_user_group" "roles" {
  for_each = toset(["patient", "doctor", "admin"])

  name         = each.value
  user_pool_id = aws_cognito_user_pool.this.id
}

# Self-service signup has no role picker, so every self-registered account defaults to
# "patient" — without this, new users have no application role and every role-gated
# endpoint (booking, appointments, payments) 403s them.
data "aws_iam_policy_document" "post_confirmation_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "post_confirmation" {
  name               = "${var.name}-post-confirmation"
  assume_role_policy = data.aws_iam_policy_document.post_confirmation_assume.json

  tags = merge(var.tags, {
    Module = "cognito"
    Name   = "post-confirmation"
  })
}

resource "aws_iam_role_policy_attachment" "post_confirmation_basic" {
  role       = aws_iam_role.post_confirmation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "post_confirmation_cognito" {
  statement {
    actions   = ["cognito-idp:AdminAddUserToGroup"]
    resources = [aws_cognito_user_pool.this.arn]
  }
}

resource "aws_iam_role_policy" "post_confirmation_cognito" {
  name   = "${var.name}-post-confirmation-cognito"
  role   = aws_iam_role.post_confirmation.id
  policy = data.aws_iam_policy_document.post_confirmation_cognito.json
}

data "archive_file" "post_confirmation" {
  type        = "zip"
  source_file = "${path.module}/lambda/post_confirmation.py"
  output_path = "${path.module}/post_confirmation.zip"
}

resource "aws_lambda_function" "post_confirmation" {
  function_name    = "${var.name}-post-confirmation"
  role             = aws_iam_role.post_confirmation.arn
  handler          = "post_confirmation.handler"
  runtime          = "python3.13"
  filename         = data.archive_file.post_confirmation.output_path
  source_code_hash = data.archive_file.post_confirmation.output_base64sha256
  timeout          = 10

  tags = merge(var.tags, {
    Module = "cognito"
    Name   = "post-confirmation"
  })
}

resource "aws_lambda_permission" "post_confirmation_cognito_invoke" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.this.arn
}
