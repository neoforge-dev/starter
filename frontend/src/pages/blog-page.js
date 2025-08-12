import {   html, css   } from 'lit';
import { BaseComponent } from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element blog-page
 * @description Blog page component with posts and categories
 */
export class BlogPage extends BaseComponent {
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
