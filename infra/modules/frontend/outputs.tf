output "bucket_id" {
  description = "Frontend S3 bucket ID."
  value       = aws_s3_bucket.frontend.id
}

output "distribution_id" {
  description = "CloudFront distribution ID."
  value       = aws_cloudfront_distribution.this.id
}

output "distribution_domain_name" {
  description = "CloudFront distribution hostname used as the DNS CNAME target."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "web_acl_arn" {
  description = "CloudFront-scoped WAF web ACL ARN."
  value       = aws_wafv2_web_acl.cloudfront.arn
}

output "url" {
  description = "CloudFront application URL."
  value       = "https://${var.domain_name}"
}
