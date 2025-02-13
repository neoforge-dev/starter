import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/projects-page.js";

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
      getProjects: async () => mockProjects,
      updateProject: async (project) => project,
      deleteProject: async (id) => ({ success: true }),
    };

    element = await fixture(html`<projects-page></projects-page>`);
    await element.updateComplete;
  });

  it("renders project list", () => {
    const projects = element.shadowRoot.querySelectorAll(".project-card");
    expect(projects.length).to.equal(mockProjects.length);
  });

  it("displays project details correctly", () => {
    const firstProject = element.shadowRoot.querySelector(".project-card");

    expect(firstProject.querySelector(".project-name").textContent).to.equal(
      mockProjects[0].name
    );
    expect(
      firstProject.querySelector(".project-description").textContent
    ).to.equal(mockProjects[0].description);
    expect(firstProject.querySelector(".project-progress").value).to.equal(
      mockProjects[0].progress
    );
  });

  it("handles project filtering", async () => {
    const filterSelect = element.shadowRoot.querySelector(".status-filter");
    filterSelect.value = "completed";
    filterSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const visibleProjects = element.shadowRoot.querySelectorAll(
      ".project-card:not(.hidden)"
    );
    expect(visibleProjects.length).to.equal(1);
    expect(
      visibleProjects[0].querySelector(".project-name").textContent
    ).to.equal(mockProjects[1].name);
  });

  it("supports project search", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "Test Project 1";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const visibleProjects = element.shadowRoot.querySelectorAll(
      ".project-card:not(.hidden)"
    );
    expect(visibleProjects.length).to.equal(1);
    expect(
      visibleProjects[0].querySelector(".project-name").textContent
    ).to.include("Test Project 1");
  });

  it("handles new project creation", async () => {
    const newProjectButton = element.shadowRoot.querySelector(
      ".new-project-button"
    );

    setTimeout(() => newProjectButton.click());
    const { detail } = await oneEvent(element, "show-modal");

    expect(detail.type).to.equal("new-project");
  });

  it("shows project details modal", async () => {
    const firstProject = element.shadowRoot.querySelector(".project-card");
    const detailsButton = firstProject.querySelector(".details-button");

    setTimeout(() => detailsButton.click());
    const { detail } = await oneEvent(element, "show-modal");

    expect(detail.type).to.equal("project-details");
    expect(detail.projectId).to.equal(mockProjects[0].id);
  });

  it("handles project deletion", async () => {
    const firstProject = element.shadowRoot.querySelector(".project-card");
    const deleteButton = firstProject.querySelector(".delete-button");

    setTimeout(() => deleteButton.click());
    const { detail } = await oneEvent(element, "show-modal");

    expect(detail.type).to.equal("confirm-delete");
    expect(detail.projectId).to.equal(mockProjects[0].id);
  });

  it("updates project progress", async () => {
    const firstProject = element.shadowRoot.querySelector(".project-card");
    const progressBar = firstProject.querySelector(".project-progress");

    progressBar.value = 80;
    progressBar.dispatchEvent(new Event("change"));
    await element.updateComplete;

    expect(firstProject.querySelector(".progress-text").textContent).to.include(
      "80%"
    );
  });

  it("displays member avatars", () => {
    const firstProject = element.shadowRoot.querySelector(".project-card");
    const avatars = firstProject.querySelectorAll(".member-avatar");

    expect(avatars.length).to.equal(mockProjects[0].members.length);
    expect(avatars[0].src).to.include(mockProjects[0].members[0].avatar);
  });

  it("shows project tags", () => {
    const firstProject = element.shadowRoot.querySelector(".project-card");
    const tags = firstProject.querySelectorAll(".project-tag");

    expect(tags.length).to.equal(mockProjects[0].tags.length);
    expect(tags[0].textContent).to.include(mockProjects[0].tags[0]);
  });

  it("handles loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".project-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
    expect(loader.hasAttribute("hidden")).to.be.false;
  });

  it("handles error state", async () => {
    const error = "Failed to load projects";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    const retryButton = element.shadowRoot.querySelector(".retry-button");

    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
    expect(retryButton).to.exist;
  });

  it("supports mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = (query) => ({
      matches: query.includes("max-width"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".projects-container");
    expect(container.classList.contains("mobile")).to.be.true;
  });

  it("maintains accessibility attributes", () => {
    const projects = element.shadowRoot.querySelectorAll(".project-card");
    projects.forEach((project) => {
      expect(project.getAttribute("role")).to.equal("article");
      expect(project.getAttribute("aria-labelledby")).to.exist;
    });

    const buttons = element.shadowRoot.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const projects = element.shadowRoot.querySelectorAll(".project-card");
    const firstProject = projects[0];

    firstProject.focus();
    firstProject.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown" })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(projects[1]);
  });

  it("handles tag filtering", async () => {
    const tagFilter = element.shadowRoot.querySelector(".tag-filter");
    tagFilter.value = "frontend";
    tagFilter.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const visibleProjects = element.shadowRoot.querySelectorAll(
      ".project-card:not(.hidden)"
    );
    expect(visibleProjects.length).to.equal(1);
    expect(
      visibleProjects[0].querySelector(".project-tag").textContent
    ).to.include("frontend");
  });
});
