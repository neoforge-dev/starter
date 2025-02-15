import { LitElement, html, css } from "lit";

export class ErrorPage extends LitElement {
  static get properties() {
    return {
      code: { type: String },
      message: { type: String },
      description: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
        text-align: center;
        background: var(--color-background, #f5f5f5);
      }

      .error-container {
        max-width: 600px;
        margin: 0 auto;
      }

      .error-code {
        font-size: 8rem;
        font-weight: 700;
        color: var(--color-primary, #2196f3);
        margin: 0;
        line-height: 1;
        opacity: 0.5;
      }

      .error-message {
        font-size: 2rem;
        font-weight: 500;
        color: var(--color-text, #333);
        margin: 1rem 0;
      }

      .error-description {
        font-size: 1.125rem;
        color: var(--color-text-secondary, #666);
        margin-bottom: 2rem;
      }

      .home-button {
        display: inline-flex;
        align-items: center;
        padding: 0.75rem 1.5rem;
        background: var(--color-primary, #2196f3);
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 500;
        transition: background 0.2s ease;
      }

      .home-button:hover {
        background: var(--color-primary-dark, #1976d2);
      }

      .home-button svg {
        margin-right: 0.5rem;
        width: 1.25rem;
        height: 1.25rem;
      }

      @media (max-width: 768px) {
        .error-code {
          font-size: 6rem;
        }

        .error-message {
          font-size: 1.5rem;
        }

        .error-description {
          font-size: 1rem;
        }
      }
    `;
  }

  constructor() {
    super();
    this.code = "404";
    this.message = "Page Not Found";
    this.description =
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.";
  }

  render() {
    return html`
      <div class="error-container">
        <h1 class="error-code">${this.code}</h1>
        <h2 class="error-message">${this.message}</h2>
        <p class="error-description">${this.description}</p>
        <a href="/" class="home-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Back to Home
        </a>
      </div>
    `;
  }
}

customElements.define("neo-error-page", ErrorPage);
