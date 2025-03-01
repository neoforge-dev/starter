import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class Testimonials extends LitElement {
  static get properties() {
    return {
      items: { type: Array },
      layout: { type: String },
      variant: { type: String },
      columns: { type: Number },
      autoplay: { type: Boolean },
      interval: { type: Number },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        font-family: system-ui, sans-serif;
      }

      .testimonials {
        width: 100%;
      }

      /* Grid Layout */
      .layout-grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(var(--testimonials-columns, 3), 1fr);
      }

      /* Carousel Layout */
      .layout-carousel {
        position: relative;
        overflow: hidden;
      }

      .carousel-container {
        display: flex;
        transition: transform 0.5s ease;
      }

      .carousel-item {
        flex: 0 0 100%;
        padding: 0 1rem;
      }

      .carousel-controls {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;
      }

      .carousel-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--testimonials-dot-color, #e5e7eb);
        cursor: pointer;
        transition: background-color 0.3s ease;
      }

      .carousel-dot.active {
        background-color: var(--testimonials-dot-active-color, #2563eb);
      }

      /* Masonry Layout */
      .layout-masonry {
        columns: var(--testimonials-columns, 3);
        gap: 2rem;
      }

      .masonry-item {
        break-inside: avoid;
        margin-bottom: 2rem;
      }

      /* Featured Layout */
      .layout-featured {
        display: grid;
        gap: 2rem;
        grid-template-columns: 2fr 1fr;
      }

      .featured-main {
        grid-column: 1 / -1;
      }

      .featured-secondary {
        display: grid;
        gap: 2rem;
      }

      /* Testimonial Card Variants */
      .testimonial {
        padding: 2rem;
        border-radius: 1rem;
        height: 100%;
      }

      /* Default Variant */
      .variant-default {
        background-color: white;
        box-shadow:
          0 4px 6px -1px rgb(0 0 0 / 0.1),
          0 2px 4px -2px rgb(0 0 0 / 0.1);
      }

      /* Minimal Variant */
      .variant-minimal {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
      }

      /* Card Variant */
      .variant-card {
        background-color: white;
        box-shadow:
          0 10px 15px -3px rgb(0 0 0 / 0.1),
          0 4px 6px -4px rgb(0 0 0 / 0.1);
        transform: translateY(0);
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease;
      }

      .variant-card:hover {
        transform: translateY(-4px);
        box-shadow:
          0 20px 25px -5px rgb(0 0 0 / 0.1),
          0 8px 10px -6px rgb(0 0 0 / 0.1);
      }

      /* Quote Variant */
      .variant-quote {
        position: relative;
        background-color: #f8fafc;
        border-left: 4px solid #2563eb;
      }

      .variant-quote::before {
        content: '"';
        position: absolute;
        top: 1rem;
        left: 1rem;
        font-size: 4rem;
        color: #2563eb;
        opacity: 0.2;
        font-family: serif;
      }

      /* Testimonial Content */
      .testimonial-content {
        font-size: 1.125rem;
        line-height: 1.75;
        color: #1f2937;
        margin-bottom: 1.5rem;
      }

      .testimonial-author {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .author-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }

      .author-info {
        flex: 1;
      }

      .author-name {
        font-weight: 600;
        color: #111827;
        margin: 0;
      }

      .author-meta {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
      }

      .testimonial-rating {
        display: flex;
        gap: 0.25rem;
        margin-top: 0.5rem;
      }

      .star {
        color: #fbbf24;
      }

      /* Responsive Design */
      @media (max-width: 1024px) {
        .layout-grid,
        .layout-masonry {
          --testimonials-columns: 2;
        }

        .layout-featured {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .layout-grid,
        .layout-masonry {
          --testimonials-columns: 1;
        }

        .testimonial {
          padding: 1.5rem;
        }

        .testimonial-content {
          font-size: 1rem;
        }
      }
    `;
  }

  constructor() {
    super();
    this.items = [];
    this.layout = "grid";
    this.variant = "default";
    this.columns = 3;
    this.autoplay = false;
    this.interval = 5000;
    this._currentSlide = 0;
    this._autoplayInterval = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._startAutoplay();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopAutoplay();
  }

  _startAutoplay() {
    if (this.autoplay && this.layout === "carousel" && this.items.length > 1) {
      this._stopAutoplay(); // Clear any existing interval first
      this._autoplayInterval = setInterval(() => {
        this._nextSlide();
      }, this.interval);
    }
  }

  _stopAutoplay() {
    if (this._autoplayInterval) {
      clearInterval(this._autoplayInterval);
      this._autoplayInterval = null;
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("autoplay") || changedProperties.has("layout")) {
      this._startAutoplay();
    }
  }

  _nextSlide() {
    this._currentSlide = (this._currentSlide + 1) % this.items.length;
    this.requestUpdate();
  }

  _prevSlide() {
    this._currentSlide =
      (this._currentSlide - 1 + this.items.length) % this.items.length;
    this.requestUpdate();
  }

  _goToSlide(index) {
    this._currentSlide = index;
    this.requestUpdate();
  }

  _renderStars(rating) {
    return html`
      <div class="testimonial-rating">
        ${Array(5)
          .fill(0)
          .map(
            (_, i) => html`
              <span class="star ${i < rating ? "star-filled" : "star-empty"}"
                >★</span
              >
            `
          )}
      </div>
    `;
  }

  _renderTestimonial(item) {
    return html`
      <div class="testimonial variant-${this.variant}">
        <p class="testimonial-content">${item.content}</p>
        <div class="testimonial-author">
          ${item.avatar
            ? html`<img
                class="author-avatar"
                src="${item.avatar}"
                alt="${item.author}"
              />`
            : ""}
          <div class="author-info">
            <p class="author-name">${item.author}</p>
            <p class="author-meta">${item.role} at ${item.company}</p>
            ${item.rating ? this._renderStars(item.rating) : ""}
          </div>
        </div>
      </div>
    `;
  }

  _renderGrid() {
    return html`
      <div
        class="testimonials-grid"
        style="grid-template-columns: repeat(${this.columns}, 1fr)"
      >
        ${this.items.map((item) => this._renderTestimonial(item))}
      </div>
    `;
  }

  _renderCarousel() {
    return html`
      <div
        class="testimonials-carousel"
        role="region"
        aria-label="Testimonials"
        tabindex="0"
        @keydown=${(e) => {
          if (e.key === "ArrowLeft") this._prevSlide();
          if (e.key === "ArrowRight") this._nextSlide();
        }}
      >
        <div
          class="carousel-container"
          style="transform: translateX(-${this._currentSlide * 100}%)"
          role="list"
        >
          ${this.items.map(
            (item, index) => html`
              <div
                class="carousel-item"
                role="listitem"
                aria-current="${index === this._currentSlide}"
              >
                ${this._renderTestimonial(item)}
              </div>
            `
          )}
        </div>
        <div
          class="carousel-controls"
          role="group"
          aria-label="Carousel Navigation"
        >
          <button
            class="carousel-prev"
            @click=${this._prevSlide}
            aria-label="Previous testimonial"
          >
            ←
          </button>
          ${this.items.map(
            (_, i) => html`
              <button
                class="carousel-dot ${i === this._currentSlide ? "active" : ""}"
                @click=${() => this._goToSlide(i)}
                aria-label="Go to testimonial ${i + 1}"
                aria-current="${i === this._currentSlide}"
              ></button>
            `
          )}
          <button
            class="carousel-next"
            @click=${this._nextSlide}
            aria-label="Next testimonial"
          >
            →
          </button>
        </div>
      </div>
    `;
  }

  _renderMasonry() {
    return html`
      <div class="testimonials-masonry">
        ${this.items.map(
          (item) => html`
            <div class="masonry-item">${this._renderTestimonial(item)}</div>
          `
        )}
      </div>
    `;
  }

  _renderFeatured() {
    const [featured, ...rest] = this.items;
    return html`
      <div class="layout-featured">
        <div class="featured-main">${this._renderTestimonial(featured)}</div>
        <div class="featured-secondary">
          ${rest.map((item) => this._renderTestimonial(item))}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.items.length) {
      return html`<div class="empty-message">No testimonials available</div>`;
    }

    switch (this.layout) {
      case "carousel":
        return this._renderCarousel();
      case "masonry":
        return this._renderMasonry();
      case "grid":
      default:
        return this._renderGrid();
    }
  }
}

customElements.define("ui-testimonials", Testimonials);
