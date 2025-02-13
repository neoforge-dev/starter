import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/ui/navigation.js";

describe("NeoNavigation", () => {
  let element;
  const items = [
    { id: "1", label: "Home", path: "/" },
    { id: "2", label: "About", path: "/about" },
    {
      id: "3",
      label: "Products",
      path: "/products",
      children: [
        { id: "3.1", label: "Hardware", path: "/products/hardware" },
        { id: "3.2", label: "Software", path: "/products/software" },
      ],
    },
    { id: "4", label: "Contact", path: "/contact" },
  ];

  beforeEach(async () => {
    element = await fixture(html`
      <neo-navigation .items=${items} current-path="/"></neo-navigation>
    `);
  });

  it("renders with default properties", () => {
    const nav = element.shadowRoot.querySelector("nav");
    const navItems = element.shadowRoot.querySelectorAll(".nav-item");

    expect(nav).to.exist;
    expect(navItems.length).to.equal(items.length);
    expect(element.expanded).to.be.false;
  });

  it("highlights active item", async () => {
    const activeItem = element.shadowRoot.querySelector(".nav-item.active");
    expect(activeItem).to.exist;
    expect(activeItem.getAttribute("data-path")).to.equal("/");
  });

  it("expands/collapses submenu on click", async () => {
    const parentItem = element.shadowRoot.querySelector('[data-id="3"]');
    const clickPromise = oneEvent(element, "click");

    parentItem.click();
    await clickPromise;
    await element.updateComplete;

    expect(parentItem.classList.contains("expanded")).to.be.true;
    const subItems = parentItem.querySelectorAll(".nav-subitem");
    expect(subItems.length).to.equal(2);

    // Click again to collapse
    const collapsePromise = oneEvent(element, "click");
    parentItem.click();
    await collapsePromise;
    await element.updateComplete;

    expect(parentItem.classList.contains("expanded")).to.be.false;
  });

  it("handles mobile navigation toggle", async () => {
    const toggleButton = element.shadowRoot.querySelector(".nav-toggle");
    expect(toggleButton).to.exist;

    const togglePromise = oneEvent(element, "click");
    toggleButton.click();
    await togglePromise;
    await element.updateComplete;

    expect(element.expanded).to.be.true;
    expect(element.classList.contains("nav-expanded")).to.be.true;

    // Click again to collapse
    const collapsePromise = oneEvent(element, "click");
    toggleButton.click();
    await collapsePromise;
    await element.updateComplete;

    expect(element.expanded).to.be.false;
    expect(element.classList.contains("nav-expanded")).to.be.false;
  });

  it("maintains accessibility attributes", () => {
    const nav = element.shadowRoot.querySelector("nav");
    const toggleButton = element.shadowRoot.querySelector(".nav-toggle");
    const navItems = element.shadowRoot.querySelectorAll(".nav-item");

    expect(nav.getAttribute("role")).to.equal("navigation");
    expect(nav.getAttribute("aria-label")).to.equal("Main navigation");
    expect(toggleButton.getAttribute("aria-label")).to.equal(
      "Toggle navigation"
    );

    navItems.forEach((item) => {
      expect(item.getAttribute("tabindex")).to.equal("0");
    });
  });

  it("handles keyboard navigation", async () => {
    const firstItem = element.shadowRoot.querySelector(".nav-item");

    // Test Enter key
    const enterPromise = oneEvent(element, "click");
    firstItem.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await enterPromise;

    // Test Space key
    const spacePromise = oneEvent(element, "click");
    firstItem.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    await spacePromise;
  });

  it("closes mobile menu when selecting an item", async () => {
    // First expand the mobile menu
    element.expanded = true;
    await element.updateComplete;

    const navItem = element.shadowRoot.querySelector(".nav-item");
    const clickPromise = oneEvent(element, "click");
    navItem.click();
    await clickPromise;
    await element.updateComplete;

    expect(element.expanded).to.be.false;
  });

  it("handles window resize events", async () => {
    // Simulate mobile view
    window.innerWidth = 767;
    window.dispatchEvent(new Event("resize"));
    await element.updateComplete;

    expect(getComputedStyle(element).position).to.equal("fixed");

    // Simulate desktop view
    window.innerWidth = 1024;
    window.dispatchEvent(new Event("resize"));
    await element.updateComplete;

    expect(getComputedStyle(element).position).to.not.equal("fixed");
  });

  it("prevents body scroll when mobile menu is open", async () => {
    element.expanded = true;
    await element.updateComplete;

    expect(document.body.style.overflow).to.equal("hidden");

    element.expanded = false;
    await element.updateComplete;

    expect(document.body.style.overflow).to.equal("");
  });
});
