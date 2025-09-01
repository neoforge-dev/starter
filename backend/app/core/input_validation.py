"""
Input Validation and Sanitization for NeoForge
Comprehensive protection against injection attacks and data validation.
"""

import re
import logging
import html
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Union, Pattern
from dataclasses import dataclass, field
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class ValidationSeverity(Enum):
    """Severity levels for validation failures."""
    LOW = "low"           # Minor validation issues
    MEDIUM = "medium"     # Moderate validation issues
    HIGH = "high"         # Significant validation issues
    CRITICAL = "critical" # Critical validation failures


class ValidationResult:
    """Result of input validation."""

    def __init__(
        self,
        is_valid: bool = True,
        errors: Optional[List[str]] = None,
        warnings: Optional[List[str]] = None,
        sanitized_value: Any = None,
        severity: ValidationSeverity = ValidationSeverity.LOW
    ):
        self.is_valid = is_valid
        self.errors = errors or []
        self.warnings = warnings or []
        self.sanitized_value = sanitized_value
        self.severity = severity
        self.timestamp = datetime.utcnow()

    def add_error(self, error: str, severity: ValidationSeverity = ValidationSeverity.MEDIUM):
        """Add an error to the validation result."""
        self.errors.append(error)
        self.is_valid = False
        if severity.value > self.severity.value:
            self.severity = severity

    def add_warning(self, warning: str):
        """Add a warning to the validation result."""
        self.warnings.append(warning)

    def to_dict(self) -> Dict[str, Any]:
        """Convert validation result to dictionary."""
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "severity": self.severity.value,
            "timestamp": self.timestamp.isoformat(),
            "has_warnings": len(self.warnings) > 0
        }


@dataclass
class ValidationRule:
    """A validation rule with pattern and constraints."""
    name: str
    pattern: Optional[Pattern[str]] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    allowed_chars: Optional[str] = None
    blocked_chars: Optional[str] = None
    custom_validator: Optional[Callable[[str], bool]] = None
    error_message: str = "Validation failed"
    severity: ValidationSeverity = ValidationSeverity.MEDIUM
    sanitize: bool = True


@dataclass
class SanitizationConfig:
    """Configuration for input sanitization."""
    remove_html: bool = True
    remove_scripts: bool = True
    remove_null_bytes: bool = True
    normalize_whitespace: bool = True
    trim_whitespace: bool = True
    escape_special_chars: bool = True
    max_length: Optional[int] = None
    allowed_tags: Set[str] = field(default_factory=set)
    allowed_attributes: Set[str] = field(default_factory=set)


class InputValidator:
    """
    Comprehensive input validation and sanitization service.

    Features:
    - SQL injection prevention
    - XSS attack prevention
    - Command injection prevention
    - Input length validation
    - Character set validation
    - Custom validation rules
    - Automatic sanitization
    - Comprehensive logging
    """

    def __init__(self):
        self.rules: Dict[str, ValidationRule] = {}
        self.sanitization_config = SanitizationConfig()
        self._setup_default_rules()

        logger.info("Initialized Input Validator")

    def _setup_default_rules(self):
        """Set up default validation rules for common input types."""
        self.add_rule(ValidationRule(
            name="email",
            pattern=re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
            min_length=5,
            max_length=254,
            error_message="Invalid email format",
            severity=ValidationSeverity.HIGH
        ))

        self.add_rule(ValidationRule(
            name="username",
            pattern=re.compile(r'^[a-zA-Z0-9_-]{3,30}$'),
            min_length=3,
            max_length=30,
            error_message="Username must be 3-30 characters, alphanumeric with underscores and hyphens",
            severity=ValidationSeverity.MEDIUM
        ))

        self.add_rule(ValidationRule(
            name="password",
            min_length=8,
            max_length=128,
            pattern=re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'),
            error_message="Password must be 8-128 chars with uppercase, lowercase, number, and special character",
            severity=ValidationSeverity.HIGH
        ))

        self.add_rule(ValidationRule(
            name="url",
            pattern=re.compile(r'^https?://[^\s/$.?#].[^\s]*$'),
            max_length=2048,
            error_message="Invalid URL format",
            severity=ValidationSeverity.MEDIUM
        ))

        self.add_rule(ValidationRule(
            name="phone",
            pattern=re.compile(r'^\+?[\d\s\-\(\)]{10,15}$'),
            error_message="Invalid phone number format",
            severity=ValidationSeverity.MEDIUM
        ))

        self.add_rule(ValidationRule(
            name="sql_safe",
            blocked_chars=";'\"\\",
            error_message="Potentially dangerous SQL characters detected",
            severity=ValidationSeverity.CRITICAL
        ))

        self.add_rule(ValidationRule(
            name="xss_safe",
            blocked_chars="<>\"'&",
            error_message="Potentially dangerous HTML/XSS characters detected",
            severity=ValidationSeverity.HIGH
        ))

    def add_rule(self, rule: ValidationRule):
        """Add a validation rule."""
        self.rules[rule.name] = rule
        logger.info(f"Added validation rule: {rule.name}")

    def remove_rule(self, rule_name: str):
        """Remove a validation rule."""
        if rule_name in self.rules:
            del self.rules[rule_name]
            logger.info(f"Removed validation rule: {rule_name}")

    def validate(
        self,
        value: Any,
        rule_name: str,
        context: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """
        Validate input against a specific rule.

        Args:
            value: The input value to validate
            rule_name: Name of the validation rule to apply
            context: Additional context for validation

        Returns:
            ValidationResult with validation details
        """
        if rule_name not in self.rules:
            return ValidationResult(
                is_valid=False,
                errors=[f"Validation rule '{rule_name}' not found"],
                severity=ValidationSeverity.HIGH
            )

        rule = self.rules[rule_name]
        result = ValidationResult()

        # Convert value to string for validation
        str_value = str(value) if value is not None else ""

        # Apply validation rule
        self._apply_validation_rule(str_value, rule, result)

        # Sanitize if requested and validation passed
        if result.is_valid and rule.sanitize:
            result.sanitized_value = self.sanitize(str_value)

        # Log validation result
        self._log_validation_result(value, rule_name, result, context)

        return result

    def validate_multiple(
        self,
        values: Dict[str, Any],
        rules: Dict[str, str],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, ValidationResult]:
        """
        Validate multiple inputs against different rules.

        Args:
            values: Dictionary of field names to values
            rules: Dictionary of field names to rule names
            context: Additional context for validation

        Returns:
            Dictionary of field names to validation results
        """
        results = {}

        for field_name, value in values.items():
            rule_name = rules.get(field_name)
            if rule_name:
                results[field_name] = self.validate(value, rule_name, context)
            else:
                results[field_name] = ValidationResult(
                    is_valid=True,
                    warnings=["No validation rule specified"]
                )

        return results

    def sanitize(self, value: Any) -> str:
        """
        Sanitize input to prevent injection attacks.

        Args:
            value: The input value to sanitize

        Returns:
            Sanitized string
        """
        if value is None:
            return ""

        str_value = str(value)

        # Apply sanitization based on configuration
        if self.sanitization_config.remove_null_bytes:
            str_value = str_value.replace('\x00', '')

        if self.sanitization_config.remove_html:
            str_value = self._remove_html_tags(str_value)

        if self.sanitization_config.remove_scripts:
            str_value = self._remove_scripts(str_value)

        if self.sanitization_config.escape_special_chars:
            str_value = html.escape(str_value, quote=True)

        if self.sanitization_config.normalize_whitespace:
            str_value = ' '.join(str_value.split())

        if self.sanitization_config.trim_whitespace:
            str_value = str_value.strip()

        if self.sanitization_config.max_length:
            str_value = str_value[:self.sanitization_config.max_length]

        return str_value

    def _apply_validation_rule(
        self,
        value: str,
        rule: ValidationRule,
        result: ValidationResult
    ):
        """Apply a validation rule to the input value."""
        # Length validation
        if rule.min_length is not None and len(value) < rule.min_length:
            result.add_error(
                f"Value too short (minimum {rule.min_length} characters)",
                rule.severity
            )

        if rule.max_length is not None and len(value) > rule.max_length:
            result.add_error(
                f"Value too long (maximum {rule.max_length} characters)",
                rule.severity
            )

        # Pattern validation
        if rule.pattern and not rule.pattern.match(value):
            result.add_error(rule.error_message, rule.severity)

        # Character validation
        if rule.allowed_chars:
            invalid_chars = set(value) - set(rule.allowed_chars)
            if invalid_chars:
                result.add_error(
                    f"Invalid characters found: {''.join(invalid_chars)}",
                    rule.severity
                )

        if rule.blocked_chars:
            found_blocked = any(char in value for char in rule.blocked_chars)
            if found_blocked:
                result.add_error(rule.error_message, rule.severity)

        # Custom validation
        if rule.custom_validator:
            try:
                custom_result = rule.custom_validator(value)
                if not custom_result:
                    result.add_error(rule.error_message, rule.severity)
            except Exception as e:
                result.add_error(f"Custom validation error: {e}", rule.severity)

    def _remove_html_tags(self, value: str) -> str:
        """Remove HTML tags from input."""
        # Simple HTML tag removal - in production, use a proper HTML parser
        return re.sub(r'<[^>]+>', '', value)

    def _remove_scripts(self, value: str) -> str:
        """Remove script tags and JavaScript code."""
        # Remove script tags
        value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)
        # Remove javascript: URLs
        value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
        # Remove on* event handlers
        value = re.sub(r'\bon\w+\s*=', '', value, flags=re.IGNORECASE)
        return value

    def _log_validation_result(
        self,
        original_value: Any,
        rule_name: str,
        result: ValidationResult,
        context: Optional[Dict[str, Any]] = None
    ):
        """Log the validation result."""
        log_data = {
            "rule_name": rule_name,
            "is_valid": result.is_valid,
            "severity": result.severity.value,
            "error_count": len(result.errors),
            "warning_count": len(result.warnings),
            "original_length": len(str(original_value)) if original_value else 0,
            "sanitized_length": len(str(result.sanitized_value)) if result.sanitized_value else 0,
            "context": context or {}
        }

        if result.is_valid:
            if result.warnings:
                logger.warning(f"Input validation warning: {log_data}")
            else:
                logger.debug(f"Input validation passed: {log_data}")
        else:
            logger.error(f"Input validation failed: {log_data}")

    def validate_json_payload(
        self,
        payload: Dict[str, Any],
        schema: Dict[str, str],
        strict: bool = True
    ) -> Dict[str, ValidationResult]:
        """
        Validate a JSON payload against a schema.

        Args:
            payload: The JSON payload to validate
            schema: Dictionary mapping field names to validation rule names
            strict: Whether to reject unknown fields

        Returns:
            Dictionary of field names to validation results
        """
        results = {}

        # Validate known fields
        for field_name, rule_name in schema.items():
            if field_name in payload:
                results[field_name] = self.validate(payload[field_name], rule_name, {"field": field_name})
            elif strict:
                results[field_name] = ValidationResult(
                    is_valid=False,
                    errors=["Required field is missing"],
                    severity=ValidationSeverity.HIGH
                )

        # Check for unknown fields if strict mode is enabled
        if strict:
            unknown_fields = set(payload.keys()) - set(schema.keys())
            for field in unknown_fields:
                results[field] = ValidationResult(
                    is_valid=False,
                    errors=["Unknown field in strict mode"],
                    severity=ValidationSeverity.MEDIUM
                )

        return results

    def validate_file_upload(
        self,
        filename: str,
        content_type: str,
        file_size: int,
        max_file_size: int = 10485760,  # 10MB
        allowed_extensions: Optional[Set[str]] = None,
        allowed_mime_types: Optional[Set[str]] = None
    ) -> ValidationResult:
        """
        Validate file upload parameters.

        Args:
            filename: The uploaded file name
            content_type: The file content type
            file_size: Size of the file in bytes
            max_file_size: Maximum allowed file size
            allowed_extensions: Set of allowed file extensions
            allowed_mime_types: Set of allowed MIME types

        Returns:
            ValidationResult with validation details
        """
        result = ValidationResult()

        # File size validation
        if file_size > max_file_size:
            result.add_error(
                f"File too large: {file_size} bytes (max {max_file_size})",
                ValidationSeverity.HIGH
            )

        # File extension validation
        if allowed_extensions:
            file_extension = filename.split('.')[-1].lower() if '.' in filename else ''
            if file_extension not in allowed_extensions:
                result.add_error(
                    f"File extension not allowed: {file_extension}",
                    ValidationSeverity.HIGH
                )

        # MIME type validation
        if allowed_mime_types and content_type not in allowed_mime_types:
            result.add_error(
                f"MIME type not allowed: {content_type}",
                ValidationSeverity.HIGH
            )

        # Filename validation (prevent path traversal)
        if '..' in filename or '/' in filename or '\\' in filename:
            result.add_error(
                "Invalid filename: potential path traversal attempt",
                ValidationSeverity.CRITICAL
            )

        # Check for suspicious filenames
        suspicious_patterns = ['<script', 'javascript', 'vbscript', 'onload', 'onerror']
        filename_lower = filename.lower()
        for pattern in suspicious_patterns:
            if pattern in filename_lower:
                result.add_error(
                    f"Suspicious filename pattern detected: {pattern}",
                    ValidationSeverity.CRITICAL
                )

        return result

    def get_validation_statistics(self) -> Dict[str, Any]:
        """Get validation statistics."""
        return {
            "total_rules": len(self.rules),
            "rule_names": list(self.rules.keys()),
            "sanitization_config": {
                "remove_html": self.sanitization_config.remove_html,
                "remove_scripts": self.sanitization_config.remove_scripts,
                "max_length": self.sanitization_config.max_length
            }
        }


# Global input validator instance
input_validator: Optional[InputValidator] = None


def init_input_validator() -> InputValidator:
    """Initialize the global input validator."""
    global input_validator
    input_validator = InputValidator()
    return input_validator


def get_input_validator() -> InputValidator:
    """Get the global input validator."""
    if input_validator is None:
        raise RuntimeError("Input Validator not initialized")
    return input_validator


# Convenience functions for common validation tasks
def validate_email(email: str) -> ValidationResult:
    """Validate an email address."""
    return get_input_validator().validate(email, "email")


def validate_username(username: str) -> ValidationResult:
    """Validate a username."""
    return get_input_validator().validate(username, "username")


def validate_password(password: str) -> ValidationResult:
    """Validate a password."""
    return get_input_validator().validate(password, "password")


def validate_url(url: str) -> ValidationResult:
    """Validate a URL."""
    return get_input_validator().validate(url, "url")


def sanitize_input(value: Any) -> str:
    """Sanitize input to prevent injection attacks."""
    return get_input_validator().sanitize(value)


def validate_json_payload(
    payload: Dict[str, Any],
    schema: Dict[str, str],
    strict: bool = True
) -> Dict[str, ValidationResult]:
    """Validate a JSON payload against a schema."""
    return get_input_validator().validate_json_payload(payload, schema, strict)