############
# source code bucket
############
resource "aws_s3_bucket" "lambda_code_bucket" {
  bucket = "minime-lambda-code-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_object" "lambda_package" {
  bucket = aws_s3_bucket.lambda_code_bucket.id
  key    = "lambda_package.zip"
  source = "../backend/lambda_package.zip"
  etag   = filemd5("../backend/lambda_package.zip")
}

############
# chat_handler
############
resource "aws_lambda_function" "chat_handler" {
  function_name    = "chat_handler"
  runtime          = "python3.11"
  handler          = "chat_handler.handler"
  s3_bucket        = aws_s3_bucket.lambda_code_bucket.id
  s3_key           = aws_s3_object.lambda_package.key
  source_code_hash = filebase64sha256("../backend/lambda_package.zip")
  timeout          = 300
  memory_size      = 512

  role = aws_iam_role.lambda_exec.arn

  layers = [
    "arn:aws:lambda:${data.aws_region.current.name}:901920570463:layer:aws-otel-python-amd64-ver-1-32-0:2"
  ]

  environment {
    variables = {
      NOTION_API_KEY                                   = var.notion_api_key
      NOTION_DB_ID                                     = var.notion_db_id
      PINECONE_API_KEY                                 = var.pinecone_api_key
      ANTHROPIC_API_KEY                                = var.anthropic_api_key
      GOOGLE_SERVICE_ACCOUNT                           = var.google_service_account
      SES_TO_EMAIL                                     = var.ses_to_email
      EVENT_BUS_NAME                                   = var.event_bus_name
      OTEL_LOGS_EXPORTER                               = "otlp"
      OTEL_EXPORTER_OTLP_ENDPOINT                      = "https://otlp.eu01.nr-data.net:4317"
      OTEL_EXPORTER_OTLP_HEADERS                       = "api-key=${var.newrelic_license_key}"
      OTEL_SERVICE_NAME                                = "chat_handler"
      OTEL_LAMBDA_DISABLE_AWS_CONTEXT_PROPAGATION      = true
      OTEL_LOG_LEVEL                                   = "INFO"
      OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED = true
      AWS_LAMBDA_EXEC_WRAPPER                          = "/opt/otel-instrument"
      ENABLE_FS_INSTRUMENTATION                        = false
      OTEL_PYTHON_DISABLED_INSTRUMENTATIONS            = "pymongo,pymysql,pyramid,redis,sqlalchemy,starlette,tornado,flask,grpc,jinja2,mysql,psycopg2,pymemcache"
      HAYSTACK_TELEMETRY_ENABLED                       = "False"
    }
  }
}

############
# conversation_summary_handler
############
resource "aws_lambda_function" "conversation_summary_handler" {
  function_name    = "conversation_summary_handler"
  runtime          = "python3.11"
  handler          = "conversation_summary_handler.handler"
  s3_bucket        = aws_s3_bucket.lambda_code_bucket.id
  s3_key           = aws_s3_object.lambda_package.key
  source_code_hash = filebase64sha256("../backend/lambda_package.zip")
  timeout          = 300
  memory_size      = 512

  role = aws_iam_role.lambda_exec.arn

  layers = [
    "arn:aws:lambda:${data.aws_region.current.name}:901920570463:layer:aws-otel-python-amd64-ver-1-32-0:2"
  ]

  environment {
    variables = {
      SES_FROM_EMAIL                                   = var.ses_from_email
      SES_TO_EMAIL                                     = var.ses_to_email
      EVENT_BUS_NAME                                   = aws_cloudwatch_event_bus.minime.name
      OTEL_LOGS_EXPORTER                               = "otlp"
      OTEL_EXPORTER_OTLP_ENDPOINT                      = "https://otlp.eu01.nr-data.net:4317"
      OTEL_EXPORTER_OTLP_HEADERS                       = "api-key=${var.newrelic_license_key}"
      OTEL_SERVICE_NAME                                = "conversation_summary_handler"
      OTEL_LAMBDA_DISABLE_AWS_CONTEXT_PROPAGATION      = true
      OTEL_LOG_LEVEL                                   = "INFO"
      OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED = true
      AWS_LAMBDA_EXEC_WRAPPER                          = "/opt/otel-instrument"
      ENABLE_FS_INSTRUMENTATION                        = false
      OTEL_PYTHON_DISABLED_INSTRUMENTATIONS            = "pymongo,pymysql,pyramid,redis,sqlalchemy,starlette,tornado,flask,grpc,jinja2,mysql,psycopg2,pymemcache"
      HAYSTACK_TELEMETRY_ENABLED                       = "False"
    }
  }
}

############
# ip_geolocation_handler
############
resource "aws_lambda_function" "ip_geolocation_handler" {
  function_name    = "ip_geolocation_handler"
  runtime          = "python3.11"
  handler          = "ip_geolocation_handler.handler"
  s3_bucket        = aws_s3_bucket.lambda_code_bucket.id
  s3_key           = aws_s3_object.lambda_package.key
  source_code_hash = filebase64sha256("../backend/lambda_package.zip")
  timeout          = 300
  memory_size      = 512

  role = aws_iam_role.lambda_exec.arn

  layers = [
    "arn:aws:lambda:${data.aws_region.current.name}:901920570463:layer:aws-otel-python-amd64-ver-1-32-0:2"
  ]

  environment {
    variables = {
      OTEL_LOGS_EXPORTER                               = "otlp"
      OTEL_EXPORTER_OTLP_ENDPOINT                      = "https://otlp.eu01.nr-data.net:4317"
      OTEL_EXPORTER_OTLP_HEADERS                       = "api-key=${var.newrelic_license_key}"
      OTEL_SERVICE_NAME                                = "ip_geolocation_handler"
      OTEL_LAMBDA_DISABLE_AWS_CONTEXT_PROPAGATION      = true
      OTEL_LOG_LEVEL                                   = "INFO"
      OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED = true
      AWS_LAMBDA_EXEC_WRAPPER                          = "/opt/otel-instrument"
      ENABLE_FS_INSTRUMENTATION                        = false
      OTEL_PYTHON_DISABLED_INSTRUMENTATIONS            = "pymongo,pymysql,pyramid,redis,sqlalchemy,starlette,tornado,flask,grpc,jinja2,mysql,psycopg2,pymemcache"
      HAYSTACK_TELEMETRY_ENABLED                       = "False"
    }
  }
}

############
# lambda role
############
resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "api_gateway_manage_connections" {
  name = "api-gateway-manage-connections"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "execute-api:ManageConnections",
          "execute-api:Invoke"
        ]
        Resource = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${aws_apigatewayv2_api.websocket_api.id}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_dynamodb_access" {
  name = "lambda-dynamodb-access-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem",
          "dynamodb:BatchGetItem"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_bedrock_invoke" {
  name = "lambda-bedrock-invoke-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:InvokeModel"
        ]
        Resource = [
          "arn:aws:bedrock:*::foundation-model/*",
          "arn:aws:bedrock:*:${data.aws_caller_identity.current.account_id}:inference-profile/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_eventbridge_put" {
  name = "lambda-eventbridge-put-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "events:PutEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_eum_send" {
  name = "lambda-eum-send-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "social-messaging:SendWhatsAppMessage"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ses_lambda_access" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSESFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_sqs_policy_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket_api.execution_arn}/*"
}
