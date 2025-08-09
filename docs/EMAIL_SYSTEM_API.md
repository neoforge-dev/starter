# Email System API Documentation

## Overview

The NeoForge Email System provides comprehensive email functionality including user registration emails, password reset emails, email verification, and delivery tracking through webhooks. The system is designed for production use with robust error handling, monitoring, and scalability features.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Endpoints │───▶│   Email Queue   │───▶│  Email Worker   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       ▼
         │                       │              ┌─────────────────┐
         │                       │              │ Email Provider  │
         │                       │              │   (SMTP/API)    │
         │                       │              └─────────────────┘
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐              │
│    Database     │    │      Redis      │              │
│   (Tracking)    │    │    (Queue)      │              │
└─────────────────┘    └─────────────────┘              │
         ▲                       ▲                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Webhooks      │
                    │ (Delivery       │
                    │  Tracking)      │
                    └─────────────────┘
```

## Authentication Endpoints

### POST /api/v1/auth/register

Register a new user and automatically send a welcome email with email verification link.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "password_confirm": "securepassword123",
  "full_name": "John Doe"
}
```

**Response (200 OK):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "is_verified": false,
    "created_at": "2024-01-01T12:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Email Behavior:**
- Automatically queues a welcome email with verification link
- Email uses `new_account` template
- Includes verification token valid for 24 hours
- Registration succeeds even if email sending fails (resilient design)

**Error Responses:**
- `400 Bad Request`: Email already registered
- `422 Unprocessable Entity`: Validation errors (password mismatch, invalid email, etc.)
- `500 Internal Server Error`: Server error (registration may still succeed)

---

### POST /api/v1/auth/verify-email

Verify user's email address using the token sent in the welcome email.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "message": "Email successfully verified"
}
```

**Behavior:**
- Marks user as verified in database
- Sets `email_verified_at` timestamp
- Idempotent operation (safe to call multiple times)

**Error Responses:**
- `400 Bad Request`: Invalid or expired verification token
- `400 Bad Request`: Email already verified (with different message)

---

### POST /api/v1/auth/resend-verification

Resend email verification link to an unverified user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If the email address is registered, you will receive a verification link shortly."
}
```

**Email Behavior:**
- Queues new verification email (reuses `new_account` template)
- Generates new verification token
- Rate limited to prevent abuse (max 1 request per 5 minutes per user)
- Returns same message for security (doesn't reveal if email exists)

**Error Responses:**
- `422 Unprocessable Entity`: Invalid email format
- `500 Internal Server Error`: Server error

---

### POST /api/v1/auth/reset-password-request

Request a password reset email to be sent to the user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If the email address is registered, you will receive a password reset link shortly."
}
```

**Email Behavior:**
- Creates secure reset token in database (expires in 24 hours)
- Queues password reset email using `reset_password` template
- Rate limited (max 1 request per 5 minutes per user)
- Returns same message for security (doesn't reveal if email exists)

**Database Changes:**
- Creates record in `password_reset_tokens` table
- Token is hashed for security
- Previous tokens for user are invalidated

**Error Responses:**
- `422 Unprocessable Entity`: Invalid email format
- `500 Internal Server Error`: Server error

---

### POST /api/v1/auth/reset-password-confirm

Confirm password reset using the token sent via email.

**Request Body:**
```json
{
  "token": "secure-reset-token-from-email",
  "new_password": "newsecurepassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been successfully reset. You can now log in with your new password."
}
```

**Behavior:**
- Validates token and checks expiration
- Updates user's password hash
- Marks reset token as used
- Invalidates all existing user sessions (security)

**Error Responses:**
- `400 Bad Request`: Invalid or expired reset token
- `400 Bad Request`: Token already used
- `422 Unprocessable Entity`: Invalid password format

## Webhook Endpoints

### GET /api/v1/webhooks/test

Test endpoint to verify webhook functionality.

**Response (200 OK):**
```json
{
  "message": "Webhook endpoint is working",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

### POST /api/v1/webhooks/sendgrid

Handle delivery status updates from SendGrid email provider.

**Headers Required:**
- `X-Twilio-Email-Event-Webhook-Signature`: HMAC signature for validation

**Request Body (Array of Events):**
```json
[
  {
    "email": "user@example.com",
    "timestamp": 1704110400,
    "smtp-id": "email-tracking-id-123",
    "event": "delivered",
    "sg_event_id": "sendgrid-event-456",
    "useragent": "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)",
    "ip": "192.168.1.1",
    "category": ["welcome"],
    "response": "250 2.0.0 Ok: queued as 12345"
  }
]
```

**Response (200 OK):**
```json
{
  "processed_events": 1,
  "successful_events": 1,
  "failed_events": 0,
  "errors": []
}
```

**Supported Events:**
- `processed`: Email processed by SendGrid
- `deferred`: Email temporarily delayed
- `delivered`: Email successfully delivered
- `open`: Email opened by recipient
- `click`: Link in email clicked
- `bounce`: Email bounced
- `dropped`: Email dropped due to policy
- `spamreport`: Email marked as spam
- `unsubscribe`: User unsubscribed
- `group_unsubscribe`: User unsubscribed from group
- `group_resubscribe`: User resubscribed to group

**Error Responses:**
- `401 Unauthorized`: Invalid webhook signature
- `400 Bad Request`: Empty request body or invalid JSON
- `500 Internal Server Error`: Processing error

---

### POST /api/v1/webhooks/smtp

Handle delivery status updates from generic SMTP providers.

**Headers Required:**
- `X-SMTP-Signature`: HMAC signature for validation

**Request Body:**
```json
{
  "events": [
    {
      "message_id": "email-tracking-id-123",
      "email": "user@example.com",
      "event_type": "delivered",
      "timestamp": "2024-01-01T12:00:00Z",
      "status": "ok",
      "user_agent": "Mozilla/5.0",
      "ip_address": "192.168.1.1",
      "location": "US",
      "metadata": {
        "provider": "smtp",
        "server": "smtp.example.com"
      }
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "processed_events": 1,
  "successful_events": 1,
  "failed_events": 0,
  "errors": []
}
```

**Supported Event Types:**
- `queued`: Email queued for sending
- `sent`: Email sent to provider
- `delivered`: Email delivered to recipient
- `opened`: Email opened
- `clicked`: Link clicked
- `bounced`: Email bounced
- `failed`: Email failed to send
- `spam`: Email marked as spam
- `unsubscribed`: User unsubscribed

## Email Templates

### Available Templates

#### `new_account`
Used for welcome emails and email verification.

**Template Variables:**
- `username`: User's full name
- `verification_url`: Email verification link
- `verification_token`: Verification token (for custom URLs)
- `company_name`: Company name from settings
- `support_email`: Support email address

**Subject**: "Welcome to {{company_name}} - Please verify your email"

#### `reset_password`
Used for password reset emails.

**Template Variables:**
- `username`: User's full name
- `reset_url`: Password reset link
- `token`: Reset token (for custom URLs)
- `expires_at`: Token expiration time
- `company_name`: Company name from settings
- `support_email`: Support email address

**Subject**: "Reset your {{company_name}} password"

#### `test_email`
Used for testing email system functionality.

**Template Variables:**
- `test_message`: Test message content
- `timestamp`: Current timestamp
- `environment`: Environment name (dev/staging/prod)

**Subject**: "Test Email - {{timestamp}}"

### Template Customization

Templates are stored in `app/email_templates/` directory and use Jinja2 templating engine.

**Template Structure:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        /* Inline CSS for email client compatibility */
    </style>
</head>
<body>
    <!-- Email content with template variables -->
    <div class="container">
        <h1>Hello {{username}}!</h1>
        <p>Your content here...</p>
    </div>
</body>
</html>
```

## Email Queue System

### Queue Operations

The email system uses Redis-based queuing for reliable email delivery.

**Queue Structure:**
```python
{
  "email_id": "unique-email-identifier",
  "email_to": "recipient@example.com",
  "subject": "Email Subject",
  "template_name": "template_name",
  "template_data": {
    "variable1": "value1",
    "variable2": "value2"
  },
  "priority": 1,  # 1=high, 2=normal, 3=low
  "retry_count": 0,
  "max_retries": 3,
  "scheduled_at": "2024-01-01T12:00:00Z"
}
```

### EmailWorker Process

The EmailWorker is a background service that processes the email queue.

**Worker Configuration:**
```python
WORKER_SETTINGS = {
    "processing_interval": 1.0,  # seconds between queue checks
    "error_interval": 5.0,      # seconds to wait after errors
    "max_retries": 3,           # maximum retry attempts
    "retry_delay": 60,          # seconds between retries
    "batch_size": 10           # emails to process per batch
}
```

**Worker Lifecycle:**
1. **Startup**: Connect to Redis queue and database
2. **Processing**: Continuously poll queue for new emails
3. **Sending**: Send emails via configured provider
4. **Tracking**: Update delivery status in database
5. **Error Handling**: Retry failed emails with exponential backoff
6. **Graceful Shutdown**: Complete current operations and stop

## Email Tracking

### Tracking Data Model

```sql
CREATE TABLE email_tracking (
    id SERIAL PRIMARY KEY,
    email_id VARCHAR(255) UNIQUE NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    template_name VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    first_opened_at TIMESTAMP,
    last_opened_at TIMESTAMP,
    first_clicked_at TIMESTAMP,
    last_clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    
    -- Metadata
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    location VARCHAR(100)
);

CREATE TABLE email_events (
    id SERIAL PRIMARY KEY,
    email_id INTEGER REFERENCES email_tracking(id),
    event_type VARCHAR(50) NOT NULL,
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
    event_metadata JSONB,
    
    -- Deduplication
    event_signature VARCHAR(64),  -- SHA256 hash for deduplication
    UNIQUE(email_id, event_signature)
);
```

### Status Transitions

```
QUEUED → SENT → DELIVERED → OPENED → CLICKED
   │      │         │
   │      │         ▼
   │      │    BOUNCED/FAILED
   │      │
   │      ▼
   │   FAILED
   │
   ▼
FAILED
```

**Status Descriptions:**
- `QUEUED`: Email queued for sending
- `SENT`: Email sent to provider
- `DELIVERED`: Email delivered to recipient's server
- `OPENED`: Email opened by recipient
- `CLICKED`: Link in email clicked
- `BOUNCED`: Email bounced (permanent failure)
- `FAILED`: Email failed to send (temporary or permanent)
- `SPAM`: Email marked as spam

### Tracking API

#### GET /api/v1/email-tracking/{email_id}
Get tracking information for a specific email.

**Response (200 OK):**
```json
{
  "email_id": "email-123",
  "recipient": "user@example.com",
  "subject": "Welcome Email",
  "template_name": "new_account",
  "status": "delivered",
  "created_at": "2024-01-01T12:00:00Z",
  "sent_at": "2024-01-01T12:00:05Z",
  "delivered_at": "2024-01-01T12:00:10Z",
  "events": [
    {
      "event_type": "sent",
      "occurred_at": "2024-01-01T12:00:05Z",
      "metadata": {"provider": "sendgrid"}
    },
    {
      "event_type": "delivered",
      "occurred_at": "2024-01-01T12:00:10Z",
      "metadata": {"response": "250 Ok"}
    }
  ]
}
```

#### GET /api/v1/email-tracking/user/{user_id}
Get all email tracking records for a specific user.

**Query Parameters:**
- `limit`: Maximum number of records (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status (optional)
- `template`: Filter by template name (optional)
- `start_date`: Filter emails after date (ISO 8601)
- `end_date`: Filter emails before date (ISO 8601)

## Error Handling

### Error Categories

1. **Validation Errors (4xx)**
   - Invalid request format
   - Missing required fields
   - Invalid email addresses
   - Authentication failures

2. **Server Errors (5xx)**
   - Database connection failures
   - Redis connection failures
   - Email provider failures
   - Internal processing errors

3. **Rate Limiting (429)**
   - Too many requests per time window
   - Automatic retry with backoff

### Error Response Format

```json
{
  "detail": "Error description",
  "error_code": "EMAIL_SEND_FAILED",
  "timestamp": "2024-01-01T12:00:00Z",
  "request_id": "req-12345",
  "retry_after": 60  // seconds (for rate limiting)
}
```

### Retry Logic

**Exponential Backoff Strategy:**
```
Attempt 1: Immediate
Attempt 2: 1 minute delay
Attempt 3: 2 minute delay
Attempt 4: 4 minute delay
Max attempts: 3
```

**Retry Conditions:**
- Temporary SMTP failures (4xx codes)
- Network timeouts
- Rate limiting responses
- Database connection errors

**Non-Retry Conditions:**
- Invalid email addresses
- Authentication failures
- Permanent SMTP failures (5xx codes)
- Malformed requests

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname

# Redis
REDIS_URL=redis://localhost:6379/0

# Email Provider
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-api-key
SMTP_USE_TLS=true

# Application
SECRET_KEY=your-secret-key-here
API_V1_STR=/api/v1
PROJECT_NAME="NeoForge Email System"
COMPANY_NAME="Your Company"
SUPPORT_EMAIL=support@yourcompany.com

# Security
ACCESS_TOKEN_EXPIRE_MINUTES=30
EMAIL_VERIFICATION_EXPIRE_HOURS=24
PASSWORD_RESET_EXPIRE_HOURS=24

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
RATE_LIMIT_PER_HOUR=100

# Email Settings
FROM_EMAIL=noreply@yourcompany.com
FROM_NAME="Your Company"
REPLY_TO_EMAIL=support@yourcompany.com

# Webhook Security
SENDGRID_WEBHOOK_SECRET=your-webhook-secret
SMTP_WEBHOOK_SECRET=your-smtp-webhook-secret

# Worker Settings
EMAIL_WORKER_INTERVAL=1.0
EMAIL_WORKER_ERROR_INTERVAL=5.0
EMAIL_WORKER_MAX_RETRIES=3
EMAIL_WORKER_BATCH_SIZE=10

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=8001
LOG_LEVEL=INFO
```

### Email Provider Configuration

#### SendGrid Setup
```python
SENDGRID_CONFIG = {
    "api_key": "your-sendgrid-api-key",
    "webhook_url": "https://yourdomain.com/api/v1/webhooks/sendgrid",
    "webhook_secret": "your-webhook-secret",
    "track_opens": True,
    "track_clicks": True,
    "templates": {
        "new_account": "d-template-id-123",
        "reset_password": "d-template-id-456"
    }
}
```

#### Generic SMTP Setup
```python
SMTP_CONFIG = {
    "server": "smtp.yourdomain.com",
    "port": 587,
    "username": "your-username",
    "password": "your-password",
    "use_tls": True,
    "timeout": 30
}
```

## Monitoring and Observability

### Health Checks

#### GET /health
Basic application health check.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "email_worker": "running"
  }
}
```

#### GET /health/email
Detailed email system health check.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "queue_size": 42,
  "worker_status": "running",
  "last_processed": "2024-01-01T11:59:30Z",
  "processing_rate": "15.2 emails/min",
  "error_rate": "0.1%",
  "providers": {
    "smtp": "healthy",
    "sendgrid": "healthy"
  }
}
```

### Metrics

#### Prometheus Metrics

```
# Queue metrics
email_queue_size{queue="default"} 42
email_queue_processing_rate{queue="default"} 15.2

# Email metrics
emails_sent_total{template="new_account",provider="sendgrid"} 1234
emails_delivered_total{template="new_account",provider="sendgrid"} 1200
emails_bounced_total{template="new_account",provider="sendgrid"} 12
emails_opened_total{template="new_account",provider="sendgrid"} 890
emails_clicked_total{template="new_account",provider="sendgrid"} 456

# Performance metrics
email_processing_duration_seconds{percentile="95"} 0.25
email_send_duration_seconds{provider="sendgrid",percentile="95"} 1.2

# Error metrics
email_errors_total{error_type="smtp_failure"} 23
email_retries_total{reason="rate_limit"} 45

# Worker metrics
email_worker_uptime_seconds 86400
email_worker_restart_count 0
```

### Logging

#### Log Levels
- `DEBUG`: Detailed debugging information
- `INFO`: General operational information
- `WARNING`: Warning conditions
- `ERROR`: Error conditions
- `CRITICAL`: Critical conditions

#### Log Format
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "INFO",
  "module": "email_worker",
  "message": "Email sent successfully",
  "email_id": "email-123",
  "recipient": "user@example.com",
  "template": "new_account",
  "provider": "sendgrid",
  "duration": 1.23,
  "request_id": "req-456"
}
```

## Security Considerations

### Authentication & Authorization
- JWT-based authentication with configurable expiration
- Role-based access control for admin endpoints
- Rate limiting to prevent abuse
- CORS configuration for browser security

### Data Protection
- Email addresses and sensitive data encrypted at rest
- Webhook signature validation to prevent tampering
- Secure token generation for email verification and password reset
- Input validation and sanitization

### Email Security
- SPF, DKIM, and DMARC configuration
- Email content sanitization to prevent XSS
- Unsubscribe link validation
- Bounce handling to maintain sender reputation

### Infrastructure Security
- TLS encryption for all communications
- Database connection encryption
- Redis authentication and encryption
- Secret management best practices

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:password@db/neoforge
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    
  worker:
    build: .
    command: python -m app.worker.run_worker
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:password@db/neoforge
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: neoforge
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: email-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: email-api
  template:
    metadata:
      labels:
        app: email-api
    spec:
      containers:
      - name: api
        image: neoforge/email-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: email-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: email-secrets
              key: redis-url
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis instance running and accessible
- [ ] Email provider configured and tested
- [ ] Webhook endpoints configured with providers
- [ ] SSL certificates installed
- [ ] Monitoring and alerting configured
- [ ] Log aggregation configured
- [ ] Backup and recovery procedures tested
- [ ] Security scan completed
- [ ] Load testing completed
- [ ] Documentation reviewed and updated

## Troubleshooting

### Common Issues

#### Emails Not Being Sent
1. Check EmailWorker is running: `GET /health/email`
2. Check queue size: Look for growing queue without processing
3. Check provider credentials: Verify SMTP/API key settings
4. Check network connectivity: Ensure worker can reach email provider
5. Check logs: Look for error messages in worker logs

#### Webhooks Not Working
1. Verify webhook URL is accessible from provider
2. Check webhook signature validation
3. Verify provider configuration matches webhook settings
4. Check firewall and security group settings
5. Test webhook endpoint: `GET /api/v1/webhooks/test`

#### High Email Bounce Rate
1. Check email content for spam indicators
2. Verify sender reputation and domain setup
3. Check recipient email validation
4. Review bounce reasons in tracking data
5. Implement double opt-in for subscriptions

#### Database Connection Issues
1. Check connection string format
2. Verify database server is accessible
3. Check connection pool settings
4. Monitor connection usage
5. Check database server logs

### Support

For additional support and documentation:
- GitHub Repository: https://github.com/yourorg/neoforge-starter
- Documentation: https://docs.neoforge.dev
- Community Forum: https://forum.neoforge.dev
- Email Support: support@neoforge.dev