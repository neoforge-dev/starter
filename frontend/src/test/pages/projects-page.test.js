import { fixture, expect, oneEvent } from "@open-wc/testing";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../components/pages/projects-page.js";

describe("Projects Page", () => {
  let element;
  const mockProjects = [
    {
      id: "1",
      name: "Test Project 1",
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
      name: "Test Project 2",
      description: "Another test project",
      status: "completed",
      progress: 100,
      members: [{ id: "1", name: "John Doe", avatar: "avatar1.jpg" }],
      dueDate: "2024-10-15",
      tags: ["backend", "api"],
    },
  ];

  beforeEach(async () => {
    // Mock API client
    window.api = {
      getProjects: async () => ({ projects: mockProjects }),
      updateProject: async (project) => project,
      deleteProject: async (id) => ({ success: true }),
    };

    element = await fixture(html`<projects-page></projects-page>`);
    await TestUtils.waitForComponent(element);
  });

  it("renders project list", async () => {
    const cards = await TestUtils.queryAllComponents(element, ".project-card");
    expect(cards.length).to.equal(mockProjects.length);
  });

  it("displays project details correctly", async () => {
    const firstProject = await TestUtils.waitForComponent(
      element,
      ".project-card"
    );
    const title = await TestUtils.waitForComponent(
      firstProject,
      ".project-title"
    );
    const description = await TestUtils.waitForComponent(
      firstProject,
      ".project-description"
    );

    expect(title.textContent).to.equal(mockProjects[0].title);
    expect(description.textContent).to.equal(mockProjects[0].description);
  });

  it("handles error state", async () => {
    // Mock API error
    window.api.getProjects = async () => {
      throw new Error("Failed to load projects");
    };

    // Create new instance to trigger error
    element = await fixture(html`<projects-page></projects-page>`);
    await TestUtils.waitForComponent(element);

    const error = await TestUtils.waitForComponent(element, ".error");
    expect(error).to.exist;
    expect(error.textContent).to.include("Failed to load projects");
  });

  it("shows loading state", async () => {
    // Create new instance to see loading state
    window.api.getProjects = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { projects: mockProjects };
    };

    element = await fixture(html`<projects-page></projects-page>`);
    const loading = await TestUtils.waitForComponent(element, ".loading");
    expect(loading).to.exist;
    expect(loading.textContent).to.include("Loading");
  });

  it("handles project submission", async () => {
    const submitLink = await TestUtils.waitForComponent(
      element,
      ".submit-project"
    );
    expect(submitLink).to.exist;
    expect(submitLink.href).to.include("github.com/neoforge/showcase");
  });

  it("displays project tags", async () => {
    const firstProject = await TestUtils.waitForComponent(
      element,
      ".project-card"
    );
    const tags = await TestUtils.queryAllComponents(firstProject, ".tag");

    expect(tags.length).to.equal(mockProjects[0].tags.length);
    expect(tags[0].textContent).to.equal(mockProjects[0].tags[0]);
  });

  it("shows project links", async () => {
    const firstProject = await TestUtils.waitForComponent(
      element,
      ".project-card"
    );
    const links = await TestUtils.queryAllComponents(
      firstProject,
      ".project-link"
    );

    expect(links.length).to.equal(2); // Demo and Source links
    expect(links[0].textContent).to.include("Live Demo");
    expect(links[1].textContent).to.include("Source Code");
  });
});
