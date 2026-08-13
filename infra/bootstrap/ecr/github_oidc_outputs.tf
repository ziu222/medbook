output "github_ecr_push_role_arn" {
  description = "IAM role assumed by the main branch GitHub Actions workflow to push backend images."
  value       = aws_iam_role.github_ecr_push.arn
}
