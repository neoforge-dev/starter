import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../styles/base.js";
import "../components/ui/tabs.js";
import "../components/ui/card.js";
import "../components/ui/button.js";
import "../components/ui/input.js";
import "../components/ui/spinner.js";
import "../components/ui/dropdown.js";
import "../components/ui/badge.js";
import "../components/ui/breadcrumbs.js";
import "../components/ui/pagination.js";

export class ComponentsPage extends LitElement {
  static properties = {
    activeTab: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .components-header {
        margin-bottom: var(--space-6);
      }

      .components-title {
        font-size: var(--text-3xl);
        font-weight: var(--weight-bold);
        color: var(--text-1);
        margin-bottom: var(--space-2);
      }

      .components-description {
        color: var(--text-2);
        font-size: var(--text-lg);
        max-width: 600px;
      }

      .component-section {
        margin-bottom: var(--space-8);
      }

      .component-title {
        font-size: var(--text-xl);
        font-weight: var(--weight-bold);
        color: var(--text-1);
        margin-bottom: var(--space-4);
      }

      .component-description {
        color: var(--text-2);
        margin-bottom: var(--space-4);
      }

      .demo-card {
        padding: var(--space-6);
        margin-bottom: var(--space-4);
      }

      .demo-section {
        margin-bottom: var(--space-6);
      }

      .demo-title {
        font-size: var(--text-lg);
        font-weight: var(--weight-medium);
        color: var(--text-1);
        margin-bottom: var(--space-2);
      }

      .demo-row {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
        flex-wrap: wrap;
      }

      .code-block {
        background: var(--surface-2);
        padding: var(--space-4);
        border-radius: var(--radius-2);
        margin: var(--space-4) 0;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        overflow-x: auto;
      }

      @media (max-width: 640px) {
        .demo-row {
          flex-direction: column;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.activeTab = "overview";
  }

  _renderButtons() {
    return html`
      <div class="component-section">
        <h2 class="component-title">Buttons</h2>
        <p class="component-description">
          Buttons allow users to take actions and make choices with a single
          tap.
        </p>

        <neo-card class="demo-card">
          <div class="demo-section">
            <h3 class="demo-title">Variants</h3>
            <div class="demo-row">
              <neo-button>Default</neo-button>
              <neo-button variant="primary">Primary</neo-button>
              <neo-button variant="outline">Outline</neo-button>
              <neo-button variant="text">Text</neo-button>
            </div>
          </div>

          <div class="demo-section">
            <h3 class="demo-title">States</h3>
            <div class="demo-row">
              <neo-button disabled>Disabled</neo-button>
              <neo-button loading>Loading</neo-button>
              <neo-button icon="add">With Icon</neo-button>
            </div>
          </div>

          <div class="demo-section">
            <h3 class="demo-title">Sizes</h3>
            <div class="demo-row">
              <neo-button size="small">Small</neo-button>
              <neo-button>Medium</neo-button>
              <neo-button size="large">Large</neo-button>
            </div>
          </div>
        </neo-card>
      </div>
    `;
  }

  _renderInputs() {
    return html`
      <div class="component-section">
        <h2 class="component-title">Inputs</h2>
        <p class="component-description">
          Input components allow users to enter text and data.
        </p>

        <neo-card class="demo-card">
          <div class="demo-section">
            <h3 class="demo-title">Text Inputs</h3>
            <div class="demo-row">
              <neo-input
                label="Username"
                placeholder="Enter username"
              ></neo-input>
              <neo-input
                type="password"
                label="Password"
                placeholder="Enter password"
              ></neo-input>
            </div>
          </div>

          <div class="demo-section">
            <h3 class="demo-title">States</h3>
            <div class="demo-row">
              <neo-input
                label="Disabled"
                value="Disabled input"
                disabled
              ></neo-input>
              <neo-input
                label="Error"
                value="Invalid input"
                error="This field is required"
              ></neo-input>
            </div>
          </div>

          <div class="demo-section">
            <h3 class="demo-title">With Icons</h3>
            <div class="demo-row">
              <neo-input
                label="Search"
                placeholder="Search..."
                icon="search"
              ></neo-input>
              <neo-input
                label="Email"
                placeholder="Enter email"
                icon="email"
              ></neo-input>
            </div>
          </div>
        </neo-card>
      </div>
    `;
  }

  _renderDropdowns() {
    return html`
      <div class="component-section">
        <h2 class="component-title">Dropdowns</h2>
        <p class="component-description">
          Dropdown menus display a list of choices on temporary surfaces.
        </p>

        <neo-card class="demo-card">
          <div class="demo-section">
            <h3 class="demo-title">Basic Dropdown</h3>
            <div class="demo-row">
              <neo-dropdown
                label="Select Option"
                .items=${[
                  { value: "1", label: "Option 1" },
                  { value: "2", label: "Option 2" },
                  { value: "3", label: "Option 3" },
                ]}
              ></neo-dropdown>
            </div>
          </div>

          <div class="demo-section">
            <h3 class="demo-title">With Icons</h3>
            <div class="demo-row">
              <neo-dropdown
                label="Select User"
                .items=${[
                  { value: "1", label: "John Doe", icon: "person" },
                  { value: "2", label: "Jane Smith", icon: "person" },
                  { value: "3", label: "Bob Johnson", icon: "person" },
                ]}
              ></neo-dropdown>
            </div>
          </div>
        </neo-card>
      </div>
    `;
  }

  _renderBadges() {
    return html`
      <div class="component-section">
        <h2 class="component-title">Badges</h2>
        <p class="component-description">
          Badges are small status descriptors for UI elements.
        </p>

        <neo-card class="demo-card">
          <div class="demo-section">
            <h3 class="demo-title">Variants</h3>
            <div class="demo-row">
              <neo-badge>Default</neo-badge>
              <neo-badge variant="success">Success</neo-badge>
              <neo-badge variant="warning">Warning</neo-badge>
              <neo-badge variant="error">Error</neo-badge>
              <neo-badge variant="info">Info</neo-badge>
            </div>
          </div>

          <div class="demo-section">
            <h3 class="demo-title">With Icons</h3>
            <div class="demo-row">
              <neo-badge icon="check">Completed</neo-badge>
              <neo-badge icon="warning" variant="warning">Warning</neo-badge>
              <neo-badge icon="error" variant="error">Error</neo-badge>
            </div>
          </div>

          <div class="demo-section">
            <h3 class="demo-title">Sizes</h3>
            <div class="demo-row">
              <neo-badge size="small">Small</neo-badge>
              <neo-badge>Medium</neo-badge>
              <neo-badge size="large">Large</neo-badge>
            </div>
          </div>
        </neo-card>
      </div>
    `;
  }

  _renderSpinners() {
    return html`
      <div class="component-section">
        <h2 class="component-title">Spinners</h2>
        <p class="component-description">
          Spinners indicate the loading state of a component or page.
        </p>

        <neo-card class="demo-card">
          <div class="demo-section">
            <h3 class="demo-title">Sizes</h3>
            <div class="demo-row">
              <neo-spinner size="small"></neo-spinner>
              <neo-spinner></neo-spinner>
              <neo-spinner size="large"></neo-spinner>
            </div>
          </div>

          <div class="demo-section">
            <h3 class="demo-title">Colors</h3>
            <div class="demo-row">
              <neo-spinner></neo-spinner>
              <neo-spinner color="var(--success)"></neo-spinner>
              <neo-spinner color="var(--error)"></neo-spinner>
            </div>
          </div>
        </neo-card>
      </div>
    `;
  }

  _renderPagination() {
    return html`
      <div class="component-section">
        <h2 class="component-title">Pagination</h2>
        <p class="component-description">
          Pagination enables navigation between pages of content.
        </p>

        <neo-card class="demo-card">
          <div class="demo-section">
            <h3 class="demo-title">Basic Pagination</h3>
            <div class="demo-row">
              <neo-pagination
                .currentPage=${1}
                .totalPages=${10}
              ></neo-pagination>
            </div>
          </div>

          <div class="demo-section">
            <h3 class="demo-title">With Boundaries</h3>
            <div class="demo-row">
              <neo-pagination
                .currentPage=${5}
                .totalPages=${20}
                .boundaryCount=${2}
                .siblingCount=${1}
              ></neo-pagination>
            </div>
          </div>
        </neo-card>
      </div>
    `;
  }

  render() {
    return html`
      <div class="components-header">
        <h1 class="components-title">Components</h1>
        <p class="components-description">
          Explore our collection of reusable UI components built with Lit.
        </p>
      </div>

      <neo-tabs
        .tabs=${[
          { id: "overview", label: "Overview", icon: "dashboard" },
          { id: "buttons", label: "Buttons", icon: "smart_button" },
          { id: "inputs", label: "Inputs", icon: "input" },
          {
            id: "dropdowns",
            label: "Dropdowns",
            icon: "arrow_drop_down_circle",
          },
          { id: "badges", label: "Badges", icon: "label" },
          { id: "spinners", label: "Spinners", icon: "refresh" },
          { id: "pagination", label: "Pagination", icon: "pages" },
        ]}
        .activeTab=${this.activeTab}
        @tab-change=${(e) => (this.activeTab = e.detail.tabId)}
      >
        <div slot="overview">
          ${this._renderButtons()} ${this._renderInputs()}
          ${this._renderDropdowns()} ${this._renderBadges()}
          ${this._renderSpinners()} ${this._renderPagination()}
        </div>

        <div slot="buttons">${this._renderButtons()}</div>

        <div slot="inputs">${this._renderInputs()}</div>

        <div slot="dropdowns">${this._renderDropdowns()}</div>

        <div slot="badges">${this._renderBadges()}</div>

        <div slot="spinners">${this._renderSpinners()}</div>

        <div slot="pagination">${this._renderPagination()}</div>
      </neo-tabs>
    `;
  }
}

customElements.define("components-page", ComponentsPage);
