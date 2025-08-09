import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../styles/base.js";
import "../components/auth/signup-form.js";

export class SignupPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
        max-width: 600px;
        margin: 0 auto;
      }
      h1 {
        text-align: center;
        margin-bottom: var(--spacing-lg);
        color: var(--text-color);
      }
    `,
  ];

  render() {
    return html`
      <h1>Sign Up</h1>
      <signup-form></signup-form>
    `;
  }
}

customElements.define("signup-page", SignupPage);
