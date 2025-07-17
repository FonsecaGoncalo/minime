output "bucket_name" {
  description = "Name of the website S3 bucket"
  value       = aws_s3_bucket.website.id
  sensitive   = true
}

output "cd_dist_id" {
  value     = aws_cloudfront_distribution.website.id
  sensitive = true
}