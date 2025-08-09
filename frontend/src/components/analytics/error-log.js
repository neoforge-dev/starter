import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

/**
 * Error Log Component
 * Displays error logs with filtering and sorting capabilities
 * @element error-log
 */
export class ErrorLog extends LitElement {
  static get properties() {
    return {
      errors: { type: Array },
      filter: { type: String },
      sortBy: { type: String },
      sortDirection: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .error-log {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .controls {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: var(--surface-color, #fff);
        border-bottom: 1px solid var(--border-color, #eee);
      }

      .error-list {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
      }

      .error-item {
        padding: 1rem;
        margin-bottom: 1rem;
        background: var(--surface-color, #fff);
        border: 1px solid var(--border-color, #eee);
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .error-item:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .error-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .error-type {
        font-weight: bold;
        color: var(--error-color, #dc3545);
      }

      .error-timestamp {
        color: var(--text-secondary-color, #666);
        font-size: 0.875rem;
      }

      .error-message {
        margin: 0.5rem 0;
        font-family: monospace;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .error-stack {
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: var(--code-background, #f8f9fa);
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.875rem;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .no-errors {
        text-align: center;
        color: var(--text-secondary-color, #666);
        padding: 2rem;
      }

      select,
      input {
        padding: 0.5rem;
        border: 1px solid var(--border-color, #eee);
        border-radius: 4px;
        background: var(--input-background, #fff);
      }

      select:focus,
      input:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
      }
    `;
  }

  constructor() {
    super();
    this.errors = [];
    this.filter = "";
    this.sortBy = "timestamp";
    this.sortDirection = "desc";
  }

  handleFilterChange(e) {
    this.filter = e.target.value;
  }

  handleSortChange(e) {
    this.sortBy = e.target.value;
  }

  handleSortDirectionChange(e) {
    this.sortDirection = e.target.value;
  }

  getFilteredAndSortedErrors() {
    let filtered = this.errors;

    if (this.filter) {
      const lowercaseFilter = this.filter.toLowerCase();
      filtered = filtered.filter(
        (error) =>
          error.message.toLowerCase().includes(lowercaseFilter) ||
          error.type.toLowerCase().includes(lowercaseFilter)
      );
    }

    return filtered.sort((a, b) => {
      const aValue = a[this.sortBy];
      const bValue = b[this.sortBy];
      const direction = this.sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "string") {
        return direction * aValue.localeCompare(bValue);
      }
      return direction * (aValue - bValue);
    });
  }

  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  render() {
    const filteredErrors = this.getFilteredAndSortedErrors();

    return html`
      <div class="error-log">
        <div class="controls">
          <input
            type="text"
            placeholder="Filter errors..."
            .value=${this.filter}
            @input=${this.handleFilterChange}
          />
          <select .value=${this.sortBy} @change=${this.handleSortChange}>
            <option value="timestamp">Time</option>
            <option value="type">Type</option>
          </select>
          <select
            .value=${this.sortDirection}
            @change=${this.handleSortDirectionChange}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>

        <div class="error-list">
          ${filteredErrors.length === 0
            ? html`<div class="no-errors">No errors found</div>`
            : filteredErrors.map(
                (error) => html`
                  <div class="error-item">
                    <div class="error-header">
                      <span class="error-type">${error.type}</span>
                      <span class="error-timestamp"
                        >${this.formatTimestamp(error.timestamp)}</span
                      >
                    </div>
                    <div class="error-message">${error.message}</div>
                    ${error.stack
                      ? html` <div class="error-stack">${error.stack}</div> `
                      : ""}
                  </div>
                `
              )}
        </div>
      </div>
    `;
  }
}

customElements.define("error-log", ErrorLog);
