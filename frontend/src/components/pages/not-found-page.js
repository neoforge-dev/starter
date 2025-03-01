import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../styles/base.js";
import { router } from "../services/router.js";
import { ROUTES } from "../config/routes.js";
import "../components/ui/button.js";

export class NotFoundPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
        text-align: center;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
      }

      h1 {
        font-size: var(--font-size-4xl);
        margin-bottom: var(--spacing-lg);
        color: var(--text-color);
      }

      p {
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xl);
      }

      .actions {
        display: flex;
        gap: var(--spacing-md);
        justify-content: center;
      }
    `,
  ];

  render() {
    return html`
      <div class="container">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div class="actions">
          <neo-button @click=${() => router.navigate(ROUTES.HOME)}>
            Go Home
          </neo-button>
          <neo-button
            variant="secondary"
            @click=${() => router.navigate(ROUTES.CONTACT)}
          >
            Contact Support
          </neo-button>
        </div>
      </div>
    `;
  }
}

customElements.define("not-found-page", NotFoundPage);
