import { LitElement, html, css } from "lit";

export class Form extends LitElement {
  static get properties() {
    return {
      action: { type: String },
      method: { type: String },
      loading: { type: Boolean },
      error: { type: String },
      success: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .error {
        color: var(--color-error, #f44336);
        font-size: 14px;
        margin-top: 8px;
      }

      .success {
        color: var(--color-success, #4caf50);
        font-size: 14px;
        margin-top: 8px;
      }

      button[type="submit"] {
        padding: 12px 24px;
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
      }

      button[type="submit"]:hover {
        background: var(--color-primary-dark);
      }

      button[type="submit"]:disabled {
        background: var(--color-disabled);
        cursor: not-allowed;
      }

      .loading {
        opacity: 0.7;
        pointer-events: none;
      }

      .loading button[type="submit"]::after {
        content: "...";
      }
    `;
  }

  constructor() {
    super();
    this.action = "";
    this.method = "POST";
    this.loading = false;
    this.error = "";
    this.success = "";
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.loading = true;
    this.error = "";
    this.success = "";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(this.action, {
        method: this.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Form submission failed");
      }

      this.success = "Form submitted successfully";
      this.dispatchEvent(
        new CustomEvent("form-submit-success", { detail: data })
      );
      e.target.reset();
    } catch (error) {
      this.error = error.message || "An error occurred";
      this.dispatchEvent(
        new CustomEvent("form-submit-error", { detail: error })
      );
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <form @submit=${this.handleSubmit} class=${this.loading ? "loading" : ""}>
        <slot></slot>
        ${this.error ? html`<div class="error">${this.error}</div>` : ""}
        ${this.success ? html`<div class="success">${this.success}</div>` : ""}
        <button type="submit" ?disabled=${this.loading}>
          ${this.loading ? "Submitting" : "Submit"}
        </button>
      </form>
    `;
  }
}

customElements.define("neo-form", Form);
