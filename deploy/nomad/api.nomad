job "api" {
  datacenters = ["dc1"]
  type        = "service"

  group "api" {
    count = 1

    network {
      port "http" {
        to = 8000
      }
    }

    service {
      name = "api"
      port = "http"

      check {
        type     = "http"
        path     = "/ready"
        interval = "10s"
        timeout  = "2s"
      }
    }

    task "api" {
      driver = "docker"

      config {
        image = "neoforge/api:latest"
        ports = ["http"]
      }

      resources {
        cpu    = 200
        memory = 256
      }

      env {
        ENVIRONMENT = "production"
        LOG_LEVEL   = "info"
      }
    }
  }
} 