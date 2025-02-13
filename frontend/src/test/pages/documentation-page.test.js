import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/documentation-page.js";

describe("Documentation Page", () => {
  let element;
  const mockDocs = {
    sections: [
      {
        id: "getting-started",
        title: "Getting Started",
        subsections: [
          {
            id: "installation",
            title: "Installation",
            content: "## Installation\nFollow these steps...",
          },
          {
            id: "quick-start",
            title: "Quick Start",
            content: "## Quick Start\nCreate your first app...",
          },
        ],
      },
      {
        id: "components",
        title: "Components",
        subsections: [
          {
            id: "buttons",
            title: "Buttons",
            content: "## Buttons\nButton variations...",
          },
          {
            id: "forms",
            title: "Forms",
            content: "## Forms\nForm elements...",
          },
        ],
      },
    ],
    metadata: {
      version: "1.0.0",
      lastUpdated: "2024-03-15",
    },
  };

  beforeEach(async () => {
    // Mock API client
    window.api = {
      getDocs: async () => mockDocs,
      getDocSection: async (id) => mockDocs.sections.find((s) => s.id === id),
      searchDocs: async (query) => [mockDocs.sections[0].subsections[0]],
    };

    element = await fixture(html`<documentation-page></documentation-page>`);
    await element.updateComplete;
  });

  it("renders documentation structure", () => {
    const sidebar = element.shadowRoot.querySelector(".docs-sidebar");
    const content = element.shadowRoot.querySelector(".docs-content");
    const search = element.shadowRoot.querySelector(".docs-search");

    expect(sidebar).to.exist;
    expect(content).to.exist;
    expect(search).to.exist;
  });

  it("displays navigation menu", () => {
    const menuItems = element.shadowRoot.querySelectorAll(".menu-item");
    expect(menuItems.length).to.equal(mockDocs.sections.length);

    const firstItem = menuItems[0];
    expect(firstItem.textContent).to.include(mockDocs.sections[0].title);
  });

  it("renders markdown content", async () => {
    const content = element.shadowRoot.querySelector(".docs-content");
    const markdown = content.querySelector("marked-element");

    expect(markdown).to.exist;
    expect(markdown.markdown).to.include("Installation");
  });

  it("handles section navigation", async () => {
    const menuItems = element.shadowRoot.querySelectorAll(".menu-item");
    const secondItem = menuItems[1];

    secondItem.click();
    await element.updateComplete;

    const content = element.shadowRoot.querySelector(".docs-content");
    expect(content.textContent).to.include("Components");
  });

  it("supports search functionality", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "installation";

    setTimeout(() => searchInput.dispatchEvent(new Event("input")));
    const { detail } = await oneEvent(element, "search-results");

    expect(detail.results.length).to.equal(1);
    expect(detail.results[0].title).to.equal("Installation");
  });

  it("highlights active section", async () => {
    const menuItems = element.shadowRoot.querySelectorAll(".menu-item");
    const firstItem = menuItems[0];

    firstItem.click();
    await element.updateComplete;

    expect(firstItem.classList.contains("active")).to.be.true;
  });

  it("handles subsection navigation", async () => {
    const subsectionLinks =
      element.shadowRoot.querySelectorAll(".subsection-link");
    const quickStartLink = Array.from(subsectionLinks).find((link) =>
      link.textContent.includes("Quick Start")
    );

    quickStartLink.click();
    await element.updateComplete;

    const content = element.shadowRoot.querySelector(".docs-content");
    expect(content.textContent).to.include("Create your first app");
  });

  it("displays version information", () => {
    const version = element.shadowRoot.querySelector(".docs-version");
    expect(version.textContent).to.include(mockDocs.metadata.version);
  });

  it("supports table of contents navigation", () => {
    const toc = element.shadowRoot.querySelector(".table-of-contents");
    const tocLinks = toc.querySelectorAll("a");

    expect(tocLinks.length).to.be.greaterThan(0);
    expect(tocLinks[0].getAttribute("href")).to.include("#");
  });

  it("handles code block copying", async () => {
    const codeBlock = element.shadowRoot.querySelector("code-block");
    const copyButton = codeBlock.querySelector(".copy-button");

    // Mock clipboard API
    const originalClipboard = navigator.clipboard;
    navigator.clipboard = {
      writeText: () => Promise.resolve(),
    };

    setTimeout(() => copyButton.click());
    const { detail } = await oneEvent(element, "code-copied");

    expect(detail.code).to.exist;

    // Restore clipboard API
    navigator.clipboard = originalClipboard;
  });

  it("supports mobile navigation toggle", async () => {
    // Mock mobile viewport
    window.matchMedia = (query) => ({
      matches: query.includes("max-width"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const menuToggle = element.shadowRoot.querySelector(".mobile-menu-toggle");
    const sidebar = element.shadowRoot.querySelector(".docs-sidebar");

    menuToggle.click();
    await element.updateComplete;

    expect(sidebar.classList.contains("visible")).to.be.true;
  });

  it("handles loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".content-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("displays error messages", async () => {
    const error = "Failed to load documentation";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
  });

  it("maintains scroll position on navigation", async () => {
    const content = element.shadowRoot.querySelector(".docs-content");
    content.scrollTop = 100;

    const subsectionLinks =
      element.shadowRoot.querySelectorAll(".subsection-link");
    subsectionLinks[0].click();
    await element.updateComplete;

    expect(content.scrollTop).to.equal(0);
  });

  it("supports keyboard navigation", async () => {
    const menuItems = element.shadowRoot.querySelectorAll(".menu-item");
    const firstItem = menuItems[0];

    firstItem.focus();
    firstItem.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    await element.updateComplete;

    expect(document.activeElement).to.equal(menuItems[1]);
  });

  it("maintains accessibility attributes", () => {
    const navigation = element.shadowRoot.querySelector(".docs-navigation");
    expect(navigation.getAttribute("role")).to.equal("navigation");

    const menuItems = element.shadowRoot.querySelectorAll(".menu-item");
    menuItems.forEach((item) => {
      expect(item.getAttribute("role")).to.equal("menuitem");
    });
  });

  it("handles print layout", async () => {
    // Mock print media query
    window.matchMedia = (query) => ({
      matches: query.includes("print"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".docs-container");
    expect(container.classList.contains("print-layout")).to.be.true;
  });

  it("supports dark mode", async () => {
    const darkModeToggle =
      element.shadowRoot.querySelector(".dark-mode-toggle");

    darkModeToggle.click();
    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".docs-container");
    expect(container.classList.contains("dark")).to.be.true;
  });

  it("handles external links", () => {
    const externalLinks =
      element.shadowRoot.querySelectorAll('a[target="_blank"]');

    externalLinks.forEach((link) => {
      expect(link.getAttribute("rel")).to.equal("noopener noreferrer");
    });
  });
});
