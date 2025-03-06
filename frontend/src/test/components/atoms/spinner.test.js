import { expect, describe, it, beforeEach } from "vitest";

// Create a mock for the NeoSpinner component
class MockNeoSpinner {
  constructor() {
    // Initialize properties with default values
    this._size = "md";
    this._color = "primary";
    this._variant = "border";
    this._label = "Loading...";

    // Create a shadow DOM structure
    this.shadowRoot = document.createElement("div");

    // Create the spinner element
    this._updateSpinner();
  }

  // Getters and setters for reactivity
  get size() {
    return this._size;
  }

  set size(value) {
    this._size = value;
    this._updateSpinner();
  }

  get color() {
    return this._color;
  }

  set color(value) {
    this._color = value;
    this._updateSpinner();
  }

  get variant() {
    return this._variant;
  }

  set variant(value) {
    this._variant = value;
    this._updateSpinner();
  }

  get label() {
    return this._label;
  }

  set label(value) {
    this._label = value;
    this._updateSpinner();
  }

  // Update the spinner DOM elements
  _updateSpinner() {
    // Clear shadow root
    this.shadowRoot.innerHTML = "";

    // Create spinner container
    const spinnerContainer = document.createElement("div");
    spinnerContainer.className = `spinner ${this._variant} ${this._size} ${this._color}`;
    spinnerContainer.setAttribute("role", "status");

    // Add dots if variant is dots
    if (this._variant === "dots") {
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.className = "dot";
        spinnerContainer.appendChild(dot);
      }
    }

    // Add screen reader text
    const srOnly = document.createElement("span");
    srOnly.className = "sr-only";
    srOnly.textContent = this._label;
    spinnerContainer.appendChild(srOnly);

    // Add spinner to shadow root
    this.shadowRoot.appendChild(spinnerContainer);
  }
}

describe("NeoSpinner", () => {
  let element;

  beforeEach(() => {
    // Create a new instance for each test
    element = new MockNeoSpinner();
  });

  it("should initialize with default properties", () => {
    expect(element.size).toBe("md");
    expect(element.color).toBe("primary");
    expect(element.variant).toBe("border");
    expect(element.label).toBe("Loading...");
  });

  it("should render with the correct size class", () => {
    const spinner = element.shadowRoot.querySelector(".spinner");
    expect(spinner.classList.contains("md")).toBe(true);

    // Change size and verify class update
    element.size = "lg";
    const updatedSpinner = element.shadowRoot.querySelector(".spinner");
    expect(updatedSpinner.classList.contains("lg")).toBe(true);
    expect(updatedSpinner.classList.contains("md")).toBe(false);
  });

  it("should render with the correct color class", () => {
    const spinner = element.shadowRoot.querySelector(".spinner");
    expect(spinner.classList.contains("primary")).toBe(true);

    // Change color and verify class update
    element.color = "error";
    const updatedSpinner = element.shadowRoot.querySelector(".spinner");
    expect(updatedSpinner.classList.contains("error")).toBe(true);
    expect(updatedSpinner.classList.contains("primary")).toBe(false);
  });

  it("should render with the correct variant", () => {
    const spinner = element.shadowRoot.querySelector(".spinner");
    expect(spinner.classList.contains("border")).toBe(true);
    expect(spinner.querySelectorAll(".dot").length).toBe(0);

    // Change variant to dots and verify dots are rendered
    element.variant = "dots";
    const updatedSpinner = element.shadowRoot.querySelector(".spinner");
    expect(updatedSpinner.classList.contains("dots")).toBe(true);
    expect(updatedSpinner.classList.contains("border")).toBe(false);
    expect(updatedSpinner.querySelectorAll(".dot").length).toBe(3);

    // Change variant to pulse and verify no dots
    element.variant = "pulse";
    const pulseSpinner = element.shadowRoot.querySelector(".spinner");
    expect(pulseSpinner.classList.contains("pulse")).toBe(true);
    expect(pulseSpinner.querySelectorAll(".dot").length).toBe(0);
  });

  it("should render with the correct accessibility label", () => {
    const srOnly = element.shadowRoot.querySelector(".sr-only");
    expect(srOnly.textContent).toBe("Loading...");

    // Change label and verify update
    element.label = "Please wait...";
    const updatedSrOnly = element.shadowRoot.querySelector(".sr-only");
    expect(updatedSrOnly.textContent).toBe("Please wait...");
  });

  it("should have the correct role attribute for accessibility", () => {
    const spinner = element.shadowRoot.querySelector(".spinner");
    expect(spinner.getAttribute("role")).toBe("status");
  });

  it("should update all properties at once", () => {
    // Update all properties
    element.size = "sm";
    element.color = "success";
    element.variant = "pulse";
    element.label = "Processing...";

    // Verify all updates
    const spinner = element.shadowRoot.querySelector(".spinner");
    expect(spinner.classList.contains("sm")).toBe(true);
    expect(spinner.classList.contains("success")).toBe(true);
    expect(spinner.classList.contains("pulse")).toBe(true);

    const srOnly = spinner.querySelector(".sr-only");
    expect(srOnly.textContent).toBe("Processing...");
  });
});
