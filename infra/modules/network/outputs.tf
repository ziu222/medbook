output "vpc_id" {
  description = "Application VPC ID."
  value       = aws_vpc.this.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs used by Lambda and RDS."
  value       = values(aws_subnet.private)[*].id
}

output "lambda_security_group_id" {
  description = "Security group attached to application Lambdas."
  value       = aws_security_group.lambda.id
}
