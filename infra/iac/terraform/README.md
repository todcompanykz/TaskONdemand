# Terraform VM Provisioning (Hetzner Cloud)

This directory now contains a reproducible VM provisioning scenario for Linux deployment:

- [`main.tf`](main.tf) - provisions VM, SSH key, and firewall in Hetzner Cloud.
- [`variables.tf`](variables.tf) - typed input variables.
- [`cloud-init.yaml.tftpl`](cloud-init.yaml.tftpl) - first-boot bootstrap (Docker, UFW, Fail2Ban).
- [`terraform.tfvars.example`](terraform.tfvars.example) - example local variable file.

## What it creates

- One Ubuntu VM (`hcloud_server`)
- Firewall with:
  - inbound: `22` (restricted by CIDR), `80`, `443`
  - outbound: all TCP/UDP
- SSH key registration (`hcloud_ssh_key`)
- cloud-init baseline for Docker and security packages

## Prerequisites

- Terraform `>= 1.5`
- Hetzner Cloud project and API token
- Local SSH keypair (public key for provisioning, private key for login)

## Quick start

```bash
cd infra/iac/terraform
cp terraform.tfvars.example terraform.tfvars
```

Fill `terraform.tfvars`:
- `hcloud_token`
- `ssh_public_key`
- `allowed_ssh_cidr` (use your real static IP, avoid `0.0.0.0/0` in production)

Then run:

```bash
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

## Outputs

After apply, Terraform prints:
- VM name
- Public IPv4/IPv6
- Ready SSH command

Example:

```bash
ssh todadmin@<vm_public_ipv4>
```

## Security notes

- Keep `terraform.tfvars` out of version control (contains secrets).
- Restrict `allowed_ssh_cidr` to `/32` where possible.
- For production, move state to remote backend (S3/Terraform Cloud/etc.).
