terraform {
  required_version = ">= 1.5.0"
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

variable "vm_name" {
  type        = string
  description = "Name of the Linux VM target"
  default     = "tod-linux-vm"
}

resource "local_file" "deployment_manifest" {
  filename = "${path.module}/generated-vm-manifest.txt"
  content  = <<EOT
TaskOnDemand VM manifest
vm_name=${var.vm_name}
target=local_linux_vm
notes=Replace with cloud provider resources when moving to VPS
EOT
}
