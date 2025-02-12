import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../styles/base.js";

export class FaqPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
        max-width: 800px;
        margin: auto;
      }
      h1 {
        color: var(--text-color);
        margin-bottom: var(--spacing-lg);
      }
      .faq-item {
        margin-bottom: var(--spacing-md);
      }
      .faq-question {
        font-weight: bold;
        color: var(--text-color);
      }
      .faq-answer {
        color: var(--text-secondary);
        margin-top: var(--spacing-xs);
      }
    `,
  ];

  render() {
    return html`
      <h1>Frequently Asked Questions</h1>
      <div class="faq-item">
        <div class="faq-question">What is NeoForge?</div>
        <div class="faq-answer">
          NeoForge is a modern full-stack starter kit that combines FastAPI and
          Lit Components.
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-question">How do I get started?</div>
        <div class="faq-answer">
          Check out our Getting Started guide in the documentation.
        </div>
      </div>
    `;
  }
}

customElements.define("faq-page", FaqPage);
