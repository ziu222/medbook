variable "aws_region" {
  description = "AWS region for the ECR repository."
  type        = string
}

variable "project" {
  description = "Project identifier used in the repository name."
  type        = string
}
