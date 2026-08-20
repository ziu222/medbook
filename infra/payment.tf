resource "aws_secretsmanager_secret" "vnpay" {
  name        = "${local.name}/vnpay"
  description = "VNPAY credentials populated manually outside Terraform."

  tags = merge(local.common_tags, {
    Service = "api"
  })
}
