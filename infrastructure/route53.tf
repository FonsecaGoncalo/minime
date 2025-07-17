resource "aws_route53_zone" "hostzone" {
  name = "gfonseca.io"
}

# Create the DNS validation record in the hosted zone
resource "aws_route53_record" "cert_validation" {
  for_each = local.unique_dvos

  zone_id = aws_route53_zone.hostzone.zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  ttl     = 60
  records = [each.value.resource_record_value]
}

resource "aws_route53_record" "ses_verification" {
  zone_id = aws_route53_zone.hostzone.id
  name    = "_amazonses.${aws_ses_domain_identity.main.domain}"
  type    = "TXT"
  ttl     = "600"
  records = [aws_ses_domain_identity.main.verification_token]
}