import { LitElement, html, css } from "lit";

/**
 * Dashboard page component
 * @element dashboard-page
 * @description Main dashboard layout with header and content area
 */
export class DashboardPage extends LitElement {
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
  `;

  render() {
    return html`
      <div class="dashboard-container">
        <header class="dashboard-header">
          <h1><slot name="title">Dashboard</slot></h1>
          <div class="actions">
            <slot name="actions"></slot>
          </div>
        </header>
        <main class="dashboard-content">
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
