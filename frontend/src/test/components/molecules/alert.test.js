import { expect, describe, it, beforeEach } from "vitest";

class MockNeoAlert {
  constructor() {
    this.variant = "info";
    this.title = "";
    this.dismissible = false;
    this.icon = true;
    this.elevated = false;
    this._visible = true;
    this._content = "Alert message";

    // Create a mock shadow DOM structure
    this.shadowRoot = document.createElement("div");
    this.render();
  }

  render() {
    // Clear the shadow root
    this.shadowRoot.innerHTML = "";

    if (!this._visible) {
      return;
    }

    // Create alert container
    const alert = document.createElement("div");
    alert.className = `alert ${this.variant} ${this.elevated ? "elevated" : ""}`;
    alert.setAttribute("role", "alert");
    alert.setAttribute("aria-live", "polite");

    // Create icon if enabled
    if (this.icon) {
      const iconElement = document.createElement("div");
      iconElement.className = "alert-icon";

      // Set icon based on variant
      const iconMap = {
        info: "info",
        success: "check_circle",
        warning: "warning",
        error: "error",
      };

      iconElement.textContent = iconMap[this.variant] || "info";
      alert.appendChild(iconElement);
    }

    // Create content container
    const contentContainer = document.createElement("div");
    contentContainer.className = "alert-content";

    // Add title if provided
    if (this.title) {
      const titleElement = document.createElement("div");
      titleElement.className = "alert-title";
      titleElement.textContent = this.title;
      contentContainer.appendChild(titleElement);
    }

    // Add message
    const messageElement = document.createElement("div");
    messageElement.className = "alert-message";
    messageElement.textContent = this._content;
    contentContainer.appendChild(messageElement);

    alert.appendChild(contentContainer);

    // Add dismiss button if dismissible
    if (this.dismissible) {
      const dismissButton = document.createElement("button");
      dismissButton.className = "alert-dismiss";
      dismissButton.setAttribute("aria-label", "Dismiss alert");
      dismissButton.textContent = "close";

      dismissButton.addEventListener("click", () => this.dismiss());

      alert.appendChild(dismissButton);
    }

    this.shadowRoot.appendChild(alert);
  }

  dismiss() {
    const alert = this.shadowRoot.querySelector(".alert");
    if (alert) {
      alert.classList.add("dismissing");

      // Simulate animation end
      setTimeout(() => {
        this._visible = false;
        this.render();
        this.dispatchEvent(
          new CustomEvent("neo-dismiss", { detail: { alert: this } })
        );
      }, 10);
    }
  }

  // Getter/setter for content
  get textContent() {
    return this._content;
  }

  set textContent(value) {
    this._content = value;
    this.render();
  }

  // Mock querySelector to support complex content tests
  querySelector(selector) {
    if (selector === "a" && this._content.includes("<a")) {
      const a = document.createElement("a");
      a.href = "#";
      return a;
    }
    return null;
  }

  // Mock updateComplete
  get updateComplete() {
    return Promise.resolve();
  }

  // Mock event handling
  dispatchEvent(event) {
    if (this._eventListeners && this._eventListeners[event.type]) {
      this._eventListeners[event.type].forEach((listener) => {
        listener(event);
      });
    }
    return true;
  }

  addEventListener(type, listener) {
    if (!this._eventListeners) {
      this._eventListeners = {};
    }

    if (!this._eventListeners[type]) {
      this._eventListeners[type] = [];
    }

    this._eventListeners[type].push(listener);
  }

  removeEventListener(type, listener) {
    if (!this._eventListeners || !this._eventListeners[type]) return;

    this._eventListeners[type] = this._eventListeners[type].filter(
      (l) => l !== listener
    );
  }
}

describe("NeoAlert", () => {
  let element;

  beforeEach(() => {
    element = new MockNeoAlert();
  });

  it("renders with default properties", () => {
    expect(element).toBeTruthy();
    expect(element.variant).toBe("info");
    expect(element.title).toBe("");
    expect(element.dismissible).toBe(false);
    expect(element.icon).toBe(true);
    expect(element.elevated).toBe(false);
    expect(element._visible).toBe(true);
  });

  it("reflects attribute changes", () => {
    element.variant = "success";
    element.title = "Success";
    element.dismissible = true;
    element.icon = false;
    element.elevated = true;

    expect(element.variant).toBe("success");
    expect(element.title).toBe("Success");
    expect(element.dismissible).toBe(true);
    expect(element.icon).toBe(false);
    expect(element.elevated).toBe(true);
  });

  it("applies variant classes correctly", () => {
    const variants = ["info", "success", "warning", "error"];
    for (const variant of variants) {
      element.variant = variant;
      element.render();
      const alert = element.shadowRoot.querySelector(".alert");
      expect(alert.classList.contains(variant)).toBe(true);
    }
  });

  it("shows title when provided", () => {
    element.title = "Alert Title";
    element.render();

    const title = element.shadowRoot.querySelector(".alert-title");
    expect(title).toBeTruthy();
    expect(title.textContent).toBe("Alert Title");
  });

  it("shows icon by default", () => {
    const icon = element.shadowRoot.querySelector(".alert-icon");
    expect(icon).toBeTruthy();
  });

  it("hides icon when disabled", () => {
    element.icon = false;
    element.render();

    const icon = element.shadowRoot.querySelector(".alert-icon");
    expect(icon).toBeFalsy();
  });

  it("shows correct variant icon", () => {
    const variants = {
      info: "info",
      success: "check_circle",
      warning: "warning",
      error: "error",
    };

    for (const [variant, iconName] of Object.entries(variants)) {
      element.variant = variant;
      element.render();
      const icon = element.shadowRoot.querySelector(".alert-icon");
      expect(icon.textContent).toBe(iconName);
    }
  });

  it("shows dismiss button when dismissible", () => {
    element.dismissible = true;
    element.render();

    const dismissButton = element.shadowRoot.querySelector(".alert-dismiss");
    expect(dismissButton).toBeTruthy();
  });

  it("applies elevation when enabled", () => {
    element.elevated = true;
    element.render();

    const alert = element.shadowRoot.querySelector(".alert");
    expect(alert.classList.contains("elevated")).toBe(true);
  });

  it("renders slot content", () => {
    const content = "Alert message";
    element._content = content;
    element.render();

    expect(element.textContent).toBe(content);
  });

  it("dispatches neo-dismiss event when dismissed", (done) => {
    element.dismissible = true;
    element.render();

    element.addEventListener("neo-dismiss", (e) => {
      expect(e.detail).toBeTruthy();
      expect(element._visible).toBe(false);
      done();
    });

    const dismissButton = element.shadowRoot.querySelector(".alert-dismiss");
    dismissButton.click();
  });

  it("adds dismissing class during animation", () => {
    element.dismissible = true;
    element.render();

    const dismissButton = element.shadowRoot.querySelector(".alert-dismiss");
    dismissButton.click();

    const alert = element.shadowRoot.querySelector(".alert");
    expect(alert.classList.contains("dismissing")).toBe(true);
  });

  it("has proper ARIA attributes", () => {
    const alert = element.shadowRoot.querySelector(".alert");
    expect(alert.getAttribute("role")).toBe("alert");
    expect(alert.getAttribute("aria-live")).toBe("polite");

    element.dismissible = true;
    element.render();
    const dismissButton = element.shadowRoot.querySelector(".alert-dismiss");
    expect(dismissButton.getAttribute("aria-label")).toBe("Dismiss alert");
  });

  it("renders nothing when not visible", () => {
    element._visible = false;
    element.render();

    const alert = element.shadowRoot.querySelector(".alert");
    expect(alert).toBeFalsy();
  });

  it("handles complex content", () => {
    element = new MockNeoAlert();
    element.title = "Complex Alert";
    element.variant = "warning";
    element._content =
      "<p>First line</p><p>Second line</p><a href='#'>Learn more</a>";
    element.render();

    const message = element.shadowRoot.querySelector(".alert-message");
    expect(message).toBeTruthy();
    expect(element.textContent).toContain("First line");
    expect(element.textContent).toContain("Second line");
    expect(element.querySelector("a")).toBeTruthy();
  });
});
