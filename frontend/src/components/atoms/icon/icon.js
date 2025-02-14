import { LitElement, html, css } from "lit";

export class NeoIcon extends LitElement {
  static properties = {
    name: { type: String },
    size: { type: String },
    color: { type: String },
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--icon-size, 1em);
      height: var(--icon-size, 1em);
      color: var(--icon-color, currentColor);
    }

    svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    /* Sizes */
    :host([size="small"]) {
      --icon-size: 1rem;
    }

    :host([size="medium"]) {
      --icon-size: 1.5rem;
    }

    :host([size="large"]) {
      --icon-size: 2rem;
    }
  `;

  constructor() {
    super();
    this.name = "";
    this.size = "medium";
    this.color = "";
  }

  render() {
    return html`
      <svg viewBox="0 0 24 24" aria-hidden="true">${this._getIconPath()}</svg>
    `;
  }

  _getIconPath() {
    // Basic set of icons
    const icons = {
      close: html`<path
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      />`,
      check: html`<path
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
      />`,
      star: html`<path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />`,
      warning: html`<path
        d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
      />`,
      error: html`<path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
      />`,
      info: html`<path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
      />`,
    };

    return icons[this.name] || null;
  }

  updated(changedProperties) {
    if (changedProperties.has("color")) {
      this.style.setProperty("--icon-color", this.color);
    }
  }
}

customElements.define("neo-icon", NeoIcon);
