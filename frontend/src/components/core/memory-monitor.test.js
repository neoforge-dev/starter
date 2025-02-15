import { describe, it, expect, beforeEach, vi } from "vitest";
import { fixture, waitForUpdate } from "../../test/setup.js";
import { MemoryMonitor } from "./memory-monitor.js";

describe("memory-monitor", () => {
  let element;

  beforeEach(async () => {
    // Define the custom element if not already defined
    if (!customElements.get("memory-monitor")) {
      customElements.define("memory-monitor", MemoryMonitor);
    }
    // Create a new instance
    element = await fixture("<memory-monitor></memory-monitor>");
    // Wait for initial render
    await waitForUpdate(element);
  });

  it("should render with default properties", async () => {
    expect(element).toBeDefined();
    expect(element.leaks).toEqual([]);
    expect(element.expanded).toBe(false);
    expect(element.maxLeaks).toBe(50);
    expect(element.autoHide).toBe(true);
  });

  it("should add leak and expand when leak is detected", async () => {
    const leak = {
      type: "memory",
      message: "Test leak",
      timestamp: Date.now(),
    };

    // Dispatch memory leak event
    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", { detail: leak })
    );
    await waitForUpdate(element);

    expect(element.leaks).toHaveLength(1);
    expect(element.leaks[0]).toEqual(leak);
    expect(element.expanded).toBe(true);

    // Check if the leak is rendered in the shadow DOM
    const leakElement = element.shadowRoot.querySelector(".leak-item");
    expect(leakElement).toBeDefined();
    expect(leakElement.querySelector(".leak-message").textContent).toBe(
      leak.message
    );
  });

  it("should limit number of leaks to maxLeaks", async () => {
    const maxLeaks = 3;
    element.maxLeaks = maxLeaks;

    for (let i = 0; i < maxLeaks + 2; i++) {
      window.dispatchEvent(
        new CustomEvent("memory-leak-detected", {
          detail: {
            type: "memory",
            message: `Leak ${i}`,
            timestamp: Date.now(),
          },
        })
      );
      await waitForUpdate(element);
    }

    expect(element.leaks).toHaveLength(maxLeaks);
    const leakElements = element.shadowRoot.querySelectorAll(".leak-item");
    expect(leakElements.length).toBe(maxLeaks);
  });

  it("should auto-hide after timeout when autoHide is true", async () => {
    vi.useFakeTimers();

    element.autoHide = true;
    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", {
        detail: {
          type: "memory",
          message: "Test leak",
          timestamp: Date.now(),
        },
      })
    );

    await waitForUpdate(element);
    expect(element.expanded).toBe(true);
    expect(element.shadowRoot.querySelector(".monitor-content")).toBeDefined();

    vi.advanceTimersByTime(1000);
    await waitForUpdate(element);
    expect(element.expanded).toBe(false);
    expect(element.shadowRoot.querySelector(".monitor-content")).toBeNull();

    vi.useRealTimers();
  });

  it("should not auto-hide when autoHide is false", async () => {
    vi.useFakeTimers();

    element.autoHide = false;
    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", {
        detail: {
          type: "memory",
          message: "Test leak",
          timestamp: Date.now(),
        },
      })
    );

    await waitForUpdate(element);
    expect(element.expanded).toBe(true);
    expect(element.shadowRoot.querySelector(".monitor-content")).toBeDefined();

    vi.advanceTimersByTime(1000);
    await waitForUpdate(element);
    expect(element.expanded).toBe(true);
    expect(element.shadowRoot.querySelector(".monitor-content")).toBeDefined();

    vi.useRealTimers();
  });

  it("should clear leaks when clear button is clicked", async () => {
    // Add a leak first
    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", {
        detail: {
          type: "memory",
          message: "Test leak",
          timestamp: Date.now(),
        },
      })
    );
    await waitForUpdate(element);
    expect(element.leaks).toHaveLength(1);
    expect(element.shadowRoot.querySelector(".leak-item")).toBeDefined();

    // Find and click the clear button
    const clearButton = element.shadowRoot.querySelector(".clear-button");
    expect(clearButton).toBeDefined();
    clearButton.click();
    await waitForUpdate(element);

    expect(element.leaks).toHaveLength(0);
    expect(element.expanded).toBe(false);
    expect(element.shadowRoot.querySelector(".leak-item")).toBeNull();
  });

  it("should toggle expanded state when header is clicked", async () => {
    const header = element.shadowRoot.querySelector(".monitor-header");
    expect(header).toBeDefined();

    // Initially not expanded
    expect(element.expanded).toBe(false);
    expect(element.shadowRoot.querySelector(".monitor-content")).toBeNull();

    // Click header to expand
    header.click();
    await waitForUpdate(element);
    expect(element.expanded).toBe(true);
    expect(element.shadowRoot.querySelector(".monitor-content")).toBeDefined();

    // Click header again to collapse
    header.click();
    await waitForUpdate(element);
    expect(element.expanded).toBe(false);
    expect(element.shadowRoot.querySelector(".monitor-content")).toBeNull();
  });

  it("should format leak types correctly", async () => {
    const testCases = [
      { type: "memory", expected: "Memory Leak" },
      { type: "performance", expected: "Performance Issue" },
      { type: "error", expected: "Error" },
      { type: "warning", expected: "Warning" },
      { type: "custom", expected: "custom" },
    ];

    for (const { type, expected } of testCases) {
      window.dispatchEvent(
        new CustomEvent("memory-leak-detected", {
          detail: {
            type,
            message: "Test leak",
            timestamp: Date.now(),
          },
        })
      );
      await waitForUpdate(element);

      const leakType = element.shadowRoot.querySelector(".leak-type");
      expect(leakType).toBeDefined();
      expect(leakType.textContent.trim()).toBe(expected);
    }
  });

  it("should format time correctly", async () => {
    const timestamp = new Date("2024-01-01T12:00:00").getTime();
    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", {
        detail: {
          type: "memory",
          message: "Test leak",
          timestamp,
        },
      })
    );
    await waitForUpdate(element);

    const timeElement = element.shadowRoot.querySelector(".leak-time");
    expect(timeElement).toBeDefined();
    expect(timeElement.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });
});
