import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class DataTable extends LitElement {
  static get properties() {
    return {
      data: { type: Array },
      columns: { type: Array },
      sortColumn: { type: String },
      sortDirection: { type: String },
      pageSize: { type: Number },
      currentPage: { type: Number },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        background: var(--color-background, white);
        border: 1px solid var(--color-border, #e0e0e0);
      }

      th,
      td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid var(--color-border, #e0e0e0);
      }

      th {
        background: var(--color-surface, #f5f5f5);
        font-weight: 600;
        cursor: pointer;
        user-select: none;
      }

      th:hover {
        background: var(--color-surface-hover, #eeeeee);
      }

      tr:hover {
        background: var(--color-hover, #f9f9f9);
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: var(--color-surface, #f5f5f5);
      }

      .pagination button {
        padding: 6px 12px;
        border: none;
        background: var(--color-primary, #2196f3);
        color: white;
        border-radius: 4px;
        cursor: pointer;
      }

      .pagination button:disabled {
        background: var(--color-disabled, #cccccc);
        cursor: not-allowed;
      }

      .sort-icon::after {
        content: "↕";
        margin-left: 4px;
      }

      .sort-icon.asc::after {
        content: "↑";
      }

      .sort-icon.desc::after {
        content: "↓";
      }
    `;
  }

  constructor() {
    super();
    this.data = [];
    this.columns = [];
    this.sortColumn = "";
    this.sortDirection = "asc";
    this.pageSize = 10;
    this.currentPage = 1;
  }

  handleSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortColumn = column;
      this.sortDirection = "asc";
    }
    this.requestUpdate();
  }

  handlePageChange(delta) {
    const newPage = this.currentPage + delta;
    const maxPage = Math.ceil(this.data.length / this.pageSize);

    if (newPage >= 1 && newPage <= maxPage) {
      this.currentPage = newPage;
      this.requestUpdate();
    }
  }

  getSortedData() {
    if (!this.sortColumn) return this.data;

    return [...this.data].sort((a, b) => {
      const aVal = a[this.sortColumn];
      const bVal = b[this.sortColumn];

      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return this.sortDirection === "asc" ? comparison : -comparison;
    });
  }

  getPagedData() {
    const sorted = this.getSortedData();
    const start = (this.currentPage - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  }

  render() {
    const pagedData = this.getPagedData();
    const totalPages = Math.ceil(this.data.length / this.pageSize);

    return html`
      <table>
        <thead>
          <tr>
            ${this.columns.map(
              (column) => html`
                <th @click=${() => this.handleSort(column.field)}>
                  ${column.label}
                  <span
                    class="sort-icon ${this.sortColumn === column.field
                      ? this.sortDirection
                      : ""}"
                  ></span>
                </th>
              `
            )}
          </tr>
        </thead>
        <tbody>
          ${pagedData.map(
            (row) => html`
              <tr>
                ${this.columns.map(
                  (column) => html` <td>${row[column.field]}</td> `
                )}
              </tr>
            `
          )}
        </tbody>
      </table>
      <div class="pagination">
        <button
          ?disabled=${this.currentPage === 1}
          @click=${() => this.handlePageChange(-1)}
        >
          Previous
        </button>
        <span>Page ${this.currentPage} of ${totalPages}</span>
        <button
          ?disabled=${this.currentPage === totalPages}
          @click=${() => this.handlePageChange(1)}
        >
          Next
        </button>
      </div>
    `;
  }
}

customElements.define("neo-data-table", DataTable);
