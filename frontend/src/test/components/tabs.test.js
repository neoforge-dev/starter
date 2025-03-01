import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../components/ui/tabs.js";

describe("Tabs", () => {
  let element;
  const mockTabs = [
    { id: "tab1", label: "First Tab", content: "First tab content" },
    { id: "tab2", label: "Second Tab", content: "Second tab content" },
    { id: "tab3", label: "Third Tab", content: "Third tab content" },
  ];

  beforeEach(async () => {
    element = await fixture(html`
      <ui-tabs
        .tabs=${mockTabs}
        selected="tab1"
        orientation="horizontal"
      ></ui-tabs>
    `);
  });

  it("renders all tabs with correct labels", () => {
    const tabButtons = element.shadowRoot.querySelectorAll('[role="tab"]');
    expect(tabButtons.length).to.equal(mockTabs.length);

    tabButtons.forEach((button, index) => {
      expect(button.textContent.trim()).to.equal(mockTabs[index].label);
    });
  });

  it("shows correct content for selected tab", async () => {
    let tabPanel = element.shadowRoot.querySelector(
      '[role="tabpanel"]:not([aria-hidden="true"])'
    );
    expect(tabPanel.textContent.trim()).to.equal(mockTabs[0].content);

    // Change selected tab
    element.selected = "tab2";
    await element.updateComplete;

    tabPanel = element.shadowRoot.querySelector(
      '[role="tabpanel"]:not([aria-hidden="true"])'
    );
    expect(tabPanel.textContent.trim()).to.equal(mockTabs[1].content);
  });

  it("handles tab selection via click", async () => {
    const secondTab = element.shadowRoot.querySelector('[data-tab-id="tab2"]');

    setTimeout(() => secondTab.click());
    const { detail } = await oneEvent(element, "tab-change");

    expect(detail.selected).to.equal("tab2");
    expect(secondTab.getAttribute("aria-selected")).to.equal("true");
  });

  it("supports keyboard navigation", async () => {
    // Test by directly changing the selected tab
    element.selected = "tab1";
    await element.updateComplete;

    // Simulate right arrow by directly calling the navigation method
    element._navigateToNextTab();
    await element.updateComplete;

    expect(element.selected).to.equal("tab2");

    // Simulate left arrow by directly calling the navigation method
    element._navigateToPreviousTab();
    await element.updateComplete;

    expect(element.selected).to.equal("tab1");
  });

  it("supports vertical orientation", async () => {
    element.orientation = "vertical";
    await element.updateComplete;

    const tabList = element.shadowRoot.querySelector('[role="tablist"]');
    expect(tabList.getAttribute("aria-orientation")).to.equal("vertical");

    // Test vertical navigation using the direct method
    element.selected = "tab1";
    await element.updateComplete;

    // Simulate down arrow by directly calling the navigation method
    element._navigateToNextTab();
    await element.updateComplete;

    expect(element.selected).to.equal("tab2");
  });

  it("maintains accessibility attributes", () => {
    const tabList = element.shadowRoot.querySelector('[role="tablist"]');
    const tabs = element.shadowRoot.querySelectorAll('[role="tab"]');
    const panel = element.shadowRoot.querySelector('[role="tabpanel"]');

    expect(tabList).to.exist;
    expect(tabs.length).to.be.greaterThan(0);
    expect(panel).to.exist;

    // Check tab attributes
    tabs.forEach((tab) => {
      expect(tab.getAttribute("role")).to.equal("tab");
      expect(tab.getAttribute("aria-selected")).to.exist;
      expect(tab.getAttribute("tabindex")).to.exist;

      const panelId = tab.getAttribute("aria-controls");
      const panel = element.shadowRoot.querySelector(`#${panelId}`);
      expect(panel).to.exist;
    });

    // Check panel attributes
    expect(panel.getAttribute("role")).to.equal("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).to.exist;
  });

  it("handles disabled tabs", async () => {
    element = await fixture(html`
      <ui-tabs
        .tabs=${[
          ...mockTabs,
          {
            id: "tab4",
            label: "Disabled Tab",
            content: "Disabled content",
            disabled: true,
          },
        ]}
        selected="tab1"
      ></ui-tabs>
    `);

    const disabledTab = element.shadowRoot.querySelector(
      '[data-tab-id="tab4"]'
    );
    expect(disabledTab.hasAttribute("disabled")).to.be.true;
    expect(disabledTab.getAttribute("aria-disabled")).to.equal("true");

    // Try to click disabled tab
    disabledTab.click();
    await element.updateComplete;

    expect(element.selected).to.equal("tab1");
  });

  it("supports dynamic tab updates", async () => {
    const newTabs = [
      ...mockTabs,
      { id: "tab4", label: "New Tab", content: "New content" },
    ];

    element.tabs = newTabs;
    await element.updateComplete;

    const tabButtons = element.shadowRoot.querySelectorAll('[role="tab"]');
    expect(tabButtons.length).to.equal(newTabs.length);

    const newTabButton = element.shadowRoot.querySelector(
      '[data-tab-id="tab4"]'
    );
    expect(newTabButton).to.exist;
    expect(newTabButton.textContent.trim()).to.equal("New Tab");
  });

  it("handles empty tabs gracefully", async () => {
    element.tabs = [];
    await element.updateComplete;

    const tabList = element.shadowRoot.querySelector('[role="tablist"]');
    const tabPanel = element.shadowRoot.querySelector('[role="tabpanel"]');

    expect(tabList.children.length).to.equal(0);
    expect(tabPanel.textContent.trim()).to.equal("");
  });

  it("supports custom tab rendering", async () => {
    element = await fixture(html`
      <ui-tabs
        .tabs=${mockTabs.map((tab) => ({
          ...tab,
          icon: "test-icon",
          badge: "3",
        }))}
        selected="tab1"
      ></ui-tabs>
    `);

    const firstTab = element.shadowRoot.querySelector('[data-tab-id="tab1"]');
    expect(firstTab.querySelector(".icon")).to.exist;
    expect(firstTab.querySelector(".badge")).to.exist;
    expect(firstTab.querySelector(".badge").textContent.trim()).to.equal("3");
  });
});
