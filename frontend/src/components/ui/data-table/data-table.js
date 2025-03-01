import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

export class NeoDataTable extends LitElement {
  static properties = {
    data: { type: Array },
    columns: { type: Array },
    sortField: { type: String },
    sortDirection: { type: String },
    pageSize: { type: Number },
    currentPage: { type: Number },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--font-family);
      }

      th,
      td {
        padding: var(--spacing-sm) var(--spacing-md);
        text-align: left;
        border-bottom: 1px solid var(--color-border);
      }

      th {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text);
        cursor: pointer;
        user-select: none;
      }

      td {
        color: var(--color-text-secondary);
      }

      tr:hover td {
        background-color: rgba(0, 0, 0, 0.02);
      }

      .pagination {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
      }

      .pagination button {
        padding: var(--spacing-xs) var(--spacing-sm);
        border: 1px solid var(--color-border);
        background: var(--color-background);
        color: var(--color-text);
        border-radius: var(--radius-sm);
        cursor: pointer;
      }

      .pagination button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ];

  constructor() {
    super();
    this.data = [];
    this.columns = [];
    this.sortField = "";
    this.sortDirection = "asc";
    this.pageSize = 10;
    this.currentPage = 1;
  }

  _handleSort(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }

    this.dispatchEvent(
      new CustomEvent("sort", {
        detail: { field: this.sortField, direction: this.sortDirection },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handlePageChange(page) {
    this.currentPage = page;
    this.dispatchEvent(
      new CustomEvent("page-change", {
        detail: { page: this.currentPage },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const pageData = this.data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(this.data.length / this.pageSize);

    return html`
      <table>
        <thead>
          <tr>
            ${this.columns.map(
              (column) => html`
                <th
                  @click=${() => this._handleSort(column.field)}
                  data-field=${column.field}
                >
                  ${column.header}
                  ${this.sortField === column.field
                    ? html`
                        <span>
                          ${this.sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      `
                    : ""}
                </th>
              `
            )}
          </tr>
        </thead>
        <tbody>
          ${pageData.map(
            (row) => html`
              <tr>
                ${this.columns.map(
                  (column) => html`
                    <td data-field=${column.field}>${row[column.field]}</td>
                  `
                )}
              </tr>
            `
          )}
        </tbody>
      </table>

      <div class="pagination">
        <button
          ?disabled=${this.currentPage === 1}
          @click=${() => this._handlePageChange(this.currentPage - 1)}
          class="pagination-prev"
        >
          Previous
        </button>
        <span>${this.currentPage} of ${totalPages}</span>
        <button
          ?disabled=${this.currentPage === totalPages}
          @click=${() => this._handlePageChange(this.currentPage + 1)}
          class="pagination-next"
        >
          Next
        </button>
      </div>
    `;
  }
}

customElements.define("neo-data-table", NeoDataTable);
