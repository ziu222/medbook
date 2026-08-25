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

variable "public_subnet" {
  description = "Public subnet hosting the single NAT Gateway."
  type = object({
    availability_zone = string
    cidr_block        = string
  })
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
