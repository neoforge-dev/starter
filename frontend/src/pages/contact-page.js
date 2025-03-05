import {
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { BaseComponent } from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element contact-page
 * @description Contact page component with form and office information
 */
export class ContactPage extends BaseComponent {
  static properties = {
    offices: { type: Array, state: true },
    departments: { type: Array, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    formData: { type: Object, state: true },
    successMessage: { type: String, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .contact-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      h1,
      h2 {
        font-size: var(--font-size-xxl);
        margin-bottom: var(--spacing-lg);
      }

      h3 {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-sm);
      }

      section {
        margin-bottom: var(--spacing-xl);
      }

      .office-grid,
      .department-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .office-card,
      .department-card {
        background: var(--color-surface);
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }

      .contact-form {
        background: var(--color-surface);
        padding: var(--spacing-xl);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
      }

      .form-group {
        margin-bottom: var(--spacing-md);
      }

      label {
        display: block;
        margin-bottom: var(--spacing-xs);
        font-weight: 500;
      }

      input,
      textarea {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-base);
      }

      textarea {
        min-height: 150px;
        resize: vertical;
      }

      button {
        background: var(--color-primary);
        color: white;
        padding: var(--spacing-sm) var(--spacing-lg);
        border: none;
        border-radius: var(--radius-sm);
        font-size: var(--font-size-base);
        font-weight: 500;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .error-message {
        color: var(--color-error);
        margin-top: var(--spacing-xs);
        font-size: var(--font-size-sm);
      }

      .success-message {
        color: var(--color-success);
        margin-top: var(--spacing-sm);
        font-size: var(--font-size-base);
      }

      .contact-info {
        margin-top: var(--spacing-sm);
      }

      .contact-info p {
        margin: var(--spacing-xs) 0;
      }

      .social-links {
        margin-top: var(--spacing-md);
      }

      .social-links a {
        margin-right: var(--spacing-sm);
        color: var(--color-primary);
        text-decoration: none;
      }
    `,
  ];

  constructor() {
    super();
    this.offices = [];
    this.departments = [];
    this.loading = true;
    this.error = null;
    this.formData = {
      name: "",
      email: "",
      subject: "",
      message: "",
    };
    this.successMessage = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadData();
  }

  async firstUpdated(changedProperties) {
    await super.firstUpdated(changedProperties);
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      const [offices, departments] = await Promise.all([
        window.contact.getOfficeLocations(),
        window.contact.getDepartments(),
      ]);
      this.offices = offices;
      this.departments = departments;
    } catch (error) {
      console.error("Failed to load contact data:", error);
      this.error = "Failed to load contact information";
    } finally {
      this.loading = false;
      await this.updateComplete;
    }
  }

  handleEvent(event) {
    if (event.type === "submit") {
      this.handleSubmit(event);
    } else if (event.type === "input") {
      this.handleInput(event);
    }
  }

  handleInput(event) {
    const { name, value } = event.target;
    this.formData = {
      ...this.formData,
      [name]: value,
    };
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    try {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      const result = await window.contact.submitForm(this.formData);
      if (result.success) {
        this.successMessage =
          "Thank you for your message. We'll get back to you soon!";
        this.formData = {
          name: "",
          email: "",
          subject: "",
          message: "",
        };
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      this.error = "Failed to send message. Please try again.";
    } finally {
      this.loading = false;
      await this.updateComplete;
    }
  }

  validateForm() {
    if (!this.formData.name || !this.formData.email || !this.formData.message) {
      this.error = "Please fill in all required fields";
      return false;
    }

    if (!this.validateEmail(this.formData.email)) {
      this.error = "Please enter a valid email address";
      return false;
    }

    return true;
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  render() {
    if (this.loading) {
      return html`
        <div class="contact-container">
          <div class="loading-indicator">Loading...</div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="contact-container">
          <div class="error-message">${this.error}</div>
        </div>
      `;
    }

    return html`
      <div class="contact-container">
        <section class="contact-form-section">
          <h1>Contact Us</h1>
          <form class="contact-form" @submit=${this.handleEvent}>
            <div class="form-group">
              <label for="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                .value=${this.formData.name}
                @input=${this.handleEvent}
                required
              />
            </div>
            <div class="form-group">
              <label for="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                .value=${this.formData.email}
                @input=${this.handleEvent}
                required
              />
            </div>
            <div class="form-group">
              <label for="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                .value=${this.formData.subject}
                @input=${this.handleEvent}
              />
            </div>
            <div class="form-group">
              <label for="message">Message *</label>
              <textarea
                id="message"
                name="message"
                .value=${this.formData.message}
                @input=${this.handleEvent}
                required
              ></textarea>
            </div>
            ${this.error
              ? html`<div class="error-message">${this.error}</div>`
              : ""}
            ${this.successMessage
              ? html`<div class="success-message">${this.successMessage}</div>`
              : ""}
            <button type="submit" ?disabled=${this.loading}>
              ${this.loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </section>

        <section class="offices-section">
          <h2>Our Offices</h2>
          <div class="office-grid">
            ${this.offices.map(
              (office) => html`
                <div class="office-card office-location">
                  <h3 class="office-name">${office.city}</h3>
                  <div class="contact-info">
                    <p>${office.address}</p>
                    <p>Phone: ${office.phone}</p>
                    <p>Email: ${office.email}</p>
                    <p class="office-hours">
                      Hours: ${office.hours} ${office.timezone}
                    </p>
                  </div>
                </div>
              `
            )}
          </div>
        </section>

        <section class="departments-section">
          <h2>Departments</h2>
          <div class="department-grid">
            ${this.departments.map(
              (dept) => html`
                <div class="department-card department">
                  <h3 class="department-name">${dept.name}</h3>
                  <p>${dept.description}</p>
                  <p>Email: ${dept.email}</p>
                </div>
              `
            )}
          </div>
        </section>

        <section class="social-section">
          <h2>Connect With Us</h2>
          <div class="social-links">
            <a href="https://twitter.com/neoforge" target="_blank">Twitter</a>
            <a href="https://github.com/neoforge" target="_blank">GitHub</a>
            <a href="https://linkedin.com/company/neoforge" target="_blank"
              >LinkedIn</a
            >
          </div>
        </section>
      </div>
    `;
  }
}
