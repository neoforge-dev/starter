import { describe, it, expect, beforeEach, vi } from "vitest";
import { fixture, waitForUpdate } from "../../test/setup.js";
import "./memory-monitor.js";

describe("memory-monitor", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(`<memory-monitor></memory-monitor>`);
  });

  it("should render with default properties", () => {
    expect(element).toBeDefined();
    expect(element.leaks).toEqual([]);
    expect(element.expanded).toBe(false);
    expect(element.maxLeaks).toBe(50);
    expect(element.autoHide).toBe(true);
  });

  it("should add leak and expand when leak is detected", async () => {
    const leak = {
      type: "warning",
      message: "Test leak",
      timestamp: Date.now(),
    };

    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", { detail: leak })
    );

    await waitForUpdate(element);

    expect(element.leaks).toHaveLength(1);
    expect(element.leaks[0]).toEqual(leak);
    expect(element.expanded).toBe(true);
  });

  it("should limit number of leaks to maxLeaks", async () => {
    const maxLeaks = 3;
    element.maxLeaks = maxLeaks;

    // Add more leaks than maxLeaks
    for (let i = 0; i < maxLeaks + 2; i++) {
      const leak = {
        type: "warning",
        message: `Test leak ${i}`,
        timestamp: Date.now(),
      };

      window.dispatchEvent(
        new CustomEvent("memory-leak-detected", { detail: leak })
      );
    }

    await waitForUpdate(element);

    expect(element.leaks).toHaveLength(maxLeaks);
  });

  it("should auto-hide after timeout when autoHide is true", async () => {
    vi.useFakeTimers();

    const leak = {
      type: "warning",
      message: "Test leak",
      timestamp: Date.now(),
    };

    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", { detail: leak })
    );

    await waitForUpdate(element);
    expect(element.expanded).toBe(true);

    vi.advanceTimersByTime(10000);
    await waitForUpdate(element);

    expect(element.expanded).toBe(false);

    vi.useRealTimers();
  });

  it("should not auto-hide when autoHide is false", async () => {
    element.autoHide = false;

    const leak = {
      type: "warning",
      message: "Test leak",
      timestamp: Date.now(),
    };

    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", { detail: leak })
    );

    await waitForUpdate(element);
    expect(element.expanded).toBe(true);

    vi.advanceTimersByTime(10000);
    await waitForUpdate(element);

    expect(element.expanded).toBe(true);
  });

  it("should clear leaks when clear button is clicked", async () => {
    // Add some leaks
    const leak = {
      type: "warning",
      message: "Test leak",
      timestamp: Date.now(),
    };

    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", { detail: leak })
    );

    await waitForUpdate(element);
    expect(element.leaks).toHaveLength(1);

    // Find and click clear button
    const clearButton = element.shadowRoot.querySelector(".clear-button");
    clearButton.click();

    await waitForUpdate(element);
    expect(element.leaks).toHaveLength(0);
  });

  it("should toggle expanded state when header is clicked", async () => {
    const header = element.shadowRoot.querySelector(".monitor-header");

    // Initially not expanded
    expect(element.expanded).toBe(false);

    // Click to expand
    header.click();
    await waitForUpdate(element);
    expect(element.expanded).toBe(true);

    // Click to collapse
    header.click();
    await waitForUpdate(element);
    expect(element.expanded).toBe(false);
  });

  it("should format leak type correctly", () => {
    const types = {
      warning: "Warning",
      critical: "Critical",
      detached_component: "Detached Component",
      event_listener_leak: "Event Listener Leak",
    };

    Object.entries(types).forEach(([input, expected]) => {
      expect(element._formatLeakType(input)).toBe(expected);
    });
  });

  it("should format time correctly", () => {
    const timestamp = new Date("2024-01-01T12:00:00").getTime();
    const formatted = element._formatTime(timestamp);
    expect(formatted).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });
});
