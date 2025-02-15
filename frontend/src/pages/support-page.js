import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { baseStyles } from "../styles/base.js";

@customElement("support-page")
export class SupportPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .support-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      h1 {
        font-size: var(--font-size-xxl);
        margin-bottom: var(--spacing-xl);
        text-align: center;
      }

      .support-grid {
        display: grid;
        gap: var(--spacing-lg);
      }

      .support-section {
        padding: var(--spacing-lg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
      }

      h2 {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-md);
      }

      .support-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
      }

      .support-card {
        padding: var(--spacing-lg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-sm);
        text-align: center;
      }

      .support-card h3 {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-md);
      }

      .support-card p {
        margin-bottom: var(--spacing-md);
        color: var(--color-text-secondary);
      }

      .contact-form {
        display: grid;
        gap: var(--spacing-md);
      }

      .form-group {
        display: grid;
        gap: var(--spacing-sm);
      }

      label {
        font-weight: 500;
      }

      textarea {
        min-height: 150px;
      }
    `,
  ];

  render() {
    return html`
      <div class="support-container">
        <h1>Support Center</h1>

        <div class="support-options">
          <div class="support-card">
            <h3>Documentation</h3>
            <p>
              Browse our comprehensive documentation to find answers to common
              questions.
            </p>
            <button>View Docs</button>
          </div>

          <div class="support-card">
            <h3>Community</h3>
            <p>
              Join our community forum to connect with other users and share
              experiences.
            </p>
            <button>Visit Forum</button>
          </div>

          <div class="support-card">
            <h3>Live Chat</h3>
            <p>
              Get real-time assistance from our support team during business
              hours.
            </p>
            <button>Start Chat</button>
          </div>
        </div>

        <div class="support-grid">
          <section class="support-section">
            <h2>Contact Support</h2>
            <div class="contact-form">
              <div class="form-group">
                <label>Name</label>
                <input type="text" placeholder="Your name" />
              </div>

              <div class="form-group">
                <label>Email</label>
                <input type="email" placeholder="Your email" />
              </div>

              <div class="form-group">
                <label>Subject</label>
                <select>
                  <option>Technical Issue</option>
                  <option>Billing Question</option>
                  <option>Feature Request</option>
                  <option>Other</option>
                </select>
              </div>

              <div class="form-group">
                <label>Message</label>
                <textarea placeholder="Describe your issue..."></textarea>
              </div>

              <button>Submit Ticket</button>
            </div>
          </section>

          <section class="support-section">
            <h2>FAQs</h2>
            <div class="faq-list">
              <details>
                <summary>How do I get started?</summary>
                <p>
                  Check out our Getting Started guide in the documentation for a
                  step-by-step walkthrough.
                </p>
              </details>

              <details>
                <summary>What are the system requirements?</summary>
                <p>
                  Our platform runs on modern browsers and requires Node.js 14
                  or higher for development.
                </p>
              </details>

              <details>
                <summary>How do I update my subscription?</summary>
                <p>
                  You can manage your subscription settings from your account
                  dashboard.
                </p>
              </details>
            </div>
          </section>
        </div>
      </div>
    `;
  }
}
