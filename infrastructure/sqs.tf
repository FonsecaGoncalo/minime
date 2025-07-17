resource "aws_sqs_queue" "conversation_start_queue" {
  name = "conversation-start-queue"

  visibility_timeout_seconds = 200

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Principal = { Service = "events.amazonaws.com" },
        Action   = "sqs:SendMessage",
        Resource = "*"
      }
    ]
  })
}

resource "aws_sqs_queue" "conversation_end_queue" {
  name = "conversation-end-queue"

  visibility_timeout_seconds = 200

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Principal = { Service = "events.amazonaws.com" },
        Action   = "sqs:SendMessage",
        Resource = "*"
      }
    ]
  })
}