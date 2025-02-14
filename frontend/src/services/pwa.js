/**
 * Service to handle PWA installation and updates
 */
class PWAService {
  constructor() {
    this.deferredInstallPrompt = null;
    this.isInstalled = false;
    this.updateAvailable = false;
    this._setupEventListeners();
  }

  /**
   * Initialize PWA service
   */
  async initialize() {
    // Register service worker
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          "/service-worker.js",
          {
            scope: "/",
          }
        );

        // Check if already installed
        const relatedApps = (await navigator.getInstalledRelatedApps?.()) || [];
        this.isInstalled = relatedApps.some(
          (app) => app.id === "com.neoforge.app"
        );

        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.updateAvailable = true;
              this._notifyUpdateAvailable();
            }
          });
        });

        console.log("Service Worker registered successfully");
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }
  }

  /**
   * Set up event listeners for PWA installation
   */
  _setupEventListeners() {
    // Capture install prompt
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.deferredInstallPrompt = event;
      this._notifyInstallAvailable();
    });

    // Track installation
    window.addEventListener("appinstalled", () => {
      this.isInstalled = true;
      this.deferredInstallPrompt = null;
      this._trackInstallation();
    });
  }

  /**
   * Show installation prompt
   * @returns {Promise<boolean>} Whether the app was installed
   */
  async promptInstall() {
    if (!this.deferredInstallPrompt) {
      console.log("Installation prompt not available");
      return false;
    }

    try {
      // Show prompt
      const result = await this.deferredInstallPrompt.prompt();
      console.log("Install prompt result:", result);

      // Clear the deferred prompt
      this.deferredInstallPrompt = null;

      return result.outcome === "accepted";
    } catch (error) {
      console.error("Error showing install prompt:", error);
      return false;
    }
  }

  /**
   * Apply service worker update
   */
  async applyUpdate() {
    if (!this.updateAvailable) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.waiting) {
        // Send message to service worker to skip waiting
        registration.waiting.postMessage("skipWaiting");

        // Reload the page to activate the new service worker
        window.location.reload();
      }
    } catch (error) {
      console.error("Error applying update:", error);
    }
  }

  /**
   * Check if PWA is running in standalone mode
   */
  isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://")
    );
  }

  /**
   * Notify that installation is available
   */
  _notifyInstallAvailable() {
    window.dispatchEvent(
      new CustomEvent("pwa-install-available", {
        detail: {
          prompt: () => this.promptInstall(),
        },
      })
    );
  }

  /**
   * Notify that an update is available
   */
  _notifyUpdateAvailable() {
    window.dispatchEvent(
      new CustomEvent("pwa-update-available", {
        detail: {
          apply: () => this.applyUpdate(),
        },
      })
    );
  }

  /**
   * Track PWA installation
   */
  _trackInstallation() {
    // Analytics tracking
    if (window.gtag) {
      window.gtag("event", "pwa_install", {
        event_category: "PWA",
        event_label: "Install",
        value: 1,
      });
    }
  }

  /**
   * Check if the app needs to be updated
   */
  async checkForUpdates() {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    } catch (error) {
      console.error("Error checking for updates:", error);
    }
  }

  /**
   * Enable periodic update checks
   * @param {number} intervalMinutes - Check interval in minutes
   */
  enablePeriodicUpdates(intervalMinutes = 60) {
    setInterval(() => this.checkForUpdates(), intervalMinutes * 60 * 1000);
  }
}

// Export singleton instance
export const pwaService = new PWAService();
