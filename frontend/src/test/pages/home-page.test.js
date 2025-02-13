import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/home-page.js";

describe("Home Page", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<home-page></home-page>`);
    await element.updateComplete;
  });

  it("renders main sections", () => {
    const hero = element.shadowRoot.querySelector(".hero-section");
    const features = element.shadowRoot.querySelector(".features-section");
    const quickStart = element.shadowRoot.querySelector(".quick-start-section");

    expect(hero).to.exist;
    expect(features).to.exist;
    expect(quickStart).to.exist;
  });

  it("displays framework features", () => {
    const features = element.shadowRoot.querySelectorAll(".feature-card");
    expect(features.length).to.be.greaterThan(0);

    features.forEach((feature) => {
      const title = feature.querySelector(".feature-title");
      const description = feature.querySelector(".feature-description");
      const icon = feature.querySelector(".feature-icon");

      expect(title).to.exist;
      expect(description).to.exist;
      expect(icon).to.exist;
    });
  });

  it("shows code examples", () => {
    const codeBlocks = element.shadowRoot.querySelectorAll("code-block");
    expect(codeBlocks.length).to.be.greaterThan(0);

    codeBlocks.forEach((block) => {
      expect(block.getAttribute("language")).to.exist;
      expect(block.textContent.length).to.be.greaterThan(0);
    });
  });

  it("handles tab switching", async () => {
    const tabs = element.shadowRoot.querySelectorAll(".framework-tab");
    const secondTab = tabs[1];

    secondTab.click();
    await element.updateComplete;

    expect(element.activeTab).to.equal(secondTab.dataset.tab);
    expect(secondTab.classList.contains("active")).to.be.true;

    const content = element.shadowRoot.querySelector(".tab-content.active");
    expect(content.getAttribute("data-tab")).to.equal(secondTab.dataset.tab);
  });

  it("displays getting started guide", () => {
    const guide = element.shadowRoot.querySelector(".getting-started-guide");
    const steps = guide.querySelectorAll(".step");

    expect(guide).to.exist;
    expect(steps.length).to.be.greaterThan(0);

    steps.forEach((step) => {
      expect(step.querySelector(".step-number")).to.exist;
      expect(step.querySelector(".step-content")).to.exist;
    });
  });

  it("handles copy to clipboard", async () => {
    const copyButton = element.shadowRoot.querySelector(".copy-button");
    const codeBlock = copyButton.closest(".code-block");

    // Mock clipboard API
    const originalClipboard = navigator.clipboard;
    navigator.clipboard = {
      writeText: () => Promise.resolve(),
    };

    setTimeout(() => copyButton.click());
    const { detail } = await oneEvent(element, "code-copied");

    expect(detail.code).to.equal(codeBlock.textContent.trim());

    // Restore clipboard API
    navigator.clipboard = originalClipboard;
  });

  it("shows framework comparison", () => {
    const comparison = element.shadowRoot.querySelector(
      ".framework-comparison"
    );
    const table = comparison.querySelector("table");

    expect(comparison).to.exist;
    expect(table).to.exist;
    expect(table.querySelectorAll("tr").length).to.be.greaterThan(1);
  });

  it("displays performance metrics", () => {
    const metrics = element.shadowRoot.querySelector(".performance-metrics");
    const charts = metrics.querySelectorAll(".metric-chart");

    expect(metrics).to.exist;
    expect(charts.length).to.be.greaterThan(0);
  });

  it("handles installation method selection", async () => {
    const methods = element.shadowRoot.querySelectorAll(".install-method");
    const npmMethod = methods[0];

    npmMethod.click();
    await element.updateComplete;

    expect(npmMethod.classList.contains("selected")).to.be.true;
    const codeBlock = element.shadowRoot.querySelector(
      ".installation-code.active"
    );
    expect(codeBlock.getAttribute("data-method")).to.equal(
      npmMethod.dataset.method
    );
  });

  it("shows ecosystem integrations", () => {
    const ecosystem = element.shadowRoot.querySelector(".ecosystem-section");
    const integrations = ecosystem.querySelectorAll(".integration-card");

    expect(ecosystem).to.exist;
    expect(integrations.length).to.be.greaterThan(0);
  });

  it("handles newsletter signup", async () => {
    const form = element.shadowRoot.querySelector(".newsletter-form");
    const emailInput = form.querySelector('input[type="email"]');

    emailInput.value = "test@example.com";
    setTimeout(() => form.submit());
    const { detail } = await oneEvent(element, "newsletter-signup");

    expect(detail.email).to.equal("test@example.com");
  });

  it("supports mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = (query) => ({
      matches: query.includes("max-width"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".page-container");
    expect(container.classList.contains("mobile")).to.be.true;
  });

  it("maintains accessibility attributes", () => {
    const sections = element.shadowRoot.querySelectorAll("section");
    sections.forEach((section) => {
      expect(section.getAttribute("aria-labelledby")).to.exist;
    });

    const tabs = element.shadowRoot.querySelector('[role="tablist"]');
    expect(tabs).to.exist;

    const buttons = element.shadowRoot.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const tabs = element.shadowRoot.querySelectorAll(".framework-tab");
    const firstTab = tabs[0];

    firstTab.focus();
    firstTab.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    await element.updateComplete;

    expect(document.activeElement).to.equal(tabs[1]);
  });

  it("handles theme switching in code examples", async () => {
    const themeToggle = element.shadowRoot.querySelector(".theme-toggle");
    const codeBlock = element.shadowRoot.querySelector("code-block");

    themeToggle.click();
    await element.updateComplete;

    expect(codeBlock.getAttribute("theme")).to.equal("dark");
  });

  it("shows loading state for dynamic content", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    expect(loader).to.exist;
    expect(loader.hasAttribute("hidden")).to.be.false;
  });
});
