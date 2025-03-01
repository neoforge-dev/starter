import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class ComponentsPage extends LitElement {
  static properties = {
    loading: { type: Boolean },
    error: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    .error {
      color: var(--error-color, red);
      padding: 1rem;
      border: 1px solid currentColor;
      border-radius: 4px;
      margin: 1rem 0;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }
  `;

  constructor() {
    super();
    this.loading = false;
    this.error = "";
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <neo-spinner></neo-spinner>
        </div>
      `;
    }

    if (this.error) {
      return html` <div class="error">${this.error}</div> `;
    }

    return html`
      <h1>Components</h1>
      <section>
        <h2>Form Components</h2>
        <neo-autoform
          .schema=${{
            title: "Example Form",
            type: "object",
            properties: {
              name: {
                type: "string",
                title: "Name",
              },
            },
          }}
        ></neo-autoform>
      </section>
    `;
  }
}

customElements.define("neo-components-page", ComponentsPage);
