output "lambda_alias_arn" {
  description = "Live API Lambda alias ARN."
  value       = aws_lambda_alias.api.arn
}
