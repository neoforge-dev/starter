import { LitElement, html, css } from "lit";
import { BaseComponent } from "../components/base-component.js";

/**
 * Dashboard page component
 * @element dashboard-page
 * @description Main dashboard layout with header and content area
 */
export class DashboardPage extends BaseComponent {
  static properties = {
    stats: { type: Object },
    loading: { type: Boolean },
    error: { type: String },
    activities: { type: Array },
    chartData: { type: Array },
    tasks: { type: Array },
    notifications: { type: Array },
    showNotifications: { type: Boolean },
    isMobile: { type: Boolean },
    filterValue: { type: String },
    sortValue: { type: String },
    searchQuery: { type: String },
    users: { type: Array },
    sidebarVisible: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }

    .dashboard-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 1rem;
      gap: 1rem;
    }

    .dashboard-container.mobile {
      padding: 0.5rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-color);
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-color);
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      background: var(--background-color);
      border-radius: 0.5rem;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-color);
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .task-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: var(--background-color);
      border-radius: 0.5rem;
    }

    .update-button {
      padding: 0.5rem 1rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--surface-color);
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .error-message {
      padding: 1rem;
      background: var(--error-color);
      color: white;
      border-radius: 0.5rem;
      margin: 1rem 0;
    }
  `;

  constructor() {
    super();
    this.stats = {
      projects: 0,
      tasks: 0,
      completedTasks: 0,
      activeUsers: 0,
    };
    this.loading = false;
    this.error = null;
    this.activities = [];
    this.chartData = [];
    this.tasks = [];
    this.users = [];
    this.updateInterval = 30000; // 30 seconds
    this.notifications = [];
    this.showNotifications = false;
    this.isMobile = false;
    this.sidebarVisible = false;
    this.filterValue = "all";
    this.sortValue = "date";
    this.searchQuery = "";
    this.checkMobileView = this.checkMobileView.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.navigateButtons = this.navigateButtons.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleSortChange = this.handleSortChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleAssigneeChange = this.handleAssigneeChange.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.handleTaskKeyDown = this.handleTaskKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    // Set up periodic chart data updates
    this.updateTimer = setInterval(() => {
      this.updateChartData();
    }, this.updateInterval);

    // Fetch tasks
    this.fetchTasks();

    // Check mobile view
    this.checkMobileView();

    // Add resize listener
    window.addEventListener("resize", this.checkMobileView);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up timer
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    // Remove resize listener
    window.removeEventListener("resize", this.checkMobileView);
  }

  checkMobileView() {
    // Check if viewport is mobile size
    if (window.matchMedia) {
      const mobileQuery = window.matchMedia("(max-width: 768px)");
      this.isMobile = mobileQuery.matches;
    }
  }

  async fetchTasks() {
    try {
      if (window.api && window.api.getTasks) {
        const response = await window.api.getTasks();
        if (response && response.tasks) {
          this.tasks = response.tasks;
        }
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  async refreshData() {
    console.log("Refreshing dashboard data");
    this.loading = true;

    try {
      // Refresh tasks
      await this.fetchTasks();

      // Refresh stats if API available
      if (window.api && window.api.getStats) {
        const response = await window.api.getStats();
        if (response && response.stats) {
          this.stats = response.stats;
        }
      }

      // Update chart data
      this.updateChartData();

      this.error = null;
    } catch (error) {
      console.error("Error refreshing data:", error);
      this.error = "Failed to refresh dashboard data";
    } finally {
      this.loading = false;
    }
  }

  updateChartData() {
    // Simulate data update
    this.chartData = this.chartData.map((item) => ({
      ...item,
      value: Math.min(100, item.value + Math.floor(Math.random() * 10)),
    }));
  }

  handleActionClick(action) {
    this.dispatchEvent(
      new CustomEvent("action-click", {
        detail: { action },
        bubbles: true,
        composed: true,
      })
    );
  }

  handleTaskUpdate(taskId, updates) {
    console.log(`Updating task ${taskId} with`, updates);

    // Update the local task data first
    this.tasks = this.tasks.map((task) =>
      task.id === taskId ? { ...task, ...updates } : task
    );

    // Use setTimeout to ensure the event is dispatched after the current execution context
    setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent("task-update", {
          detail: { taskId, updates },
          bubbles: true,
          composed: true,
        })
      );
    }, 0);

    // Request an update
    this.requestUpdate();
  }

  formatStatus(status) {
    // Display the formatted status but keep the original value in the data attribute
    return status.replace("_", " ");
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  handleKeyDown(event) {
    // Handle keyboard navigation
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      this.navigateButtons(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      this.navigateButtons(-1);
    }
  }

  navigateButtons(direction) {
    const buttons = this.shadowRoot.querySelectorAll(".quick-action");
    const currentIndex = Array.from(buttons).indexOf(document.activeElement);
    const nextIndex =
      (currentIndex + direction + buttons.length) % buttons.length;
    buttons[nextIndex].focus();
  }

  handleFilterChange(e) {
    this.filterValue = e.target.value;
    this.requestUpdate();
  }

  handleSortChange(e) {
    this.sortValue = e.target.value;
    this.requestUpdate();
  }

  handleSearch(e) {
    this.searchQuery = e.target.value.toLowerCase();
    this.requestUpdate();
  }

  handleAssigneeChange(taskId, e) {
    const userId = e.target.value;
    const user = this.users.find((u) => u.id === userId);

    if (user) {
      this.handleTaskUpdate(taskId, {
        assignee: user,
      });
    }
  }

  getFilteredTasks() {
    let filteredTasks = [...this.tasks];

    // Apply search
    if (this.searchQuery) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(this.searchQuery) ||
          task.description.toLowerCase().includes(this.searchQuery)
      );
    }

    // Apply filtering
    if (this.filterValue !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.status === this.filterValue
      );
    }

    // Apply sorting
    if (this.sortValue === "priority") {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      filteredTasks.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    } else if (this.sortValue === "date") {
      // Sort by due date (assuming dueDate is in a format that can be compared)
      filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    return filteredTasks;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    this.requestUpdate();
  }

  handleTaskKeyDown(event) {
    if (event.key === "Enter") {
      // Remove selected class from all task cards
      const taskCards = this.shadowRoot.querySelectorAll(".task-card");
      taskCards.forEach((card) => card.classList.remove("selected"));

      // Add selected class to the current task card
      event.currentTarget.classList.add("selected");
    }
  }

  render() {
    return html`
      <div class="dashboard-container ${this.isMobile ? "mobile" : ""}">
        ${this.loading
          ? html` <div class="loading-indicator">Loading...</div> `
          : null}
        ${this.error
          ? html` <div class="error-message">${this.error}</div> `
          : null}
        ${window.auth?.currentUser
          ? html`
              <div class="user-info">
                Welcome, ${window.auth.currentUser.name}!
              </div>
            `
          : null}

        <div class="stats-container">
          <div class="stat-item">
            <span>Projects</span>
            <span>${this.stats.projects}</span>
          </div>
          <div class="stat-item">
            <span>Tasks</span>
            <span>${this.stats.tasks}</span>
          </div>
          <div class="stat-item">
            <span>Completed</span>
            <span>${this.stats.completedTasks}</span>
          </div>
          <div class="stat-item">
            <span>Active Users</span>
            <span>${this.stats.activeUsers}</span>
          </div>
        </div>

        <div class="task-list">
          ${this.tasks.map(
            (task) => html`
              <div class="task-item">
                <div>
                  <h3>${task.title}</h3>
                  <p>${task.description}</p>
                  <span>Status: ${this.formatStatus(task.status)}</span>
                </div>
                <button
                  class="update-button"
                  @click=${() =>
                    this.handleTaskUpdate(task.id, { status: "completed" })}
                >
                  Update
                </button>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}
