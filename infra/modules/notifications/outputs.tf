output "queue_arn" {
  description = "Notification FIFO queue ARN."
  value       = aws_sqs_queue.notifications.arn
}

output "queue_url" {
  description = "Notification FIFO queue URL."
  value       = aws_sqs_queue.notifications.url
}

output "sender_email" {
  description = "Verified email address used as the SES sender."
  value       = local.sender_email
}
