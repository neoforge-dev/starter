import { expect, describe, it, beforeEach, vi } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
// MemoryMonitor import removed - only used in title string

describe("MemoryMonitor", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<memory-monitor></memory-monitor>`);
    await element.updateComplete;
  });

  it("has default properties", () => {
    expect(element.leaks).toEqual([]);
    expect(element.expanded).toBe(false);
    expect(element.maxLeaks).toBe(50);
    expect(element.autoHide).toBe(true);
    expect(element.autoHideTimeout).toBe(10000);
  });

  it("adds a leak", () => {
    const leak = {
      type: "critical",
      size: 1024,
      time: Date.now(),
      message: "Test leak",
    };
    element.addLeak(leak);
    expect(element.leaks).toHaveLength(1);
    expect(element.leaks[0]).toEqual(leak);
    expect(element.expanded).toBe(true);
  });

  it("limits the number of leaks", () => {
    element.maxLeaks = 2;
    for (let i = 0; i < 3; i++) {
      element.addLeak({
        type: "critical",
        size: 1024,
        time: Date.now(),
        message: `Leak ${i}`,
      });
    }
    expect(element.leaks).toHaveLength(2);
  });

  it("auto-hides after timeout", () => {
    vi.useFakeTimers();
    element.autoHideTimeout = 100;
    element.addLeak({
      type: "critical",
      size: 1024,
      time: Date.now(),
      message: "Test leak",
    });
    expect(element.expanded).toBe(true);
    vi.advanceTimersByTime(150);
    expect(element.expanded).toBe(false);
    vi.useRealTimers();
  });

  it("does not auto-hide when autoHide is false", () => {
    vi.useFakeTimers();
    element.autoHide = false;
    element.autoHideTimeout = 100;
    element.addLeak({
      type: "critical",
      size: 1024,
      time: Date.now(),
      message: "Test leak",
    });
    expect(element.expanded).toBe(true);
    vi.advanceTimersByTime(150);
    expect(element.expanded).toBe(true);
    vi.useRealTimers();
  });

  it("clears leaks", async () => {
    element.addLeak({
      type: "critical",
      size: 1024,
      time: Date.now(),
      message: "Test leak",
    });
    await element.updateComplete;
    element.expanded = true;
    await element.updateComplete;
    const clearButton = element.shadowRoot.querySelector(".clear-button");
    clearButton.click();
    expect(element.leaks).toHaveLength(0);
  });

  it("toggles expanded state", async () => {
    await element.updateComplete;
    const header = element.shadowRoot.querySelector(".monitor-header");
    header.click();
    await element.updateComplete;
    expect(element.expanded).toBe(true);
    header.click();
    await element.updateComplete;
    expect(element.expanded).toBe(false);
  });

  it("formats leak type correctly", async () => {
    element.addLeak({
      type: "critical",
      size: 1024,
      time: Date.now(),
      message: "Test leak",
    });
    await element.updateComplete;
    element.expanded = true;
    await element.updateComplete;
    const leakItem = element.shadowRoot.querySelector(".leak-item");
    expect(leakItem.getAttribute("data-type")).toBe("critical");
  });

  it("formats time correctly", async () => {
    const time = new Date();
    element.addLeak({
      type: "critical",
      size: 1024,
      time: time.getTime(),
      message: "Test leak",
    });
    await element.updateComplete;
    element.expanded = true;
    await element.updateComplete;
    const leakTime = element.shadowRoot.querySelector(".leak-time");
    expect(leakTime.textContent.trim()).toBe(time.toLocaleTimeString());
  });

  it("removes event listener when disconnected", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    element.disconnectedCallback();
    expect(removeEventListener).toHaveBeenCalledWith(
      "memory-leak-detected",
      element._handleLeakDetected
    );
    removeEventListener.mockRestore();
  });
});
