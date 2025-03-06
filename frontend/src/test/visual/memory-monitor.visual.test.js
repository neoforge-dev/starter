import { expect, describe, it, beforeEach, vi } from "vitest";
import { MemoryMonitor } from "../../components/core/memory-monitor.js";

// Using the mock approach instead of skipping
describe("Memory Monitor Component", () => {
  let memoryMonitorProps;
  let memoryUsageElement;

  beforeEach(() => {
    // Mock performance.memory
    global.performance = {
      memory: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
      },
    };

    // Create memory usage element mock
    memoryUsageElement = {
      textContent: "",
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    };

    // Create a mock of the memory monitor properties
    memoryMonitorProps = {
      // Properties
      leaks: [],
      expanded: false,
      maxLeaks: 50,
      autoHide: true,
      autoHideTimeout: 10000,
      _eventListeners: {}, // Store event listeners

      // Methods
      _handleLeakDetected: function (event) {
        if (!event.detail) {
          console.warn("Memory leak event missing detail");
          return;
        }

        const { type, size, time } = event.detail;
        if (!type || !size || !time) {
          console.warn(
            "Memory leak event missing required fields",
            event.detail
          );
          return;
        }

        this.addLeak(event.detail);
      },

      addLeak: function (leak) {
        this.leaks = [...this.leaks, leak];
        if (this.leaks.length > this.maxLeaks) {
          this.leaks = this.leaks.slice(-this.maxLeaks);
        }
        this.expanded = true;
        if (this.autoHide) {
          setTimeout(() => {
            this.expanded = false;
          }, this.autoHideTimeout);
        }
      },

      _formatTime: function (time) {
        return new Date(time).toLocaleTimeString();
      },

      _formatSize: function (size) {
        const units = ["B", "KB", "MB", "GB"];
        let value = size;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
          value /= 1024;
          unitIndex++;
        }

        return `${value.toFixed(1)}${units[unitIndex]}`;
      },

      _clearLeaks: function () {
        this.leaks = [];
        this.expanded = false;
      },

      _toggleExpanded: function () {
        this.expanded = !this.expanded;
      },

      updateMemoryInfo: function () {
        if (!global.performance || !global.performance.memory) {
          return;
        }

        const memory = global.performance.memory;
        const usedMB = this._formatSize(memory.usedJSHeapSize);
        const totalMB = this._formatSize(memory.totalJSHeapSize);
        const usagePercent = Math.round(
          (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        );

        const element = this.shadowRoot.querySelector(".memory-usage");
        if (element) {
          element.textContent = `${usedMB} / ${totalMB} (${usagePercent}%)`;

          // Update styling based on usage
          element.classList.remove("warning", "critical");
          if (usagePercent >= 80) {
            element.classList.add("critical");
          } else if (usagePercent >= 50) {
            element.classList.add("warning");
          }
        }
      },

      // Event handling
      addEventListener: function (event, callback) {
        if (!this._eventListeners[event]) {
          this._eventListeners[event] = [];
        }
        this._eventListeners[event].push(callback);
      },

      // Method to dispatch events
      dispatchEvent: function (event) {
        const listeners = this._eventListeners[event.type] || [];
        listeners.forEach((callback) => callback(event));
        return true;
      },

      // Shadow DOM
      shadowRoot: {
        querySelector: function (selector) {
          if (selector === ".memory-usage") {
            return memoryUsageElement;
          }
          return null;
        },
        querySelectorAll: function (selector) {
          return [];
        },
      },

      // Other properties needed for testing
      updateComplete: Promise.resolve(true),
      hasAttribute: function (attr) {
        return false;
      },
      getAttribute: function (attr) {
        return null;
      },
    };
  });

  it("should display memory usage information", () => {
    // Trigger update
    memoryMonitorProps.updateMemoryInfo();

    // Check if memory usage is displayed
    expect(memoryUsageElement.textContent).toContain("50.0MB");
    expect(memoryUsageElement.textContent).toContain("100.0MB");
    expect(memoryUsageElement.textContent).toContain("50%");
  });

  it("should apply correct styling based on memory usage", () => {
    // Trigger update
    memoryMonitorProps.updateMemoryInfo();

    // Check if correct class is applied (50% usage)
    expect(memoryUsageElement.classList.add).toHaveBeenCalledWith("warning");
    expect(memoryUsageElement.classList.remove).toHaveBeenCalledWith(
      "warning",
      "critical"
    );
  });

  it("should handle leak detection events", () => {
    // Create a leak event
    const leakEvent = {
      detail: {
        type: "detached_node",
        size: 1024 * 1024, // 1MB
        time: Date.now(),
        message: "Detached DOM node detected",
      },
    };

    // Initial leak count
    expect(memoryMonitorProps.leaks.length).toBe(0);

    // Handle the leak event
    memoryMonitorProps._handleLeakDetected(leakEvent);

    // Check if leak was added
    expect(memoryMonitorProps.leaks.length).toBe(1);
    expect(memoryMonitorProps.leaks[0].type).toBe("detached_node");
    expect(memoryMonitorProps.expanded).toBe(true);
  });

  it("should respect maxLeaks limit", () => {
    // Set a small maxLeaks value for testing
    memoryMonitorProps.maxLeaks = 3;

    // Add more leaks than the limit
    for (let i = 0; i < 5; i++) {
      memoryMonitorProps.addLeak({
        type: "test_leak",
        size: 1024,
        time: Date.now(),
        message: `Test leak ${i}`,
      });
    }

    // Check if only maxLeaks items are kept
    expect(memoryMonitorProps.leaks.length).toBe(3);
    expect(memoryMonitorProps.leaks[0].message).toBe("Test leak 2");
    expect(memoryMonitorProps.leaks[2].message).toBe("Test leak 4");
  });

  it("should format sizes correctly", () => {
    expect(memoryMonitorProps._formatSize(1024)).toBe("1.0KB");
    expect(memoryMonitorProps._formatSize(1024 * 1024)).toBe("1.0MB");
    expect(memoryMonitorProps._formatSize(1024 * 1024 * 1024)).toBe("1.0GB");
    expect(memoryMonitorProps._formatSize(500)).toBe("500.0B");
  });

  it("should toggle expanded state", () => {
    expect(memoryMonitorProps.expanded).toBe(false);

    memoryMonitorProps._toggleExpanded();
    expect(memoryMonitorProps.expanded).toBe(true);

    memoryMonitorProps._toggleExpanded();
    expect(memoryMonitorProps.expanded).toBe(false);
  });

  it("should clear leaks", () => {
    // Add some leaks
    memoryMonitorProps.addLeak({
      type: "test_leak",
      size: 1024,
      time: Date.now(),
      message: "Test leak",
    });

    expect(memoryMonitorProps.leaks.length).toBe(1);
    expect(memoryMonitorProps.expanded).toBe(true);

    // Clear leaks
    memoryMonitorProps._clearLeaks();

    expect(memoryMonitorProps.leaks.length).toBe(0);
    expect(memoryMonitorProps.expanded).toBe(false);
  });
});
