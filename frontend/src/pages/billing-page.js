import { html, css } from 'lit';
import { BaseComponent } from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element billing-page
 * @description Billing and subscription management page
 */
export class BillingPage extends BaseComponent {
  static properties = {
    subscription: { type: Object, state: true },
    billingHistory: { type: Array, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .billing-header {
        margin-bottom: var(--spacing-lg);
      }

      .subscription-info {
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        background: var(--surface-color);
      }

      .billing-history {
        margin-top: var(--spacing-lg);
      }

      .billing-history h3 {
        margin-bottom: var(--spacing-md);
      }

      .invoice-list {
        display: grid;
        gap: var(--spacing-sm);
      }

      .invoice-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background: var(--surface-color);
      }

      .add-payment-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius);
        cursor: pointer;
      }

      .add-payment-btn:hover {
        background: var(--primary-color-dark);
      }
    `,
  ];

  constructor() {
    super();
    this.subscription = { plan: "Free", status: "active" };
    this.billingHistory = [];
    this.loading = false;
    this.error = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadBillingData();
  }

  async loadBillingData() {
    this.loading = true;
    try {
      // Mock data for E2E testing
      this.billingHistory = [
        { id: 1, date: "2024-01-01", amount: "$0.00", status: "Paid" },
      ];
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="billing-page">
        <div class="billing-header">
          <h1>Billing & Subscription</h1>
        </div>

        ${this.error ? html`<div class="error">${this.error}</div>` : ""}

        <div class="subscription-info" data-testid="current-plan">
          <h2>Current Plan: ${this.subscription.plan}</h2>
          <p>Status: ${this.subscription.status}</p>
        </div>

        <div class="billing-actions" data-testid="payment-methods">
          <button
            class="add-payment-btn"
            data-testid="add-payment-method"
            @click=${this.addPaymentMethod}
          >
            Add Payment Method
          </button>

          <!-- Payment method form (shown when adding) -->
          <div class="payment-form" style="display: none;">
            <input type="text" data-testid="card-number" placeholder="Card Number" />
            <input type="text" data-testid="expiry" placeholder="MM/YY" />
            <input type="text" data-testid="cvc" placeholder="CVC" />
            <button data-testid="save-payment-method">Save Payment Method</button>
          </div>
        </div>

        <div class="plan-options" data-testid="plan-options">
          <h3>Plan Options</h3>
          <button>Upgrade</button>
        </div>

        <div class="billing-history" data-testid="billing-history">
          <h3>Billing History</h3>
          <div class="invoice-list">
            ${this.billingHistory.map(invoice => html`
              <div class="invoice-item">
                <div>
                  <strong>${invoice.date}</strong>
                  <span>${invoice.amount}</span>
                </div>
                <span>${invoice.status}</span>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  addPaymentMethod() {
    // Mock add payment method functionality
    console.log("Add payment method clicked");
  }
}

customElements.define("billing-page", BillingPage);