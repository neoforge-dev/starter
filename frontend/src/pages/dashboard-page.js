import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../styles/base.js";
import { authService } from "../services/auth-service.js";
import "../components/ui/card.js";
import "../components/ui/spinner.js";
import "../components/ui/tabs.js";
import "../components/ui/badge.js";

export class DashboardPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
      }
      h1 {
        color: var(--text-color);
        margin-bottom: var(--spacing-lg);
      }
    `,
  ];

  render() {
    return html`
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard. More features coming soon.</p>
    `;
  }
}

customElements.define("dashboard-page", DashboardPage);
