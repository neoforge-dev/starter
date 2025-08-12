import { 
  LitElement,
  html,
  css,
 } from 'lit';

export class Hero extends LitElement {
  static properties = {
    variant: { type: String },
    title: { type: String },
    subtitle: { type: String },
    imageUrl: { type: String },
    imageAlt: { type: String },
    primaryAction: { type: Object },
    secondaryAction: { type: Object },
    background: { type: String },
    textColor: { type: String },
    features: { type: Array },
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
    }

    .hero {
      position: relative;
      padding: 4rem 2rem;
      overflow: hidden;
    }

    .hero-content {
      max-width: 1280px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .title {
      font-size: 3.5rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 1.5rem;
    }

    .subtitle {
      font-size: 1.25rem;
      line-height: 1.75;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
    }

    .button-primary {
      background-color: var(--hero-primary-button-bg, #2563eb);
      color: white;
    }

    .button-primary:hover {
      background-color: var(--hero-primary-button-hover-bg, #1d4ed8);
    }

    .button-secondary {
      background-color: var(--hero-secondary-button-bg, #ffffff);
      color: var(--hero-secondary-button-color, #1f2937);
      border: 1px solid var(--hero-secondary-button-border, #d1d5db);
    }

    .button-secondary:hover {
      background-color: var(--hero-secondary-button-hover-bg, #f3f4f6);
    }

    /* Variant: Default */
    .hero-default {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }

    .hero-default .hero-image {
      width: 100%;
      height: auto;
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    }

    /* Variant: Centered */
    .hero-centered {
      text-align: center;
    }

    .hero-centered .hero-content {
      max-width: 768px;
    }

    /* Variant: Split */
    .hero-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 600px;
    }

    .hero-split .hero-content {
      padding: 4rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .hero-split .hero-image-wrapper {
      position: relative;
      overflow: hidden;
    }

    .hero-split .hero-image {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Variant: Gradient */
    .hero-gradient {
      text-align: center;
      color: white;
    }

    .hero-gradient::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--hero-gradient-bg);
      opacity: 0.9;
    }

    /* Features Grid */
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 4rem;
    }

    .feature {
      text-align: center;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      backdrop-filter: blur(10px);
    }

    .feature-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .feature-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .feature-description {
      font-size: 1rem;
      opacity: 0.9;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .hero {
        padding: 3rem 1.5rem;
      }

      .title {
        font-size: 2.5rem;
      }

      .hero-default,
      .hero-split {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .hero-split .hero-image-wrapper {
        height: 300px;
        position: relative;
      }

      .actions {
        justify-content: center;
      }

      .features {
        grid-template-columns: 1fr;
      }
    }
  `;

  constructor() {
    super();
    this.variant = "default";
    this.features = [];
  }

  _handlePrimaryClick(e) {
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent("primary-click", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSecondaryClick(e) {
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent("secondary-click", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _renderFeatures() {
    if (!this.features?.length) return "";

    return html`
      <div class="features">
        ${this.features.map(
          (feature) => html`
            <div class="feature">
              <div class="feature-icon">${feature.icon}</div>
              <h3 class="feature-title">${feature.title}</h3>
              <p class="feature-description">${feature.description}</p>
            </div>
          `
        )}
      </div>
    `;
  }

  render() {
    const style = {
      "--hero-gradient-bg": this.background,
      color: this.textColor || "inherit",
    };

    return html`
      <section
        class="hero hero-${this.variant}"
        style=${Object.entries(style)
          .map(([k, v]) => `${k}:${v}`)
          .join(";")}
      >
        <div class="hero-content">
          ${this.variant === "split"
            ? html`
                <h1 class="title">${this.title}</h1>
                <p class="subtitle">${this.subtitle}</p>
                <div class="actions">
                  ${this.primaryAction
                    ? html`
                        <a
                          href=${this.primaryAction.href}
                          class="button button-primary"
                          @click=${this._handlePrimaryClick}
                        >
                          ${this.primaryAction.label}
                        </a>
                      `
                    : ""}
                  ${this.secondaryAction
                    ? html`
                        <a
                          href=${this.secondaryAction.href}
                          class="button button-secondary"
                          @click=${this._handleSecondaryClick}
                        >
                          ${this.secondaryAction.label}
                        </a>
                      `
                    : ""}
                </div>
              `
            : html`
                <div class="hero-text">
                  <h1 class="title">${this.title}</h1>
                  <p class="subtitle">${this.subtitle}</p>
                  <div class="actions">
                    ${this.primaryAction
                      ? html`
                          <a
                            href=${this.primaryAction.href}
                            class="button button-primary"
                            @click=${this._handlePrimaryClick}
                          >
                            ${this.primaryAction.label}
                          </a>
                        `
                      : ""}
                    ${this.secondaryAction
                      ? html`
                          <a
                            href=${this.secondaryAction.href}
                            class="button button-secondary"
                            @click=${this._handleSecondaryClick}
                          >
                            ${this.secondaryAction.label}
                          </a>
                        `
                      : ""}
                  </div>
                </div>
                ${this._renderFeatures()}
              `}
        </div>
        ${(this.variant === "default" || this.variant === "split") &&
        this.imageUrl
          ? html`
              <div class="hero-image-wrapper">
                <img
                  src=${this.imageUrl}
                  alt=${this.imageAlt || ""}
                  class="hero-image"
                />
              </div>
            `
          : ""}
      </section>
    `;
  }
}

customElements.define("ui-hero", Hero);
