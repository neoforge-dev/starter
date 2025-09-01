"""Webhook payload schemas."""
import hashlib
import hmac
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from app.models.email_tracking import EmailStatus
from pydantic import BaseModel, Field, field_validator


class SendGridEvent(BaseModel):
    """SendGrid webhook event schema."""

    email: str
    timestamp: int
    smtp_id: Optional[str] = Field(None, alias="smtp-id")
    event: str
    category: Optional[Union[str, List[str]]] = None
    sg_event_id: Optional[str] = None
    sg_message_id: Optional[str] = None
    useragent: Optional[str] = None
    ip: Optional[str] = None
    url: Optional[str] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    response: Optional[str] = None
    type: Optional[str] = None
    url_offset: Optional[Dict[str, int]] = None
    asm_group_id: Optional[int] = None

    class Config:
        populate_by_name = True


class SendGridWebhookPayload(BaseModel):
    """SendGrid webhook payload containing multiple events."""

    events: List[SendGridEvent]

    @field_validator("events", mode="before")
    @classmethod
    def parse_events(cls, v):
        """Parse events from raw webhook payload."""
        if isinstance(v, list):
            return v
        return [v]  # Single event


class SMTPEvent(BaseModel):
    """Generic SMTP webhook event schema."""

    message_id: str
    email: str
    event_type: str
    timestamp: Optional[datetime] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SMTPWebhookPayload(BaseModel):
    """Generic SMTP webhook payload."""

    events: List[SMTPEvent]

    @field_validator("events", mode="before")
    @classmethod
    def parse_events(cls, v):
        """Parse events from raw webhook payload."""
        if isinstance(v, list):
            return v
        return [v]  # Single event


class WebhookEventMapping(BaseModel):
    """Webhook event mapping result."""

    email_id: Optional[str] = None
    recipient: str
    status: EmailStatus
    timestamp: datetime
    error_message: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    event_metadata: Optional[Dict[str, Any]] = None


class WebhookProcessingResult(BaseModel):
    """Result of webhook processing."""

    processed_events: int
    successful_events: int
    failed_events: int
    errors: List[str] = []


class WebhookSignatureValidator:
    """Webhook signature validation utilities."""

    @staticmethod
    def validate_sendgrid_signature(
        payload: bytes, signature: str, timestamp: str, public_key: str
    ) -> bool:
        """
        Validate SendGrid webhook signature using ECDSA.

        Args:
            payload: Raw webhook payload bytes
            signature: Base64 encoded signature from header
            timestamp: Timestamp from header
            public_key: SendGrid public key for verification

        Returns:
            True if signature is valid, False otherwise
        """
        try:
            import base64

            from cryptography.hazmat.primitives import hashes
            from cryptography.hazmat.primitives.asymmetric import ec
            from cryptography.hazmat.primitives.serialization import load_pem_public_key

            # Load the public key
            key = load_pem_public_key(public_key.encode())

            # Verify signature
            signature_bytes = base64.b64decode(signature)
            signed_payload = timestamp.encode() + payload

            key.verify(signature_bytes, signed_payload, ec.ECDSA(hashes.SHA256()))
            return True
        except Exception:
            return False

    @staticmethod
    def validate_hmac_signature(
        payload: bytes, signature: str, secret: str, algorithm: str = "sha256"
    ) -> bool:
        """
        Validate HMAC webhook signature.

        Args:
            payload: Raw webhook payload bytes
            signature: HMAC signature from header
            secret: Webhook secret key
            algorithm: Hash algorithm (sha256, sha1, etc.)

        Returns:
            True if signature is valid, False otherwise
        """
        try:
            # Remove algorithm prefix if present (e.g., "sha256=")
            if "=" in signature:
                signature = signature.split("=", 1)[1]

            # Calculate expected signature
            hash_func = getattr(hashlib, algorithm)
            expected = hmac.new(secret.encode(), payload, hash_func).hexdigest()

            # Secure comparison
            return hmac.compare_digest(signature, expected)
        except Exception:
            return False
