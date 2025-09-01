# Open Policy Agent (OPA) Security Policies for NeoForge Platform
# Comprehensive security rules for Kubernetes workloads

package security.policies

import rego.v1

# Default policy results
default allow_pod := false
default allow_service := false
default allow_ingress := false
default allow_networkpolicy := false

# ==============================================================================
# POD SECURITY POLICIES
# ==============================================================================

# Allow pod creation if all security policies pass
allow_pod if {
    input.request.kind.kind == "Pod"
    input.request.operation == "CREATE"

    # All security checks must pass
    no_privileged_containers
    no_host_network
    no_host_pid
    no_host_ipc
    required_security_context
    no_dangerous_capabilities
    allowed_volumes
    resource_limits_defined
    non_root_user
    read_only_root_filesystem
    no_privilege_escalation
}

# Pod must not run privileged containers
no_privileged_containers if {
    containers := input.request.object.spec.containers
    not any_privileged_container(containers)

    initContainers := object.get(input.request.object.spec, "initContainers", [])
    not any_privileged_container(initContainers)
}

any_privileged_container(containers) if {
    some container in containers
    container.securityContext.privileged == true
}

# Pod must not use host network
no_host_network if {
    not input.request.object.spec.hostNetwork == true
}

# Pod must not use host PID
no_host_pid if {
    not input.request.object.spec.hostPID == true
}

# Pod must not use host IPC
no_host_ipc if {
    not input.request.object.spec.hostIPC == true
}

# Pod must have security context defined
required_security_context if {
    input.request.object.spec.securityContext

    # Verify container security contexts
    containers := input.request.object.spec.containers
    every container in containers {
        container.securityContext
    }
}

# Pod must not have dangerous capabilities
no_dangerous_capabilities if {
    containers := input.request.object.spec.containers
    not any_dangerous_capability(containers)

    initContainers := object.get(input.request.object.spec, "initContainers", [])
    not any_dangerous_capability(initContainers)
}

# Define dangerous capabilities that should not be allowed
dangerous_caps := {
    "SYS_ADMIN",
    "SYS_MODULE",
    "SYS_TIME",
    "NET_ADMIN",
    "SYS_BOOT",
    "SYS_PTRACE",
    "DAC_OVERRIDE",
    "SYS_RAWIO"
}

any_dangerous_capability(containers) if {
    some container in containers
    some cap in object.get(container.securityContext.capabilities, "add", [])
    cap in dangerous_caps
}

# Pod must only use allowed volume types
allowed_volumes if {
    volumes := object.get(input.request.object.spec, "volumes", [])
    every volume in volumes {
        volume_type_allowed(volume)
    }
}

# Define allowed volume types
allowed_volume_types := {
    "configMap",
    "secret",
    "emptyDir",
    "persistentVolumeClaim",
    "projected",
    "downwardAPI"
}

volume_type_allowed(volume) if {
    volume_type := [key | volume[key]; key != "name"][0]
    volume_type in allowed_volume_types
}

# Pod containers must have resource limits
resource_limits_defined if {
    containers := input.request.object.spec.containers
    every container in containers {
        container.resources.limits.memory
        container.resources.limits.cpu
        container.resources.requests.memory
        container.resources.requests.cpu
    }
}

# Pod must run as non-root user
non_root_user if {
    input.request.object.spec.securityContext.runAsNonRoot == true

    containers := input.request.object.spec.containers
    every container in containers {
        container.securityContext.runAsNonRoot == true
    }
}

# Pod containers must have read-only root filesystem
read_only_root_filesystem if {
    containers := input.request.object.spec.containers
    every container in containers {
        container.securityContext.readOnlyRootFilesystem == true
    }
}

# Pod must not allow privilege escalation
no_privilege_escalation if {
    containers := input.request.object.spec.containers
    every container in containers {
        container.securityContext.allowPrivilegeEscalation == false
    }

    initContainers := object.get(input.request.object.spec, "initContainers", [])
    every container in initContainers {
        container.securityContext.allowPrivilegeEscalation == false
    }
}

# ==============================================================================
# SERVICE SECURITY POLICIES
# ==============================================================================

allow_service if {
    input.request.kind.kind == "Service"
    input.request.operation in {"CREATE", "UPDATE"}

    # Service security checks
    no_nodeport_services
    proper_service_annotations
}

# Restrict NodePort services (use LoadBalancer or Ingress instead)
no_nodeport_services if {
    input.request.object.spec.type != "NodePort"
}

# Service must have proper annotations
proper_service_annotations if {
    annotations := object.get(input.request.object.metadata, "annotations", {})

    # Must have owner annotation
    annotations["app.neoforge.io/owner"]

    # Must have security classification
    annotations["security.neoforge.io/classification"] in {"public", "internal", "restricted"}
}

# ==============================================================================
# INGRESS SECURITY POLICIES
# ==============================================================================

allow_ingress if {
    input.request.kind.kind == "Ingress"
    input.request.operation in {"CREATE", "UPDATE"}

    # Ingress security checks
    tls_required
    no_insecure_backends
    rate_limiting_enabled
}

# Ingress must use TLS
tls_required if {
    tls_configs := object.get(input.request.object.spec, "tls", [])
    count(tls_configs) > 0
}

# Ingress backends must be secure
no_insecure_backends if {
    rules := object.get(input.request.object.spec, "rules", [])
    every rule in rules {
        paths := object.get(rule.http, "paths", [])
        every path in paths {
            # Ensure backend service exists and is properly configured
            path.backend.service.name
            path.backend.service.port
        }
    }
}

# Ingress must have rate limiting
rate_limiting_enabled if {
    annotations := object.get(input.request.object.metadata, "annotations", {})
    annotations["nginx.ingress.kubernetes.io/rate-limit"]
}

# ==============================================================================
# NETWORK POLICY SECURITY
# ==============================================================================

allow_networkpolicy if {
    input.request.kind.kind == "NetworkPolicy"
    input.request.operation in {"CREATE", "UPDATE"}

    # Network policy security checks
    default_deny_ingress
    explicit_egress_rules
}

# Network policy should implement default deny for ingress
default_deny_ingress if {
    # If no ingress rules are specified, it defaults to deny all
    ingress := object.get(input.request.object.spec, "ingress", [])

    # If ingress rules exist, they should be explicit
    count(ingress) == 0
} else if {
    ingress := input.request.object.spec.ingress
    every rule in ingress {
        # Each ingress rule must have explicit from selectors
        rule.from
    }
}

# Network policy should have explicit egress rules
explicit_egress_rules if {
    egress := object.get(input.request.object.spec, "egress", [])
    count(egress) > 0

    every rule in egress {
        # Each egress rule should have explicit to selectors or ports
        any([rule.to, rule.ports])
    }
}

# ==============================================================================
# IMAGE SECURITY POLICIES
# ==============================================================================

# Validate container image security
secure_container_images if {
    containers := input.request.object.spec.containers
    every container in containers {
        image_has_digest(container.image)
        not image_uses_latest_tag(container.image)
        image_from_allowed_registry(container.image)
    }

    initContainers := object.get(input.request.object.spec, "initContainers", [])
    every container in initContainers {
        image_has_digest(container.image)
        not image_uses_latest_tag(container.image)
        image_from_allowed_registry(container.image)
    }
}

# Image must have digest for immutability
image_has_digest(image) if {
    contains(image, "@sha256:")
}

# Image must not use 'latest' tag
image_uses_latest_tag(image) if {
    endswith(image, ":latest")
} else if {
    not contains(image, ":")
}

# Image must be from allowed registry
image_from_allowed_registry(image) if {
    allowed_registries := {
        "ghcr.io/",
        "docker.io/library/",
        "registry.k8s.io/",
        "quay.io/"
    }

    some registry in allowed_registries
    startswith(image, registry)
}

# ==============================================================================
# RBAC SECURITY POLICIES
# ==============================================================================

# Validate RBAC permissions are not overly permissive
rbac_not_overpermissive if {
    input.request.kind.kind in {"Role", "ClusterRole"}

    rules := input.request.object.rules
    every rule in rules {
        not overpermissive_rule(rule)
    }
}

# Define overly permissive RBAC rules
overpermissive_rule(rule) if {
    "*" in rule.resources
    "*" in rule.verbs
}

overpermissive_rule(rule) if {
    "secrets" in rule.resources
    "get" in rule.verbs
    not rule.resourceNames
}

# ==============================================================================
# COMPLIANCE AND AUDIT
# ==============================================================================

# Generate compliance report data
compliance_data := {
    "timestamp": time.now_ns(),
    "policies_evaluated": {
        "pod_security": allow_pod,
        "service_security": allow_service,
        "ingress_security": allow_ingress,
        "network_policy": allow_networkpolicy,
        "image_security": secure_container_images,
        "rbac_security": rbac_not_overpermissive
    },
    "violations": violations
}

# Collect all policy violations
violations := [violation |
    violation := sprintf("Pod security violation: %v", [msg])
    not allow_pod
    msg := "Pod does not meet security requirements"
] ++ [violation |
    violation := sprintf("Service security violation: %v", [msg])
    not allow_service
    msg := "Service does not meet security requirements"
] ++ [violation |
    violation := sprintf("Ingress security violation: %v", [msg])
    not allow_ingress
    msg := "Ingress does not meet security requirements"
]
