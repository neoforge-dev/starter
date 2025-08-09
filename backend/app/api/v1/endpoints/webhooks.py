"""Webhook endpoints for email delivery tracking."""
import hashlib
import json
import logging
from datetime import datetime, UTC
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import get_settings
from app.crud.email_tracking import email_tracking
from app.models.email_tracking import EmailStatus
from app.schemas.webhooks import (
    SendGridEvent,
    SendGridWebhookPayload,
    SMTPEvent,
    SMTPWebhookPayload,
    WebhookEventMapping,
    WebhookProcessingResult,
    WebhookSignatureValidator,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# SendGrid event mapping to our EmailStatus enum
SENDGRID_EVENT_MAPPING = {
    "processed": EmailStatus.SENT,
    "delivered": EmailStatus.DELIVERED,
    "bounce": EmailStatus.BOUNCED,
    "dropped": EmailStatus.FAILED,
    "deferred": EmailStatus.QUEUED,
    "open": EmailStatus.OPENED,
    "click": EmailStatus.CLICKED,
    "spamreport": EmailStatus.SPAM,
    "unsubscribe": EmailStatus.FAILED,
    "group_unsubscribe": EmailStatus.FAILED,
    "group_resubscribe": EmailStatus.DELIVERED,  # Treat as re-engagement
}

# Generic SMTP event mapping
SMTP_EVENT_MAPPING = {
    "sent": EmailStatus.SENT,
    "delivered": EmailStatus.DELIVERED,
    "bounced": EmailStatus.BOUNCED,
    "failed": EmailStatus.FAILED,
    "queued": EmailStatus.QUEUED,
    "opened": EmailStatus.OPENED,
    "clicked": EmailStatus.CLICKED,
    "spam": EmailStatus.SPAM,
    "rejected": EmailStatus.FAILED,
    "deferred": EmailStatus.QUEUED,
}


def _generate_event_signature(event_mapping: WebhookEventMapping) -> str:
    """
    Generate a signature for event deduplication.
    
    Args:
        event_mapping: Webhook event mapping
        
    Returns:
        SHA256 hash signature for the event
    """
    # Create a signature based on key event properties
    signature_data = {
        "email_id": event_mapping.email_id,
        "recipient": event_mapping.recipient,
        "status": event_mapping.status.value,
        "timestamp": event_mapping.timestamp.isoformat(),
        "metadata": event_mapping.event_metadata,
    }
    
    # Create deterministic JSON string and hash it
    signature_json = json.dumps(signature_data, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(signature_json.encode()).hexdigest()


def _is_duplicate_event(
    existing_event,  # EmailEvent
    event_mapping: WebhookEventMapping,
    event_signature: str
) -> bool:
    """
    Check if an incoming event is a duplicate of an existing event.
    
    Args:
        existing_event: Existing EmailEvent from database
        event_mapping: Incoming webhook event mapping
        event_signature: Signature of the incoming event
        
    Returns:
        True if events are duplicates, False otherwise
    """
    # Check if same event type and similar timestamp (within 1 second)
    if (existing_event.event_type == event_mapping.status and
        abs((existing_event.occurred_at - event_mapping.timestamp).total_seconds()) < 1):
        return True
    
    # Check if event metadata contains the same signature
    if (existing_event.event_metadata and 
        existing_event.event_metadata.get("event_signature") == event_signature):
        return True
    
    return False


async def validate_sendgrid_signature(request: Request) -> bool:
    """Validate SendGrid webhook signature if configured."""
    settings = get_settings()
    if not settings.SENDGRID_WEBHOOK_PUBLIC_KEY:
        logger.warning("SendGrid webhook signature validation disabled - no public key configured")
        return True
    
    signature = request.headers.get("X-Twilio-Email-Event-Webhook-Signature")
    timestamp = request.headers.get("X-Twilio-Email-Event-Webhook-Timestamp")
    
    if not signature or not timestamp:
        logger.error("Missing SendGrid signature headers")
        return False
    
    body = await request.body()
    return WebhookSignatureValidator.validate_sendgrid_signature(
        payload=body,
        signature=signature,
        timestamp=timestamp,
        public_key=settings.SENDGRID_WEBHOOK_PUBLIC_KEY
    )


async def validate_smtp_signature(request: Request) -> bool:
    """Validate generic SMTP webhook signature if configured."""
    settings = get_settings()
    if not settings.WEBHOOK_SECRET_KEY:
        logger.warning("SMTP webhook signature validation disabled - no secret key configured")
        return True
    
    signature = request.headers.get("X-Webhook-Signature")
    if not signature:
        signature = request.headers.get("X-Hub-Signature-256")
    
    if not signature:
        logger.error("Missing SMTP webhook signature header")
        return False
    
    body = await request.body()
    return WebhookSignatureValidator.validate_hmac_signature(
        payload=body,
        signature=signature,
        secret=settings.WEBHOOK_SECRET_KEY,
        algorithm="sha256"
    )


def map_sendgrid_event_to_tracking(event: SendGridEvent) -> WebhookEventMapping:
    """Map SendGrid event to our webhook event mapping."""
    # Map event type to our status
    status = SENDGRID_EVENT_MAPPING.get(event.event, EmailStatus.QUEUED)
    
    # Convert timestamp
    timestamp = datetime.fromtimestamp(event.timestamp, UTC)
    
    # Extract error message for failed events
    error_message = None
    if status in [EmailStatus.BOUNCED, EmailStatus.FAILED, EmailStatus.SPAM]:
        error_message = event.reason or event.response or event.status
    
    # Build event metadata
    event_metadata = {
        "provider": "sendgrid",
        "sg_event_id": event.sg_event_id,
        "sg_message_id": event.sg_message_id,
        "smtp_id": event.smtp_id,
        "category": event.category,
        "event_type": event.event,
    }
    
    # Add URL for click events
    if event.event == "click" and event.url:
        event_metadata["url"] = event.url
        event_metadata["url_offset"] = event.url_offset
    
    # Add reason for bounces/failures
    if event.reason:
        event_metadata["reason"] = event.reason
    if event.response:
        event_metadata["response"] = event.response
    if event.status:
        event_metadata["bounce_status"] = event.status
    if event.type:
        event_metadata["bounce_type"] = event.type
    
    return WebhookEventMapping(
        email_id=event.smtp_id,  # Use SMTP ID as email_id
        recipient=event.email,
        status=status,
        timestamp=timestamp,
        error_message=error_message,
        user_agent=event.useragent,
        ip_address=event.ip,
        location=None,  # SendGrid doesn't provide location directly
        event_metadata=event_metadata,
    )


def map_smtp_event_to_tracking(event: SMTPEvent) -> WebhookEventMapping:
    """Map generic SMTP event to our webhook event mapping."""
    # Map event type to our status
    status = SMTP_EVENT_MAPPING.get(event.event_type.lower(), EmailStatus.QUEUED)
    
    # Use provided timestamp or current time
    timestamp = event.timestamp or datetime.now(UTC)
    
    # Extract error message for failed events
    error_message = None
    if status in [EmailStatus.BOUNCED, EmailStatus.FAILED, EmailStatus.SPAM]:
        error_message = event.reason or event.status
    
    # Build event metadata
    event_metadata = {
        "provider": "smtp",
        "event_type": event.event_type,
        **(event.metadata or {}),
    }
    
    if event.status:
        event_metadata["status"] = event.status
    if event.reason:
        event_metadata["reason"] = event.reason
    
    return WebhookEventMapping(
        email_id=event.message_id,
        recipient=event.email,
        status=status,
        timestamp=timestamp,
        error_message=error_message,
        user_agent=event.user_agent,
        ip_address=event.ip_address,
        location=event.location,
        event_metadata=event_metadata,
    )


async def process_webhook_event(
    db: AsyncSession,
    event_mapping: WebhookEventMapping,
) -> tuple[bool, Optional[str]]:
    """
    Process a single webhook event with enhanced email resolution.
    
    Returns:
        Tuple of (success, error_message)
    """
    try:
        # Enhanced email resolution with fallback strategies
        tracking = await email_tracking.find_by_email_and_recipient(
            db=db,
            email_id=event_mapping.email_id,
            recipient=event_mapping.recipient,
            timestamp=event_mapping.timestamp,
            time_window_hours=24
        )
        
        # If no tracking record found, log and skip
        if not tracking:
            error_msg = (
                f"No tracking record found - email_id: {event_mapping.email_id}, "
                f"recipient: {event_mapping.recipient}, event: {event_mapping.status}"
            )
            logger.warning(error_msg)
            return False, error_msg
        
        # Enhanced duplicate detection with metadata comparison
        event_signature = _generate_event_signature(event_mapping)
        for existing_event in tracking.events:
            if _is_duplicate_event(existing_event, event_mapping, event_signature):
                logger.info(
                    f"Duplicate event detected for email {tracking.id} "
                    f"(status: {event_mapping.status}, signature: {event_signature[:16]}...), skipping"
                )
                return True, None  # Success, but it was a duplicate
        
        # Add event signature to metadata for deduplication
        enhanced_metadata = event_mapping.event_metadata or {}
        enhanced_metadata["event_signature"] = event_signature
        
        # Update tracking status and add event
        await email_tracking.update_status(
            db=db,
            db_obj=tracking,
            status=event_mapping.status,
            error_message=event_mapping.error_message,
            tracking_metadata=enhanced_metadata,
        )
        
        # Commit the transaction
        await db.commit()
        
        logger.info(
            f"Successfully processed webhook event for email {tracking.id}: "
            f"{tracking.status} -> {event_mapping.status} at {event_mapping.timestamp}"
        )
        return True, None
        
    except Exception as e:
        error_msg = (
            f"Error processing webhook event - "
            f"email_id: {event_mapping.email_id}, "
            f"recipient: {event_mapping.recipient}, "
            f"status: {event_mapping.status}, "
            f"error: {str(e)}"
        )
        logger.error(error_msg, exc_info=True)
        await db.rollback()
        return False, str(e)


async def process_webhook_events_batch(
    db: AsyncSession,
    event_mappings: List[WebhookEventMapping],
) -> WebhookProcessingResult:
    """Process multiple webhook events in batch."""
    result = WebhookProcessingResult(
        processed_events=len(event_mappings),
        successful_events=0,
        failed_events=0,
        errors=[]
    )
    
    for event_mapping in event_mappings:
        success, error = await process_webhook_event(db, event_mapping)
        if success:
            result.successful_events += 1
        else:
            result.failed_events += 1
            if error:
                result.errors.append(error)
    
    return result


@router.post(
    "/sendgrid",
    response_model=WebhookProcessingResult,
    status_code=status.HTTP_200_OK,
    summary="SendGrid webhook endpoint",
    description="Process SendGrid webhook events for email delivery tracking",
)
async def sendgrid_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> WebhookProcessingResult:
    """Process SendGrid webhook events."""
    try:
        # Validate signature if configured
        if not await validate_sendgrid_signature(request):
            logger.error("SendGrid webhook signature validation failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature"
            )
        
        # Parse request body
        body = await request.body()
        if not body:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty request body"
            )
        
        # Parse events - SendGrid sends events as a JSON array directly
        import json
        try:
            events_data = json.loads(body.decode())
            if not isinstance(events_data, list):
                events_data = [events_data]
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse SendGrid webhook JSON: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload"
            )
        
        # Validate and map events
        event_mappings = []
        for event_data in events_data:
            try:
                sendgrid_event = SendGridEvent(**event_data)
                event_mapping = map_sendgrid_event_to_tracking(sendgrid_event)
                event_mappings.append(event_mapping)
            except Exception as e:
                logger.error(f"Failed to parse SendGrid event: {str(e)}")
                continue
        
        if not event_mappings:
            logger.warning("No valid events found in SendGrid webhook")
            return WebhookProcessingResult(
                processed_events=0,
                successful_events=0,
                failed_events=0,
                errors=["No valid events found"]
            )
        
        # Process events with provider context
        result = await process_webhook_events_batch(db, event_mappings, provider="sendgrid")
        
        logger.info(
            f"SendGrid webhook processed: {result.successful_events}/{result.processed_events} successful"
        )
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in SendGrid webhook: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error processing webhook"
        )


@router.post(
    "/smtp",
    response_model=WebhookProcessingResult,
    status_code=status.HTTP_200_OK,
    summary="Generic SMTP webhook endpoint",
    description="Process generic SMTP webhook events for email delivery tracking",
)
async def smtp_webhook(
    payload: SMTPWebhookPayload,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> WebhookProcessingResult:
    """Process generic SMTP webhook events."""
    try:
        # Validate signature if configured
        if not await validate_smtp_signature(request):
            logger.error("SMTP webhook signature validation failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature"
            )
        
        # Map events to our tracking format
        event_mappings = []
        for event in payload.events:
            try:
                event_mapping = map_smtp_event_to_tracking(event)
                event_mappings.append(event_mapping)
            except Exception as e:
                logger.error(f"Failed to map SMTP event: {str(e)}")
                continue
        
        if not event_mappings:
            logger.warning("No valid events found in SMTP webhook")
            return WebhookProcessingResult(
                processed_events=0,
                successful_events=0,
                failed_events=0,
                errors=["No valid events found"]
            )
        
        # Process events with provider context
        result = await process_webhook_events_batch(db, event_mappings, provider="smtp")
        
        logger.info(
            f"SMTP webhook processed: {result.successful_events}/{result.processed_events} successful"
        )
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in SMTP webhook: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error processing webhook"
        )


@router.get(
    "/test",
    summary="Test webhook endpoint",
    description="Test endpoint to verify webhook router is working",
)
async def webhook_test():
    """Test endpoint for webhook functionality."""
    return {"message": "Webhook endpoint is working", "timestamp": datetime.now(UTC)}