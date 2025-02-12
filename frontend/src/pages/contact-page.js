import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../styles/base.js";

export class ContactPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
        max-width: 600px;
        margin: auto;
        text-align: center;
      }
      h1 {
        color: var(--text-color);
        margin-bottom: var(--spacing-lg);
      }
      form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }
      input,
      textarea {
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
      }
      button {
        align-self: center;
      }
    `,
  ];

  render() {
    return html`
      <h1>Contact Us</h1>
      <form @submit=${this._handleSubmit}>
        <input type="text" placeholder="Your Name" required />
        <input type="email" placeholder="Your Email" required />
        <textarea placeholder="Your Message" rows="5" required></textarea>
        <button type="submit">Send Message</button>
      </form>
    `;
  }

  _handleSubmit(e) {
    e.preventDefault();
    // Stub: Handle contact form submission
    alert("Thank you for contacting us!");
  }
}

customElements.define("contact-page", ContactPage);
