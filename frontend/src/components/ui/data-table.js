import { LitElement, html, css } from "lit";

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
        background: var(--color-background);
        border-radius: 8px;
        overflow: hidden;
      }

      th,
      td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid var(--color-border);
      }

      th {
        background: var(--color-surface);
        font-weight: 600;
        cursor: pointer;
        user-select: none;
      }

      th:hover {
        background: var(--color-surface-hover);
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover {
        background: var(--color-surface-hover);
      }

      .pagination {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: 16px;
        gap: 8px;
      }

      button {
        padding: 8px 16px;
        border: none;
        background: var(--color-primary);
        color: white;
        border-radius: 4px;
        cursor: pointer;
      }

      button:disabled {
        background: var(--color-disabled);
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
  }

  handlePageChange(change) {
    const newPage = this.currentPage + change;
    const maxPage = Math.ceil(this.data.length / this.pageSize);

    if (newPage >= 1 && newPage <= maxPage) {
      this.currentPage = newPage;
    }
  }

  getSortedData() {
    if (!this.sortColumn) return this.data;

    return [...this.data].sort((a, b) => {
      const aVal = a[this.sortColumn];
      const bVal = b[this.sortColumn];

      if (this.sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  getPagedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.getSortedData().slice(start, end);
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
                  >
                  </span>
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
