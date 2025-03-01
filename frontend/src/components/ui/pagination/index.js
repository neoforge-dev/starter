import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class Pagination extends LitElement {
  static get properties() {
    return {
      currentPage: { type: Number },
      totalPages: { type: Number },
      visiblePages: { type: Number },
      disabled: { type: Boolean },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
        padding: 0 0.5rem;
        border: 1px solid var(--color-border, #e0e0e0);
        background: var(--color-surface, white);
        color: var(--color-text, #333);
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      button:hover:not(:disabled) {
        background: var(--color-hover, #f5f5f5);
        border-color: var(--color-primary, #2196f3);
        color: var(--color-primary, #2196f3);
      }

      button.active {
        background: var(--color-primary, #2196f3);
        border-color: var(--color-primary, #2196f3);
        color: white;
      }

      button:disabled {
        background: var(--color-disabled, #f5f5f5);
        border-color: var(--color-border, #e0e0e0);
        color: var(--color-text-disabled, #999);
        cursor: not-allowed;
      }

      .ellipsis {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
        color: var(--color-text-secondary, #666);
      }

      @media (max-width: 480px) {
        button.page-number:not(.active) {
          display: none;
        }

        button.prev,
        button.next {
          padding: 0 1rem;
        }
      }
    `;
  }

  constructor() {
    super();
    this.currentPage = 1;
    this.totalPages = 1;
    this.visiblePages = 5;
    this.disabled = false;
  }

  getVisiblePageNumbers() {
    const pages = [];
    const halfVisible = Math.floor(this.visiblePages / 2);
    let start = Math.max(1, this.currentPage - halfVisible);
    let end = Math.min(this.totalPages, start + this.visiblePages - 1);

    if (end - start + 1 < this.visiblePages) {
      start = Math.max(1, end - this.visiblePages + 1);
    }

    // Always show first page
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push("...");
      }
    }

    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Always show last page
    if (end < this.totalPages) {
      if (end < this.totalPages - 1) {
        pages.push("...");
      }
      pages.push(this.totalPages);
    }

    return pages;
  }

  handlePageClick(page) {
    if (page === this.currentPage || this.disabled) return;

    this.currentPage = page;
    this.dispatchEvent(
      new CustomEvent("page-change", {
        detail: { page: this.currentPage },
      })
    );
  }

  handlePrevClick() {
    if (this.currentPage > 1 && !this.disabled) {
      this.handlePageClick(this.currentPage - 1);
    }
  }

  handleNextClick() {
    if (this.currentPage < this.totalPages && !this.disabled) {
      this.handlePageClick(this.currentPage + 1);
    }
  }

  render() {
    const pages = this.getVisiblePageNumbers();

    return html`
      <div class="pagination">
        <button
          class="prev"
          ?disabled=${this.currentPage === 1 || this.disabled}
          @click=${this.handlePrevClick}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        ${pages.map((page) => {
          if (page === "...") {
            return html`<span class="ellipsis">...</span>`;
          }
          return html`
            <button
              class="page-number ${page === this.currentPage ? "active" : ""}"
              ?disabled=${this.disabled}
              @click=${() => this.handlePageClick(page)}
            >
              ${page}
            </button>
          `;
        })}

        <button
          class="next"
          ?disabled=${this.currentPage === this.totalPages || this.disabled}
          @click=${this.handleNextClick}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    `;
  }
}

customElements.define("neo-pagination", Pagination);
