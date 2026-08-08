variable "state_bucket_name" {
  description = "S3 bucket name used for Terraform state"
  type        = string
}

variable "aws_region" {
  description = "AWS region for the state bucket"
  type        = string
}
