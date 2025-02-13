import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/ui/navigation.js";

describe("NeoNavigation", () => {
  let element;
  const mockItems = [
    {
      id: "1",
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      id: "2",
      label: "Projects",
      path: "/projects",
      children: [
        {
          id: "2.1",
          label: "Active",
          path: "/projects/active",
        },
        {
          id: "2.2",
          label: "Archived",
          path: "/projects/archived",
        },
      ],
    },
    {
      id: "3",
      label: "Settings",
      path: "/settings",
    },
  ];

  beforeEach(async () => {
    element = await fixture(html`
      <neo-navigation
        .items=${mockItems}
        current-path="/dashboard"
      ></neo-navigation>
    `);
  });

  // Desktop functionality tests
  it("renders navigation items correctly", () => {
    const items = element.shadowRoot.querySelectorAll(".nav-item");
    expect(items.length).to.equal(mockItems.length);
  });

  it("highlights current path", () => {
    const activeItem = element.shadowRoot.querySelector(
      ".nav-item-header.active"
    );
    expect(activeItem).to.exist;
    expect(activeItem.textContent.trim()).to.equal("Dashboard");
  });

  it("expands/collapses items with children", async () => {
    const projectsItem = element.shadowRoot.querySelector('[data-id="2"]');
    const header = projectsItem.querySelector(".nav-item-header");

    // Initially collapsed
    expect(projectsItem.classList.contains("expanded")).to.be.false;

    // Click to expand
    header.click();
    await element.updateComplete;
    expect(projectsItem.classList.contains("expanded")).to.be.true;

    // Click to collapse
    header.click();
    await element.updateComplete;
    expect(projectsItem.classList.contains("expanded")).to.be.false;
  });

  // Mobile functionality tests
  describe("Mobile View", () => {
    beforeEach(() => {
      // Mock mobile viewport
      window.matchMedia = (query) => ({
        matches: query.includes("max-width: 768px"),
        addListener: () => {},
        removeListener: () => {},
      });
    });

    it("shows mobile toggle button", () => {
      const toggle = element.shadowRoot.querySelector(".nav-toggle");
      expect(toggle).to.exist;
      expect(toggle.style.display).to.not.equal("none");
    });

    it("toggles mobile menu", async () => {
      const toggle = element.shadowRoot.querySelector(".nav-toggle");

      // Initially not expanded
      expect(element.expanded).to.be.false;

      // Click to expand
      toggle.click();
      await element.updateComplete;
      expect(element.expanded).to.be.true;

      // Click to collapse
      toggle.click();
      await element.updateComplete;
      expect(element.expanded).to.be.false;
    });

    it("closes mobile menu when selecting an item", async () => {
      // Open menu
      element.expanded = true;
      await element.updateComplete;

      // Click a nav item
      const item = element.shadowRoot.querySelector('[data-path="/dashboard"]');
      const header = item.querySelector(".nav-item-header");
      header.click();

      await element.updateComplete;
      expect(element.expanded).to.be.false;
    });

    it("handles touch events correctly", async () => {
      const item = element.shadowRoot.querySelector('[data-id="2"]');
      const header = item.querySelector(".nav-item-header");

      // Simulate touch events
      header.dispatchEvent(new TouchEvent("touchstart"));
      header.dispatchEvent(new TouchEvent("touchend"));

      await element.updateComplete;
      expect(item.classList.contains("expanded")).to.be.true;
    });

    it("updates body scroll when menu opens/closes", async () => {
      // Open menu
      element.expanded = true;
      await element.updateComplete;
      expect(document.body.style.overflow).to.equal("hidden");

      // Close menu
      element.expanded = false;
      await element.updateComplete;
      expect(document.body.style.overflow).to.equal("");
    });

    it("handles window resize", async () => {
      // Open menu in mobile
      element.expanded = true;
      await element.updateComplete;

      // Simulate resize to desktop
      window.matchMedia = (query) => ({
        matches: false,
        addListener: () => {},
        removeListener: () => {},
      });

      window.dispatchEvent(new Event("resize"));
      await element.updateComplete;

      expect(element.expanded).to.be.false;
      expect(document.body.style.overflow).to.equal("");
    });
  });

  // Accessibility tests
  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      const nav = element.shadowRoot.querySelector('[role="navigation"]');
      expect(nav).to.exist;
      expect(nav.getAttribute("aria-label")).to.equal("Main navigation");
    });

    it("has proper ARIA attributes for expandable items", () => {
      const expandableItem = element.shadowRoot.querySelector(
        '[data-id="2"] .nav-item-header'
      );
      expect(expandableItem.getAttribute("role")).to.equal("button");
      expect(expandableItem.getAttribute("aria-expanded")).to.exist;
    });

    it("handles keyboard navigation", async () => {
      const item = element.shadowRoot.querySelector('[data-id="2"]');
      const header = item.querySelector(".nav-item-header");

      // Press Enter
      header.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      await element.updateComplete;
      expect(item.classList.contains("expanded")).to.be.true;

      // Press Space
      header.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
      await element.updateComplete;
      expect(item.classList.contains("expanded")).to.be.false;
    });

    it("maintains focus management", async () => {
      const toggle = element.shadowRoot.querySelector(".nav-toggle");
      const firstItem = element.shadowRoot.querySelector(".nav-item-header");

      // Open menu and check focus
      toggle.focus();
      toggle.click();
      await element.updateComplete;

      expect(document.activeElement).to.equal(firstItem);
    });
  });
});
