import { 
  LitElement,
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class PricingTables extends LitElement {
  static properties = {
    plans: { type: Array },
    layout: { type: String },
    variant: { type: String },
    currency: { type: String },
    interval: { type: String },
    showToggle: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
    }

    .pricing-container {
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Interval Toggle */
    .interval-toggle {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-bottom: 3rem;
    }

    .toggle-label {
      font-size: 1rem;
      color: #4b5563;
    }

    .toggle-button {
      position: relative;
      width: 3rem;
      height: 1.5rem;
      border-radius: 9999px;
      background-color: #e5e7eb;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .toggle-button.active {
      background-color: #2563eb;
    }

    .toggle-button::after {
      content: "";
      position: absolute;
      top: 0.125rem;
      left: 0.125rem;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      background-color: white;
      transition: transform 0.2s;
    }

    .toggle-button.active::after {
      transform: translateX(1.5rem);
    }

    /* Simple Layout */
    .layout-simple {
      display: grid;
      gap: 2rem;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    /* Feature Rich Layout */
    .layout-feature-rich {
      display: grid;
      gap: 2rem;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }

    /* Comparison Layout */
    .layout-comparison {
      overflow-x: auto;
    }

    .comparison-table {
      width: 100%;
      border-collapse: collapse;
    }

    .comparison-table th,
    .comparison-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .comparison-table th:first-child,
    .comparison-table td:first-child {
      position: sticky;
      left: 0;
      background-color: white;
      z-index: 1;
    }

    .category-header {
      background-color: #f9fafb;
      font-weight: 600;
    }

    /* Plan Card */
    .plan-card {
      position: relative;
      padding: 2rem;
      border-radius: 1rem;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Default Variant */
    .variant-default {
      background-color: white;
      box-shadow:
        0 4px 6px -1px rgb(0 0 0 / 0.1),
        0 2px 4px -2px rgb(0 0 0 / 0.1);
    }

    /* Gradient Variant */
    .variant-gradient {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    }

    .variant-gradient.popular {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    /* Bordered Variant */
    .variant-bordered {
      border: 2px solid #e5e7eb;
    }

    .variant-bordered.popular {
      border-color: #2563eb;
    }

    /* Popular Badge */
    .popular-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background-color: #2563eb;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Plan Content */
    .plan-name {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .plan-description {
      color: #6b7280;
      margin: 0 0 2rem 0;
      line-height: 1.5;
    }

    .variant-gradient.popular .plan-description {
      color: rgba(255, 255, 255, 0.9);
    }

    .plan-price {
      font-size: 3rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .price-currency {
      font-size: 1.5rem;
    }

    .price-interval {
      font-size: 1rem;
      color: #6b7280;
    }

    .variant-gradient.popular .price-interval {
      color: rgba(255, 255, 255, 0.9);
    }

    /* Features List */
    .features-list {
      list-style: none;
      padding: 0;
      margin: 2rem 0;
      flex-grow: 1;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      color: #4b5563;
    }

    .variant-gradient.popular .feature-item {
      color: rgba(255, 255, 255, 0.9);
    }

    .feature-icon {
      color: #2563eb;
      font-size: 1.25rem;
    }

    .variant-gradient.popular .feature-icon {
      color: white;
    }

    /* CTA Button */
    .cta-button {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      font-size: 1rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
    }

    .cta-button-primary {
      background-color: #2563eb;
      color: white;
    }

    .cta-button-primary:hover {
      background-color: #1d4ed8;
    }

    .variant-gradient.popular .cta-button-primary {
      background-color: white;
      color: #2563eb;
    }

    .variant-gradient.popular .cta-button-primary:hover {
      background-color: #f9fafb;
    }

    /* Tooltip */
    .tooltip {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .tooltip-icon {
      margin-left: 0.5rem;
      color: #9ca3af;
      cursor: help;
    }

    .tooltip-text {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.5rem;
      background-color: #1f2937;
      color: white;
      font-size: 0.875rem;
      border-radius: 0.25rem;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s;
      z-index: 10;
    }

    .tooltip:hover .tooltip-text {
      opacity: 1;
      visibility: visible;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .pricing-container {
        padding: 1rem;
      }

      .plan-card {
        padding: 1.5rem;
      }

      .plan-price {
        font-size: 2.5rem;
      }

      .comparison-table {
        font-size: 0.875rem;
      }

      .comparison-table th,
      .comparison-table td {
        padding: 0.75rem;
      }
    }
  `;

  constructor() {
    super();
    this.plans = [];
    this.layout = "simple";
    this.variant = "default";
    this.currency = "$";
    this.interval = "monthly";
    this.showToggle = true;
  }

  _handleIntervalToggle() {
    const newInterval = this.interval === "monthly" ? "yearly" : "monthly";
    this.interval = newInterval;
    this.dispatchEvent(
      new CustomEvent("interval-change", {
        detail: { interval: newInterval },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handlePlanSelect(plan) {
    this.dispatchEvent(
      new CustomEvent("plan-selected", {
        detail: { plan },
        bubbles: true,
        composed: true,
      })
    );
  }

  _renderToggle() {
    if (!this.showToggle) return "";

    return html`
      <div class="interval-toggle">
        <span class="toggle-label">Monthly</span>
        <div
          class="toggle-button ${this.interval === "yearly" ? "active" : ""}"
          @click=${this._handleIntervalToggle}
        ></div>
        <span class="toggle-label">Yearly</span>
      </div>
    `;
  }

  _renderFeatures(features) {
    if (Array.isArray(features)) {
      return html`
        <ul class="features-list">
          ${features.map((feature) => {
            if (typeof feature === "string") {
              return html`
                <li class="feature-item">
                  <span class="feature-icon">✓</span>
                  <span>${feature}</span>
                </li>
              `;
            }
            return html`
              <li class="feature-item">
                <span class="feature-icon"
                  >${feature.included ? "✓" : "×"}</span
                >
                <span class="tooltip">
                  ${feature.name}
                  <span class="tooltip-icon">ⓘ</span>
                  <span class="tooltip-text">${feature.tooltip}</span>
                </span>
              </li>
            `;
          })}
        </ul>
      `;
    }

    return html`
      <div class="features-list">
        ${features.map(
          (category) => html`
            <div class="feature-category">
              <h4>${category.category}</h4>
              <ul class="features-list">
                ${category.items.map(
                  (item) => html`
                    <li class="feature-item">
                      <span>${item.name}</span>
                      <span>${item.value}</span>
                    </li>
                  `
                )}
              </ul>
            </div>
          `
        )}
      </div>
    `;
  }

  _renderPlan(plan) {
    return html`
      <div
        class="plan-card variant-${this.variant} ${plan.popular
          ? "popular"
          : ""}"
      >
        ${plan.popular
          ? html`<div class="popular-badge">Most Popular</div>`
          : ""}
        <h3 class="plan-name">${plan.name}</h3>
        <p class="plan-description">${plan.description}</p>
        <div class="plan-price">
          <span class="price-currency">${this.currency}</span>
          <span>${plan.price[this.interval]}</span>
          <span class="price-interval"
            >/${this.interval === "monthly" ? "mo" : "yr"}</span
          >
        </div>
        ${this._renderFeatures(plan.features)}
        <a
          href=${plan.cta.href}
          class="cta-button cta-button-primary"
          @click=${(e) => {
            e.preventDefault();
            this._handlePlanSelect(plan);
          }}
        >
          ${plan.cta.label}
        </a>
      </div>
    `;
  }

  _renderComparison() {
    if (!this.plans.length) return "";

    const firstPlan = this.plans[0];
    const categories = firstPlan.features;

    return html`
      <div class="layout-comparison">
        <table class="comparison-table">
          <thead>
            <tr>
              <th></th>
              ${this.plans.map((plan) => html`<th>${plan.name}</th>`)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price</td>
              ${this.plans.map(
                (plan) => html`
                  <td>
                    <div class="plan-price">
                      <span class="price-currency">${this.currency}</span>
                      <span>${plan.price[this.interval]}</span>
                      <span class="price-interval"
                        >/${this.interval === "monthly" ? "mo" : "yr"}</span
                      >
                    </div>
                  </td>
                `
              )}
            </tr>
            ${categories.map(
              (category) => html`
                <tr class="category-header">
                  <td colspan=${this.plans.length + 1}>${category.category}</td>
                </tr>
                ${category.items.map(
                  (item) => html`
                    <tr>
                      <td>${item.name}</td>
                      ${this.plans.map((plan) => {
                        const planFeature = plan.features
                          .find((f) => f.category === category.category)
                          .items.find((i) => i.name === item.name);
                        return html`<td>${planFeature.value}</td>`;
                      })}
                    </tr>
                  `
                )}
              `
            )}
            <tr>
              <td></td>
              ${this.plans.map(
                (plan) => html`
                  <td>
                    <a
                      href=${plan.cta.href}
                      class="cta-button cta-button-primary"
                      @click=${(e) => {
                        e.preventDefault();
                        this._handlePlanSelect(plan);
                      }}
                    >
                      ${plan.cta.label}
                    </a>
                  </td>
                `
              )}
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  render() {
    return html`
      <div class="pricing-container">
        ${this._renderToggle()}
        ${this.layout === "comparison"
          ? this._renderComparison()
          : html`
              <div class="layout-${this.layout}">
                ${this.plans.map((plan) => this._renderPlan(plan))}
              </div>
            `}
      </div>
    `;
  }
}

customElements.define("ui-pricing-tables", PricingTables);
