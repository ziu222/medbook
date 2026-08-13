variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "identifier" {
  description = "RDS instance identifier"
  type        = string
}

variable "allowed_security_group_id" {
  description = "Security group ID allowed to connect to PostgreSQL"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class."
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
