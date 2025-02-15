import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Component to display memory leak reports and alerts
 * @customElement memory-monitor
 */
export class MemoryMonitor extends LitElement {
  static properties = {
    leaks: { type: Array },
    expanded: { type: Boolean },
    maxLeaks: { type: Number },
    autoHide: { type: Boolean },
    autoHideTimeout: { type: Number },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        position: fixed;
        bottom: var(--spacing-md, 1rem);
        right: var(--spacing-md, 1rem);
        z-index: 1000;
        width: 400px;
        max-width: calc(100vw - var(--spacing-md, 1rem) * 2);
      }

      .monitor-container {
        background: var(--color-surface, #ffffff);
        border-radius: var(--radius-lg, 0.5rem);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        transform: translateY(0);
        transition: transform 0.3s ease-in-out;
      }

      :host([hidden]) .monitor-container {
        transform: translateY(calc(100% + var(--spacing-md, 1rem)));
      }

      .monitor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-md, 1rem);
        background: var(--color-surface-hover, #f5f5f5);
        cursor: pointer;
      }

      .monitor-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 0.5rem);
        font-weight: 500;
      }

      .monitor-badge {
        background: var(--color-error, #dc2626);
        color: white;
        padding: 0.2em 0.6em;
        border-radius: var(--radius-full, 9999px);
        font-size: 0.8em;
      }

      .monitor-content {
        max-height: 400px;
        overflow-y: auto;
        padding: var(--spacing-md, 1rem);
      }

      .leak-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md, 1rem);
      }

      .leak-item {
        padding: var(--spacing-md, 1rem);
        background: var(--color-surface-hover, #f5f5f5);
        border-radius: var(--radius-md, 0.375rem);
        border-left: 4px solid var(--leak-color, #6b7280);
      }

      .leak-item[data-type="critical"] {
        --leak-color: var(--color-error, #dc2626);
      }

      .leak-item[data-type="warning"] {
        --leak-color: var(--color-warning, #f59e0b);
      }

      .leak-item[data-type="detached_component"],
      .leak-item[data-type="detached_node"],
      .leak-item[data-type="event_listener_leak"] {
        --leak-color: var(--color-info, #3b82f6);
      }

      .leak-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: var(--spacing-sm, 0.5rem);
      }

      .leak-type {
        font-weight: 500;
        color: var(--leak-color, #6b7280);
      }

      .leak-time {
        font-size: 0.8em;
        color: var(--color-text-secondary, #6b7280);
      }

      .leak-message {
        margin-bottom: var(--spacing-sm, 0.5rem);
        line-height: 1.4;
      }

      .leak-details {
        font-size: 0.9em;
        color: var(--color-text-secondary, #6b7280);
      }

      .monitor-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-sm, 0.5rem);
        padding: var(--spacing-md, 1rem);
        border-top: 1px solid var(--color-border, #e5e7eb);
      }

      button {
        padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
        border: none;
        border-radius: var(--radius-sm, 0.25rem);
        cursor: pointer;
        font-size: 0.9em;
        transition: background 0.2s ease;
      }

      .clear-button {
        background: var(--color-surface-hover, #f5f5f5);
        color: var(--color-text, #111827);
      }

      .clear-button:hover {
        background: var(--color-surface-hover-dark, #e5e7eb);
      }

      .dismiss-button {
        background: var(--color-primary, #3b82f6);
        color: white;
      }

      .dismiss-button:hover {
        background: var(--color-primary-dark, #2563eb);
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

      .empty-state {
        text-align: center;
        color: var(--color-text-secondary, #6b7280);
        padding: var(--spacing-lg, 2rem) 0;
      }
    `,
  ];

  constructor() {
    super();
    this.leaks = [];
    this.expanded = false;
    this.maxLeaks = 50;
    this.autoHide = true;
    this.autoHideTimeout = 10000;
    this._handleLeakDetected = this._handleLeakDetected.bind(this);
  }

  createRenderRoot() {
    return this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("memory-leak-detected", this._handleLeakDetected);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(
      "memory-leak-detected",
      this._handleLeakDetected
    );
  }

  _handleLeakDetected(event) {
    if (!event.detail) {
      console.warn("Memory leak event missing detail");
      return;
    }

    const { type, size, time } = event.detail;
    if (!type || !size || !time) {
      console.warn("Memory leak event missing required fields", event.detail);
      return;
    }

    this.addLeak(event.detail);
  }

  addLeak(leak) {
    this.leaks = [...this.leaks, leak];
    if (this.leaks.length > this.maxLeaks) {
      this.leaks = this.leaks.slice(-this.maxLeaks);
    }
    this.expanded = true;
    if (this.autoHide) {
      setTimeout(() => {
        this.expanded = false;
        this.requestUpdate();
      }, this.autoHideTimeout);
    }
    this.requestUpdate();
  }

  _formatTime(time) {
    return new Date(time).toLocaleTimeString();
  }

  _formatSize(size) {
    const units = ["B", "KB", "MB", "GB"];
    let value = size;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  }

  _clearLeaks() {
    this.leaks = [];
    this.expanded = false;
    this.requestUpdate();
  }

  _toggleExpanded() {
    this.expanded = !this.expanded;
    this.requestUpdate();
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
                ${this.leaks.length === 0
                  ? html`
                      <div class="empty-state">No memory leaks detected</div>
                    `
                  : html`
                      <div class="leak-list">
                        ${this.leaks.map(
                          (leak) => html`
                            <div class="leak-item" data-type=${leak.type}>
                              <div class="leak-header">
                                <span class="leak-type"> ${leak.type} </span>
                                <span class="leak-time">
                                  ${this._formatTime(leak.time)}
                                </span>
                              </div>
                              <div class="leak-message">
                                ${this._formatSize(leak.size)}
                              </div>
                            </div>
                          `
                        )}
                      </div>
                    `}
              </div>
              <div class="monitor-actions">
                <button
                  class="clear-button"
                  @click=${this._clearLeaks}
                  ?disabled=${this.leaks.length === 0}
                >
                  Clear All
                </button>
              </div>
            `
          : null}
      </div>
    `;
  }
}

customElements.define("memory-monitor", MemoryMonitor);
