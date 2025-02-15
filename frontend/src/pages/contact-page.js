import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { baseStyles } from "../styles/base.js";

@customElement("contact-page")
export class ContactPage extends LitElement {
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

      h1 {
        font-size: var(--font-size-xxl);
        margin-bottom: var(--spacing-lg);
      }

      .contact-form {
        display: grid;
        gap: var(--spacing-md);
      }
    `,
  ];

  render() {
    return html`
      <div class="contact-container">
        <h1>Contact Us</h1>
        <div class="contact-form">
          <input type="text" placeholder="Name" />
          <input type="email" placeholder="Email" />
          <textarea placeholder="Message"></textarea>
          <button>Send Message</button>
        </div>
      </div>
    `;
  }
}
