locals {
  common_tags = merge(var.tags, {
    Module = "acm"
  })
}

data "cloudflare_zone" "this" {
  filter = {
    name = var.cloudflare_zone_name
  }
}

resource "aws_acm_certificate" "this" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = merge(local.common_tags, {
    Name = "acm-certificate"
  })

  lifecycle {
    create_before_destroy = true
  }
}

locals {
  validation_option = one(aws_acm_certificate.this.domain_validation_options)
}

resource "cloudflare_dns_record" "validation" {
  zone_id = data.cloudflare_zone.this.id
  name    = trimsuffix(local.validation_option.resource_record_name, ".")
  type    = local.validation_option.resource_record_type
  content = trimsuffix(local.validation_option.resource_record_value, ".")
  ttl     = 60
  proxied = false
}

resource "aws_acm_certificate_validation" "this" {
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [cloudflare_dns_record.validation.name]
}
