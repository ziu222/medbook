variable "name" {
  description = "Resource name prefix."
  type        = string
}

variable "image_uri" {
  description = "Immutable ECR image URI for the FastAPI Lambda."
  type        = string
}

variable "memory_size" {
  description = "Lambda memory allocation in MB."
  type        = number
}

variable "reserved_concurrency" {
  description = "Lambda reserved concurrency used to protect PostgreSQL."
  type        = number
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Lambda VPC attachment."
  type        = list(string)
}

variable "lambda_security_group_id" {
  description = "Security group attached to the FastAPI Lambda."
  type        = string
}

variable "database_host" {
  description = "PostgreSQL hostname."
  type        = string
}

variable "database_port" {
  description = "PostgreSQL port."
  type        = number
}

variable "database_name" {
  description = "PostgreSQL database name."
  type        = string
}

variable "database_username" {
  description = "PostgreSQL username."
  type        = string
}

variable "database_secret_arn" {
  description = "Secrets Manager ARN for the database credentials."
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID exposed to the application."
  type        = string
}

variable "cognito_user_pool_endpoint" {
  description = "Cognito issuer endpoint used by the JWT authorizer."
  type        = string
}

variable "cognito_app_client_id" {
  description = "Cognito SPA app client ID used as JWT audience."
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
