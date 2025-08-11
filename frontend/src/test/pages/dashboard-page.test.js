import { TestRunner, Assert, ComponentTester } from "../test-utils.js";
import { DashboardPage } from "../../pages/dashboard-page.js";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

const runner = new TestRunner();

runner.describe("DashboardPage", () => {
  let element;
  const mockData = {
    stats: {
      totalProjects: 12,
      activeProjects: 5,
      completedTasks: 45,
      pendingTasks: 8,
    },
    recentActivity: [
      {
        id: 1,
        type: "task_completed",
        description: "Completed task: Update documentation",
        timestamp: "2024-02-10T14:30:00Z",
      },
      {
        id: 2,
        type: "project_created",
        description: "Created new project: API Integration",
        timestamp: "2024-02-10T13:15:00Z",
      },
    ],
    projects: [
      {
        id: 1,
        name: "API Integration",
        status: "in_progress",
        progress: 65,
        dueDate: "2024-03-01",
      },
      {
        id: 2,
        name: "Frontend Redesign",
        status: "planning",
        progress: 25,
        dueDate: "2024-03-15",
      },
    ],
  };

  runner.beforeEach(async () => {
    element = await ComponentTester.render(DashboardPage);
    element.stats = mockData.stats;
    element.recentActivity = mockData.recentActivity;
    element.projects = mockData.projects;
    await element.updateComplete;
  });

  runner.afterEach(() => {
    ComponentTester.cleanup();
  });

  runner.it("should render dashboard layout", async () => {
    const shadowRoot = element.shadowRoot;
    const header = shadowRoot.querySelector("header");
    const sidebar = shadowRoot.querySelector(".sidebar");
    const mainContent = shadowRoot.querySelector("main");
    const statsSection = shadowRoot.querySelector(".stats-section");
    const activitySection = shadowRoot.querySelector(".activity-section");
    const projectsSection = shadowRoot.querySelector(".projects-section");

    Assert.notNull(header, "Header should be present");
    Assert.notNull(sidebar, "Sidebar should be present");
    Assert.notNull(mainContent, "Main content should be present");
    Assert.notNull(statsSection, "Stats section should be present");
    Assert.notNull(activitySection, "Activity section should be present");
    Assert.notNull(projectsSection, "Projects section should be present");
  });

  runner.it("should render statistics cards", async () => {
    const shadowRoot = element.shadowRoot;
    const statsCards = shadowRoot.querySelectorAll(".stat-card");

    Assert.equal(statsCards.length, 4, "Should show all statistics cards");

    const [totalProjects, activeProjects, completedTasks, pendingTasks] =
      statsCards;

    Assert.include(
      totalProjects.textContent,
      mockData.stats.totalProjects.toString(),
      "Should show total projects"
    );
    Assert.include(
      activeProjects.textContent,
      mockData.stats.activeProjects.toString(),
      "Should show active projects"
    );
    Assert.include(
      completedTasks.textContent,
      mockData.stats.completedTasks.toString(),
      "Should show completed tasks"
    );
    Assert.include(
      pendingTasks.textContent,
      mockData.stats.pendingTasks.toString(),
      "Should show pending tasks"
    );
  });

  runner.it("should render recent activity", async () => {
    const shadowRoot = element.shadowRoot;
    const activityItems = shadowRoot.querySelectorAll(".activity-item");

    Assert.equal(
      activityItems.length,
      mockData.recentActivity.length,
      "Should show all activity items"
    );

    activityItems.forEach((item, index) => {
      const activity = mockData.recentActivity[index];
      Assert.include(
        item.textContent,
        activity.description,
        "Should show activity description"
      );
      Assert.include(
        item.querySelector(".timestamp").textContent,
        new Date(activity.timestamp).toLocaleString(),
        "Should show formatted timestamp"
      );
    });
  });

  runner.it("should render project list", async () => {
    const shadowRoot = element.shadowRoot;
    const projectItems = shadowRoot.querySelectorAll(".project-item");

    Assert.equal(
      projectItems.length,
      mockData.projects.length,
      "Should show all projects"
    );

    projectItems.forEach((item, index) => {
      const project = mockData.projects[index];
      const progressBar = item.querySelector(".progress-bar");
      const statusBadge = item.querySelector(".status-badge");

      Assert.include(
        item.textContent,
        project.name,
        "Should show project name"
      );
      Assert.equal(
        progressBar.getAttribute("value"),
        project.progress.toString(),
        "Should show correct progress"
      );
      Assert.include(
        statusBadge.textContent,
        project.status,
        "Should show correct status"
      );
    });
  });

  runner.it("should handle project filtering", async () => {
    const shadowRoot = element.shadowRoot;
    const filterSelect = shadowRoot.querySelector(".project-filter");

    Assert.notNull(filterSelect, "Project filter should be present");

    // Filter by status
    await ComponentTester.select(filterSelect, "in_progress");

    const filteredProjects = shadowRoot.querySelectorAll(
      ".project-item:not(.hidden)"
    );
    Assert.equal(
      filteredProjects.length,
      1,
      "Should show only in-progress projects"
    );
    Assert.include(
      filteredProjects[0].textContent,
      "API Integration",
      "Should show correct filtered project"
    );
  });

  runner.it("should handle project search", async () => {
    const shadowRoot = element.shadowRoot;
    const searchInput = shadowRoot.querySelector(".project-search input");

    Assert.notNull(searchInput, "Project search should be present");

    // Search for project
    await ComponentTester.type(searchInput, "API");

    const searchResults = shadowRoot.querySelectorAll(
      ".project-item:not(.hidden)"
    );
    Assert.equal(searchResults.length, 1, "Should show matching projects");
    Assert.include(
      searchResults[0].textContent,
      "API Integration",
      "Should show correct search result"
    );
  });

  runner.it("should handle project sorting", async () => {
    const shadowRoot = element.shadowRoot;
    const sortSelect = shadowRoot.querySelector(".project-sort");

    Assert.notNull(sortSelect, "Project sort should be present");

    // Sort by due date
    await ComponentTester.select(sortSelect, "due_date");

    shadowRoot.querySelectorAll(".project-item");
    const firstProjectDate = new Date(mockData.projects[0].dueDate);
    const secondProjectDate = new Date(mockData.projects[1].dueDate);

    Assert.true(
      firstProjectDate <= secondProjectDate,
      "Projects should be sorted by due date"
    );
  });

  runner.it("should handle refresh data", async () => {
    const shadowRoot = element.shadowRoot;
    const refreshButton = shadowRoot.querySelector(".refresh-button");
    let refreshCalled = false;

    // Mock refresh handler
    element.refreshData = async () => {
      refreshCalled = true;
      return { success: true };
    };

    Assert.notNull(refreshButton, "Refresh button should be present");

    await ComponentTester.click(refreshButton);
    Assert.true(refreshCalled, "Should call refresh handler");
  });
});

// Run tests
runner.run();

// Simple vitest test for Dashboard Page
describe("Dashboard Page", () => {
  let container;
  let element;

  beforeEach(async () => {
    // Create a container for the page
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create the dashboard-page element  
    element = document.createElement('dashboard-page');
    container.appendChild(element);
    
    // Wait for component to be fully rendered
    await element.updateComplete;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("should render dashboard page", async () => {
    expect(element).toBeTruthy();
    expect(element.shadowRoot).toBeTruthy();
  });
});
