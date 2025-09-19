# NeoForge Python SDK

Official Python SDK for the NeoForge API with full async support.

## Installation

```bash
pip install neoforge-sdk
```

## Quick Start

### Async Usage (Recommended)

```python
import asyncio
from neoforge import NeoForgeClient

async def main():
    async with NeoForgeClient(api_key="your-api-key-here") as client:
        plans = await client.get_billing_plans()
        print(plans)

asyncio.run(main())
```

### Synchronous Usage

```python
from neoforge.client import SyncNeoForgeClient

client = SyncNeoForgeClient(api_key="your-api-key-here")
plans = client.get_billing_plans()
print(plans)
client.close()
```

## API Reference

### Authentication
- `login(email, password)` - Login user
- `register(email, password, full_name)` - Register new user
- `refresh_token(refresh_token)` - Refresh access token

### Billing
- `get_billing_plans()` - Get subscription plans
- `create_subscription(plan_id, billing_cycle)` - Create subscription
- `get_subscription()` - Get current subscription
- `cancel_subscription(immediate)` - Cancel subscription
- `get_usage()` - Get usage metrics

### Organizations
- `list_organizations()` - List organizations
- `create_organization(name, description)` - Create organization
- `get_organization(org_id)` - Get organization details
- `update_organization(org_id, **kwargs)` - Update organization
- `delete_organization(org_id)` - Delete organization

### Projects
- `list_projects(organization_id)` - List projects
- `create_project(name, description, organization_id)` - Create project
- `get_project(project_id)` - Get project details
- `update_project(project_id, **kwargs)` - Update project
- `delete_project(project_id)` - Delete project

### Analytics
- `get_analytics_metrics(start_date, end_date)` - Get analytics metrics
- `get_user_activity(user_id)` - Get user activity

### Users
- `get_current_user()` - Get current user
- `update_current_user(**kwargs)` - Update current user
- `list_users()` - List users

## Error Handling

```python
from neoforge import NeoForgeClient, APIError, AuthenticationError

async with NeoForgeClient(api_key="your-key") as client:
    try:
        await client.get_billing_plans()
    except AuthenticationError:
        print("Invalid API key")
    except APIError as e:
        print(f"API Error: {e.message} (Status: {e.status_code})")
```

## Requirements

- Python 3.8+
- httpx >= 0.25.0
- pydantic >= 2.0.0

## License

MIT
