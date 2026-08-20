variable "aws_region" {
  description = "AWS region used to build regional endpoint service names."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "private_subnets" {
  description = "Map of availability zone to private subnet CIDR"
  type        = map(string)

  validation {
    condition     = length(var.private_subnets) > 0
    error_message = "At least one private subnet is required."
  }
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
