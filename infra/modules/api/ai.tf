resource "aws_secretsmanager_secret" "gemini" {
  name        = "${var.name}/gemini"
  description = "Gemini API key populated manually outside Terraform."

  tags = merge(local.common_tags, {
    Name    = "gemini-api-key"
    Service = "ai"
  })
}

resource "aws_apigatewayv2_route" "ai" {
  for_each = toset([
    "POST /api/chat",
    "POST /api/symptoms/classify",
    "POST /api/recommendations/doctors",
  ])

  api_id             = aws_apigatewayv2_api.main.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
