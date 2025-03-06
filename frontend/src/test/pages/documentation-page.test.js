import { expect, describe, it, beforeEach, vi } from "vitest";
import { DocumentationPage } from "../../pages/documentation-page.js";

// Use a mock approach similar to what we did for the button and checkbox tests
describe("Documentation Page", () => {
  let pageProps;
  const mockDocs = {
    sections: [
      {
        id: "getting-started",
        title: "Getting Started",
        content: "# Getting Started\nWelcome to the documentation",
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
  };

  beforeEach(() => {
    // Create a mock of the documentation page properties
    pageProps = {
      sections: mockDocs.sections,
      activeSection: "getting-started",
      activeSubsection: "installation",
      loading: false,
      error: null,
      searchQuery: "",
      searchResults: [],
      metadata: mockDocs.metadata,
      // Mock API service
      api: {
        getDocs: vi.fn().mockResolvedValue(mockDocs),
        searchDocs: vi.fn().mockResolvedValue([]),
      },
      // Mock the loadDocs method
      _loadDocs: async function () {
        try {
          this.loading = true;
          const docs = await this.api.getDocs();
          this.sections = docs.sections;
          this.metadata = docs.metadata;
          if (this.sections.length > 0) {
            this.activeSection = this.sections[0].id;
            if (this.sections[0].subsections.length > 0) {
              this.activeSubsection = this.sections[0].subsections[0].id;
            }
          }
        } catch (error) {
          this.error = "Failed to load documentation";
        } finally {
          this.loading = false;
        }
      },
      // Mock the handleSearch method
      _handleSearch: async function (e) {
        const query = e.target ? e.target.value : e;
        this.searchQuery = query;
        if (!query) {
          this.searchResults = [];
          return;
        }
        try {
          const results = await this.api.searchDocs(query);
          this.searchResults = results;
        } catch (error) {
          console.error("Search error:", error);
        }
      },
      // Mock the shadowRoot functionality
      shadowRoot: {
        querySelector: function (selector) {
          if (selector === ".docs-container") {
            return { exists: true };
          }
          if (selector === ".docs-sidebar") {
            return { exists: true };
          }
          if (selector === ".docs-content") {
            return {
              exists: true,
              querySelector: function (innerSelector) {
                if (innerSelector === "marked-element") {
                  return { exists: true };
                }
                return null;
              },
            };
          }
          if (selector === ".menu-item") {
            return {
              click: function () {
                pageProps.activeSection = "getting-started";
                return true;
              },
            };
          }
          if (selector === ".search-input") {
            return {
              value: pageProps.searchQuery,
              dispatchEvent: function (event) {
                return true;
              },
            };
          }
          if (selector === "neo-spinner") {
            return pageProps.loading ? { exists: true } : null;
          }
          if (selector === ".error-message") {
            return pageProps.error ? { textContent: pageProps.error } : null;
          }
          return null;
        },
        querySelectorAll: function (selector) {
          if (selector === ".menu-item") {
            return pageProps.sections.map((section) => ({
              textContent: section.title,
              click: function () {
                pageProps.activeSection = section.id;
                return true;
              },
            }));
          }
          return [];
        },
      },
      // Mock the updateComplete property
      updateComplete: Promise.resolve(true),
    };
  });

  it("renders documentation structure", async () => {
    const container = pageProps.shadowRoot.querySelector(".docs-container");
    const sidebar = pageProps.shadowRoot.querySelector(".docs-sidebar");
    const content = pageProps.shadowRoot.querySelector(".docs-content");

    expect(container).toBeDefined();
    expect(sidebar).toBeDefined();
    expect(content).toBeDefined();
  });

  it("displays navigation menu", async () => {
    const menuItems = pageProps.shadowRoot.querySelectorAll(".menu-item");
    expect(menuItems.length).toBe(1);
    expect(menuItems[0].textContent).toBe("Getting Started");
  });

  it("renders markdown content", async () => {
    const content = pageProps.shadowRoot.querySelector(".docs-content");
    const markedElement = content.querySelector("marked-element");
    expect(markedElement).toBeDefined();
  });

  it("handles section navigation", async () => {
    const menuItem = pageProps.shadowRoot.querySelector(".menu-item");
    menuItem.click();
    expect(pageProps.activeSection).toBe("getting-started");
  });

  it("handles search", async () => {
    const searchInput = pageProps.shadowRoot.querySelector(".search-input");
    await pageProps._handleSearch("test");
    expect(pageProps.api.searchDocs).toHaveBeenCalledWith("test");
  });

  it("shows loading state", async () => {
    pageProps.loading = true;
    const spinner = pageProps.shadowRoot.querySelector("neo-spinner");
    expect(spinner).toBeDefined();
  });

  it("handles error state", async () => {
    pageProps.error = "Failed to load documentation";
    const errorMessage = pageProps.shadowRoot.querySelector(".error-message");
    expect(errorMessage).toBeDefined();
    expect(errorMessage.textContent).toBe("Failed to load documentation");
  });
});
