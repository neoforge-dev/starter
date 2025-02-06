terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

provider "digitalocean" {
  token = var.do_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "digitalocean_droplet" "web" {
  name   = "neoforge-prod"
  region = "nyc3"
  size   = "s-1vcpu-1gb"
  image  = "ubuntu-22-04-x64"

  ssh_keys = [data.digitalocean_ssh_key.default.id]

  tags = ["production", "neoforge"]

  vpc_uuid = digitalocean_vpc.neoforge.id
}

resource "digitalocean_vpc" "neoforge" {
  name     = "neoforge-network"
  region   = "nyc3"
  ip_range = "10.10.10.0/24"
}

data "digitalocean_ssh_key" "default" {
  name = "default" # Make sure to have this SSH key added to your DO account
}

output "droplet_ip" {
  value = digitalocean_droplet.web.ipv4_address
} 
