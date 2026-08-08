output "user_pool_id" {
  description = "Cognito User Pool ID."
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_endpoint" {
  description = "Cognito issuer endpoint."
  value       = aws_cognito_user_pool.this.endpoint
}

output "app_client_id" {
  description = "Public SPA app client ID."
  value       = aws_cognito_user_pool_client.spa.id
}

output "managed_login_url" {
  description = "Cognito managed-login base URL."
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}
