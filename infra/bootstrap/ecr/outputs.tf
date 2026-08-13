output "repository_url" {
  description = "ECR repository URL used to build backend_image_uri."
  value       = aws_ecr_repository.backend.repository_url
}

output "repository_arn" {
  description = "ECR repository ARN."
  value       = aws_ecr_repository.backend.arn
}
