import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/docs-page.js";

describe("Documentation Page", () => {
  let element;
  const mockDocs = {
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        content: "# Introduction\nWelcome to NeoForge documentation...",
        subsections: [
          {
            id: "overview",
            title: "Overview",
            content: "## Overview\nNeoForge is a modern framework...",
          },
          {
            id: "getting-started",
            title: "Getting Started",
            content: "## Getting Started\nInstall NeoForge using...",
          },
        ],
      },
      {
        id: "components",
        title: "Components",
        content: "# Components\nLearn about NeoForge components...",
        subsections: [
          {
            id: "web-components",
            title: "Web Components",
            content: "## Web Components\nCreate custom elements...",
          },
        ],
      },
    ],
    metadata: {
      version: "1.0.0",
      lastUpdated: "2024-03-15",
      contributors: [
        { name: "John Doe", commits: 150 },
        { name: "Jane Smith", commits: 120 },
      ],
    },
  };

  beforeEach(async () => {
    // Mock documentation service
    window.docs = {
      getDocs: async () => mockDocs,
      getSection: async (id) => mockDocs.sections.find((s) => s.id === id),
      getSubsection: async (sectionId, subsectionId) => {
        const section = mockDocs.sections.find((s) => s.id === sectionId);
        return section?.subsections.find((ss) => ss.id === subsectionId);
      },
      searchDocs: async (query) => [mockDocs.sections[0].subsections[0]],
      reportIssue: async (path, issue) => ({
        success: true,
        ticketId: "DOC-123",
      }),
    };

    element = await fixture(html`<docs-page></docs-page>`);
    await element.updateComplete;
  });

  it("renders documentation layout", () => {
    const sidebar = element.shadowRoot.querySelector(".docs-sidebar");
    const content = element.shadowRoot.querySelector(".docs-content");
    const toc = element.shadowRoot.querySelector(".table-of-contents");

    expect(sidebar).to.exist;
    expect(content).to.exist;
    expect(toc).to.exist;
  });

  it("displays navigation menu", () => {
    const menu = element.shadowRoot.querySelector(".docs-menu");
    const sections = menu.querySelectorAll(".section-item");

    expect(sections.length).to.equal(mockDocs.sections.length);
    sections.forEach((section, index) => {
      expect(section.textContent).to.include(mockDocs.sections[index].title);
    });
  });

  it("renders markdown content", () => {
    const content = element.shadowRoot.querySelector(".docs-content");
    const markdown = content.querySelector("marked-element");

    expect(markdown).to.exist;
    expect(markdown.markdown).to.include("Welcome to NeoForge documentation");
  });

  it("handles section navigation", async () => {
    const menu = element.shadowRoot.querySelector(".docs-menu");
    const secondSection = menu.querySelectorAll(".section-item")[1];

    secondSection.click();
    await element.updateComplete;

    const content = element.shadowRoot.querySelector(".docs-content");
    expect(content.textContent).to.include("Learn about NeoForge components");
  });

  it("supports subsection navigation", async () => {
    const menu = element.shadowRoot.querySelector(".docs-menu");
    const subsection = menu.querySelector('[data-id="getting-started"]');

    subsection.click();
    await element.updateComplete;

    const content = element.shadowRoot.querySelector(".docs-content");
    expect(content.textContent).to.include("Install NeoForge using");
  });

  it("updates table of contents", async () => {
    const toc = element.shadowRoot.querySelector(".table-of-contents");
    const links = toc.querySelectorAll("a");

    expect(links.length).to.be.greaterThan(0);
    expect(links[0].getAttribute("href")).to.include("#");
  });

  it("handles search functionality", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "overview";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const searchResults = element.shadowRoot.querySelector(".search-results");
    expect(searchResults).to.exist;
    expect(searchResults.textContent).to.include("Overview");
  });

  it("supports version selection", async () => {
    const versionSelect = element.shadowRoot.querySelector(".version-select");
    versionSelect.value = "0.9.0";
    versionSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    expect(element.version).to.equal("0.9.0");
  });

  it("shows contributor information", () => {
    const contributors = element.shadowRoot.querySelector(".contributors-list");
    const items = contributors.querySelectorAll(".contributor-item");

    expect(items.length).to.equal(mockDocs.metadata.contributors.length);
    items.forEach((item, index) => {
      expect(item.textContent).to.include(
        mockDocs.metadata.contributors[index].name
      );
    });
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
    const navigation = element.shadowRoot.querySelector(".docs-navigation");
    expect(navigation.getAttribute("role")).to.equal("navigation");

    const sections = element.shadowRoot.querySelectorAll(".section-item");
    sections.forEach((section) => {
      expect(section.getAttribute("role")).to.equal("menuitem");
    });
  });

  it("supports keyboard navigation", async () => {
    const sections = element.shadowRoot.querySelectorAll(".section-item");
    const firstSection = sections[0];

    firstSection.focus();
    firstSection.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown" })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(sections[1]);
  });

  it("handles loading states", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".content-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("displays error states", async () => {
    const error = "Failed to load documentation";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
  });

  it("supports dark mode", async () => {
    const darkModeToggle =
      element.shadowRoot.querySelector(".dark-mode-toggle");
    darkModeToggle.click();
    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".docs-container");
    expect(container.classList.contains("dark")).to.be.true;
  });

  it("handles issue reporting", async () => {
    const reportButton = element.shadowRoot.querySelector(
      ".report-issue-button"
    );

    setTimeout(() => reportButton.click());
    const { detail } = await oneEvent(element, "report-issue");

    expect(detail.path).to.exist;
    expect(detail.type).to.equal("documentation");
  });

  it("maintains scroll position on navigation", async () => {
    const content = element.shadowRoot.querySelector(".docs-content");
    content.scrollTop = 100;

    const menu = element.shadowRoot.querySelector(".docs-menu");
    const subsection = menu.querySelector('[data-id="overview"]');
    subsection.click();
    await element.updateComplete;

    expect(content.scrollTop).to.equal(0);
  });

  it("supports edit on GitHub link", () => {
    const editLink = element.shadowRoot.querySelector(".edit-on-github");
    expect(editLink.href).to.include("github.com");
    expect(editLink.getAttribute("target")).to.equal("_blank");
    expect(editLink.getAttribute("rel")).to.equal("noopener noreferrer");
  });
});
