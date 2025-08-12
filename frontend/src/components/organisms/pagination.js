import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../../styles/base.js";

export class PaginationComponent extends LitElement {
  static properties = {
    currentPage: { type: Number },
    totalPages: { type: Number },
    siblingCount: { type: Number },
    boundaryCount: { type: Number },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .pagination {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .page-item {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 32px;
        padding: 0 var(--space-2);
        border-radius: var(--radius-1);
        font-size: var(--text-sm);
        color: var(--text-2);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .page-item:hover {
        background: var(--surface-2);
        color: var(--text-1);
      }

      .page-item.active {
        background: var(--brand);
        color: white;
      }

      .page-item.disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      .ellipsis {
        color: var(--text-2);
        pointer-events: none;
      }

      /* Responsive */
      @media (max-width: 640px) {
        .pagination {
          justify-content: center;
        }

        .page-item {
          min-width: 28px;
          height: 28px;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.currentPage = 1;
    this.totalPages = 1;
    this.siblingCount = 1;
    this.boundaryCount = 1;
  }

  _range(start, end) {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  }

  _getPageNumbers() {
    const totalPageNumbers = this.siblingCount * 2 + 3 + this.boundaryCount * 2;

    if (totalPageNumbers >= this.totalPages) {
      return this._range(1, this.totalPages);
    }

    const leftSiblingIndex = Math.max(
      this.currentPage - this.siblingCount,
      this.boundaryCount + 1
    );
    const rightSiblingIndex = Math.min(
      this.currentPage + this.siblingCount,
      this.totalPages - this.boundaryCount
    );

    const shouldShowLeftDots = leftSiblingIndex > this.boundaryCount + 2;
    const shouldShowRightDots =
      rightSiblingIndex < this.totalPages - (this.boundaryCount + 1);

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * this.siblingCount;
      const leftRange = this._range(1, leftItemCount);
      return [...leftRange, "...", this.totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * this.siblingCount;
      const rightRange = this._range(
        this.totalPages - rightItemCount + 1,
        this.totalPages
      );
      return [1, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = this._range(leftSiblingIndex, rightSiblingIndex);
      return [1, "...", ...middleRange, "...", this.totalPages];
    }
  }

  _handlePageChange(page) {
    if (page === this.currentPage) return;

    this.currentPage = page;
    this.dispatchEvent(
      new CustomEvent("page-change", {
        detail: { page },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const pages = this._getPageNumbers();

    return html`
      <nav class="pagination" aria-label="Pagination">
        <!-- Previous button -->
        <div
          class="page-item ${this.currentPage === 1 ? "disabled" : ""}"
          @click=${() => this._handlePageChange(this.currentPage - 1)}
          aria-label="Previous page"
        >
          <span class="material-icons">chevron_left</span>
        </div>

        ${pages.map(
          (page) => html`
            ${page === "..."
              ? html`<span class="page-item ellipsis">...</span>`
              : html`
                  <div
                    class="page-item ${page === this.currentPage
                      ? "active"
                      : ""}"
                    @click=${() => this._handlePageChange(page)}
                    aria-label="Page ${page}"
                    aria-current=${page === this.currentPage ? "page" : null}
                  >
                    ${page}
                  </div>
                `}
          `
        )}

        <!-- Next button -->
        <div
          class="page-item ${this.currentPage === this.totalPages
            ? "disabled"
            : ""}"
          @click=${() => this._handlePageChange(this.currentPage + 1)}
          aria-label="Next page"
        >
          <span class="material-icons">chevron_right</span>
        </div>
      </nav>
    `;
  }
}

customElements.define("neo-pagination", PaginationComponent);
