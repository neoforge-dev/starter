# Analytics Service

## Overview

The Analytics Service provides comprehensive monitoring and tracking capabilities for:
- Performance metrics
- Error tracking
- User behavior analytics

## Usage

### Basic Setup

```javascript
import { analytics } from '@services/analytics';

// Analytics is automatically initialized
// No additional setup required
```

### Performance Monitoring

The service automatically tracks core web vitals and performance metrics:

```javascript
// Metrics tracked:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)
- Time to Interactive (TTI)
```

### Error Tracking

Automatic error tracking for both synchronous and asynchronous errors:

```javascript
// Errors are automatically tracked
try {
  // Your code
} catch (error) {
  // Errors are automatically sent to analytics
  throw error;
}

// Unhandled promise rejections are also tracked
promise.then(() => {
  throw new Error('Async error');
});
```

### User Behavior Tracking

Track user interactions and page views:

```javascript
// Page views are tracked automatically
// Click events are tracked automatically
// Form submissions are tracked automatically

// Custom interaction tracking
analytics.trackUserInteraction('custom_action', element);
```

## Analytics Dashboard

The service includes a built-in analytics dashboard component:

```html
<!-- Add to your page -->
<analytics-dashboard></analytics-dashboard>
```

### Dashboard Features

1. Performance Metrics View:
   - Real-time performance data
   - Historical trends
   - Threshold violations

2. Error Log:
   - Error type and message
   - Stack traces
   - Timestamp information

3. User Behavior:
   - Page view statistics
   - User interaction patterns
   - Form submission data

## Performance Thresholds

The service enforces the following performance budgets:

```javascript
const thresholds = {
  FCP: 1800,  // 1.8s
  LCP: 2500,  // 2.5s
  FID: 100,   // 100ms
  CLS: 0.1,   // 0.1
  TTFB: 800,  // 800ms
  TTI: 3500,  // 3.5s
};
```

## API Reference

### Methods

#### `trackUserInteraction(type: string, element: HTMLElement)`
Track custom user interactions.

```javascript
analytics.trackUserInteraction('button_click', buttonElement);
```

#### `trackError(error: Error)`
Manually track errors.

```javascript
analytics.trackError(new Error('Custom error'));
```

#### `trackPageView()`
Manually trigger page view tracking.

```javascript
analytics.trackPageView();
```

### Events

The service emits the following events:

```javascript
// Performance issue detected
analytics.addEventListener('performance-issue', (event) => {
  console.log('Performance issue:', event.detail);
});

// Error detected
analytics.addEventListener('error', (event) => {
  console.log('Error:', event.detail);
});

// User interaction
analytics.addEventListener('interaction', (event) => {
  console.log('User interaction:', event.detail);
});
```

## Integration with Monitoring Services

### Production Setup

In production, analytics data is sent to your monitoring service:

```javascript
// Configure endpoint in environment
VITE_ANALYTICS_ENDPOINT=https://your-monitoring-service.com/api

// Data is automatically sent
{
  type: 'performance|error|interaction',
  data: {
    // Metric specific data
  },
  timestamp: Date.now()
}
```

### Local Development

In development, data is logged to the console and stored in memory:

```javascript
// Access stored metrics
console.log(analytics.performanceMetrics);
console.log(analytics.errorLog);
console.log(analytics.userEvents);
```

## Best Practices

1. **Performance Monitoring:**
   - Monitor trends over time
   - Set up alerts for threshold violations
   - Regular performance audits

2. **Error Tracking:**
   - Group similar errors
   - Track error frequency
   - Monitor error patterns

3. **User Behavior:**
   - Focus on key user journeys
   - Track conversion paths
   - Monitor user engagement

## Troubleshooting

### Common Issues

1. **Missing Data:**
   ```javascript
   // Check initialization
   if (!analytics.isInitialized) {
     console.warn('Analytics not initialized');
   }
   ```

2. **Performance Issues:**
   ```javascript
   // Monitor observer disconnections
   analytics.addEventListener('observer-disconnect', (event) => {
     console.warn('Performance observer disconnected:', event);
   });
   ```

3. **Data Transmission:**
   ```javascript
   // Monitor failed transmissions
   analytics.addEventListener('transmission-error', (event) => {
     console.error('Failed to send analytics:', event);
   });
   ```

## Security Considerations

1. **Data Collection:**
   - Only collect necessary data
   - Respect user privacy settings
   - Follow GDPR guidelines

2. **Data Transmission:**
   - Use secure endpoints
   - Encrypt sensitive data
   - Implement rate limiting

3. **Error Logging:**
   - Sanitize error messages
   - Remove sensitive information
   - Implement log rotation 