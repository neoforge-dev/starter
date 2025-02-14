import { axe } from "axe-core";

/**
 * Service to monitor and report accessibility issues
 */
class AccessibilityMonitor {
  constructor() {
    this.observers = new Set();
    this.issues = new Map();
    this.config = {
      rules: {
        "color-contrast": { enabled: true },
        "aria-required-attr": { enabled: true },
        "aria-roles": { enabled: true },
        "document-title": { enabled: true },
        "html-has-lang": { enabled: true },
        "image-alt": { enabled: true },
        label: { enabled: true },
        "link-name": { enabled: true },
        list: { enabled: true },
        tabindex: { enabled: true },
      },
      resultTypes: ["violations", "incomplete", "inapplicable"],
      elementRef: true,
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "best-practice"],
      },
    };
  }

  /**
   * Initialize accessibility monitoring
   */
  initialize() {
    this._setupMutationObserver();
    this._startMonitoring();
  }

  /**
   * Subscribe to accessibility updates
   * @param {Function} callback
   */
  subscribe(callback) {
    this.observers.add(callback);
    callback(Array.from(this.issues.values()));
    return () => this.observers.delete(callback);
  }

  /**
   * Run accessibility check on the entire document
   */
  async checkDocument() {
    try {
      const results = await axe.run(document, this.config);
      this._processResults(results);
    } catch (error) {
      console.error("Error running accessibility check:", error);
    }
  }

  /**
   * Check accessibility of a specific element
   * @param {Element} element
   */
  async checkElement(element) {
    try {
      const results = await axe.run(element, this.config);
      this._processResults(results);
    } catch (error) {
      console.error("Error checking element:", error);
    }
  }

  /**
   * Update configuration
   * @param {Object} config
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config,
    };
    this.checkDocument();
  }

  /**
   * Set up mutation observer to detect DOM changes
   */
  _setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;

      mutations.forEach((mutation) => {
        if (
          mutation.type === "childList" ||
          (mutation.type === "attributes" &&
            this._isRelevantAttribute(mutation.attributeName))
        ) {
          shouldCheck = true;
        }
      });

      if (shouldCheck) {
        this._debounce(() => this.checkDocument(), 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["role", "aria-*", "alt", "title", "lang"],
    });
  }

  /**
   * Start periodic monitoring
   */
  _startMonitoring() {
    // Initial check
    this.checkDocument();

    // Periodic checks
    setInterval(() => {
      this.checkDocument();
    }, 60000); // Check every minute
  }

  /**
   * Process accessibility results
   * @param {Object} results
   */
  _processResults(results) {
    // Clear old issues
    this.issues.clear();

    // Process violations
    results.violations.forEach((violation) => {
      const issue = {
        id: violation.id,
        type: "violation",
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map((node) => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary,
        })),
        timestamp: Date.now(),
      };

      this.issues.set(violation.id, issue);
    });

    // Process incomplete results
    results.incomplete.forEach((incomplete) => {
      const issue = {
        id: incomplete.id,
        type: "incomplete",
        impact: incomplete.impact,
        description: incomplete.description,
        help: incomplete.help,
        helpUrl: incomplete.helpUrl,
        nodes: incomplete.nodes.map((node) => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary,
        })),
        timestamp: Date.now(),
      };

      this.issues.set(incomplete.id, issue);
    });

    this._notifyObservers();
  }

  /**
   * Check if attribute is relevant for accessibility
   * @param {string} attribute
   * @returns {boolean}
   */
  _isRelevantAttribute(attribute) {
    return (
      attribute.startsWith("aria-") ||
      ["role", "alt", "title", "lang", "tabindex"].includes(attribute)
    );
  }

  /**
   * Notify observers of updates
   */
  _notifyObservers() {
    const issues = Array.from(this.issues.values());
    this.observers.forEach((callback) => callback(issues));
  }

  /**
   * Debounce function
   * @param {Function} func
   * @param {number} wait
   */
  _debounce(func, wait) {
    clearTimeout(this._debounceTimeout);
    this._debounceTimeout = setTimeout(func, wait);
  }
}

// Export singleton instance
export const accessibilityMonitor = new AccessibilityMonitor();
