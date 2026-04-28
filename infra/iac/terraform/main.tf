terraform {
  required_version = ">= 1.5.0"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.47"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

locals {
  vm_name = "${var.project_name}-${var.environment}-vm"
  tags = [
    var.project_name,
    var.environment,
  ]
}

resource "hcloud_ssh_key" "operator" {
  name       = "${local.vm_name}-ssh-key"
  public_key = var.ssh_public_key
}

resource "hcloud_firewall" "tod_vm" {
  name = "${local.vm_name}-fw"

  # SSH is restricted to the operator CIDR.
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = [var.allowed_ssh_cidr]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "tcp"
    port            = "any"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "udp"
    port            = "any"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_server" "tod_vm" {
  name        = local.vm_name
  image       = var.vm_image
  server_type = var.vm_type
  location    = var.vm_location
  ssh_keys    = [hcloud_ssh_key.operator.id]
  firewall_ids = [
    hcloud_firewall.tod_vm.id,
  ]

  user_data = templatefile("${path.module}/cloud-init.yaml.tftpl", {
    timezone = var.timezone
    ssh_user = var.ssh_user
  })

  labels = {
    app         = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  }
}

output "vm_name" {
  description = "Provisioned VM name"
  value       = hcloud_server.tod_vm.name
}

output "vm_public_ipv4" {
  description = "Public IPv4 of the VM"
  value       = hcloud_server.tod_vm.ipv4_address
}

output "vm_public_ipv6" {
  description = "Public IPv6 of the VM"
  value       = hcloud_server.tod_vm.ipv6_address
}

output "ssh_connection_command" {
  description = "Ready-to-use SSH command"
  value       = "ssh ${var.ssh_user}@${hcloud_server.tod_vm.ipv4_address}"
}
