import { LitElement, html, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

export class NeoSpinner extends LitElement {
  static properties = {
    size: { type: String },
    variant: { type: String },
    label: { type: String },
    speed: { type: String },
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      display: inline-block;
      border: 2px solid transparent;
      border-radius: 50%;
      animation: spin var(--spinner-duration, 1s) linear infinite;
    }

    /* Sizes */
    .size-small {
      width: 1rem;
      height: 1rem;
      border-width: 2px;
    }

    .size-medium {
      width: 2rem;
      height: 2rem;
      border-width: 3px;
    }

    .size-large {
      width: 3rem;
      height: 3rem;
      border-width: 4px;
    }

    /* Variants */
    .variant-primary {
      border-top-color: var(--color-primary);
    }

    .variant-secondary {
      border-top-color: var(--color-secondary);
    }

    .variant-light {
      border-top-color: var(--color-white);
    }

    .variant-dark {
      border-top-color: var(--color-text);
    }

    /* Speeds */
    .speed-slow {
      --spinner-duration: 2s;
    }

    .speed-normal {
      --spinner-duration: 1s;
    }

    .speed-fast {
      --spinner-duration: 0.5s;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;

  constructor() {
    super();
    this.size = "medium";
    this.variant = "primary";
    this.label = "Loading";
    this.speed = "normal";
  }

  render() {
    const classes = {
      spinner: true,
      [`size-${this.size}`]: true,
      [`variant-${this.variant}`]: true,
      [`speed-${this.speed}`]: true,
    };

    return html`
      <div
        class=${classMap(classes)}
        role="progressbar"
        aria-label=${this.label}
      ></div>
    `;
  }
}

customElements.define("neo-spinner", NeoSpinner);
