export class Analytics {
  constructor() {
    this._queue = [];
    this._initialized = false;
    this._initPromise = this._initialize();
  }

  async _initialize() {
    try {
      // Load analytics script asynchronously
      await this._loadScript(
        "https://www.googletagmanager.com/gtag/js?id=" +
          process.env.GA_MEASUREMENT_ID
      );

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };

      gtag("js", new Date());
      gtag("config", process.env.GA_MEASUREMENT_ID);

      this._initialized = true;
      this._processQueue();
    } catch (error) {
      console.error("Failed to initialize analytics:", error);
    }
  }

  async _loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.async = true;
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  _processQueue() {
    while (this._queue.length > 0) {
      const [event, params] = this._queue.shift();
      this.trackEvent(event, params);
    }
  }

  async trackEvent(event, params = {}) {
    if (!this._initialized) {
      this._queue.push([event, params]);
      await this._initPromise;
      return;
    }

    gtag("event", event, {
      ...params,
      timestamp: new Date().toISOString(),
    });
  }

  trackPageView(path) {
    this.trackEvent("page_view", { page_path: path });
  }

  trackError(error, context = {}) {
    this.trackEvent("error", {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }
}

export const analytics = new Analytics();
