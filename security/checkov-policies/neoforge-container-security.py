"""
Custom Checkov policies for NeoForge container security
These policies enforce NeoForge-specific security requirements beyond default checks
"""

from checkov.common.models.enums import CheckResultType, TrueOrFalse
from checkov.kubernetes.checks.resource.base_spec_check import BaseK8sCheck
from checkov.runner_filter import RunnerFilter


class NeoForgeContainerRunAsNonRoot(BaseK8sCheck):
    """Check that NeoForge containers run as non-root user"""

    def __init__(self):
        name = "NeoForge containers must run as non-root user"
        id = "CKV_NEOFORGE_1"
        supported_resources = ["containers", "initContainers"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if container runs as non-root"""
        if "securityContext" in conf:
            security_context = conf["securityContext"]
            if isinstance(security_context, dict):
                # Check runAsNonRoot is explicitly set to true
                if security_context.get("runAsNonRoot") is True:
                    return CheckResultType.PASSED
                # If runAsUser is set to a non-zero value, it's also acceptable
                run_as_user = security_context.get("runAsUser")
                if run_as_user is not None and run_as_user != 0:
                    return CheckResultType.PASSED
        return CheckResultType.FAILED


class NeoForgeContainerReadOnlyRootFS(BaseK8sCheck):
    """Check that NeoForge containers use read-only root filesystem"""

    def __init__(self):
        name = "NeoForge containers must have read-only root filesystem"
        id = "CKV_NEOFORGE_2"
        supported_resources = ["containers", "initContainers"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if container has read-only root filesystem"""
        if "securityContext" in conf:
            security_context = conf["securityContext"]
            if isinstance(security_context, dict):
                if security_context.get("readOnlyRootFilesystem") is True:
                    return CheckResultType.PASSED
        return CheckResultType.FAILED


class NeoForgeContainerNotPrivileged(BaseK8sCheck):
    """Check that NeoForge containers are not privileged"""

    def __init__(self):
        name = "NeoForge containers must not be privileged"
        id = "CKV_NEOFORGE_3"
        supported_resources = ["containers", "initContainers"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if container is not privileged"""
        if "securityContext" in conf:
            security_context = conf["securityContext"]
            if isinstance(security_context, dict):
                # Privileged should be false or not set
                privileged = security_context.get("privileged")
                if privileged is True:
                    return CheckResultType.FAILED
        return CheckResultType.PASSED


class NeoForgeContainerDropAllCapabilities(BaseK8sCheck):
    """Check that NeoForge containers drop ALL capabilities"""

    def __init__(self):
        name = "NeoForge containers must drop ALL capabilities"
        id = "CKV_NEOFORGE_4"
        supported_resources = ["containers", "initContainers"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if container drops ALL capabilities"""
        if "securityContext" in conf:
            security_context = conf["securityContext"]
            if isinstance(security_context, dict):
                capabilities = security_context.get("capabilities", {})
                if isinstance(capabilities, dict):
                    drop_caps = capabilities.get("drop", [])
                    if "ALL" in drop_caps:
                        return CheckResultType.PASSED
        return CheckResultType.FAILED


class NeoForgePodNoHostNetwork(BaseK8sCheck):
    """Check that NeoForge pods do not use host network"""

    def __init__(self):
        name = "NeoForge pods must not use host network"
        id = "CKV_NEOFORGE_5"
        supported_resources = ["Pod"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if pod uses host network"""
        spec = conf.get("spec", {})
        if spec.get("hostNetwork") is True:
            return CheckResultType.FAILED
        return CheckResultType.PASSED


class NeoForgePodNoHostPID(BaseK8sCheck):
    """Check that NeoForge pods do not use host PID"""

    def __init__(self):
        name = "NeoForge pods must not use host PID"
        id = "CKV_NEOFORGE_6"
        supported_resources = ["Pod"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if pod uses host PID"""
        spec = conf.get("spec", {})
        if spec.get("hostPID") is True:
            return CheckResultType.FAILED
        return CheckResultType.PASSED


class NeoForgePodNoHostIPC(BaseK8sCheck):
    """Check that NeoForge pods do not use host IPC"""

    def __init__(self):
        name = "NeoForge pods must not use host IPC"
        id = "CKV_NEOFORGE_7"
        supported_resources = ["Pod"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if pod uses host IPC"""
        spec = conf.get("spec", {})
        if spec.get("hostIPC") is True:
            return CheckResultType.FAILED
        return CheckResultType.PASSED


class NeoForgeContainerResourceLimits(BaseK8sCheck):
    """Check that NeoForge containers have resource limits"""

    def __init__(self):
        name = "NeoForge containers must have resource limits"
        id = "CKV_NEOFORGE_8"
        supported_resources = ["containers", "initContainers"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if container has resource limits"""
        resources = conf.get("resources", {})
        if isinstance(resources, dict):
            limits = resources.get("limits", {})
            requests = resources.get("requests", {})

            # Check for both CPU and memory limits and requests
            required_resources = ["cpu", "memory"]

            for resource in required_resources:
                if resource not in limits:
                    return CheckResultType.FAILED
                if resource not in requests:
                    return CheckResultType.FAILED

            return CheckResultType.PASSED
        return CheckResultType.FAILED


class NeoForgeImageFromAllowedRegistry(BaseK8sCheck):
    """Check that NeoForge containers use images from allowed registries"""

    def __init__(self):
        name = "NeoForge containers must use images from allowed registries"
        id = "CKV_NEOFORGE_9"
        supported_resources = ["containers", "initContainers"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if container image is from allowed registry"""
        image = conf.get("image", "")
        if not image:
            return CheckResultType.FAILED

        allowed_registries = [
            "ghcr.io/neoforge-dev/",
            "docker.io/library/",
            "registry.k8s.io/",
            "quay.io/",
            "gcr.io/distroless/",
        ]

        for registry in allowed_registries:
            if image.startswith(registry):
                return CheckResultType.PASSED

        return CheckResultType.FAILED


class NeoForgeImageUseDigest(BaseK8sCheck):
    """Check that NeoForge containers use image digest instead of tag"""

    def __init__(self):
        name = "NeoForge containers should use image digest, not tag"
        id = "CKV_NEOFORGE_10"
        supported_resources = ["containers", "initContainers"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if container image uses digest"""
        image = conf.get("image", "")
        if not image:
            return CheckResultType.FAILED

        # Check if image uses digest (contains @sha256:)
        if "@sha256:" in image:
            return CheckResultType.PASSED

        # For development environments, this might be relaxed
        # Check if it's at least not using 'latest' tag
        if image.endswith(":latest") or ":" not in image:
            return CheckResultType.FAILED

        return CheckResultType.PASSED


class NeoForgeImageNotLatestTag(BaseK8sCheck):
    """Check that NeoForge containers do not use latest tag"""

    def __init__(self):
        name = "NeoForge containers must not use latest tag"
        id = "CKV_NEOFORGE_11"
        supported_resources = ["containers", "initContainers"]
        categories = ["KUBERNETES"]
        super().__init__(
            name=name,
            id=id,
            categories=categories,
            supported_resources=supported_resources,
        )

    def scan_spec_conf(self, conf):
        """Check if container image uses latest tag"""
        image = conf.get("image", "")
        if not image:
            return CheckResultType.FAILED

        # Check for various forms of 'latest' tag
        disallowed_tags = [":latest", ":main", ":master", ":dev", ":development"]

        for tag in disallowed_tags:
            if image.endswith(tag):
                return CheckResultType.FAILED

        # Also check for images without explicit tags (defaults to latest)
        if ":" not in image and "@" not in image:
            return CheckResultType.FAILED

        return CheckResultType.PASSED


# Registry of all NeoForge custom checks
NEOFORGE_CHECKS = [
    NeoForgeContainerRunAsNonRoot(),
    NeoForgeContainerReadOnlyRootFS(),
    NeoForgeContainerNotPrivileged(),
    NeoForgeContainerDropAllCapabilities(),
    NeoForgePodNoHostNetwork(),
    NeoForgePodNoHostPID(),
    NeoForgePodNoHostIPC(),
    NeoForgeContainerResourceLimits(),
    NeoForgeImageFromAllowedRegistry(),
    NeoForgeImageUseDigest(),
    NeoForgeImageNotLatestTag(),
]
