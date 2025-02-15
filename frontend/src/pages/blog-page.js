import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { baseStyles } from "../styles/base.js";

@customElement("blog-page")
export class BlogPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .blog-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      h1 {
        font-size: var(--font-size-xxl);
        margin-bottom: var(--spacing-lg);
      }
    `,
  ];

  render() {
    return html`
      <div class="blog-container">
        <h1>Blog</h1>
        <p>Coming soon...</p>
      </div>
    `;
  }
}
