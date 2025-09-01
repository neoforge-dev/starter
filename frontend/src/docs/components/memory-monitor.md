# Memory Monitor Component

The Memory Monitor component provides real-time monitoring of memory usage and leak detection in your web application. It helps developers identify memory issues early and maintain optimal performance.

## Features

- Real-time memory usage tracking
- Memory leak detection
- Event listener monitoring
- Detached DOM node detection
- Customizable thresholds and alerts

## Installation

```bash
npm install @neoforge/components
```

## Basic Usage

Import and use the component in your HTML:

```html
<memory-monitor
  max-leaks="5"
  auto-hide="false"
  threshold="100"
></memory-monitor>
```

Or in JavaScript:

```javascript
import "@neoforge/components/memory-monitor.js";

const monitor = document.createElement("memory-monitor");
monitor.maxLeaks = 5;
monitor.autoHide = false;
monitor.threshold = 100;
document.body.appendChild(monitor);
```

## Properties

| Property    | Type    | Default | Description                                    |
|------------|---------|---------|------------------------------------------------|
| maxLeaks   | Number  | 10      | Maximum number of leaks to display             |
| autoHide   | Boolean | true    | Automatically hide when no issues are detected |
| threshold  | Number  | 50      | Memory threshold in MB for leak detection      |

## Events

| Event Name     | Detail                  | Description                         |
|---------------|-------------------------|-------------------------------------|
| leak-detected | `{ size, location }`    | Fired when a memory leak is detected|
| threshold-exceeded | `{ usage, limit }` | Fired when memory usage exceeds threshold |

## Examples

### Basic Monitoring

```html
<memory-monitor></memory-monitor>
```

### Custom Threshold

```html
<memory-monitor
  threshold="200"
  max-leaks="3"
  auto-hide="false"
>
</memory-monitor>
```

### With Event Handling

```javascript
const monitor = document.querySelector("memory-monitor");

monitor.addEventListener("leak-detected", (e) => {
  console.warn("Memory leak detected:", e.detail);
});

monitor.addEventListener("threshold-exceeded", (e) => {
  console.error("Memory threshold exceeded:", e.detail);
});
```

## Best Practices

1. **Set Appropriate Thresholds**
   - Consider your application's typical memory usage
   - Account for different device capabilities
   - Set thresholds based on user interaction patterns

2. **Handle Events**
   - Always listen for leak detection events
   - Implement appropriate error reporting
   - Consider user notification strategies

3. **Performance Considerations**
   - Use `autoHide` in production
   - Adjust polling frequency based on needs
   - Consider disabling in non-critical sections

## Troubleshooting

### Common Issues

1. **False Positives**
   - Increase threshold for high-memory applications
   - Check for legitimate temporary memory spikes
   - Verify against actual memory profiler data

2. **Missing Leaks**
   - Decrease threshold for more sensitivity
   - Check polling frequency configuration
   - Verify leak detection patterns

### Debug Mode

Enable debug mode for detailed logging:

```javascript
monitor.debug = true;
```

## API Reference

### Methods

#### `startMonitoring()`
Begins memory monitoring with current configuration.

#### `stopMonitoring()`
Stops memory monitoring.

#### `checkMemory()`
Performs a manual memory check.

#### `resetStats()`
Resets all monitoring statistics.

### Advanced Configuration

```javascript
monitor.configure({
  pollInterval: 1000,
  debugMode: true,
  reportingEndpoint: "/api/memory-stats",
  alertThresholds: {
    warning: 75,
    critical: 90
  }
});
```

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+

## Contributing

We welcome contributions! Please see our [Contributing Guide](../contributing.md) for details.

## License

MIT License - see [LICENSE.md](../LICENSE.md) for details.
