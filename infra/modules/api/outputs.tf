output "api_endpoint" {
  description = "Default API Gateway endpoint."
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "execution_arn" {
  description = "API Gateway execution ARN."
  value       = aws_apigatewayv2_api.main.execution_arn
}

output "lambda_function_name" {
  description = "FastAPI Lambda function name."
  value       = aws_lambda_function.api.function_name
}

output "lambda_alias_name" {
  description = "Live Lambda alias name."
  value       = aws_lambda_alias.api.name
}
