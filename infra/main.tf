locals {
  name          = var.project
  vpc_cidr      = "10.0.0.0/16"
  image_sha     = "test-17"
  vnpay_pay_url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  vnpay_api_url = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"

  common_tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

module "network" {
  source = "./modules/network"

  vpc_cidr = local.vpc_cidr
  private_subnets = {
    (data.aws_availability_zones.available.names[0]) = cidrsubnet(local.vpc_cidr, 8, 10)
    (data.aws_availability_zones.available.names[1]) = cidrsubnet(local.vpc_cidr, 8, 11)
  }
  public_subnet = {
    availability_zone = data.aws_availability_zones.available.names[0]
    cidr_block        = cidrsubnet(local.vpc_cidr, 8, 0)
  }

  tags = local.common_tags
}

module "rds" {
  source = "./modules/rds"

  vpc_id                    = module.network.vpc_id
  identifier                = "${local.name}-postgres"
  allowed_security_group_id = module.network.lambda_security_group_id
  instance_class            = var.db_instance_class
  subnet_ids                = module.network.private_subnet_ids

  tags = local.common_tags
}

module "cognito" {
  source = "./modules/cognito"

  aws_region = var.aws_region
  name       = local.name
  callback_urls = concat(
    var.cognito_callback_urls,
    ["https://${var.domain_name}/auth/callback"],
  )
  logout_urls = concat(
    var.cognito_logout_urls,
    ["https://${var.domain_name}/"],
  )

  tags = local.common_tags
}

module "acm" {
  source = "./modules/acm"

  providers = {
    aws        = aws.us_east_1
    cloudflare = cloudflare
  }

  domain_name          = var.domain_name
  cloudflare_zone_name = var.cloudflare_zone_name

  tags = local.common_tags
}

module "notifications" {
  source = "./modules/notifications"

  providers = {
    aws        = aws
    cloudflare = cloudflare
  }

  name                  = local.name
  image_uri             = "640012953073.dkr.ecr.ap-southeast-1.amazonaws.com/medbook-backend:${local.image_sha}"
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_user_pool_arn = module.cognito.user_pool_arn
  domain_name           = var.domain_name
  cloudflare_zone_name  = var.cloudflare_zone_name
  vnpay_secret_arn      = aws_secretsmanager_secret.vnpay.arn
  vnpay_pay_url         = local.vnpay_pay_url
  vnpay_return_url      = "https://${var.domain_name}/payment/result"
  vnpay_api_url         = local.vnpay_api_url
  api_function_name     = "${local.name}-api:live"
  tags                  = local.common_tags
}

module "api" {
  source = "./modules/api"

  name                       = local.name
  image_uri                  = "640012953073.dkr.ecr.ap-southeast-1.amazonaws.com/medbook-backend:${local.image_sha}"
  memory_size                = 1024
  reserved_concurrency       = -1
  private_subnet_ids         = module.network.private_subnet_ids
  lambda_security_group_id   = module.network.lambda_security_group_id
  database_host              = module.rds.host
  database_port              = module.rds.port
  database_name              = module.rds.database_name
  database_username          = module.rds.username
  database_secret_arn        = module.rds.master_secret_arn
  cognito_user_pool_id       = module.cognito.user_pool_id
  cognito_user_pool_arn      = module.cognito.user_pool_arn
  cognito_user_pool_endpoint = module.cognito.user_pool_endpoint
  cognito_app_client_id      = module.cognito.app_client_id
  notification_queue_arn     = module.notifications.queue_arn
  notification_queue_url     = module.notifications.queue_url
  vnpay_secret_arn           = aws_secretsmanager_secret.vnpay.arn
  vnpay_pay_url              = local.vnpay_pay_url
  vnpay_return_url           = "https://${var.domain_name}/payment/result"

  depends_on = [module.network]
}

module "frontend" {
  source = "./modules/frontend"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name                    = local.name
  api_endpoint            = module.api.api_endpoint
  domain_name             = var.domain_name
  certificate_arn         = module.acm.certificate_arn
  waf_rate_limit_per_5min = 2000

  tags = local.common_tags
}

resource "cloudflare_dns_record" "app" {
  zone_id = module.acm.cloudflare_zone_id
  name    = var.domain_name
  type    = "CNAME"
  content = module.frontend.distribution_domain_name
  ttl     = 60
  proxied = false
}

resource "aws_budgets_budget" "monthly" {
  name         = "${local.name}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = [format("user:Project$%s", var.project)]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  tags = merge(local.common_tags, {
    Service = "finops"
  })
}
