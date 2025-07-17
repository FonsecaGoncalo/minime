resource "aws_cloudwatch_event_bus" "minime" {
  name = var.event_bus_name
}

############
# ConversationStart
############
resource "aws_cloudwatch_event_rule" "conversation_start_rule" {
  name           = "conversation-start"
  event_bus_name = aws_cloudwatch_event_bus.minime.name
  event_pattern = jsonencode({
    source = ["minime.chat"],
    "detail-type" = ["ConversationStart"]
  })
}

resource "aws_cloudwatch_event_target" "conversation_start_target" {
  event_bus_name = aws_cloudwatch_event_bus.minime.name
  rule           = aws_cloudwatch_event_rule.conversation_start_rule.name
  target_id      = "queue"
  arn            = aws_sqs_queue.conversation_start_queue.arn
}

resource "aws_lambda_event_source_mapping" "conversation_start_mapping" {
  event_source_arn = aws_sqs_queue.conversation_start_queue.arn
  function_name    = aws_lambda_function.ip_geolocation_handler.arn
  batch_size       = 1
}

############
# ConversationEnded
############
resource "aws_cloudwatch_event_rule" "conversation_end_rule" {
  name           = "conversation-ended"
  event_bus_name = aws_cloudwatch_event_bus.minime.name
  event_pattern = jsonencode({
    source = ["minime.chat"],
    "detail-type" = ["ConversationEnded"]
  })
}

resource "aws_cloudwatch_event_target" "conversation_end_target" {
  event_bus_name = aws_cloudwatch_event_bus.minime.name
  rule           = aws_cloudwatch_event_rule.conversation_end_rule.name
  target_id      = "queue"
  arn            = aws_sqs_queue.conversation_end_queue.arn
}

resource "aws_lambda_event_source_mapping" "conversation_end_mapping" {
  event_source_arn = aws_sqs_queue.conversation_end_queue.arn
  function_name    = aws_lambda_function.conversation_summary_handler.arn
  batch_size       = 1
}
