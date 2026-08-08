# MedBook

Online medical appointment platform. The first infrastructure phase is in [`infra/`](infra/).

## Core infrastructure

The Terraform configuration creates:

- A two-AZ VPC with private subnets.
- Private RDS PostgreSQL with an AWS-managed master secret.
- Cognito managed login for React.
- A private S3 frontend bucket behind CloudFront.
- API Gateway and a FastAPI Lambda using a prebuilt ECR image.
- CloudFront WAF managed rules and per-IP rate limiting.
- An optional monthly AWS Budget when an alert email is supplied.

Bedrock, SQS/worker, RDS Proxy, and production backup policy are intentionally deferred.

The application stack is split by lifecycle:

- `network`: VPC, private subnets, Lambda security group, and private endpoints.
- `rds`: PostgreSQL, DB subnet group, and database security group.
- `bootstrap/ecr`: FastAPI image repository and lifecycle policy.
- `cognito`: User Pool, SPA client, managed login, and role groups.
- `api`: FastAPI Lambda, IAM, logs, and API Gateway.
- `frontend`: Private S3 bucket, CloudFront, and origin access policy.

## Bootstrap Terraform state and ECR

Only the project owner runs the apply commands. Bootstrap is intentionally split
in two because the ECR stack stores its state in the S3 bucket created by the
first stack.

First, create the backend bucket using local state:

```bash
terraform -chdir=infra/bootstrap/backend init
terraform -chdir=infra/bootstrap/backend plan
terraform -chdir=infra/bootstrap/backend apply
```

The application backend in `infra/versions.tf` must match the
`state_bucket_id` output from bootstrap.

Second, create ECR using that S3 backend:

```bash
terraform -chdir=infra/bootstrap/ecr init
terraform -chdir=infra/bootstrap/ecr plan
terraform -chdir=infra/bootstrap/ecr apply
terraform -chdir=infra/bootstrap/ecr output -raw repository_url
```

Build the FastAPI Lambda image for `linux/amd64`, push it with an immutable Git
SHA tag, then set its complete URI in `infra/terraform.tfvars`:

```hcl
backend_image_uri = "640012953073.dkr.ecr.ap-southeast-1.amazonaws.com/medbook-backend:abc1234"
```

## Plan the application stack

```bash
cp infra/terraform.tfvars.example infra/terraform.tfvars
terraform -chdir=infra init
terraform -chdir=infra plan
```

The application stack now creates Lambda, its `live` alias, API Gateway, JWT
authorization, the Secrets Manager VPC endpoint, and CloudFront `/api/*` routing
in one apply:

```bash
terraform -chdir=infra apply
```

Before deploying React outside localhost, replace the Cognito callback and logout URLs in `infra/terraform.tfvars` with the CloudFront URL from:

```bash
terraform -chdir=infra output -raw frontend_url
```
