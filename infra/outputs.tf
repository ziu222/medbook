output "frontend_bucket" {
  description = "S3 bucket that receives the React build."
  value       = module.frontend.bucket_id
}

output "frontend_url" {
  description = "CloudFront URL for the application."
  value       = module.frontend.url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID used for cache invalidation."
  value       = module.frontend.distribution_id
}

output "cloudfront_web_acl_arn" {
  description = "WAF web ACL attached to CloudFront."
  value       = module.frontend.web_acl_arn
}

output "cloudfront_certificate_arn" {
  description = "Validated us-east-1 ACM certificate."
  value       = module.acm.certificate_arn
}

output "api_endpoint" {
  description = "Direct API Gateway endpoint."
  value       = module.api.api_endpoint
}

output "database_endpoint" {
  description = "Private PostgreSQL endpoint."
  value       = module.rds.endpoint
}

output "database_secret_arn" {
  description = "Secrets Manager ARN for the RDS-managed master password."
  value       = module.rds.master_secret_arn
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID."
  value       = module.cognito.user_pool_id
}

output "cognito_app_client_id" {
  description = "Public Cognito app client ID used by React."
  value       = module.cognito.app_client_id
}

output "cognito_domain" {
  description = "Cognito managed-login domain."
  value       = module.cognito.managed_login_url
}
