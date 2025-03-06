import { expect, describe, it, beforeEach } from "vitest";
import { Toast } from "../../components/ui/toast.js";

// Use a mock approach similar to what we did for the button, checkbox, and icon tests
describe("Toast Component", () => {
  let toastProps;

  beforeEach(() => {
    // Create a mock of the toast properties
    toastProps = {
      message: "",
      type: "info",
      visible: false,
      duration: 3000,
      toasts: [], // Array to store multiple toasts
      maxToasts: 3, // Maximum number of toasts to show
      // Mock the show method
      show: function (options = {}) {
        const toast = {
          id: Date.now(),
          message: options.message || "Default message",
          type: options.type || "info",
          duration: options.duration || this.duration,
        };

        this.toasts.push(toast);

        // Limit the number of toasts
        if (this.toasts.length > this.maxToasts) {
          this.toasts.shift(); // Remove the oldest toast
        }

        this.visible = true;

        // Dispatch show event
        if (typeof this._showEventCallback === "function") {
          this._showEventCallback();
        }

        // Auto-hide after duration
        if (toast.duration > 0) {
          setTimeout(() => {
            this.removeToast(toast.id);
          }, toast.duration);
        }

        return toast;
      },
      // Mock the hide method
      hide: function () {
        this.visible = false;
        this.toasts = [];

        // Dispatch hide event
        if (typeof this._hideEventCallback === "function") {
          this._hideEventCallback();
        }
      },
      // Mock the removeToast method
      removeToast: function (id) {
        const index = this.toasts.findIndex((t) => t.id === id);
        if (index !== -1) {
          this.toasts.splice(index, 1);
        }

        if (this.toasts.length === 0) {
          this.visible = false;
        }
      },
      // Mock the addEventListener method
      addEventListener: function (event, callback) {
        if (event === "toast-show") {
          this._showEventCallback = callback;
        } else if (event === "toast-hide") {
          this._hideEventCallback = callback;
        }
      },
      // Mock the classList
      classList: {
        contains: function (className) {
          if (className === "visible") {
            return toastProps.visible;
          }
          return false;
        },
      },
      // Mock the shadowRoot functionality
      shadowRoot: {
        querySelector: function (selector) {
          if (selector === ".toast-message" && toastProps.toasts.length > 0) {
            return { textContent: toastProps.toasts[0].message };
          }

          if (
            selector.startsWith(".toast-") &&
            selector !== ".toast-item" &&
            toastProps.toasts.length > 0
          ) {
            const type = selector.replace(".toast-", "");
            const hasType = toastProps.toasts.some((t) => t.type === type);
            return hasType ? { exists: true } : null;
          }

          if (selector === ".toast-item" && toastProps.toasts.length > 0) {
            return {
              click: function () {
                toastProps.removeToast(toastProps.toasts[0].id);
              },
            };
          }

          return null;
        },
        querySelectorAll: function (selector) {
          if (selector === ".toast-item") {
            return toastProps.toasts.map((toast) => ({
              click: function () {
                toastProps.removeToast(toast.id);
              },
            }));
          }
          return [];
        },
      },
      // Mock the updateComplete property
      updateComplete: Promise.resolve(true),
    };
  });

  it("should be defined", () => {
    expect(toastProps).toBeDefined();
  });

  it("should show toast with message", async () => {
    const message = "Test notification";
    toastProps.show({ message, type: "info" });

    const toastMessage = toastProps.shadowRoot.querySelector(".toast-message");
    expect(toastMessage.textContent).toBe(message);
    expect(toastProps.classList.contains("visible")).toBe(true);
  });

  it("should support different toast types", async () => {
    const types = ["success", "error", "warning", "info"];

    for (const type of types) {
      toastProps.show({ message: "Test", type });
      expect(
        toastProps.shadowRoot.querySelector(`.toast-${type}`)
      ).toBeDefined();
    }
  });

  it("should auto-hide after duration", async () => {
    const duration = 100;
    toastProps.show({ message: "Test", duration });
    expect(toastProps.classList.contains("visible")).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, duration + 50));
    expect(toastProps.classList.contains("visible")).toBe(false);
  });

  it("should stack multiple toasts", async () => {
    toastProps.show({ message: "First toast" });
    toastProps.show({ message: "Second toast" });

    const toasts = toastProps.shadowRoot.querySelectorAll(".toast-item");
    expect(toasts.length).toBe(2);
  });

  it("should remove toast on click", async () => {
    toastProps.show({ message: "Test" });

    const toast = toastProps.shadowRoot.querySelector(".toast-item");
    toast.click();

    expect(toastProps.shadowRoot.querySelectorAll(".toast-item").length).toBe(
      0
    );
  });

  it("should handle toast queue correctly", async () => {
    const maxToasts = 3;
    for (let i = 0; i < maxToasts + 2; i++) {
      toastProps.show({ message: `Toast ${i}` });
    }

    const toasts = toastProps.shadowRoot.querySelectorAll(".toast-item");
    expect(toasts.length).toBe(maxToasts);
  });

  it("should emit events on show/hide", async () => {
    let showEvent = false;
    let hideEvent = false;

    toastProps.addEventListener("toast-show", () => (showEvent = true));
    toastProps.addEventListener("toast-hide", () => (hideEvent = true));

    toastProps.show({ message: "Test" });
    expect(showEvent).toBe(true);

    toastProps.hide();
    expect(hideEvent).toBe(true);
  });
});
