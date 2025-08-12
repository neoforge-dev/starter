import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../../styles/base.js";
import { accessibilityMonitor } from "../../services/accessibility-monitor.js";

/**
 * Accessibility monitoring dashboard
 * @customElement accessibility-dashboard
 */
export class AccessibilityDashboard extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .summary-card {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
      }

      .issues-list {
        margin-top: var(--spacing-lg);
      }

      .issue-card {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-md);
      }

      .issue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
      }

      .issue-title {
        font-size: 1.1rem;
        font-weight: 500;
        margin: 0;
      }

      .issue-impact {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
      }

      .impact-critical {
        background: #fee2e2;
        color: #dc2626;
      }

      .impact-serious {
        background: #fef3c7;
        color: #d97706;
      }

      .impact-moderate {
        background: #e0f2fe;
        color: #0284c7;
      }

      .impact-minor {
        background: #f3f4f6;
        color: #6b7280;
      }

      .issue-description {
        margin: var(--spacing-md) 0;
      }

      .issue-help {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-md);
      }

      .issue-nodes {
        background: var(--color-surface-hover);
        border-radius: var(--radius-sm);
        padding: var(--spacing-md);
        margin-top: var(--spacing-md);
      }

      .node-item {
        margin-bottom: var(--spacing-sm);
        padding-bottom: var(--spacing-sm);
        border-bottom: 1px solid var(--color-border);
      }

      .node-html {
        font-family: monospace;
        background: var(--color-surface);
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        margin: var(--spacing-sm) 0;
        overflow-x: auto;
      }

      .node-summary {
        color: var(--color-text-secondary);
        font-size: 0.9rem;
      }

      .help-link {
        color: var(--color-primary);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
      }

      .help-link:hover {
        text-decoration: underline;
      }

      .timestamp {
        color: var(--color-text-secondary);
        font-size: 0.9rem;
      }

      .no-issues {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--color-text-secondary);
      }
    `,
  ];

  static properties = {
    _issues: { type: Array, state: true },
  };

  constructor() {
    super();
    this._issues = [];
    this._unsubscribe = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = accessibilityMonitor.subscribe((issues) => {
      this._issues = issues;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  render() {
    return html`
      <div class="dashboard">
        ${this._renderSummary()} ${this._renderFilters()}
      </div>
      ${this._renderIssues()}
    `;
  }

  _renderSummary() {
    const violations = this._issues.filter((i) => i.type === "violation");
    const incomplete = this._issues.filter((i) => i.type === "incomplete");

    return html`
      <div class="summary-card">
        <h2>Accessibility Summary</h2>
        <div>
          <div>Violations: ${violations.length}</div>
          <div>Incomplete: ${incomplete.length}</div>
          <div>Total Issues: ${this._issues.length}</div>
        </div>
      </div>
    `;
  }

  _renderFilters() {
    return html`
      <div class="summary-card">
        <h2>Filters</h2>
        <div>
          <label>
            <input
              type="checkbox"
              @change=${(e) =>
                this._updateConfig({
                  rules: { "color-contrast": { enabled: e.target.checked } },
                })}
              checked
            />
            Color Contrast
          </label>
          <!-- Add more filter options as needed -->
        </div>
      </div>
    `;
  }

  _renderIssues() {
    if (!this._issues.length) {
      return html`
        <div class="no-issues">
          <h2>No accessibility issues found! 🎉</h2>
          <p>Keep up the good work!</p>
        </div>
      `;
    }

    return html`
      <div class="issues-list">
        ${this._issues.map((issue) => this._renderIssue(issue))}
      </div>
    `;
  }

  _renderIssue(issue) {
    return html`
      <div class="issue-card">
        <div class="issue-header">
          <h3 class="issue-title">${issue.id}</h3>
          <span class="issue-impact impact-${issue.impact}"
            >${issue.impact}</span
          >
        </div>
        <div class="issue-description">${issue.description}</div>
        <div class="issue-help">${issue.help}</div>
        <a
          href="${issue.helpUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="help-link"
        >
          Learn more
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.5 3C3.22386 3 3 2.77614 3 2.5C3 2.22386 3.22386 2 3.5 2H9.5C9.77614 2 10 2.22386 10 2.5V8.5C10 8.77614 9.77614 9 9.5 9C9.22386 9 9 8.77614 9 8.5V3.70711L2.85355 9.85355C2.65829 10.0488 2.34171 10.0488 2.14645 9.85355C1.95118 9.65829 1.95118 9.34171 2.14645 9.14645L8.29289 3H3.5Z"
              fill="currentColor"
            />
          </svg>
        </a>
        <div class="issue-nodes">
          ${issue.nodes.map(
            (node) => html`
              <div class="node-item">
                <div class="node-html">${node.html}</div>
                <div class="node-summary">${node.failureSummary}</div>
              </div>
            `
          )}
        </div>
        <div class="timestamp">
          Found: ${new Date(issue.timestamp).toLocaleString()}
        </div>
      </div>
    `;
  }

  _updateConfig(config) {
    accessibilityMonitor.updateConfig(config);
  }
}

customElements.define("accessibility-dashboard", AccessibilityDashboard);
