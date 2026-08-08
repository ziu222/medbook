output "endpoint" {
  description = "PostgreSQL endpoint including port."
  value       = aws_db_instance.main.endpoint
}

output "host" {
  description = "PostgreSQL hostname."
  value       = aws_db_instance.main.address
}

output "port" {
  description = "PostgreSQL port."
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Application database name."
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "Application database master username."
  value       = aws_db_instance.main.username
}

output "master_secret_arn" {
  description = "Secrets Manager ARN for the RDS-managed master password."
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
}
