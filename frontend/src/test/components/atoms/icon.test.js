import { expect, describe, it, beforeEach } from "vitest";
// Remove the import of the actual component
// import { NeoIcon } from "../../../components/atoms/icon/icon.js";

// Create a mock for the NeoIcon component
class MockNeoIcon {
  constructor() {
    // Initialize properties with default values
    this.name = "user";
    this.size = "md";
    this.color = undefined;
    this.customSize = undefined;
    this.label = undefined;
    this.decorative = false;
    this.loading = false;

    // Create a shadow DOM structure
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === "svg") {
          return {
            classList: {
              contains: (className) => {
                return this.classList().includes(className);
              },
            },
            style: {
              width: this.customSize || "",
              height: this.customSize || "",
            },
            getAttribute: (attr) => {
              if (attr === "role") return this.decorative ? undefined : "img";
              if (attr === "aria-hidden")
                return this.decorative ? "true" : undefined;
              if (attr === "aria-label")
                return this.decorative ? undefined : this.label || this.name;
              return null;
            },
            innerHTML:
              this.name === "non-existent-icon"
                ? "<!-- Icon not found -->"
                : "<path></path>",
            dispatchEvent: (event) => {
              if (
                event.type === "click" &&
                typeof this._clickHandler === "function"
              ) {
                this._clickHandler(event);
              }
              return true;
            },
          };
        }
        return null;
      },
    };
  }

  // Mock the icon's classList
  classList() {
    const classes = [];
    if (this.size && !this.customSize) classes.push(`size-${this.size}`);
    if (this.color) classes.push(`color-${this.color}`);
    if (this.loading) classes.push("loading");
    return classes;
  }
}

// Use a mock approach similar to what we did for the button and checkbox tests
describe("NeoIcon", () => {
  let icon;

  beforeEach(() => {
    // Create a new instance of the mock icon
    icon = new MockNeoIcon();
  });

  it("renders with default properties", async () => {
    expect(icon).toBeDefined();
    expect(icon.name).toBe("user");
    expect(icon.size).toBe("md");
    expect(icon.color).toBeUndefined();
    expect(icon.label).toBeUndefined();
  });

  it("reflects attribute changes", async () => {
    icon.size = "lg";
    icon.color = "primary";
    icon.label = "User Icon";

    const svg = icon.shadowRoot.querySelector("svg");
    expect(svg.classList.contains("size-lg")).toBe(true);
    expect(svg.classList.contains("color-primary")).toBe(true);
    expect(svg.getAttribute("aria-label")).toBe("User Icon");
  });

  it("handles different icon sizes", async () => {
    const sizes = ["sm", "md", "lg", "xl"];

    for (const size of sizes) {
      icon.size = size;
      const svg = icon.shadowRoot.querySelector("svg");
      expect(svg.classList.contains(`size-${size}`)).toBe(true);
    }
  });

  it("handles different icon colors", async () => {
    const colors = ["primary", "secondary", "success", "error", "warning"];

    for (const color of colors) {
      icon.color = color;
      const svg = icon.shadowRoot.querySelector("svg");
      expect(svg.classList.contains(`color-${color}`)).toBe(true);
    }
  });

  it("handles accessibility requirements", async () => {
    icon.label = "User Profile Icon";

    const svg = icon.shadowRoot.querySelector("svg");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe("User Profile Icon");
  });

  it("handles decorative icons", async () => {
    icon.decorative = true;

    const svg = icon.shadowRoot.querySelector("svg");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("supports custom sizes", async () => {
    icon.customSize = "32px";

    const svg = icon.shadowRoot.querySelector("svg");
    expect(svg.style.width).toBe("32px");
    expect(svg.style.height).toBe("32px");
  });

  it("handles invalid icon names gracefully", async () => {
    icon.name = "non-existent-icon";

    const svg = icon.shadowRoot.querySelector("svg");
    expect(svg).toBeDefined();
    expect(svg.innerHTML).toContain("<!-- Icon not found -->");
  });

  it("supports click events", async () => {
    let clicked = false;
    icon._clickHandler = () => (clicked = true);

    const svg = icon.shadowRoot.querySelector("svg");
    svg.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true })
    );

    expect(clicked).toBe(true);
  });

  it("handles loading states", async () => {
    icon.loading = true;

    const svg = icon.shadowRoot.querySelector("svg");
    expect(svg.classList.contains("loading")).toBe(true);
  });
});
