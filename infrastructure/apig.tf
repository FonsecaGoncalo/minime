# WebSocket API Gateway
resource "aws_apigatewayv2_api" "websocket_api" {
  name                       = "websocket-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

# API Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.websocket_api.id
  name        = "prod"
  auto_deploy = true
}

# API Gateway Integration
resource "aws_apigatewayv2_integration" "websocket_integration" {
  api_id             = aws_apigatewayv2_api.websocket_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.chat_handler.invoke_arn
  integration_method = "POST"
}

# API Gateway Routes
resource "aws_apigatewayv2_route" "connect_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_integration.id}"
}

resource "aws_apigatewayv2_route" "disconnect_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_integration.id}"
}

resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_integration.id}"
}

# Validate the ACM certificate once DNS is in place
resource "aws_acm_certificate_validation" "api" {
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [
    for rec in aws_route53_record.cert_validation : rec.fqdn
  ]
}

# Configure API Gateway to use the custom domain with the validated certificate
resource "aws_apigatewayv2_domain_name" "api" {
  domain_name = "api.gfonseca.io"

  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.api.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "api" {
  api_id      = aws_apigatewayv2_api.websocket_api.id
  domain_name = aws_apigatewayv2_domain_name.api.domain_name
  stage       = aws_apigatewayv2_stage.default.name
}

resource "aws_route53_record" "api_alias" {
  zone_id = aws_route53_zone.hostzone.zone_id
  name    = "api"
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# Request a DNS-validated ACM certificate for the subdomain
resource "aws_acm_certificate" "api" {
  domain_name       = "*.gfonseca.io"
  validation_method = "DNS"
  subject_alternative_names = ["gfonseca.io"]
}
locals {
  # 1) Group all of your DVOs (from both certs) by their record name:
  all_dvos_grouped = {
    for dvo in concat(
      tolist(aws_acm_certificate.api.domain_validation_options),
      tolist(aws_acm_certificate.website_cert.domain_validation_options),
    ) :
    dvo.resource_record_name => dvo...
  }

  # 2) From each group, just take the first DVO
  unique_dvos = {
    for record_name, dvo_list in local.all_dvos_grouped :
    record_name => dvo_list[0]
  }
}