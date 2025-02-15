import { describe, it, expect, beforeEach, vi } from "vitest";
import { fixture, waitForUpdate } from "../../test/setup.js";
import { MemoryMonitor } from "./memory-monitor.js";

describe("memory-monitor", () => {
  let element;

  beforeEach(async () => {
    element = await fixture("memory-monitor");
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
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

    // Create and dispatch the event
    const event = new CustomEvent("memory-leak-detected", {
      detail: leak,
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
    await element.updateComplete;

    expect(element.leaks).toHaveLength(1);
    expect(element.leaks[0]).toEqual(leak);
    expect(element.expanded).toBe(true);
  });

  it("should limit number of leaks to maxLeaks", async () => {
    const maxLeaks = 3;
    element.maxLeaks = maxLeaks;

    for (let i = 0; i < maxLeaks + 2; i++) {
      const event = new CustomEvent("memory-leak-detected", {
        detail: {
          type: "memory",
          message: `Leak ${i}`,
          timestamp: Date.now(),
        },
        bubbles: true,
        composed: true,
      });
      window.dispatchEvent(event);
      await element.updateComplete;
    }

    expect(element.leaks).toHaveLength(maxLeaks);
  });

  it("should auto-hide after timeout when autoHide is true", async () => {
    vi.useFakeTimers();

    element.autoHide = true;
    const event = new CustomEvent("memory-leak-detected", {
      detail: {
        type: "memory",
        message: "Test leak",
        timestamp: Date.now(),
      },
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
    await element.updateComplete;

    expect(element.expanded).toBe(true);

    vi.advanceTimersByTime(1000); // Advance 1 second (test environment)
    await element.updateComplete;
    expect(element.expanded).toBe(false);

    vi.useRealTimers();
  });

  it("should not auto-hide when autoHide is false", async () => {
    vi.useFakeTimers();

    element.autoHide = false;
    const event = new CustomEvent("memory-leak-detected", {
      detail: {
        type: "memory",
        message: "Test leak",
        timestamp: Date.now(),
      },
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
    await element.updateComplete;

    expect(element.expanded).toBe(true);

    vi.advanceTimersByTime(1000); // Advance 1 second
    await element.updateComplete;
    expect(element.expanded).toBe(true);

    vi.useRealTimers();
  });

  it("should clear leaks when clear button is clicked", async () => {
    // Add a leak first
    const event = new CustomEvent("memory-leak-detected", {
      detail: {
        type: "memory",
        message: "Test leak",
        timestamp: Date.now(),
      },
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
    await element.updateComplete;

    expect(element.leaks).toHaveLength(1);

    // Expand the monitor to show the clear button
    element.expanded = true;
    await element.updateComplete;

    // Find and click the clear button
    const clearButton = element.shadowRoot.querySelector(".clear-button");
    clearButton.click();
    await element.updateComplete;

    expect(element.leaks).toHaveLength(0);
    expect(element.expanded).toBe(false);
  });

  it("should toggle expanded state when header is clicked", async () => {
    // Initially not expanded
    expect(element.expanded).toBe(false);

    // Click header to expand
    const header = element.shadowRoot.querySelector(".monitor-header");
    header.click();
    await element.updateComplete;
    expect(element.expanded).toBe(true);

    // Click header again to collapse
    header.click();
    await element.updateComplete;
    expect(element.expanded).toBe(false);
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
      const event = new CustomEvent("memory-leak-detected", {
        detail: {
          type,
          message: "Test leak",
          timestamp: Date.now(),
        },
        bubbles: true,
        composed: true,
      });
      window.dispatchEvent(event);
      await element.updateComplete;

      // Expand the monitor to show the leak type
      element.expanded = true;
      await element.updateComplete;

      const leakType = element.shadowRoot.querySelector(".leak-type");
      expect(leakType.textContent.trim()).toBe(expected);
    }
  });

  it("should format time correctly", async () => {
    const timestamp = new Date("2024-01-01T12:00:00").getTime();
    const event = new CustomEvent("memory-leak-detected", {
      detail: {
        type: "memory",
        message: "Test leak",
        timestamp,
      },
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
    await element.updateComplete;

    // Expand the monitor to show the time
    element.expanded = true;
    await element.updateComplete;

    const timeElement = element.shadowRoot.querySelector(".leak-time");
    expect(timeElement.textContent.trim()).toBe(
      new Date(timestamp).toLocaleTimeString()
    );
  });

  it("should remove event listener when disconnected", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    // Create and connect element
    const newElement = document.createElement("memory-monitor");
    document.body.appendChild(newElement);
    await newElement.updateComplete;

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "memory-leak-detected",
      expect.any(Function)
    );

    // Disconnect element
    document.body.removeChild(newElement);
    await newElement.updateComplete;

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "memory-leak-detected",
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
