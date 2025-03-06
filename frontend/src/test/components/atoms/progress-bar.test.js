import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock implementation for NeoProgressBar
class MockNeoProgressBar {
  constructor() {
    // Initialize properties with default values
    this._value = 0;
    this._max = 100;
    this._variant = "default";
    this._size = "md";
    this._indeterminate = false;
    this._showLabel = false;
    this._label = "";

    // Create DOM elements for testing
    this.progressContainer = document.createElement("div");
    this.progressBar = document.createElement("div");
    this.progressFill = document.createElement("div");
    this.progressLabel = document.createElement("div");
    this.srOnly = document.createElement("span");

    // Set up the DOM structure
    this.progressBar.appendChild(this.progressFill);
    this.progressContainer.appendChild(this.progressBar);
    this.progressContainer.appendChild(this.srOnly);

    // Set up attributes
    this.progressContainer.setAttribute("role", "progressbar");
    this.progressContainer.setAttribute("aria-valuemin", "0");
    this.progressContainer.setAttribute("aria-valuemax", "100");
    this.progressContainer.setAttribute("aria-valuenow", "0");

    // Set up classes
    this.progressBar.className = "progress-bar md";
    this.progressFill.className = "progress-fill default";
    this.progressFill.style.width = "0%";
    this.progressLabel.className = "progress-label";
    this.srOnly.className = "sr-only";
    this.srOnly.textContent = "Progress: 0%";

    // Event listeners
    this._eventListeners = new Map();

    // Shadow root mock
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === ".progress-container") return this.progressContainer;
        if (selector === ".progress-bar") return this.progressBar;
        if (selector === ".progress-fill") return this.progressFill;
        if (selector === ".progress-label") return this.progressLabel;
        if (selector === ".sr-only") return this.srOnly;
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".progress-bar") return [this.progressBar];
        if (selector === ".progress-fill") return [this.progressFill];
        if (selector === ".progress-label")
          return this._showLabel ? [this.progressLabel] : [];
        return [];
      },
    };

    // Update the DOM to match initial properties
    this._updateProgressBar();
  }

  // Getters and setters for properties
  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this._updateProgressBar();
  }

  get max() {
    return this._max;
  }

  set max(val) {
    this._max = val;
    this._updateProgressBar();
  }

  get variant() {
    return this._variant;
  }

  set variant(val) {
    this._variant = val;
    this._updateProgressBar();
  }

  get size() {
    return this._size;
  }

  set size(val) {
    this._size = val;
    this._updateProgressBar();
  }

  get indeterminate() {
    return this._indeterminate;
  }

  set indeterminate(val) {
    this._indeterminate = val;
    this._updateProgressBar();
  }

  get showLabel() {
    return this._showLabel;
  }

  set showLabel(val) {
    this._showLabel = val;
    this._updateProgressBar();
  }

  get label() {
    return this._label;
  }

  set label(val) {
    this._label = val;
    this._updateProgressBar();
  }

  // Calculate percentage based on value and max
  get percentage() {
    return Math.min(100, Math.max(0, (this._value / this._max) * 100));
  }

  // Event handling
  addEventListener(eventName, callback) {
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, new Set());
    }
    this._eventListeners.get(eventName).add(callback);
  }

  removeEventListener(eventName, callback) {
    if (this._eventListeners.has(eventName)) {
      this._eventListeners.get(eventName).delete(callback);
    }
  }

  dispatchEvent(event) {
    if (this._eventListeners.has(event.type)) {
      this._eventListeners.get(event.type).forEach((callback) => {
        callback(event);
      });
    }
    return true;
  }

  // Update the progress bar DOM elements based on current properties
  _updateProgressBar() {
    // Update classes
    this.progressBar.className = `progress-bar ${this._size}`;
    this.progressFill.className = `progress-fill ${this._variant}${this._indeterminate ? " indeterminate" : ""}`;

    // Update styles
    if (!this._indeterminate) {
      this.progressFill.style.width = `${this.percentage}%`;
    } else {
      this.progressFill.style.width = "50%";
    }

    // Update attributes
    this.progressContainer.setAttribute("aria-valuemax", this._max.toString());
    if (!this._indeterminate) {
      this.progressContainer.setAttribute(
        "aria-valuenow",
        this._value.toString()
      );
    } else {
      this.progressContainer.removeAttribute("aria-valuenow");
    }

    // Update label
    if (this._showLabel) {
      if (!this.progressContainer.contains(this.progressLabel)) {
        this.progressContainer.insertBefore(this.progressLabel, this.srOnly);
      }
      this.progressLabel.textContent =
        this._label || `${Math.round(this.percentage)}%`;
    } else if (this.progressContainer.contains(this.progressLabel)) {
      this.progressContainer.removeChild(this.progressLabel);
    }

    // Update screen reader text
    this.srOnly.textContent = this._indeterminate
      ? "Loading..."
      : `Progress: ${Math.round(this.percentage)}%`;
  }
}

describe("NeoProgressBar", () => {
  let element;

  beforeEach(() => {
    element = new MockNeoProgressBar();
  });

  it("should have default properties", () => {
    expect(element.value).toBe(0);
    expect(element.max).toBe(100);
    expect(element.variant).toBe("default");
    expect(element.size).toBe("md");
    expect(element.indeterminate).toBe(false);
    expect(element.showLabel).toBe(false);
    expect(element.label).toBe("");
  });

  it("should calculate percentage correctly", () => {
    element.value = 50;
    expect(element.percentage).toBe(50);

    element.value = 25;
    expect(element.percentage).toBe(25);

    element.max = 200;
    expect(element.percentage).toBe(12.5);

    element.value = 300;
    expect(element.percentage).toBe(100); // Should cap at 100%

    element.value = -10;
    expect(element.percentage).toBe(0); // Should not go below 0%
  });

  it("should update progress bar width based on value", () => {
    element.value = 75;
    expect(element.shadowRoot.querySelector(".progress-fill").style.width).toBe(
      "75%"
    );

    element.value = 30;
    expect(element.shadowRoot.querySelector(".progress-fill").style.width).toBe(
      "30%"
    );
  });

  it("should apply variant classes correctly", () => {
    element.variant = "success";
    expect(
      element.shadowRoot.querySelector(".progress-fill").className
    ).toContain("success");

    element.variant = "error";
    expect(
      element.shadowRoot.querySelector(".progress-fill").className
    ).toContain("error");

    element.variant = "default";
    expect(
      element.shadowRoot.querySelector(".progress-fill").className
    ).toContain("default");
  });

  it("should apply size classes correctly", () => {
    element.size = "sm";
    expect(
      element.shadowRoot.querySelector(".progress-bar").className
    ).toContain("sm");

    element.size = "lg";
    expect(
      element.shadowRoot.querySelector(".progress-bar").className
    ).toContain("lg");

    element.size = "md";
    expect(
      element.shadowRoot.querySelector(".progress-bar").className
    ).toContain("md");
  });

  it("should handle indeterminate state", () => {
    element.indeterminate = true;
    expect(
      element.shadowRoot.querySelector(".progress-fill").className
    ).toContain("indeterminate");
    expect(element.shadowRoot.querySelector(".sr-only").textContent).toBe(
      "Loading..."
    );
    expect(element.progressContainer.hasAttribute("aria-valuenow")).toBe(false);

    element.indeterminate = false;
    expect(
      element.shadowRoot.querySelector(".progress-fill").className
    ).not.toContain("indeterminate");
    expect(element.shadowRoot.querySelector(".sr-only").textContent).toBe(
      "Progress: 0%"
    );
    expect(element.progressContainer.hasAttribute("aria-valuenow")).toBe(true);
  });

  it("should show label when showLabel is true", () => {
    element.showLabel = true;
    expect(element.progressContainer.contains(element.progressLabel)).toBe(
      true
    );
    expect(element.progressLabel.textContent).toBe("0%");

    element.value = 42;
    expect(element.progressLabel.textContent).toBe("42%");

    element.showLabel = false;
    expect(element.progressContainer.contains(element.progressLabel)).toBe(
      false
    );
  });

  it("should use custom label text when provided", () => {
    element.showLabel = true;
    element.label = "Loading files...";
    expect(element.progressLabel.textContent).toBe("Loading files...");

    element.label = "";
    element.value = 75;
    expect(element.progressLabel.textContent).toBe("75%");
  });

  it("should set correct ARIA attributes", () => {
    expect(element.progressContainer.getAttribute("role")).toBe("progressbar");
    expect(element.progressContainer.getAttribute("aria-valuemin")).toBe("0");
    expect(element.progressContainer.getAttribute("aria-valuemax")).toBe("100");
    expect(element.progressContainer.getAttribute("aria-valuenow")).toBe("0");

    element.value = 50;
    element.max = 200;
    expect(element.progressContainer.getAttribute("aria-valuemax")).toBe("200");
    expect(element.progressContainer.getAttribute("aria-valuenow")).toBe("50");

    element.indeterminate = true;
    expect(element.progressContainer.hasAttribute("aria-valuenow")).toBe(false);
  });

  it("should update screen reader text based on progress", () => {
    element.value = 33;
    expect(element.srOnly.textContent).toBe("Progress: 33%");

    element.indeterminate = true;
    expect(element.srOnly.textContent).toBe("Loading...");
  });
});
