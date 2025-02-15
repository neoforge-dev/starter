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
        width: 100%;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--color-text, #333);
      }

      input,
      textarea,
      select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--color-border, #ddd);
        border-radius: 4px;
        font-size: 1rem;
        line-height: 1.5;
        transition: border-color 0.2s ease;
      }

      input:focus,
      textarea:focus,
      select:focus {
        outline: none;
        border-color: var(--color-primary, #2196f3);
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        background: var(--color-primary, #2196f3);
        color: white;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      button:hover {
        background: var(--color-primary-dark, #1976d2);
      }

      button:disabled {
        background: var(--color-disabled, #ccc);
        cursor: not-allowed;
      }

      .error-message {
        color: var(--color-error, #f44336);
        margin-top: 0.5rem;
        font-size: 0.875rem;
      }

      .success-message {
        color: var(--color-success, #4caf50);
        margin-top: 0.5rem;
        font-size: 0.875rem;
      }

      .loading {
        opacity: 0.7;
        pointer-events: none;
      }

      .spinner {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        margin-right: 0.5rem;
        border: 2px solid #fff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
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
      this.dispatchEvent(new CustomEvent("form-success", { detail: data }));
      e.target.reset();
    } catch (err) {
      this.error = err.message || "An error occurred";
      this.dispatchEvent(new CustomEvent("form-error", { detail: err }));
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <form @submit=${this.handleSubmit} class=${this.loading ? "loading" : ""}>
        <slot></slot>

        ${this.error
          ? html` <div class="error-message">${this.error}</div> `
          : ""}
        ${this.success
          ? html` <div class="success-message">${this.success}</div> `
          : ""}

        <button type="submit" ?disabled=${this.loading}>
          ${this.loading ? html` <span class="spinner"></span> ` : ""}
          ${this.loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    `;
  }
}

customElements.define("neo-form", Form);
