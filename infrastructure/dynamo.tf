resource "aws_dynamodb_table" "conversation_table" {
  name         = "Conversations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_dynamodb_table" "rate_limit_table" {
  name         = "RateLimitBuckets"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "bucket_id"

  attribute {
    name = "bucket_id"
    type = "S"
  }
}