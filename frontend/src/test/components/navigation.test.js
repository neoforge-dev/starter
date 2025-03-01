import { expect } from "@esm-bundle/chai";
import { fixture, html } from "@open-wc/testing";
import "../../components/ui/navigation.js";

describe("Navigation Component", () => {
  let element;
  const defaultNavItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "dashboard",
      path: "/dashboard",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "settings",
      path: "/settings",
      children: [
        { id: "profile", label: "Profile", path: "/settings/profile" },
        { id: "security", label: "Security", path: "/settings/security" },
      ],
    },
    {
      id: "docs",
      label: "Documentation",
      icon: "book",
      path: "/docs",
    },
  ];

  beforeEach(async () => {
    element = await fixture(html`
      <neo-navigation .items=${defaultNavItems} current-path="/dashboard">
      </neo-navigation>
    `);
  });

  afterEach(() => {
    // Clean up any modals that might have been added to the body
    document.querySelectorAll("neo-navigation").forEach((nav) => {
      nav.remove();
    });
    // Remove any event listeners
    window.removeEventListener("resize", element._handleResize);
  });

  it("should be defined", () => {
    expect(element).to.be.instanceOf(customElements.get("neo-navigation"));
  });

  it("should render navigation items", async () => {
    const items = element.shadowRoot.querySelectorAll(".nav-item");
    expect(items.length).to.equal(defaultNavItems.length);

    items.forEach((item, index) => {
      expect(item.textContent).to.include(defaultNavItems[index].label);
    });
  });

  it("should highlight current path", async () => {
    const activeItem = element.shadowRoot.querySelector(".nav-item.active");
    expect(activeItem).to.exist;
    expect(activeItem.getAttribute("data-path")).to.equal("/dashboard");
  });

  it("should handle nested navigation", async () => {
    const settingsItem = element.shadowRoot.querySelector(
      '[data-id="settings"]'
    );
    settingsItem.click();
    await element.updateComplete;

    const subItems = element.shadowRoot.querySelectorAll(".nav-subitem");
    expect(subItems.length).to.equal(2);
    expect(subItems[0].textContent).to.include("Profile");
  });

  it("should emit navigation events", async () => {
    let navigatedPath = null;
    const handler = (e) => {
      navigatedPath = e.detail.path;
    };
    element.addEventListener("navigate", handler);

    const docsItem = element.shadowRoot.querySelector('[data-id="docs"]');
    docsItem.click();

    expect(navigatedPath).to.equal("/docs");
    element.removeEventListener("navigate", handler);
  });

  it("should handle mobile navigation toggle", async () => {
    const toggleButton = element.shadowRoot.querySelector(".nav-toggle");
    toggleButton.click();
    await element.updateComplete;

    expect(element.classList.contains("nav-expanded")).to.be.true;

    toggleButton.click();
    await element.updateComplete;
    expect(element.classList.contains("nav-expanded")).to.be.false;
  });

  it("should collapse other items when expanding one", async () => {
    const settingsItem = element.shadowRoot.querySelector(
      '[data-id="settings"]'
    );
    settingsItem.click();
    await element.updateComplete;

    expect(settingsItem.classList.contains("expanded")).to.be.true;

    const docsItem = element.shadowRoot.querySelector('[data-id="docs"]');
    docsItem.click();
    await element.updateComplete;

    expect(settingsItem.classList.contains("expanded")).to.be.false;
  });

  it("should handle keyboard navigation", async () => {
    const firstItem = element.shadowRoot.querySelector(".nav-item");
    firstItem.focus();

    // Test arrow down navigation
    const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
    firstItem.dispatchEvent(event);
    await element.updateComplete;

    const secondItem = element.shadowRoot.querySelector('[data-id="settings"]');
    expect(document.activeElement).to.equal(secondItem);
  });

  it("should handle route changes", async () => {
    element.currentPath = "/settings/profile";
    await element.updateComplete;

    const activeItem = element.shadowRoot.querySelector(".nav-subitem.active");
    expect(activeItem).to.exist;
    expect(activeItem.getAttribute("data-path")).to.equal("/settings/profile");
  });
});
