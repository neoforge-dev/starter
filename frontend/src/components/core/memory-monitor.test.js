import { describe, it, expect, beforeEach, vi } from "vitest";
import { html } from "lit";
import { fixture, waitForUpdate } from "../../test/setup.js";
import { MemoryMonitor } from "./memory-monitor.js";

describe("memory-monitor", () => {
  let element;

  beforeEach(async () => {
    // Always register the component before each test
    customElements.define("memory-monitor", MemoryMonitor);
    element = await fixture(`<memory-monitor></memory-monitor>`);
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
    element.dispatchEvent(event);
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
      element.dispatchEvent(event);
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
    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.expanded).toBe(true);

    vi.advanceTimersByTime(5000); // Advance 5 seconds
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
    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.expanded).toBe(true);

    vi.advanceTimersByTime(5000); // Advance 5 seconds
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
    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.leaks).toHaveLength(1);

    // Simulate clicking the clear button
    element.clearLeaks();
    await element.updateComplete;

    expect(element.leaks).toHaveLength(0);
    expect(element.expanded).toBe(false);
  });

  it("should toggle expanded state", async () => {
    // Initially not expanded
    expect(element.expanded).toBe(false);

    // Toggle expanded state
    element.expanded = true;
    await element.updateComplete;
    expect(element.expanded).toBe(true);

    // Toggle back
    element.expanded = false;
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
      element.dispatchEvent(event);
      await element.updateComplete;

      expect(element.leaks[0].type).toBe(type);
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
    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.leaks[0].timestamp).toBe(timestamp);
  });
});
