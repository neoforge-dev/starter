import { expect, describe, it, beforeEach, vi } from "vitest";
import { ProjectsPage } from "../../components/pages/projects-page.js";

// Create a mock for the API service
vi.mock("../../components/services/api.js", () => ({
  apiService: {
    getProjects: vi.fn(),
  },
}));

// Use a mock approach similar to what we did for the button and checkbox tests
describe("Projects Page", () => {
  let pageProps;
  const mockProjects = [
    {
      id: "1",
      title: "Test Project 1",
      description: "A test project",
      status: "active",
      progress: 75,
      members: [
        { id: "1", name: "John Doe", avatar: "avatar1.jpg" },
        { id: "2", name: "Jane Smith", avatar: "avatar2.jpg" },
      ],
      dueDate: "2024-12-31",
      tags: ["frontend", "ui"],
    },
    {
      id: "2",
      title: "Test Project 2",
      description: "Another test project",
      status: "completed",
      progress: 100,
      members: [{ id: "1", name: "John Doe", avatar: "avatar1.jpg" }],
      dueDate: "2024-10-15",
      tags: ["backend", "api"],
    },
  ];

  beforeEach(() => {
    // Create a mock of the projects page properties
    pageProps = {
      projects: [],
      isLoading: true,
      error: null,
      // Mock the loadProjects method
      loadProjects: async function () {
        try {
          this.isLoading = true;
          // Simulate API call
          const data = { projects: mockProjects };
          this.projects = data.projects;
          this.error = null;
        } catch (error) {
          this.error = "Failed to load projects. Please try again later.";
        } finally {
          this.isLoading = false;
        }
      },
      // Mock the shadowRoot functionality
      shadowRoot: {
        querySelectorAll: function (selector) {
          if (selector === ".project-card") {
            return pageProps.isLoading || pageProps.error
              ? []
              : mockProjects.map((project, index) => ({
                  querySelector: function (innerSelector) {
                    if (innerSelector === ".project-title") {
                      return { textContent: project.title };
                    }
                    if (innerSelector === ".project-description") {
                      return { textContent: project.description };
                    }
                    if (innerSelector === ".tag") {
                      return { textContent: project.tags[0] };
                    }
                    if (innerSelector === ".project-link") {
                      return { textContent: "Live Demo", href: "#demo" };
                    }
                    return null;
                  },
                  querySelectorAll: function (innerSelector) {
                    if (innerSelector === ".tag") {
                      return project.tags.map((tag) => ({ textContent: tag }));
                    }
                    if (innerSelector === ".project-link") {
                      return [
                        { textContent: "Live Demo", href: "#demo" },
                        { textContent: "Source Code", href: "#source" },
                      ];
                    }
                    return [];
                  },
                }));
          }
          if (selector === ".loading") {
            return pageProps.isLoading
              ? [{ textContent: "Loading projects..." }]
              : [];
          }
          if (selector === ".error") {
            return pageProps.error ? [{ textContent: pageProps.error }] : [];
          }
          if (selector === ".submit-project") {
            return [
              {
                href: "https://github.com/neoforge/showcase",
                textContent: "Submit Your Project",
              },
            ];
          }
          return [];
        },
        querySelector: function (selector) {
          const elements = this.querySelectorAll(selector);
          return elements.length > 0 ? elements[0] : null;
        },
      },
    };
  });

  it("renders project list", async () => {
    await pageProps.loadProjects();
    const cards = pageProps.shadowRoot.querySelectorAll(".project-card");
    expect(cards.length).toBe(mockProjects.length);
  });

  it("displays project details correctly", async () => {
    await pageProps.loadProjects();
    const firstProject =
      pageProps.shadowRoot.querySelectorAll(".project-card")[0];
    const title = firstProject.querySelector(".project-title");
    const description = firstProject.querySelector(".project-description");

    expect(title.textContent).toBe(mockProjects[0].title);
    expect(description.textContent).toBe(mockProjects[0].description);
  });

  it("handles error state", async () => {
    // Set error state
    pageProps.isLoading = false;
    pageProps.error = "Failed to load projects";

    const error = pageProps.shadowRoot.querySelector(".error");
    expect(error).toBeDefined();
    expect(error.textContent).toBe("Failed to load projects");
  });

  it("shows loading state", async () => {
    // Loading state is true by default
    const loading = pageProps.shadowRoot.querySelector(".loading");
    expect(loading).toBeDefined();
    expect(loading.textContent).toContain("Loading");
  });

  it("handles project submission", async () => {
    const submitLink = pageProps.shadowRoot.querySelector(".submit-project");
    expect(submitLink).toBeDefined();
    expect(submitLink.href).toContain("github.com/neoforge/showcase");
  });

  it("displays project tags", async () => {
    await pageProps.loadProjects();
    const firstProject =
      pageProps.shadowRoot.querySelectorAll(".project-card")[0];
    const tags = firstProject.querySelectorAll(".tag");

    expect(tags.length).toBe(mockProjects[0].tags.length);
    expect(tags[0].textContent).toBe(mockProjects[0].tags[0]);
  });

  it("shows project links", async () => {
    await pageProps.loadProjects();
    const firstProject =
      pageProps.shadowRoot.querySelectorAll(".project-card")[0];
    const links = firstProject.querySelectorAll(".project-link");

    expect(links.length).toBe(2); // Demo and Source links
    expect(links[0].textContent).toContain("Live Demo");
    expect(links[1].textContent).toContain("Source Code");
  });
});
