import { LitElement, html, css } from "lit";

/**
 * Dashboard page component
 * @element dashboard-page
 * @description Main dashboard layout with header and content area
 */
export class DashboardPage extends LitElement {
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
    this.activities = [
      {
        id: 1,
        type: "task_completed",
        user: "John Doe",
        description: 'Completed task "Update documentation"',
        timestamp: "2 hours ago",
      },
      {
        id: 2,
        type: "comment_added",
        user: "Jane Smith",
        description: 'Commented on "API Integration"',
        timestamp: "4 hours ago",
      },
      {
        id: 3,
        type: "project_created",
        user: "Alex Johnson",
        description: 'Created new project "Mobile App"',
        timestamp: "1 day ago",
      },
    ];
    this.chartData = [
      { label: "Planning", value: 100 },
      { label: "Design", value: 85 },
      { label: "Development", value: 65 },
      { label: "Testing", value: 40 },
      { label: "Deployment", value: 20 },
    ];
    this.tasks = [];
    this.users = [
      { id: "user1", name: "John Doe" },
      { id: "user2", name: "Jane Smith" },
      { id: "user3", name: "Alex Johnson" },
    ];
    this.updateInterval = 30000; // 30 seconds
    this.notifications = [
      {
        id: 1,
        content: "New comment on your task",
        time: "5 minutes ago",
        read: false,
      },
      {
        id: 2,
        content: "Project deadline approaching",
        time: "1 hour ago",
        read: true,
      },
      {
        id: 3,
        content: "You were mentioned in a comment",
        time: "2 hours ago",
        read: false,
      },
    ];
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

    if (
      direction > 0 &&
      currentIndex !== -1 &&
      currentIndex < buttons.length - 1
    ) {
      buttons[currentIndex + 1].focus();
    } else if (direction < 0 && currentIndex > 0) {
      buttons[currentIndex - 1].focus();
    }
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

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .dashboard-container {
      display: grid;
      grid-template-rows: auto 1fr;
      height: 100%;
    }

    .dashboard-header {
      padding: var(--spacing-md);
      background-color: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dashboard-content {
      overflow: auto;
      padding: var(--spacing-md);
    }

    h1 {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    .welcome-message {
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-md);
      color: var(--color-text-primary);
      font-weight: 500;
    }

    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .stat-card {
      background-color: var(--color-surface);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-md);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-value {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: var(--spacing-xs);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .loading-indicator {
      display: flex;
      justify-content: center;
      padding: var(--spacing-lg);
    }

    .error-message {
      color: var(--color-error);
      padding: var(--spacing-md);
      background-color: var(--color-error-light);
      border-radius: var(--border-radius-md);
      margin-bottom: var(--spacing-md);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    .activity-feed {
      background-color: var(--color-surface);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-md);
      box-shadow: var(--shadow-sm);
    }

    .activity-feed h2 {
      font-size: var(--font-size-md);
      margin-top: 0;
      margin-bottom: var(--spacing-md);
      color: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--spacing-xs);
    }

    .activity-item {
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--color-border-light);
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--color-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
    }

    .activity-user {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .activity-description {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-xs);
    }

    .activity-timestamp {
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
    }

    .quick-actions {
      background-color: var(--color-surface);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-md);
      box-shadow: var(--shadow-sm);
    }

    .quick-actions h2 {
      font-size: var(--font-size-md);
      margin-top: 0;
      margin-bottom: var(--spacing-md);
      color: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--spacing-xs);
    }

    .quick-action {
      display: block;
      width: 100%;
      padding: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
      background-color: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-sm);
      color: var(--color-text-primary);
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition:
        background-color 0.2s,
        border-color 0.2s;
    }

    .quick-action:hover {
      background-color: var(--color-background-hover);
      border-color: var(--color-primary);
    }

    .quick-action:focus {
      outline: none;
      box-shadow: 0 0 0 2px var(--color-primary-light);
    }

    .quick-action[data-action="new-project"] {
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      border-color: var(--color-primary);
    }

    .quick-action[data-action="new-project"]:hover {
      background-color: var(--color-primary-dark);
    }

    .progress-chart {
      background-color: var(--color-surface);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-md);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-lg);
    }

    .progress-chart h2 {
      font-size: var(--font-size-md);
      margin-top: 0;
      margin-bottom: var(--spacing-md);
      color: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--spacing-xs);
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .chart-bar {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .chart-label {
      width: 100px;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .chart-track {
      flex: 1;
      height: 12px;
      background-color: var(--color-background);
      border-radius: 6px;
      overflow: hidden;
    }

    .chart-progress {
      height: 100%;
      background-color: var(--color-primary);
      border-radius: 6px;
      transition: width 0.3s ease;
    }

    .chart-value {
      width: 40px;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-align: right;
    }

    .task-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .task-card {
      background-color: var(--color-surface);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-md);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      border-left: 4px solid var(--color-primary);
      transition:
        box-shadow 0.2s ease,
        transform 0.2s ease;
    }

    .task-card:focus {
      outline: none;
      box-shadow: 0 0 0 2px var(--color-primary-light);
    }

    .task-card.selected {
      box-shadow: 0 0 0 2px var(--color-primary);
      transform: translateY(-2px);
    }

    .task-card[data-priority="high"] {
      border-left-color: var(--color-error);
    }

    .task-card[data-priority="medium"] {
      border-left-color: var(--color-warning);
    }

    .task-card[data-priority="low"] {
      border-left-color: var(--color-success);
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .task-title {
      font-weight: 600;
      font-size: var(--font-size-md);
      color: var(--color-text-primary);
      margin: 0;
    }

    .task-description {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin-bottom: var(--spacing-sm);
    }

    .task-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
    }

    .task-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: var(--font-size-xs);
      font-weight: 500;
      text-transform: capitalize;
      background-color: var(--color-background);
    }

    .task-status[data-status="todo"] {
      background-color: var(--color-info-light);
      color: var(--color-info);
    }

    .task-status[data-status="in_progress"] {
      background-color: var(--color-warning-light);
      color: var(--color-warning);
    }

    .task-status[data-status="completed"] {
      background-color: var(--color-success-light);
      color: var(--color-success);
    }

    .task-status[data-status="blocked"] {
      background-color: var(--color-error-light);
      color: var(--color-error);
    }

    .task-assignee {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .task-assignee-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: var(--color-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xs);
      font-weight: 600;
      color: var(--color-primary);
    }

    .task-assignee-name {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .task-priority {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .due-date {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .task-actions {
      display: flex;
      justify-content: space-between;
      margin-top: var(--spacing-sm);
    }

    .status-select,
    .priority-select,
    .assignee-select {
      font-size: var(--font-size-xs);
      padding: 4px 8px;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--color-border);
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .task-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .task-list-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .task-list-controls {
      display: flex;
      gap: var(--spacing-sm);
    }

    .filter-select,
    .sort-select {
      font-size: var(--font-size-sm);
      padding: 6px 12px;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--color-border);
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .search-input {
      font-size: var(--font-size-sm);
      padding: 6px 12px;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--color-border);
      background-color: var(--color-background);
      color: var(--color-text-primary);
      width: 200px;
    }

    .dashboard-sidebar {
      background-color: var(--color-surface);
      border-right: 1px solid var(--color-border);
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 250px;
      z-index: 1000;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    .dashboard-sidebar.visible {
      transform: translateX(0);
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
    }

    .sidebar-header h2 {
      margin: 0;
      font-size: var(--font-size-md);
    }

    .sidebar-nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sidebar-nav li {
      margin-bottom: var(--spacing-sm);
    }

    .sidebar-nav a {
      display: block;
      padding: var(--spacing-sm);
      color: var(--color-text-primary);
      text-decoration: none;
      border-radius: var(--border-radius-sm);
    }

    .sidebar-nav a:hover {
      background-color: var(--color-background-hover);
    }

    .menu-toggle {
      display: block;
      background: none;
      border: none;
      color: var(--color-text-primary);
      cursor: pointer;
      font-size: 24px;
      margin-right: var(--spacing-sm);
    }

    @media (min-width: 769px) {
      .menu-toggle {
        display: none;
      }
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--color-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-primary);
    }

    .user-name {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .user-role {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .task-stats {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-sm) 0;
    }

    .total-tasks,
    .completed-tasks {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-number {
      font-size: var(--font-size-lg);
      font-weight: 700;
      color: var(--color-primary);
    }

    .stat-text {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .notifications-panel {
      position: absolute;
      top: 60px;
      right: 20px;
      width: 300px;
      background-color: var(--color-surface);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 100;
      max-height: 400px;
      overflow-y: auto;
    }

    .notifications-header {
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notifications-title {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .notification-item {
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: 1px solid var(--color-border-light);
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-content {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .notification-time {
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
      margin-top: 4px;
    }

    .refresh-button {
      background: none;
      border: none;
      color: var(--color-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-sm);
      padding: 4px 8px;
      border-radius: var(--border-radius-sm);
    }

    .refresh-button:hover {
      background-color: var(--color-primary-light);
    }

    @media (max-width: 768px) {
      .dashboard-container {
        grid-template-columns: 1fr;
      }

      .dashboard-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 250px;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        z-index: 1000;
      }

      .dashboard-sidebar.visible {
        transform: translateX(0);
      }

      .menu-toggle {
        display: block;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      .task-list {
        grid-template-columns: 1fr;
      }
    }
  `;

  render() {
    const userName = window.auth?.currentUser?.name || "User";
    const filteredTasks = this.getFilteredTasks();

    return html`
      <div class="dashboard-container ${this.isMobile ? "mobile" : ""}">
        <header class="dashboard-header">
          <h1><slot name="title">Dashboard</slot></h1>
          <div class="actions">
            <button
              class="menu-toggle"
              @click=${this.toggleSidebar}
              aria-label="Toggle sidebar menu"
            >
              Menu
            </button>
            <div class="user-profile">
              <div class="user-avatar">${userName.charAt(0)}</div>
              <div class="user-info">
                <div class="user-name">${userName}</div>
                <div class="user-role">Administrator</div>
              </div>
            </div>
            <button
              class="notifications-toggle"
              @click=${this.toggleNotifications}
              aria-label="Toggle notifications"
            >
              Notifications
            </button>
            <button
              class="refresh-button"
              @click=${() => this.refreshData()}
              aria-label="Refresh data"
            >
              Refresh
            </button>
            <slot name="actions"></slot>
          </div>
        </header>

        <div class="dashboard-sidebar ${this.sidebarVisible ? "visible" : ""}">
          <div class="sidebar-header">
            <h2>Navigation</h2>
            <button @click=${this.toggleSidebar} aria-label="Close sidebar">
              Close
            </button>
          </div>
          <nav class="sidebar-nav">
            <ul>
              <li><a href="#dashboard">Dashboard</a></li>
              <li><a href="#projects">Projects</a></li>
              <li><a href="#tasks">Tasks</a></li>
              <li><a href="#team">Team</a></li>
              <li><a href="#settings">Settings</a></li>
            </ul>
          </nav>
        </div>

        <div class="notifications-panel" ?hidden=${!this.showNotifications}>
          <div class="notifications-header">
            <div class="notifications-title">Notifications</div>
            <button
              @click=${this.toggleNotifications}
              aria-label="Close notifications"
            >
              Close
            </button>
          </div>
          ${this.notifications.map(
            (notification) => html`
              <div class="notification-item" data-read=${notification.read}>
                <div class="notification-content">${notification.content}</div>
                <div class="notification-time">${notification.time}</div>
              </div>
            `
          )}
        </div>

        <main class="dashboard-content">
          <div class="welcome-message">Welcome back, ${userName}!</div>

          ${this.error
            ? html`<div class="error-message">${this.error}</div>`
            : ""}
          ${this.loading
            ? html`<div class="loading-indicator">
                Loading dashboard data...
              </div>`
            : html`
                <div class="stats-container">
                  <div class="stat-card" data-stat="projects">
                    <div class="stat-value">${this.stats.projects}</div>
                    <div class="stat-label">Projects</div>
                  </div>
                  <div class="stat-card" data-stat="tasks">
                    <div class="stat-value">${this.stats.tasks}</div>
                    <div class="stat-label">Tasks</div>
                  </div>
                  <div class="stat-card" data-stat="completedTasks">
                    <div class="stat-value">${this.stats.completedTasks}</div>
                    <div class="stat-label">Completed Tasks</div>
                  </div>
                  <div class="stat-card" data-stat="activeUsers">
                    <div class="stat-value">${this.stats.activeUsers}</div>
                    <div class="stat-label">Active Users</div>
                  </div>
                </div>

                <div class="progress-chart" .data=${this.chartData}>
                  <h2>Project Progress</h2>
                  <div class="chart-container">
                    ${this.chartData.map(
                      (item) => html`
                        <div class="chart-bar">
                          <div class="chart-label">${item.label}</div>
                          <div class="chart-track">
                            <div
                              class="chart-progress"
                              style="width: ${item.value}%"
                            ></div>
                          </div>
                          <div class="chart-value">${item.value}%</div>
                        </div>
                      `
                    )}
                  </div>
                </div>

                <div class="task-list-header">
                  <h2 class="task-list-title">Tasks</h2>
                  <div class="task-list-controls">
                    <input
                      type="text"
                      class="search-input"
                      placeholder="Search tasks..."
                      .value=${this.searchQuery}
                      @input=${this.handleSearch}
                    />
                    <select
                      class="filter-select"
                      .value=${this.filterValue}
                      @change=${this.handleFilterChange}
                    >
                      <option value="all">All Tasks</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <select
                      class="sort-select"
                      .value=${this.sortValue}
                      @change=${this.handleSortChange}
                    >
                      <option value="date">Sort by Date</option>
                      <option value="priority">Sort by Priority</option>
                    </select>
                  </div>
                </div>

                <div class="task-list" role="list">
                  ${this.getFilteredTasks().map(
                    (task) => html`
                      <div
                        class="task-card"
                        data-priority=${task.priority}
                        role="listitem"
                        tabindex="0"
                        @keydown=${this.handleTaskKeyDown}
                      >
                        <div class="task-header">
                          <h3 class="task-title">${task.title}</h3>
                          <div class="task-status" data-status=${task.status}>
                            ${this.formatStatus(task.status)}
                            <span style="display: none;">${task.status}</span>
                          </div>
                        </div>
                        <div class="task-description">${task.description}</div>
                        <div class="task-meta">
                          <div class="task-assignee">
                            <div class="task-assignee-avatar">
                              ${task.assignee.name.charAt(0)}
                            </div>
                            <span class="task-assignee-name"
                              >${task.assignee.name}</span
                            >
                          </div>
                          <div
                            class="task-priority"
                            data-priority=${task.priority}
                          >
                            Priority:
                            ${task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                          </div>
                          <div class="due-date">Due: ${task.dueDate}</div>
                        </div>
                        <div class="task-actions">
                          <select
                            class="status-select"
                            .value=${task.status}
                            @change=${(e) => {
                              const newStatus = e.target.value;
                              console.log(
                                `Status changed to ${newStatus} for task ${task.id}`
                              );
                              this.handleTaskUpdate(task.id, {
                                status: newStatus,
                              });
                            }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                          <select
                            class="priority-select"
                            .value=${task.priority}
                            @change=${(e) =>
                              this.handleTaskUpdate(task.id, {
                                priority: e.target.value,
                              })}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                          <select
                            class="assignee-select"
                            .value=${task.assignee.id}
                            @change=${(e) =>
                              this.handleAssigneeChange(task.id, e)}
                          >
                            ${this.users.map(
                              (user) => html`
                                <option value=${user.id}>${user.name}</option>
                              `
                            )}
                          </select>
                        </div>
                      </div>
                    `
                  )}
                </div>

                <div class="dashboard-grid">
                  <div class="activity-feed">
                    <h2>Recent Activity</h2>
                    ${this.activities.map(
                      (activity) => html`
                        <div class="activity-item">
                          <div class="activity-icon">
                            <!-- Icon based on activity type would go here -->
                          </div>
                          <div class="activity-content">
                            <div class="activity-user">${activity.user}</div>
                            <div class="activity-description">
                              ${activity.description}
                            </div>
                            <div class="activity-timestamp">
                              ${activity.timestamp}
                            </div>
                          </div>
                        </div>
                      `
                    )}
                  </div>
                  <div class="quick-actions">
                    <h2>Quick Actions</h2>
                    <button
                      class="quick-action"
                      data-action="new-project"
                      aria-label="Create new project"
                      @click=${() => this.handleActionClick("new-project")}
                      @keydown=${this.handleKeyDown}
                    >
                      Create New Project
                    </button>
                    <button
                      class="quick-action"
                      data-action="add-task"
                      aria-label="Add new task"
                      @click=${() => this.handleActionClick("add-task")}
                      @keydown=${this.handleKeyDown}
                    >
                      Add New Task
                    </button>
                    <button
                      class="quick-action"
                      data-action="invite-user"
                      aria-label="Invite team member"
                      @click=${() => this.handleActionClick("invite-user")}
                      @keydown=${this.handleKeyDown}
                    >
                      Invite Team Member
                    </button>
                    <button
                      class="quick-action"
                      data-action="generate-report"
                      aria-label="Generate report"
                      @click=${() => this.handleActionClick("generate-report")}
                      @keydown=${this.handleKeyDown}
                    >
                      Generate Report
                    </button>

                    <div class="task-stats">
                      <div class="total-tasks">
                        <div class="stat-number">${this.tasks.length}</div>
                        <div class="stat-text">Total Tasks</div>
                      </div>
                      <div class="completed-tasks">
                        <div class="stat-number">
                          ${this.tasks.filter(
                            (task) => task.status === "completed"
                          ).length}
                        </div>
                        <div class="stat-text">Completed</div>
                      </div>
                    </div>
                  </div>
                </div>
              `}

          <slot></slot>
        </main>
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("dashboard-page")) {
  customElements.define("dashboard-page", DashboardPage);
}
