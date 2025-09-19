# NeoForge JavaScript/TypeScript SDK

Official JavaScript/TypeScript SDK for the NeoForge API.

## Installation

```bash
npm install @neoforge/sdk
```

## Quick Start

```javascript
const { NeoForgeClient } = require('@neoforge/sdk');

const client = new NeoForgeClient({
  apiKey: 'your-api-key-here'
});

// Use the client
const plans = await client.billing.getPlans();
```

## TypeScript Support

This SDK includes full TypeScript definitions:

```typescript
import NeoForgeClient from '@neoforge/sdk';

const client = new NeoForgeClient({
  apiKey: 'your-api-key-here',
  baseURL: 'https://api.neoforge.dev', // optional
  timeout: 30000 // optional, default 30s
});
```

## API Reference

### Authentication
- `auth.login(email, password)` - Login user
- `auth.register(email, password, fullName)` - Register new user
- `auth.refreshToken(refreshToken)` - Refresh access token

### Billing
- `billing.getPlans()` - Get subscription plans
- `billing.createSubscription(planId, billingCycle)` - Create subscription
- `billing.getSubscription()` - Get current subscription
- `billing.cancelSubscription(immediate)` - Cancel subscription
- `billing.getUsage()` - Get usage metrics

### Organizations
- `organizations.list()` - List organizations
- `organizations.create(name, description)` - Create organization
- `organizations.get(id)` - Get organization details
- `organizations.update(id, data)` - Update organization
- `organizations.delete(id)` - Delete organization

### Projects
- `projects.list(organizationId)` - List projects
- `projects.create(name, description, organizationId)` - Create project
- `projects.get(id)` - Get project details
- `projects.update(id, data)` - Update project
- `projects.delete(id)` - Delete project

### Analytics
- `analytics.getMetrics(startDate, endDate)` - Get analytics metrics
- `analytics.getUserActivity(userId)` - Get user activity

### Users
- `users.me()` - Get current user
- `users.update(data)` - Update current user
- `users.list()` - List users

## Error Handling

All methods throw APIError objects:

```javascript
try {
  await client.billing.getPlans();
} catch (error) {
  console.error('Status:', error.status);
  console.error('Message:', error.message);
  console.error('Code:', error.code);
}
```

## License

MIT
