import {
  fixture,
  expect,
  oneEvent,
  waitForComponentUpdate,
  TestUtils,
} from "../setup.mjs";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../pages/docs-page.js";

describe("Documentation Page", () => {
  let element;

  beforeEach(async () => {
    // Mock docs service
    window.docs = {
      getDocs: vi.fn().mockResolvedValue({
        sections: [
          {
            id: "getting-started",
            title: "Getting Started",
            content: "# Getting Started\nWelcome to the docs",
            subsections: [
              {
                id: "installation",
                title: "Installation",
                content: "## Installation\nInstall the package",
              },
            ],
          },
        ],
        metadata: {
          version: "1.0.0",
          lastUpdated: "2024-03-15",
          contributors: [{ name: "John Doe", commits: 10 }],
        },
      }),
      searchDocs: vi.fn().mockResolvedValue([]),
    };

    element = await fixture(html`<docs-page></docs-page>`);
    await TestUtils.waitForAll(element);
  });

  it("renders documentation layout", async () => {
    const sidebar = await TestUtils.queryComponent(element, ".docs-sidebar");
    const content = await TestUtils.queryComponent(element, ".docs-content");
    const toc = await TestUtils.queryComponent(element, ".table-of-contents");

    expect(sidebar).to.exist;
    expect(content).to.exist;
    expect(toc).to.exist;
  });

  it("displays navigation menu", async () => {
    await element.updateComplete;
    const menuItems = await TestUtils.queryAllComponents(
      element,
      ".section-item"
    );
    expect(menuItems.length).to.equal(1);
    expect(menuItems[0].textContent.trim()).to.equal("Getting Started");
  });

  it("renders markdown content", async () => {
    await element.updateComplete;
    const content = await TestUtils.queryComponent(element, ".docs-content");
    const markedElement = content.querySelector("marked-element");
    expect(markedElement).to.exist;
  });

  it("handles section navigation", async () => {
    await element.updateComplete;
    const sectionItem = await TestUtils.queryComponent(
      element,
      ".section-item"
    );
    sectionItem.click();
    await element.updateComplete;
    expect(element.currentSection).to.equal("getting-started");
  });

  it("handles search", async () => {
    const searchInput = await TestUtils.queryComponent(
      element,
      ".search-input"
    );
    searchInput.value = "test";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;
    expect(window.docs.searchDocs).to.have.been.calledWith("test");
  });

  it("displays version selector", async () => {
    const versionSelect = await TestUtils.queryComponent(
      element,
      ".version-select"
    );
    expect(versionSelect).to.exist;
    expect(versionSelect.value).to.equal("latest");
  });

  it("shows contributors", async () => {
    await element.updateComplete;
    const contributorsList = await TestUtils.queryComponent(
      element,
      ".contributors-list"
    );
    const contributorItems =
      contributorsList.querySelectorAll(".contributor-item");
    expect(contributorItems.length).to.equal(1);
    expect(contributorItems[0].textContent).to.include("John Doe");
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
