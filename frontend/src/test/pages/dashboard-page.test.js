import { expect, oneEvent, TestUtils } from "../setup.mjs";
import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../pages/dashboard-page.js";

describe("Dashboard Page", () => {
  let element;
  const mockUser = {
    id: "123",
    name: "Test User",
    email: "test@example.com",
    role: "admin",
  };

  const mockStats = {
    projects: 5,
    tasks: 25,
    completedTasks: 15,
    activeUsers: 3,
  };

  const mockTasks = [
    {
      id: "1",
      title: "Complete Project Setup",
      description: "Set up development environment",
      status: "in_progress",
      priority: "high",
      dueDate: "2024-03-20",
      assignee: {
        id: "user1",
        name: "John Doe",
        avatar: "john.jpg",
      },
    },
    {
      id: "2",
      title: "Write Documentation",
      description: "Document API endpoints",
      status: "todo",
      priority: "medium",
      dueDate: "2024-03-25",
      assignee: {
        id: "user2",
        name: "Jane Smith",
        avatar: "jane.jpg",
      },
    },
  ];

  beforeEach(async () => {
    // Mock auth state
    window.auth = {
      currentUser: mockUser,
      isAuthenticated: true,
    };

    // Mock API client
    window.api = {
      getTasks: async () => ({ tasks: mockTasks }),
      updateTask: async (taskId, updates) => ({
        task: { ...mockTasks.find((t) => t.id === taskId), ...updates },
      }),
    };

    element = await TestUtils.fixture(html`<dashboard-page></dashboard-page>`);
    // Mock API response
    element.stats = mockStats;
    await element.updateComplete;
  });

  it("renders welcome message with user name", () => {
    const welcome = element.shadowRoot.querySelector(".welcome-message");
    expect(welcome.textContent).to.include(mockUser.name);
  });

  it("displays statistics cards", () => {
    const cards = element.shadowRoot.querySelectorAll(".stat-card");
    expect(cards.length).to.be.greaterThan(0);

    // Check stats values
    const projectsCard = element.shadowRoot.querySelector(
      '[data-stat="projects"]'
    );
    expect(projectsCard.textContent).to.include(mockStats.projects.toString());
  });

  it("shows recent activity feed", () => {
    const activity = element.shadowRoot.querySelector(".activity-feed");
    const items = activity.querySelectorAll(".activity-item");

    expect(activity).to.exist;
    expect(items.length).to.be.greaterThan(0);
  });

  it("displays quick actions", () => {
    const actions = element.shadowRoot.querySelector(".quick-actions");
    const buttons = actions.querySelectorAll("button");

    expect(actions).to.exist;
    expect(buttons.length).to.be.greaterThan(0);
  });

  it("handles quick action clicks", async () => {
    const newProjectButton = element.shadowRoot.querySelector(
      '[data-action="new-project"]'
    );

    setTimeout(() => newProjectButton.click());
    const { detail } = await oneEvent(element, "action-click");

    expect(detail.action).to.equal("new-project");
  });

  it("shows project progress chart", () => {
    const chart = element.shadowRoot.querySelector(".progress-chart");
    expect(chart).to.exist;
    expect(chart.data).to.exist;
  });

  it("displays task list", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const taskCards = shadowRoot.querySelectorAll(".task-card");
    expect(taskCards.length).to.equal(mockTasks.length);
  });

  it("shows task details", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const firstTask = shadowRoot.querySelector(".task-card");
    const title = firstTask.querySelector(".task-title");
    const description = firstTask.querySelector(".task-description");
    const status = firstTask.querySelector(".task-status");

    expect(title.textContent).to.include(mockTasks[0].title);
    expect(description.textContent).to.include(mockTasks[0].description);
    expect(status.textContent.toLowerCase()).to.include(mockTasks[0].status);
  });

  it("handles task status updates", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const firstTask = shadowRoot.querySelector(".task-card");
    const statusSelect = firstTask.querySelector(".status-select");

    statusSelect.value = "completed";
    statusSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const { detail } = await oneEvent(element, "task-update");
    expect(detail.taskId).to.equal(mockTasks[0].id);
    expect(detail.updates.status).to.equal("completed");
  });

  it("shows notifications panel", async () => {
    const notificationButton = element.shadowRoot.querySelector(
      ".notifications-toggle"
    );
    const panel = element.shadowRoot.querySelector(".notifications-panel");

    expect(panel.hasAttribute("hidden")).to.be.true;

    notificationButton.click();
    await element.updateComplete;

    expect(panel.hasAttribute("hidden")).to.be.false;
  });

  it("handles data refresh", async () => {
    const refreshButton = element.shadowRoot.querySelector(".refresh-button");
    let refreshCalled = false;

    element.refreshData = () => {
      refreshCalled = true;
      return Promise.resolve();
    };

    refreshButton.click();
    await element.updateComplete;

    expect(refreshCalled).to.be.true;
  });

  it("shows loading state during data fetch", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    expect(loader).to.exist;
    expect(loader.hasAttribute("hidden")).to.be.false;
  });

  it("handles error states", async () => {
    const error = "Failed to load dashboard data";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
  });

  it("supports mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = (query) => ({
      matches: query.includes("max-width"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".dashboard-container");
    expect(container.classList.contains("mobile")).to.be.true;
  });

  it("maintains accessibility attributes", () => {
    const sections = element.shadowRoot.querySelectorAll("section");
    sections.forEach((section) => {
      expect(section.getAttribute("aria-label")).to.exist;
    });

    const buttons = element.shadowRoot.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button.getAttribute("aria-label")).to.exist;
    });
  });

  it("handles keyboard navigation", async () => {
    const actionButtons = element.shadowRoot.querySelectorAll(".quick-action");
    const firstButton = actionButtons[0];

    firstButton.focus();
    firstButton.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight" })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(actionButtons[1]);
  });

  it("updates chart data periodically", async () => {
    const originalData = element.chartData;

    // Wait for update interval
    await new Promise((resolve) =>
      setTimeout(resolve, element.updateInterval + 100)
    );

    expect(element.chartData).to.not.deep.equal(originalData);
  });

  it("renders dashboard layout", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const header = shadowRoot.querySelector(".dashboard-header");
    const sidebar = shadowRoot.querySelector(".dashboard-sidebar");
    const content = shadowRoot.querySelector(".dashboard-content");

    expect(header).to.exist;
    expect(sidebar).to.exist;
    expect(content).to.exist;
  });

  it("supports task filtering", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const filterSelect = shadowRoot.querySelector(".filter-select");

    filterSelect.value = "in_progress";
    filterSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const visibleTasks = shadowRoot.querySelectorAll(".task-card:not(.hidden)");
    expect(visibleTasks.length).to.equal(1);
    expect(visibleTasks[0].textContent).to.include(mockTasks[0].title);
  });

  it("handles task sorting", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const sortSelect = shadowRoot.querySelector(".sort-select");

    sortSelect.value = "priority";
    sortSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const taskCards = shadowRoot.querySelectorAll(".task-card");
    const firstTaskPriority =
      taskCards[0].querySelector(".task-priority").textContent;
    expect(firstTaskPriority.toLowerCase()).to.include("high");
  });

  it("displays user profile", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const profile = shadowRoot.querySelector(".user-profile");
    const avatar = profile.querySelector(".user-avatar");
    const name = profile.querySelector(".user-name");

    expect(avatar).to.exist;
    expect(name).to.exist;
  });

  it("shows task statistics", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const stats = shadowRoot.querySelector(".task-stats");
    const totalTasks = stats.querySelector(".total-tasks");
    const completedTasks = stats.querySelector(".completed-tasks");

    expect(totalTasks).to.exist;
    expect(completedTasks).to.exist;
  });

  it("handles task search", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const searchInput = shadowRoot.querySelector(".search-input");

    searchInput.value = "documentation";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const visibleTasks = shadowRoot.querySelectorAll(".task-card:not(.hidden)");
    expect(visibleTasks.length).to.equal(1);
    expect(visibleTasks[0].textContent).to.include("Documentation");
  });

  it("supports task assignment", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const firstTask = shadowRoot.querySelector(".task-card");
    const assigneeSelect = firstTask.querySelector(".assignee-select");

    assigneeSelect.value = "user2";
    assigneeSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const { detail } = await oneEvent(element, "task-update");
    expect(detail.updates.assignee.id).to.equal("user2");
  });

  it("displays task due dates", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const taskCards = shadowRoot.querySelectorAll(".task-card");

    taskCards.forEach((card, index) => {
      const dueDate = card.querySelector(".due-date");
      expect(dueDate.textContent).to.include(mockTasks[index].dueDate);
    });
  });

  it("handles mobile responsive layout", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const menuToggle = shadowRoot.querySelector(".menu-toggle");
    const sidebar = shadowRoot.querySelector(".dashboard-sidebar");

    menuToggle.click();
    await element.updateComplete;

    expect(sidebar.classList.contains("visible")).to.be.true;
  });

  it("maintains accessibility attributes", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const taskList = shadowRoot.querySelector(".task-list");
    expect(taskList.getAttribute("role")).to.equal("list");

    const taskCards = shadowRoot.querySelectorAll(".task-card");
    taskCards.forEach((card) => {
      expect(card.getAttribute("role")).to.equal("listitem");
    });
  });

  it("supports keyboard navigation", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const taskCards = shadowRoot.querySelectorAll(".task-card");
    const firstCard = taskCards[0];

    firstCard.focus();
    firstCard.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await element.updateComplete;

    expect(firstCard.classList.contains("selected")).to.be.true;
  });

  it("handles task priority updates", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const firstTask = shadowRoot.querySelector(".task-card");
    const prioritySelect = firstTask.querySelector(".priority-select");

    prioritySelect.value = "low";
    prioritySelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const { detail } = await oneEvent(element, "task-update");
    expect(detail.updates.priority).to.equal("low");
  });
});
