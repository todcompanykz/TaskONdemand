variable "hcloud_token" {
  type        = string
  description = "Hetzner Cloud API token"
  sensitive   = true
}

variable "project_name" {
  type        = string
  description = "Project slug used for resource names"
  default     = "taskondemand"
}

variable "environment" {
  type        = string
  description = "Environment name, e.g. dev/stage/prod"
  default     = "prod"
}

variable "vm_type" {
  type        = string
  description = "Hetzner server type"
  default     = "cx22"
}

variable "vm_image" {
  type        = string
  description = "Hetzner image name"
  default     = "ubuntu-24.04"
}

variable "vm_location" {
  type        = string
  description = "Hetzner datacenter location"
  default     = "fsn1"
}

variable "timezone" {
  type        = string
  description = "Timezone configured in cloud-init"
  default     = "Asia/Almaty"
}

variable "ssh_user" {
  type        = string
  description = "SSH user for provisioned machine"
  default     = "todadmin"
}

variable "ssh_public_key" {
  type        = string
  description = "Operator SSH public key content"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "Allowed CIDR for SSH access"
  default     = "0.0.0.0/0"
}
