import { notificationService } from "./services/notifications.js";
import { analytics } from "./services/analytics.js";
import { i18n } from "./services/i18n.js";

// Initialize services
async function initializeApp() {
  try {
    // Initialize i18n first
    await i18n.initialize();

    // Track page views
    analytics.trackPageView(window.location.pathname);

    // Listen for route changes
    window.addEventListener("route-changed", (e) => {
      analytics.trackPageView(e.detail.path);
    });

    // Request notification permission if needed
    if (Notification.permission === "default") {
      await notificationService.requestPermission();
    }
  } catch (error) {
    console.error("Error initializing app:", error);
    analytics.trackError(error);
  }
}

initializeApp();
