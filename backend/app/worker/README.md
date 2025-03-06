# Email Worker

This module provides an asynchronous email processing system for NeoForge. It allows emails to be queued and processed in the background, ensuring that the main application remains responsive even when sending many emails.

## Architecture

The email system consists of the following components:

1. **EmailQueue** (`app.core.queue.EmailQueue`): A Redis-based queue implementation that stores emails to be sent.
2. **EmailWorker** (`app.worker.email_worker.EmailWorker`): A worker that processes emails from the queue.
3. **EmailService** (`app.core.email.EmailService`): A service that queues emails to be sent.
4. **Standalone Worker** (`app.worker.run_worker.py`): A script that runs the email worker as a standalone process.

## How It Works

1. **Queueing Emails**:
   - The application uses the `EmailService` to queue emails.
   - Emails are stored in Redis using the `EmailQueue` class.
   - Each email is assigned a unique ID and stored with metadata like status and creation time.

2. **Processing Emails**:
   - The `EmailWorker` continuously processes emails from the queue.
   - It runs in a background task, either as part of the main application or as a standalone process.
   - When an email is processed, it's marked as completed or failed depending on the outcome.

3. **Error Handling**:
   - If an email fails to send, it's marked as failed with an error message.
   - The worker includes retry logic to handle transient failures.
   - Failed emails can be requeued for later processing.

## Usage

### In the Main Application

The email worker is automatically initialized and started in the main application's lifespan context manager:

```python
# In app/main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize email queue
    email_queue = EmailQueue(redis=redis_client)
    await email_queue.connect()
    
    # Initialize and start email worker
    email_worker.queue = email_queue
    email_worker.start()
    
    yield
    
    # Cleanup
    email_worker.stop()
    await email_queue.disconnect()
```

### As a Standalone Process

For production environments, it's recommended to run the email worker as a standalone process:

```bash
# Run the email worker as a standalone process
python -m app.worker.run_worker
```

Or using Docker:

```bash
# Run the email worker using Docker Compose
docker-compose -f docker-compose.dev.yml up email-worker
```

### Sending Emails

To send an email, use one of the helper functions in `app.core.email`:

```python
from app.core.email import send_test_email

# Send a test email
await send_test_email(
    email_to="user@example.com",
    subject="Test Email",
    template_name="test_email.html",
    template_data={"message": "This is a test email"}
)
```

Or queue an email directly:

```python
from app.core.email import EmailService
from fastapi_mail import MessageSchema

# Create an email service
service = EmailService()

# Create a message
message = MessageSchema(
    subject="Hello",
    recipients=["user@example.com"],
    template_body={"name": "User"},
    template_name="greeting.html"
)

# Queue the email
await service.send_queued_email(message)
```

## Configuration

The email worker can be configured using the following environment variables:

- `SMTP_USER`: The SMTP username (default: `neoforge@example.com`)
- `SMTP_PASSWORD`: The SMTP password
- `REDIS_URL`: The Redis URL (default: `redis://redis:6379/0`)

## Monitoring

Currently, the email worker logs all operations to the application logger. Future enhancements will include:

- Prometheus metrics for email processing
- Dashboard for monitoring email queue status
- Alerts for failed emails

## Testing

The email worker includes comprehensive tests in `tests/worker/test_email_worker.py`. These tests cover:

- Processing emails from the queue
- Handling empty queues
- Error handling
- Starting and stopping the worker
- The processing loop

To run the tests:

```bash
# Run the email worker tests
pytest tests/worker/test_email_worker.py -v
``` 