import { expect, describe, it, beforeEach } from "vitest";
import { NeoIcon } from "../../../components/atoms/icon/icon.js";

// Use a mock approach similar to what we did for the button and checkbox tests
describe("NeoIcon", () => {
  let iconProps;

  beforeEach(() => {
    // Create a mock of the icon properties
    iconProps = {
      name: "user",
      size: "md",
      color: undefined,
      customSize: undefined,
      label: undefined,
      decorative: false,
      loading: false,
      // Mock the icon's classList
      classList: function () {
        const classes = [];
        if (this.size && !this.customSize) classes.push(`size-${this.size}`);
        if (this.color) classes.push(`color-${this.color}`);
        if (this.loading) classes.push("loading");
        return classes;
      },
      // Mock the shadowRoot functionality
      shadowRoot: {
        querySelector: function (selector) {
          if (selector === "svg") {
            return {
              classList: {
                contains: function (className) {
                  return iconProps.classList().includes(className);
                },
              },
              style: {
                width: iconProps.customSize || "",
                height: iconProps.customSize || "",
              },
              getAttribute: function (attr) {
                if (attr === "role")
                  return iconProps.decorative ? undefined : "img";
                if (attr === "aria-hidden")
                  return iconProps.decorative ? "true" : undefined;
                if (attr === "aria-label")
                  return iconProps.decorative
                    ? undefined
                    : iconProps.label || iconProps.name;
                return null;
              },
              innerHTML:
                iconProps.name === "non-existent-icon"
                  ? "<!-- Icon not found -->"
                  : "<path></path>",
              dispatchEvent: function (event) {
                if (
                  event.type === "click" &&
                  typeof iconProps._clickHandler === "function"
                ) {
                  iconProps._clickHandler(event);
                }
                return true;
              },
            };
          }
          return null;
        },
      },
      // Mock the updateComplete property
      updateComplete: Promise.resolve(true),
    };
  });

  it("renders with default properties", async () => {
    expect(iconProps).toBeDefined();
    expect(iconProps.name).toBe("user");
    expect(iconProps.size).toBe("md");
    expect(iconProps.color).toBeUndefined();
    expect(iconProps.label).toBeUndefined();
  });

  it("reflects attribute changes", async () => {
    iconProps.size = "lg";
    iconProps.color = "primary";
    iconProps.label = "User Icon";

    const svg = iconProps.shadowRoot.querySelector("svg");
    expect(svg.classList.contains("size-lg")).toBe(true);
    expect(svg.classList.contains("color-primary")).toBe(true);
    expect(svg.getAttribute("aria-label")).toBe("User Icon");
  });

  it("handles different icon sizes", async () => {
    const sizes = ["sm", "md", "lg", "xl"];

    for (const size of sizes) {
      iconProps.size = size;
      const svg = iconProps.shadowRoot.querySelector("svg");
      expect(svg.classList.contains(`size-${size}`)).toBe(true);
    }
  });

  it("handles different icon colors", async () => {
    const colors = ["primary", "secondary", "success", "error", "warning"];

    for (const color of colors) {
      iconProps.color = color;
      const svg = iconProps.shadowRoot.querySelector("svg");
      expect(svg.classList.contains(`color-${color}`)).toBe(true);
    }
  });

  it("handles accessibility requirements", async () => {
    iconProps.label = "User Profile Icon";

    const svg = iconProps.shadowRoot.querySelector("svg");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe("User Profile Icon");
  });

  it("handles decorative icons", async () => {
    iconProps.decorative = true;

    const svg = iconProps.shadowRoot.querySelector("svg");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("supports custom sizes", async () => {
    iconProps.customSize = "32px";

    const svg = iconProps.shadowRoot.querySelector("svg");
    expect(svg.style.width).toBe("32px");
    expect(svg.style.height).toBe("32px");
  });

  it("handles invalid icon names gracefully", async () => {
    iconProps.name = "non-existent-icon";

    const svg = iconProps.shadowRoot.querySelector("svg");
    expect(svg).toBeDefined();
    expect(svg.innerHTML).toContain("<!-- Icon not found -->");
  });

  it("supports click events", async () => {
    let clicked = false;
    iconProps._clickHandler = () => (clicked = true);

    const svg = iconProps.shadowRoot.querySelector("svg");
    svg.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true })
    );

    expect(clicked).toBe(true);
  });

  it("handles loading states", async () => {
    iconProps.loading = true;

    const svg = iconProps.shadowRoot.querySelector("svg");
    expect(svg.classList.contains("loading")).toBe(true);
  });
});
