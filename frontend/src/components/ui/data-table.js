import { LitElement, html, css } from "lit";
import { baseStyles } from "../styles/base.js";

/**
 * A data table component that supports sorting, filtering, and pagination
 * @customElement neo-data-table
 */
export class DataTable extends LitElement {
  static properties = {
    data: { type: Array },
    columns: { type: Array },
    sortField: { type: String },
    sortDirection: { type: String },
    filter: { type: String },
    page: { type: Number },
    pageSize: { type: Number },
    selectedRows: { type: Array },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        width: 100%;
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
      }

      th,
      td {
        padding: var(--spacing-md, 1rem);
        text-align: left;
        border-bottom: 1px solid var(--color-border, #e5e7eb);
      }

      th {
        background: var(--color-surface-hover, #f5f5f5);
        font-weight: 500;
        cursor: pointer;
        user-select: none;
      }

      th:hover {
        background: var(--color-surface-hover-dark, #e5e7eb);
      }

      tr:hover td {
        background: var(--color-surface-hover, #f5f5f5);
      }

      .sort-indicator {
        display: inline-block;
        margin-left: var(--spacing-sm, 0.5rem);
      }

      .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-md, 1rem);
        background: var(--color-surface, #ffffff);
        border-top: 1px solid var(--color-border, #e5e7eb);
      }

      .pagination-info {
        color: var(--color-text-secondary, #6b7280);
      }

      .pagination-controls {
        display: flex;
        gap: var(--spacing-sm, 0.5rem);
      }

      button {
        padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
        border: none;
        border-radius: var(--radius-sm, 0.25rem);
        background: var(--color-surface-hover, #f5f5f5);
        cursor: pointer;
        transition: background 0.2s ease;
      }

      button:hover:not(:disabled) {
        background: var(--color-surface-hover-dark, #e5e7eb);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .filter-container {
        margin-bottom: var(--spacing-md, 1rem);
      }

      input {
        width: 100%;
        padding: var(--spacing-sm, 0.5rem);
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: var(--radius-sm, 0.25rem);
      }
    `,
  ];

  constructor() {
    super();
    this.data = [];
    this.columns = [];
    this.sortField = "";
    this.sortDirection = "asc";
    this.filter = "";
    this.page = 1;
    this.pageSize = 10;
    this.selectedRows = [];
  }

  _handleSort(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }
    this.requestUpdate();
  }

  _handleFilter(e) {
    this.filter = e.target.value;
    this.page = 1;
    this.requestUpdate();
  }

  _handleRowClick(row) {
    const index = this.selectedRows.findIndex(
      (selected) => selected.id === row.id
    );
    if (index === -1) {
      this.selectedRows = [...this.selectedRows, row];
    } else {
      this.selectedRows = this.selectedRows.filter(
        (selected) => selected.id !== row.id
      );
    }
    this.dispatchEvent(
      new CustomEvent("row-select", {
        detail: { row, selected: index === -1 },
      })
    );
  }

  _handlePageChange(newPage) {
    this.page = newPage;
    this.requestUpdate();
  }

  _getFilteredData() {
    if (!this.filter) return this.data;
    const lowercaseFilter = this.filter.toLowerCase();
    return this.data.filter((row) =>
      Object.values(row).some(
        (value) =>
          value && value.toString().toLowerCase().includes(lowercaseFilter)
      )
    );
  }

  _getSortedData(filteredData) {
    if (!this.sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[this.sortField];
      const bValue = b[this.sortField];
      const modifier = this.sortDirection === "asc" ? 1 : -1;
      if (aValue < bValue) return -1 * modifier;
      if (aValue > bValue) return 1 * modifier;
      return 0;
    });
  }

  _getPaginatedData(sortedData) {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return sortedData.slice(start, end);
  }

  render() {
    const filteredData = this._getFilteredData();
    const sortedData = this._getSortedData(filteredData);
    const paginatedData = this._getPaginatedData(sortedData);
    const totalPages = Math.ceil(sortedData.length / this.pageSize);

    return html`
      <div class="filter-container">
        <input
          type="text"
          placeholder="Filter..."
          .value=${this.filter}
          @input=${this._handleFilter}
        />
      </div>

      <table>
        <thead>
          <tr>
            ${this.columns.map(
              (column) => html`
                <th @click=${() => this._handleSort(column.field)}>
                  ${column.title}
                  ${this.sortField === column.field
                    ? html`
                        <span class="sort-indicator">
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
          ${paginatedData.map(
            (row) => html`
              <tr
                @click=${() => this._handleRowClick(row)}
                class=${this.selectedRows.some(
                  (selected) => selected.id === row.id
                )
                  ? "selected"
                  : ""}
              >
                ${this.columns.map(
                  (column) => html` <td>${row[column.field]}</td> `
                )}
              </tr>
            `
          )}
        </tbody>
      </table>

      <div class="pagination">
        <div class="pagination-info">
          Showing ${(this.page - 1) * this.pageSize + 1} to
          ${Math.min(this.page * this.pageSize, sortedData.length)} of
          ${sortedData.length} entries
        </div>
        <div class="pagination-controls">
          <button
            @click=${() => this._handlePageChange(1)}
            ?disabled=${this.page === 1}
          >
            First
          </button>
          <button
            @click=${() => this._handlePageChange(this.page - 1)}
            ?disabled=${this.page === 1}
          >
            Previous
          </button>
          <button
            @click=${() => this._handlePageChange(this.page + 1)}
            ?disabled=${this.page === totalPages}
          >
            Next
          </button>
          <button
            @click=${() => this._handlePageChange(totalPages)}
            ?disabled=${this.page === totalPages}
          >
            Last
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define("neo-data-table", DataTable);
