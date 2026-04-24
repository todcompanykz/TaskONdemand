variable "ssh_user" {
  type        = string
  description = "SSH user for provisioned machine"
  default     = "todadmin"
}

variable "allowed_cidr" {
  type        = string
  description = "Allowed CIDR for SSH access"
  default     = "0.0.0.0/0"
}
