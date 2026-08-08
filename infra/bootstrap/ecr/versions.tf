terraform {
  required_version = ">= 1.10.0"

  backend "s3" {
    bucket       = "medbook-tf-state-640012953073-ap-southeast-1-an"
    key          = "medbook/bootstrap/ecr/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
