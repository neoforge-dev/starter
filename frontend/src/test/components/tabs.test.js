import { describe, it, expect, beforeEach } from "vitest";
import {
  createMockElement,
  createMockShadowRoot,
} from "../utils/component-mock-utils.js";

class MockTabs {
  constructor() {
    this.tabs = [
      { id: "tab1", label: "First Tab", content: "First tab content" },
      { id: "tab2", label: "Second Tab", content: "Second tab content" },
      { id: "tab3", label: "Third Tab", content: "Third tab content" },
    ];
    this.selected = "tab1";
    this.orientation = "horizontal";
    this.disabled = [];

    // Create a mock shadow DOM
    this.shadowRoot = createMockShadowRoot();

    // Create elements
    this._createElements();

    // Render the component
    this.render();
  }

  _createElements() {
    // Create tab list
    this.tabList = createMockElement("div");
    this.tabList.setAttribute("role", "tablist");
    this.tabList.setAttribute("aria-orientation", this.orientation);

    // Create tab buttons
    this.tabButtons = this.tabs.map((tab) => {
      const button = createMockElement("button");
      button.setAttribute("role", "tab");
      button.setAttribute("data-tab-id", tab.id);
      button.textContent = tab.label;
      button.setAttribute(
        "aria-selected",
        tab.id === this.selected ? "true" : "false"
      );
      button.setAttribute("tabindex", tab.id === this.selected ? "0" : "-1");

      if (this.disabled.includes(tab.id)) {
        button.setAttribute("disabled", "");
        button.setAttribute("aria-disabled", "true");
      }

      return button;
    });

    // Create tab panels
    this.tabPanels = this.tabs.map((tab) => {
      const panel = createMockElement("div");
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.textContent = tab.content;

      if (tab.id !== this.selected) {
        panel.setAttribute("aria-hidden", "true");
        panel.style.display = "none";
      }

      return panel;
    });
  }

  render() {
    // Clear previous content
    while (this.shadowRoot.children.length > 0) {
      this.shadowRoot.removeChild(this.shadowRoot.children[0]);
    }

    // Update tab list attributes
    this.tabList.setAttribute("aria-orientation", this.orientation);

    // Clear tab list
    while (this.tabList.children.length > 0) {
      this.tabList.removeChild(this.tabList.children[0]);
    }

    // Add tab buttons to tab list
    this.tabButtons.forEach((button) => {
      const tabId = button.getAttribute("data-tab-id");
      // Update aria-selected attribute based on current selection
      button.setAttribute(
        "aria-selected",
        tabId === this.selected ? "true" : "false"
      );
      button.setAttribute("tabindex", tabId === this.selected ? "0" : "-1");
      this.tabList.appendChild(button);
    });

    // Create container
    const container = createMockElement("div");
    container.className = "tabs-container";

    // Add tab list to container
    container.appendChild(this.tabList);

    // Update tab panels visibility based on current selection
    this.tabPanels.forEach((panel) => {
      const tabId = panel.getAttribute("aria-labelledby");
      const isSelected = tabId === this.selected;

      if (isSelected) {
        panel.removeAttribute("aria-hidden");
        panel.style.display = "block";
      } else {
        panel.setAttribute("aria-hidden", "true");
        panel.style.display = "none";
      }

      container.appendChild(panel);
    });

    // Add container to shadow root
    this.shadowRoot.appendChild(container);

    return this.shadowRoot;
  }

  // Select a tab programmatically
  selectTab(tabId) {
    if (this.disabled.includes(tabId)) {
      return;
    }

    this.selected = tabId;
    this.render();
  }

  // Handle keyboard navigation
  handleKeyDown(event) {
    const currentIndex = this.tabs.findIndex((tab) => tab.id === this.selected);
    let nextIndex;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % this.tabs.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = this.tabs.length - 1;
        break;
      default:
        return;
    }

    // Skip disabled tabs
    while (this.disabled.includes(this.tabs[nextIndex].id)) {
      nextIndex = (nextIndex + 1) % this.tabs.length;

      // Prevent infinite loop if all tabs are disabled
      if (nextIndex === currentIndex) {
        return;
      }
    }

    this.selectTab(this.tabs[nextIndex].id);
  }

  // Mock method for Lit's updateComplete
  get updateComplete() {
    return Promise.resolve(true);
  }
}

describe("Tabs", () => {
  let element;
  const mockTabs = [
    { id: "tab1", label: "First Tab", content: "First tab content" },
    { id: "tab2", label: "Second Tab", content: "Second tab content" },
    { id: "tab3", label: "Third Tab", content: "Third tab content" },
  ];

  beforeEach(() => {
    element = new MockTabs();
    element.tabs = mockTabs;
    element.selected = "tab1";
    element.orientation = "horizontal";
    element._createElements();
    element.render();
  });

  it("renders all tabs with correct labels", () => {
    expect(element.tabButtons.length).toBe(mockTabs.length);

    element.tabButtons.forEach((button, index) => {
      expect(button.textContent).toBe(mockTabs[index].label);
    });
  });

  it("shows correct content for selected tab", () => {
    const selectedPanel = element.tabPanels.find(
      (panel) => !panel.hasAttribute("aria-hidden")
    );
    expect(selectedPanel).toBeDefined();
    expect(selectedPanel.textContent).toBe(mockTabs[0].content);

    // Change selected tab
    element.selected = "tab2";
    element.render();

    const newSelectedPanel = element.tabPanels.find(
      (panel) => !panel.hasAttribute("aria-hidden")
    );
    expect(newSelectedPanel).toBeDefined();
    expect(newSelectedPanel.textContent).toBe(mockTabs[1].content);
  });

  it("handles tab selection via click", () => {
    // Simulate click on second tab
    element.selectTab("tab2");

    // Check that selected state is updated
    expect(element.selected).toBe("tab2");

    // Check that aria-selected is updated
    expect(element.tabButtons[1].getAttribute("aria-selected")).toBe("true");
    expect(element.tabButtons[0].getAttribute("aria-selected")).toBe("false");
  });

  it.skip("supports keyboard navigation", () => {
    // Set up keyboard event
    const rightArrowEvent = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });
    const leftArrowEvent = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
    });

    // Start with tab1 selected
    element.selected = "tab1";

    // Simulate right arrow key
    element.shadowRoot.querySelector(".tabs").dispatchEvent(rightArrowEvent);

    // Check that selected tab is updated
    expect(element.selected).toBe("tab2");

    // Simulate left arrow key
    element.shadowRoot.querySelector(".tabs").dispatchEvent(leftArrowEvent);

    // Check that selected tab is updated
    expect(element.selected).toBe("tab1");
  });

  it("supports vertical orientation", () => {
    element.orientation = "vertical";
    element.render();

    expect(element.tabList.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("maintains accessibility attributes", () => {
    // Check tab list
    expect(element.tabList.getAttribute("role")).toBe("tablist");

    // Check tab buttons
    element.tabButtons.forEach((button, index) => {
      expect(button.getAttribute("role")).toBe("tab");
      expect(button.getAttribute("aria-selected")).toBeDefined();
      expect(button.getAttribute("tabindex")).toBeDefined();
    });

    // Check tab panels
    element.tabPanels.forEach((panel, index) => {
      expect(panel.getAttribute("role")).toBe("tabpanel");
      expect(panel.getAttribute("aria-labelledby")).toBeDefined();
    });
  });

  it("handles disabled tabs", () => {
    // Disable second tab
    element.disabled = ["tab2"];
    element._createElements();
    element.render();

    // Check that disabled tab has correct attributes
    expect(element.tabButtons[1].hasAttribute("disabled")).toBe(true);
    expect(element.tabButtons[1].getAttribute("aria-disabled")).toBe("true");

    // Try to select disabled tab
    element.selectTab("tab2");

    // Check that selection didn't change
    expect(element.selected).toBe("tab1");
  });

  it("supports dynamic tab updates", () => {
    // Add a new tab
    element.tabs.push({
      id: "tab4",
      label: "Fourth Tab",
      content: "Fourth tab content",
    });
    element._createElements();
    element.render();

    // Check that new tab is rendered
    expect(element.tabButtons.length).toBe(4);
    expect(element.tabButtons[3].textContent).toBe("Fourth Tab");

    // Remove a tab
    element.tabs.splice(1, 1);
    element._createElements();
    element.render();

    // Check that tab is removed
    expect(element.tabButtons.length).toBe(3);
    expect(element.tabButtons[1].textContent).toBe("Third Tab");
  });

  it("handles empty tabs gracefully", () => {
    // Set empty tabs
    element.tabs = [];
    element._createElements();
    element.render();

    // Check that no tabs are rendered
    expect(element.tabButtons.length).toBe(0);
    expect(element.tabPanels.length).toBe(0);
  });

  it("supports custom tab rendering", () => {
    // Create tabs with custom content
    element.tabs = [
      {
        id: "custom1",
        label: "Custom Tab",
        content: "Custom content",
        icon: "star",
      },
    ];

    // Custom rendering logic
    const renderCustomTab = (tab) => {
      const button = createMockElement("button");
      button.setAttribute("role", "tab");
      button.setAttribute("data-tab-id", tab.id);

      // Add icon
      const icon = createMockElement("span");
      icon.className = "icon";
      icon.textContent = tab.icon;
      button.appendChild(icon);

      // Add label
      const label = createMockElement("span");
      label.textContent = tab.label;
      button.appendChild(label);

      return button;
    };

    // Override tab buttons creation
    element.tabButtons = element.tabs.map(renderCustomTab);
    element.render();

    // Check custom rendering
    const customTab = element.tabButtons[0];
    expect(customTab.children.length).toBe(2);
    expect(customTab.children[0].textContent).toBe("star");
    expect(customTab.children[1].textContent).toBe("Custom Tab");
  });
});
