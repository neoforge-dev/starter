/**
 * Global test setup for all test environments
 */

import { installPolyfill as installPerformancePolyfill } from "./unified-performance-polyfill.js";

// Ensure performance API is available
installPerformancePolyfill();

// ... existing code ...
