import { LitElement, html, css } from "lit";
import { baseStyles } from "../styles/base.js";
import { imageOptimizer } from "../../services/image-optimizer.js";

/**
 * Optimized image component with lazy loading and responsive images
 * @customElement optimized-image
 */
export class OptimizedImage extends LitElement {
  static properties = {
    src: { type: String },
    alt: { type: String },
    width: { type: Number },
    height: { type: Number },
    loading: { type: String }, // eager | lazy
    fit: { type: String }, // cover | contain | fill
    position: { type: String }, // center | top | bottom | left | right
    placeholder: { type: String }, // blur | color
    quality: { type: Number },
    blur: { type: Number },
    _loaded: { type: Boolean, state: true },
    _error: { type: Boolean, state: true },
    _placeholder: { type: String, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        position: relative;
        overflow: hidden;
      }

      .image-container {
        width: 100%;
        height: 100%;
        position: relative;
      }

      img {
        width: 100%;
        height: 100%;
        display: block;
        transition: opacity 0.2s ease-in-out;
      }

      .main-image {
        opacity: 0;
      }

      .main-image.loaded {
        opacity: 1;
      }

      .placeholder {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-size: cover;
        background-position: center;
        transition: opacity 0.2s ease-in-out;
      }

      .placeholder.hidden {
        opacity: 0;
      }

      /* Object fit styles */
      :host([fit="cover"]) img {
        object-fit: cover;
      }

      :host([fit="contain"]) img {
        object-fit: contain;
      }

      :host([fit="fill"]) img {
        object-fit: fill;
      }

      /* Position styles */
      :host([position="top"]) img {
        object-position: top;
      }

      :host([position="bottom"]) img {
        object-position: bottom;
      }

      :host([position="left"]) img {
        object-position: left;
      }

      :host([position="right"]) img {
        object-position: right;
      }

      /* Error state */
      .error-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-surface);
        color: var(--color-text-secondary);
        font-size: 0.9rem;
        padding: var(--spacing-md);
        text-align: center;
      }

      /* Loading animation */
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      .loading {
        background: linear-gradient(
          90deg,
          var(--color-surface) 25%,
          var(--color-surface-hover) 50%,
          var(--color-surface) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }
    `,
  ];

  constructor() {
    super();
    this.loading = "lazy";
    this.fit = "cover";
    this.position = "center";
    this.quality = 80;
    this.blur = 10;
    this._loaded = false;
    this._error = false;
    this._placeholder = null;

    // Bind event handlers
    this._handleLoad = this._handleLoad.bind(this);
    this._handleError = this._handleError.bind(this);
  }

  async firstUpdated() {
    if (this.placeholder === "blur" && this.src) {
      // Generate blurred placeholder
      this._placeholder = await this._generatePlaceholder();
    }
  }

  render() {
    if (this._error) {
      return this._renderError();
    }

    return html`
      <div class="image-container">
        ${this._renderPlaceholder()} ${this._renderMainImage()}
      </div>
    `;
  }

  _renderMainImage() {
    return html`
      <img
        src=${this._getOptimizedUrl()}
        alt=${this.alt || ""}
        width=${this.width || ""}
        height=${this.height || ""}
        loading=${this.loading}
        decoding="async"
        class="main-image ${this._loaded ? "loaded" : ""}"
        @load=${this._handleLoad}
        @error=${this._handleError}
      />
    `;
  }

  _renderPlaceholder() {
    if (!this._placeholder && !this.placeholder) return null;

    const style =
      this.placeholder === "blur"
        ? `background-image: url(${this._placeholder})`
        : `background-color: ${this.placeholder}`;

    return html`
      <div
        class="placeholder ${this._loaded ? "hidden" : ""} ${!this._loaded
          ? "loading"
          : ""}"
        style=${style}
      ></div>
    `;
  }

  _renderError() {
    return html`
      <div class="error-container">
        <div>
          <div>⚠️</div>
          <div>Failed to load image</div>
        </div>
      </div>
    `;
  }

  _getOptimizedUrl() {
    return imageOptimizer.getOptimizedUrl(this.src, {
      width: this.width,
      height: this.height,
      quality: this.quality,
    });
  }

  async _generatePlaceholder() {
    try {
      // Generate tiny placeholder (10px wide)
      const placeholderUrl = imageOptimizer.getOptimizedUrl(this.src, {
        width: 10,
        quality: 20,
        blur: this.blur,
      });

      // Load placeholder image
      const response = await fetch(placeholderUrl);
      const blob = await response.blob();

      // Convert to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error generating placeholder:", error);
      return null;
    }
  }

  _handleLoad() {
    this._loaded = true;
    this.dispatchEvent(new CustomEvent("load"));
  }

  _handleError() {
    this._error = true;
    this.dispatchEvent(new CustomEvent("error"));
  }
}

customElements.define("optimized-image", OptimizedImage);
