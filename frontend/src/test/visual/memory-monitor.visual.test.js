import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Memory Monitor Component", () => {
  let memoryMonitor;

  beforeEach(() => {
    // Mock performance.memory
    global.performance = {
      memory: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
      },
    };

    // Create memory monitor element
    document.body.innerHTML = "<memory-monitor></memory-monitor>";
    memoryMonitor = document.querySelector("memory-monitor");

    // Mock the shadow DOM
    memoryMonitor.shadowRoot = {
      querySelector: vi.fn().mockImplementation((selector) => {
        if (selector === ".memory-usage") {
          return {
            textContent: "",
            classList: {
              add: vi.fn(),
              remove: vi.fn(),
            },
          };
        }
        return null;
      }),
    };
  });

  it("should display memory usage information", () => {
    // Trigger update
    memoryMonitor.updateMemoryInfo();

    // Check if memory usage is displayed
    const memoryUsageElement =
      memoryMonitor.shadowRoot.querySelector(".memory-usage");
    expect(memoryUsageElement.textContent).toContain("50MB");
    expect(memoryUsageElement.textContent).toContain("100MB");
  });

  it("should apply correct styling based on memory usage", () => {
    // Trigger update
    memoryMonitor.updateMemoryInfo();

    // Get memory usage element
    const memoryUsageElement =
      memoryMonitor.shadowRoot.querySelector(".memory-usage");

    // Check if correct class is applied (50% usage)
    expect(memoryUsageElement.classList.add).toHaveBeenCalledWith("warning");
    expect(memoryUsageElement.classList.remove).toHaveBeenCalledWith(
      "critical"
    );
  });
});
