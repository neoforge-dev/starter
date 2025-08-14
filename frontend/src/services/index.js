/**
 * Services index - provides centralized exports for all services
 * This enables cleaner imports: import { authService, apiService } from '../services'
 */

// Core services
export { authService } from './auth.ts';
export { default as analytics } from './analytics.js';
export { journeyIntelligence } from './journey-intelligence.js';
export { i18n } from './i18n.js';

// API services - consolidated
export { apiService } from './api.ts';

// Data services
export { default as store } from './store.js';
export { pwaService } from './pwa.js';

// UI services
export { notificationService } from './notifications.js';
export { modalService } from './modal-service.js';
export { toastService } from './toast-service.js';

// Error handling
export { AppError, ErrorType, errorService } from './error-service.js';

// Utility services
export { performanceMonitor } from './performance-monitor.js';
export { accessibilityMonitor } from './accessibility-monitor.js';
export { imageOptimizer } from './image-optimizer.js';
export { uploadService } from './upload.js';

// Offline/PWA services
export { offlineStorage } from './offline-storage.js';
// export { offlineManager } from './offline.js'; // TODO: Implement offline functionality

// Docs services
export { docsService } from './docs.js';

// Translation services
export { translationUpdater } from './translation-updater.js';
export { translationsLoader } from './translations-loader.js';

// Router services - consolidated
export { router } from './router.js';