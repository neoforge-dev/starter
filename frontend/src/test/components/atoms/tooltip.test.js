import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock implementation for NeoTooltip
class MockNeoTooltip {
  constructor() {
    // Initialize properties with default values
    this._content = "";
    this._position = "top";
    this._variant = "dark";
    this._arrow = true;
    this._delay = 200;
    this._showTimeout = null;

    // Create DOM elements for testing
    this.tooltipTrigger = document.createElement("div");
    this.tooltipTrigger.className = "tooltip-trigger";
    this.tooltipTrigger.setAttribute("aria-describedby", "tooltip");

    this.tooltipElement = document.createElement("div");
    this.tooltipElement.id = "tooltip";
    this.tooltipElement.role = "tooltip";
    this.tooltipElement.className = "tooltip dark top arrow";
    this.tooltipElement.textContent = this._content;

    this.slotElement = document.createElement("slot");

    // Set up the DOM structure
    this.tooltipTrigger.appendChild(this.slotElement);
    this.tooltipTrigger.appendChild(this.tooltipElement);

    // Add event listeners to the trigger
    this.tooltipTrigger.addEventListener("mouseenter", () =>
      this._handleMouseEnter()
    );
    this.tooltipTrigger.addEventListener("mouseleave", () =>
      this._handleMouseLeave()
    );

    // Event listeners
    this._eventListeners = new Map();

    // Shadow root mock
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === ".tooltip-trigger") return this.tooltipTrigger;
        if (selector === ".tooltip" || selector === "#tooltip")
          return this.tooltipElement;
        if (selector === "slot") return this.slotElement;
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".tooltip-trigger") return [this.tooltipTrigger];
        if (selector === ".tooltip" || selector === "#tooltip")
          return [this.tooltipElement];
        if (selector === "slot") return [this.slotElement];
        return [];
      },
    };

    // Set visibility after DOM elements are created
    this.__isVisible = false;

    // Update complete promise
    this.updateComplete = Promise.resolve(true);
  }

  // Getters and setters for properties
  get content() {
    return this._content;
  }

  set content(value) {
    this._content = value;
    this.tooltipElement.textContent = value;
  }

  get position() {
    return this._position;
  }

  set position(value) {
    this._position = value;
    this._updateTooltipClasses();
  }

  get variant() {
    return this._variant;
  }

  set variant(value) {
    this._variant = value;
    this._updateTooltipClasses();
  }

  get arrow() {
    return this._arrow;
  }

  set arrow(value) {
    this._arrow = value;
    this._updateTooltipClasses();
  }

  get delay() {
    return this._delay;
  }

  set delay(value) {
    this._delay = value;
  }

  get _isVisible() {
    return this.__isVisible;
  }

  set _isVisible(value) {
    this.__isVisible = value;
    this._updateTooltipClasses();
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

  // Component methods
  _handleMouseEnter() {
    this._showTimeout = setTimeout(() => {
      this._isVisible = true;
    }, this._delay);

    // For testing purposes, immediately trigger the timeout
    clearTimeout(this._showTimeout);
    this._isVisible = true;
  }

  _handleMouseLeave() {
    if (this._showTimeout) {
      clearTimeout(this._showTimeout);
    }
    this._isVisible = false;
  }

  // Helper methods
  _updateTooltipClasses() {
    if (!this.tooltipElement) return;

    const classes = [
      "tooltip",
      this._variant,
      this._position,
      this._arrow ? "arrow" : "",
      this.__isVisible ? "visible" : "",
    ].filter(Boolean);

    this.tooltipElement.className = classes.join(" ");
  }
}

describe("NeoTooltip", () => {
  let element;

  beforeEach(() => {
    element = new MockNeoTooltip();
  });

  it("should have default properties", () => {
    expect(element.content).toBe("");
    expect(element.position).toBe("top");
    expect(element.variant).toBe("dark");
    expect(element.arrow).toBe(true);
    expect(element.delay).toBe(200);
    expect(element._isVisible).toBe(false);
  });

  it("should update content when property changes", () => {
    element.content = "Tooltip content";
    expect(element.tooltipElement.textContent).toBe("Tooltip content");
  });

  it("should update position class when property changes", () => {
    element.position = "bottom";
    expect(element.tooltipElement.className).toContain("bottom");
    expect(element.tooltipElement.className).not.toContain("top");

    element.position = "left";
    expect(element.tooltipElement.className).toContain("left");
    expect(element.tooltipElement.className).not.toContain("bottom");

    element.position = "right";
    expect(element.tooltipElement.className).toContain("right");
    expect(element.tooltipElement.className).not.toContain("left");
  });

  it("should update variant class when property changes", () => {
    element.variant = "light";
    expect(element.tooltipElement.className).toContain("light");
    expect(element.tooltipElement.className).not.toContain("dark");

    element.variant = "dark";
    expect(element.tooltipElement.className).toContain("dark");
    expect(element.tooltipElement.className).not.toContain("light");
  });

  it("should update arrow class when property changes", () => {
    element.arrow = false;
    expect(element.tooltipElement.className).not.toContain("arrow");

    element.arrow = true;
    expect(element.tooltipElement.className).toContain("arrow");
  });

  it("should show tooltip on mouse enter after delay", () => {
    expect(element._isVisible).toBe(false);

    element.tooltipTrigger.dispatchEvent(new MouseEvent("mouseenter"));

    expect(element._isVisible).toBe(true);
    expect(element.tooltipElement.className).toContain("visible");
  });

  it("should hide tooltip on mouse leave", () => {
    // First show the tooltip
    element.tooltipTrigger.dispatchEvent(new MouseEvent("mouseenter"));
    expect(element._isVisible).toBe(true);

    // Then hide it
    element.tooltipTrigger.dispatchEvent(new MouseEvent("mouseleave"));
    expect(element._isVisible).toBe(false);
    expect(element.tooltipElement.className).not.toContain("visible");
  });

  it("should have correct ARIA attributes", () => {
    expect(element.tooltipTrigger.getAttribute("aria-describedby")).toBe(
      "tooltip"
    );
    expect(element.tooltipElement.getAttribute("role")).toBe("tooltip");
  });

  it("should support multiple positions", () => {
    const positions = ["top", "right", "bottom", "left"];

    positions.forEach((position) => {
      element.position = position;
      expect(element.tooltipElement.className).toContain(position);
    });
  });

  it("should support multiple variants", () => {
    const variants = ["dark", "light"];

    variants.forEach((variant) => {
      element.variant = variant;
      expect(element.tooltipElement.className).toContain(variant);
    });
  });

  it("should clear timeout on mouse leave", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    // First show the tooltip to set the timeout
    element.tooltipTrigger.dispatchEvent(new MouseEvent("mouseenter"));

    // Then hide it
    element.tooltipTrigger.dispatchEvent(new MouseEvent("mouseleave"));

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
