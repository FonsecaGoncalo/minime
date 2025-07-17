resource "aws_s3_bucket" "website" {
  bucket = "gfonseca.io"
  acl    = "private"
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}

resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for gfonseca.io static website"
}


resource "aws_s3_bucket_policy" "website_policy" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontRead"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })
}

resource "aws_acm_certificate" "website_cert" {
  provider          = aws.use1
  domain_name       = "gfonseca.io"
  subject_alternative_names = ["www.gfonseca.io"]
  validation_method = "DNS"
}

resource "aws_acm_certificate_validation" "website_cert" {
  provider                = aws.use1
  certificate_arn         = aws_acm_certificate.website_cert.arn
  validation_record_fqdns = [
    for rec in aws_route53_record.cert_validation : rec.fqdn
  ]
}



resource "aws_cloudfront_distribution" "website" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "CloudFront for gfonseca.io static site"

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "s3-gfonseca-io"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD"]
    cached_methods = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    target_origin_id       = "s3-gfonseca-io"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  aliases = ["gfonseca.io", "www.gfonseca.io"]

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.website_cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  default_root_object = "index.html"
  price_class         = "PriceClass_100"
}


resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.hostzone.zone_id
  name    = "www"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.hostzone.zone_id
  name = ""    # apex
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}
