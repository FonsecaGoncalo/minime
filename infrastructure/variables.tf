variable "aws_region" {
  type      = string
  sensitive = true
}

variable "pinecone_api_key" {
  type      = string
  sensitive = true
}

variable "notion_api_key" {
  type      = string
  sensitive = true
}

variable "notion_db_id" {
  type      = string
  sensitive = true
}

variable "anthropic_api_key" {
  type      = string
  sensitive = true
}

variable "newrelic_license_key" {
  type      = string
  sensitive = true
}

variable "google_service_account" {
  type      = string
  sensitive = true
}

variable "event_bus_name" {
  type      = string
  sensitive = true
}

variable "ses_from_email" {
  type      = string
  sensitive = true
}

variable "ses_to_email" {
  type      = string
  sensitive = true
}
