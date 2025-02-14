import { LitElement, html, css } from "lit";
import { baseStyles } from "../styles/base.js";

/**
 * Component to display memory leak reports and alerts
 * @customElement memory-monitor
 */
export class MemoryMonitor extends LitElement {
  static properties = {
    leaks: { type: Array, state: true },
    expanded: { type: Boolean, state: true },
    maxLeaks: { type: Number },
    autoHide: { type: Boolean },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        position: fixed;
        bottom: var(--spacing-md);
        right: var(--spacing-md);
        z-index: 1000;
        width: 400px;
        max-width: calc(100vw - var(--spacing-md) * 2);
      }

      .monitor-container {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        transform: translateY(0);
        transition: transform 0.3s ease-in-out;
      }

      :host([hidden]) .monitor-container {
        transform: translateY(calc(100% + var(--spacing-md)));
      }

      .monitor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-md);
        background: var(--color-surface-hover);
        cursor: pointer;
      }

      .monitor-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-weight: 500;
      }

      .monitor-badge {
        background: var(--color-error);
        color: white;
        padding: 0.2em 0.6em;
        border-radius: var(--radius-full);
        font-size: 0.8em;
      }

      .monitor-content {
        max-height: 400px;
        overflow-y: auto;
        padding: var(--spacing-md);
      }

      .leak-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .leak-item {
        padding: var(--spacing-md);
        background: var(--color-surface-hover);
        border-radius: var(--radius-md);
        border-left: 4px solid var(--leak-color);
      }

      .leak-item[data-type="critical"] {
        --leak-color: var(--color-error);
      }

      .leak-item[data-type="warning"] {
        --leak-color: var(--color-warning);
      }

      .leak-item[data-type="detached_component"],
      .leak-item[data-type="detached_node"],
      .leak-item[data-type="event_listener_leak"] {
        --leak-color: var(--color-info);
      }

      .leak-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: var(--spacing-sm);
      }

      .leak-type {
        font-weight: 500;
        color: var(--leak-color);
      }

      .leak-time {
        font-size: 0.8em;
        color: var(--color-text-secondary);
      }

      .leak-message {
        margin-bottom: var(--spacing-sm);
        line-height: 1.4;
      }

      .leak-details {
        font-size: 0.9em;
        color: var(--color-text-secondary);
      }

      .monitor-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        border-top: 1px solid var(--color-border);
      }

      button {
        padding: var(--spacing-sm) var(--spacing-md);
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 0.9em;
        transition: background 0.2s ease;
      }

      .clear-button {
        background: var(--color-surface-hover);
        color: var(--color-text);
      }

      .clear-button:hover {
        background: var(--color-surface-hover-dark);
      }

      .dismiss-button {
        background: var(--color-primary);
        color: white;
      }

      .dismiss-button:hover {
        background: var(--color-primary-dark);
      }

      /* Animations */
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .leak-item {
        animation: slideIn 0.3s ease-out;
      }
    `,
  ];

  constructor() {
    super();
    this.leaks = [];
    this.expanded = false;
    this.maxLeaks = 50;
    this.autoHide = true;
    this._setupEventListeners();
  }

  _setupEventListeners() {
    window.addEventListener("memory-leak-detected", (event) => {
      this._addLeak(event.detail);
    });
  }

  _addLeak(leak) {
    this.leaks = [leak, ...this.leaks].slice(0, this.maxLeaks);
    this.expanded = true;

    // Auto-hide after 10 seconds if enabled
    if (this.autoHide) {
      setTimeout(() => {
        this.expanded = false;
      }, 10000);
    }
  }

  _formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }

  _formatLeakType(type) {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  _clearLeaks() {
    this.leaks = [];
  }

  _toggleExpanded() {
    this.expanded = !this.expanded;
  }

  render() {
    return html`
      <div class="monitor-container">
        <div class="monitor-header" @click=${this._toggleExpanded}>
          <div class="monitor-title">
            <span>Memory Monitor</span>
            ${this.leaks.length > 0
              ? html` <span class="monitor-badge">${this.leaks.length}</span> `
              : null}
          </div>
          <span>${this.expanded ? "▼" : "▲"}</span>
        </div>

        ${this.expanded
          ? html`
              <div class="monitor-content">
                ${this.leaks.length > 0
                  ? html`
                      <div class="leak-list">
                        ${this.leaks.map(
                          (leak) => html`
                            <div class="leak-item" data-type=${leak.type}>
                              <div class="leak-header">
                                <span class="leak-type">
                                  ${this._formatLeakType(leak.type)}
                                </span>
                                <span class="leak-time">
                                  ${this._formatTime(leak.timestamp)}
                                </span>
                              </div>
                              <div class="leak-message">${leak.message}</div>
                              ${leak.component || leak.eventType
                                ? html`
                                    <div class="leak-details">
                                      ${leak.component
                                        ? `Component: ${leak.component}`
                                        : ""}
                                      ${leak.eventType
                                        ? `Event: ${leak.eventType}`
                                        : ""}
                                    </div>
                                  `
                                : null}
                            </div>
                          `
                        )}
                      </div>
                    `
                  : html`
                      <div class="empty-state">No memory leaks detected</div>
                    `}
              </div>
              <div class="monitor-actions">
                <button
                  class="clear-button"
                  @click=${this._clearLeaks}
                  ?disabled=${this.leaks.length === 0}
                >
                  Clear
                </button>
                <button class="dismiss-button" @click=${this._toggleExpanded}>
                  Dismiss
                </button>
              </div>
            `
          : null}
      </div>
    `;
  }
}

customElements.define("memory-monitor", MemoryMonitor);
