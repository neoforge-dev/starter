import {  html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import {
  BaseComponent,
  defineComponent,
} from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element pricing-page
 * @description Pricing page component with plans and features
 */
@defineComponent("pricing-page")
export class PricingPage extends BaseComponent {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .pricing-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      h1 {
        font-size: var(--font-size-xxl);
        margin-bottom: var(--spacing-xl);
        text-align: center;
      }

      .pricing-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .pricing-card {
        padding: var(--spacing-lg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
        text-align: center;
      }

      .price {
        font-size: var(--font-size-xl);
        font-weight: bold;
        margin: var(--spacing-md) 0;
      }

      .features {
        margin: var(--spacing-lg) 0;
        text-align: left;
      }

      .feature {
        margin: var(--spacing-sm) 0;
      }
    `,
  ];

  render() {
    return html`
      <div class="pricing-container">
        <h1>Pricing Plans</h1>
        <div class="pricing-grid">
          <div class="pricing-card">
            <h2>Basic</h2>
            <div class="price">$9/mo</div>
            <div class="features">
              <div class="feature">✓ Feature 1</div>
              <div class="feature">✓ Feature 2</div>
              <div class="feature">✓ Feature 3</div>
            </div>
            <button>Get Started</button>
          </div>
          <div class="pricing-card">
            <h2>Pro</h2>
            <div class="price">$29/mo</div>
            <div class="features">
              <div class="feature">✓ All Basic features</div>
              <div class="feature">✓ Feature 4</div>
              <div class="feature">✓ Feature 5</div>
            </div>
            <button>Get Started</button>
          </div>
          <div class="pricing-card">
            <h2>Enterprise</h2>
            <div class="price">Contact Us</div>
            <div class="features">
              <div class="feature">✓ All Pro features</div>
              <div class="feature">✓ Custom solutions</div>
              <div class="feature">✓ Priority support</div>
            </div>
            <button>Contact Sales</button>
          </div>
        </div>
      </div>
    `;
  }
}
