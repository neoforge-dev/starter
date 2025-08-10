import { BaseComponent } from "./base-component.js";
// TODO: Add html, css imports when render method is implemented
// import { html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
// import { baseStyles } from "../styles/base.js";

/**
 * @element neo-autoform
 * @description Automatic form generation component based on JSON schema
 */
export class NeoAutoform extends BaseComponent {
  static get properties() {
    return {
      schema: { type: Object },
      value: { type: Object },
      layout: { type: String },
      variant: { type: String },
      disabled: { type: Boolean },
      readonly: { type: Boolean },
    };
  }
}
