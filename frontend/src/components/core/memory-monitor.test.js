import { expect } from "chai";
import { fixture, html } from "@open-wc/testing-helpers";
import { MemoryMonitor } from "./memory-monitor.js";
import sinon from "sinon";

// Register the custom element once before all tests
if (!customElements.get("memory-monitor")) {
  customElements.define("memory-monitor", MemoryMonitor);
}

describe("memory-monitor", () => {
  let element;

  beforeEach(async () => {
    // Create a new instance
    element = await fixture(html`<memory-monitor></memory-monitor>`);
    // Wait for the element to be ready
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element.shadowRoot).to.exist;
    expect(element.expanded).to.be.false;
    expect(element.leaks).to.deep.equal([]);
  });

  it("should add leak and expand when leak is detected", async () => {
    const leak = { type: "memory", size: 1000, time: Date.now() };
    element.addLeak(leak);
    await element.updateComplete;
    expect(element.leaks).to.have.lengthOf(1);
    expect(element.expanded).to.be.true;
    const leakElement = element.shadowRoot.querySelector(".leak-item");
    expect(leakElement).to.exist;
  });

  it("should limit number of leaks to maxLeaks", async () => {
    const maxLeaks = 3;
    element.maxLeaks = maxLeaks;

    for (let i = 0; i < maxLeaks + 2; i++) {
      element.addLeak({ type: "memory", size: 1000, time: Date.now() });
      await element.updateComplete;
    }

    expect(element.leaks).to.have.lengthOf(maxLeaks);
    const leakElements = element.shadowRoot.querySelectorAll(".leak-item");
    expect(leakElements).to.have.lengthOf(maxLeaks);
  });

  it("should auto-hide after timeout when autoHide is true", async () => {
    element.autoHide = true;
    element.autoHideTimeout = 100;
    element.expanded = true;

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(element.expanded).to.be.false;
  });

  it("should not auto-hide when autoHide is false", async () => {
    element.autoHide = false;
    element.expanded = true;

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(element.expanded).to.be.true;
  });

  it("should clear leaks when clear button is clicked", async () => {
    element.addLeak({ type: "memory", size: 1000, time: Date.now() });
    await element.updateComplete;

    const clearButton = element.shadowRoot.querySelector(".clear-button");
    expect(clearButton).to.exist;
    clearButton.click();
    await element.updateComplete;

    expect(element.leaks).to.have.lengthOf(0);
    const leakElements = element.shadowRoot.querySelectorAll(".leak-item");
    expect(leakElements).to.have.lengthOf(0);
  });

  it("should toggle expanded state when header is clicked", async () => {
    const header = element.shadowRoot.querySelector(".monitor-header");
    expect(header).to.exist;
    const initialState = element.expanded;

    header.click();
    await element.updateComplete;
    expect(element.expanded).to.equal(!initialState);
  });

  it("should format leak types correctly", async () => {
    const leak = { type: "memory", size: 1024, time: Date.now() };
    element.addLeak(leak);
    await element.updateComplete;

    const leakElement = element.shadowRoot.querySelector(".leak-item");
    expect(leakElement).to.exist;
    expect(leakElement.textContent).to.include("1.0 KB");
  });

  it("should format time correctly", async () => {
    const now = Date.now();
    const leak = { type: "memory", size: 1000, time: now };
    element.addLeak(leak);
    await element.updateComplete;

    const leakElement = element.shadowRoot.querySelector(".leak-item");
    expect(leakElement).to.exist;
    expect(leakElement.textContent).to.include(
      new Date(now).toLocaleTimeString()
    );
  });

  it("should remove event listener when disconnected", async () => {
    const spy = sinon.spy(element, "_handleLeakDetected");
    element.disconnectedCallback();

    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", {
        detail: { type: "memory", size: 1000, time: Date.now() },
      })
    );
    expect(spy.called).to.be.false;
  });
});
