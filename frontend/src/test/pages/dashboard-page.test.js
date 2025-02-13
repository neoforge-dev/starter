import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
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

  beforeEach(async () => {
    // Mock auth state
    window.auth = {
      currentUser: mockUser,
      isAuthenticated: true,
    };

    element = await fixture(html`<dashboard-page></dashboard-page>`);
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

  it("displays task list", () => {
    const tasks = element.shadowRoot.querySelector(".task-list");
    const items = tasks.querySelectorAll(".task-item");

    expect(tasks).to.exist;
    expect(items.length).to.be.greaterThan(0);
  });

  it("handles task status updates", async () => {
    const taskCheckbox = element.shadowRoot.querySelector(".task-checkbox");

    setTimeout(() => taskCheckbox.click());
    const { detail } = await oneEvent(element, "task-update");

    expect(detail.taskId).to.exist;
    expect(detail.completed).to.be.true;
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
});
