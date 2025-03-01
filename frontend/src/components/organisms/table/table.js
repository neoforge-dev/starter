import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Table component for displaying and managing tabular data
 * @element neo-table
 *
 * @prop {Array} columns - Array of column definitions
 * @prop {Array} data - Array of data objects
 * @prop {Array} selected - Array of selected row IDs
 * @prop {boolean} selectable - Whether rows can be selected
 * @prop {boolean} sortable - Whether columns can be sorted
 * @prop {boolean} filterable - Whether columns can be filtered
 * @prop {boolean} paginated - Whether to show pagination
 * @prop {number} pageSize - Number of rows per page
 * @prop {number} currentPage - Current page number
 * @prop {string} emptyMessage - Message to show when no data
 */
export class NeoTable extends LitElement {
  static properties = {
    columns: { type: Array },
    data: { type: Array },
    selected: { type: Array },
    selectable: { type: Boolean },
    sortable: { type: Boolean },
    filterable: { type: Boolean },
    paginated: { type: Boolean },
    pageSize: { type: Number },
    currentPage: { type: Number },
    emptyMessage: { type: String },
    _sortColumn: { type: String, state: true },
    _sortDirection: { type: String, state: true },
    _filters: { type: Object, state: true },
    _allSelected: { type: Boolean, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .table-container {
        overflow-x: auto;
        width: 100%;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--border-radius, 0.375rem);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--font-size-sm, 0.875rem);
      }

      th,
      td {
        padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
        text-align: left;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
      }

      th {
        font-weight: 600;
        background-color: var(--color-bg-subtle, #f8fafc);
        position: relative;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tbody tr:hover {
        background-color: var(--color-bg-hover, #f1f5f9);
      }

      .sortable {
        cursor: pointer;
        user-select: none;
      }

      .sortable:hover {
        background-color: var(--color-bg-hover, #f1f5f9);
      }

      .sort-indicator {
        display: inline-block;
        margin-left: 0.25rem;
        transition: transform 0.2s ease;
      }

      .sort-asc .sort-indicator::after {
        content: "↑";
      }

      .sort-desc .sort-indicator::after {
        content: "↓";
      }

      .filter-container {
        margin-top: 0.5rem;
        display: flex;
        gap: 0.5rem;
      }

      .filter-input {
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--border-radius-sm, 0.25rem);
        font-size: var(--font-size-xs, 0.75rem);
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
        background-color: var(--color-bg-subtle, #f8fafc);
        border-top: 1px solid var(--color-border, #e2e8f0);
      }

      .pagination-info {
        font-size: var(--font-size-sm, 0.875rem);
      }

      .pagination-controls {
        display: flex;
        gap: 0.25rem;
      }

      .pagination-button {
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--border-radius-sm, 0.25rem);
        background-color: var(--color-bg, white);
        cursor: pointer;
        font-size: var(--font-size-xs, 0.75rem);
      }

      .pagination-button:hover:not(:disabled) {
        background-color: var(--color-bg-hover, #f1f5f9);
      }

      .pagination-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .pagination-button.active {
        background-color: var(--color-primary, #3b82f6);
        color: white;
        border-color: var(--color-primary, #3b82f6);
      }

      .checkbox-cell {
        width: 1.5rem;
      }

      .empty-message {
        padding: var(--spacing-6, 1.5rem);
        text-align: center;
        color: var(--color-text-muted, #64748b);
      }
    `,
  ];

  constructor() {
    super();
    this.columns = [];
    this.data = [];
    this.selected = [];
    this.selectable = false;
    this.sortable = false;
    this.filterable = false;
    this.paginated = false;
    this.pageSize = 10;
    this.currentPage = 1;
    this.emptyMessage = "No data available";
    this._sortColumn = null;
    this._sortDirection = "asc";
    this._filters = {};
    this._allSelected = false;
  }

  get visibleData() {
    let result = [...this.data];

    // Apply filters
    if (this.filterable && Object.keys(this._filters).length > 0) {
      Object.entries(this._filters).forEach(([key, value]) => {
        if (value) {
          result = result.filter((item) => {
            const itemValue = String(item[key] || "").toLowerCase();
            const filterValue = String(value).toLowerCase();
            return itemValue.includes(filterValue);
          });
        }
      });
    }

    // Apply sorting
    if (this.sortable && this._sortColumn) {
      result.sort((a, b) => {
        const aValue = a[this._sortColumn];
        const bValue = b[this._sortColumn];
        const direction = this._sortDirection === "asc" ? 1 : -1;

        if (typeof aValue === "number") {
          return (aValue - bValue) * direction;
        }
        return String(aValue).localeCompare(String(bValue)) * direction;
      });
    }

    // Apply pagination
    if (this.paginated) {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      result = result.slice(start, end);
    }

    return result;
  }

  get totalPages() {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  get filteredData() {
    let result = [...this.data];

    if (this.filterable) {
      Object.entries(this._filters).forEach(([key, value]) => {
        if (value) {
          result = result.filter((item) =>
            String(item[key]).toLowerCase().includes(value.toLowerCase())
          );
        }
      });
    }

    return result;
  }

  _handleSort(column) {
    if (!this.sortable || !column.sortable) return;

    if (this._sortColumn === column.key) {
      this._sortDirection = this._sortDirection === "asc" ? "desc" : "asc";
    } else {
      this._sortColumn = column.key;
      this._sortDirection = "asc";
    }

    this.dispatchEvent(
      new CustomEvent("neo-sort", {
        detail: {
          column: this._sortColumn,
          direction: this._sortDirection,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleFilter(column, value) {
    this._filters = {
      ...this._filters,
      [column.key]: value,
    };

    this.currentPage = 1;
    this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent("neo-filter", {
        detail: {
          filters: this._filters,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleRowSelect(row, checked) {
    const newSelected = checked
      ? [...this.selected, row.id]
      : this.selected.filter((id) => id !== row.id);

    this.selected = newSelected;
    this._allSelected = this.visibleData.every((row) =>
      this.selected.includes(row.id)
    );

    this.dispatchEvent(
      new CustomEvent("neo-select", {
        detail: {
          selected: this.selected,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSelectAll(checked) {
    this._allSelected = checked;
    this.selected = checked ? this.visibleData.map((row) => row.id) : [];

    this.dispatchEvent(
      new CustomEvent("neo-select", {
        detail: {
          selected: this.selected,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handlePageChange(page) {
    this.currentPage = page;

    this.dispatchEvent(
      new CustomEvent("neo-page", {
        detail: {
          page: this.currentPage,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.data.length) {
      return html` <div class="empty-message">${this.emptyMessage}</div> `;
    }

    return html`
      <div class="table-container">
        <table>
          <thead>
            <tr>
              ${this.selectable
                ? html`
                    <th class="checkbox-cell">
                      <input
                        type="checkbox"
                        .checked=${this._allSelected}
                        @change=${(e) =>
                          this._handleSelectAll(e.target.checked)}
                      />
                    </th>
                  `
                : ""}
              ${this.columns.map(
                (column) => html`
                  <th
                    class=${this.sortable && column.sortable ? "sortable" : ""}
                    @click=${() => this._handleSort(column)}
                  >
                    ${column.label}
                    ${this.sortable && column.sortable
                      ? html`
                          <span
                            class="material-icons sort-icon ${this
                              ._sortColumn === column.key
                              ? "active"
                              : ""}"
                          >
                            ${this._sortColumn === column.key
                              ? this._sortDirection === "asc"
                                ? "arrow_upward"
                                : "arrow_downward"
                              : "unfold_more"}
                          </span>
                        `
                      : ""}
                  </th>
                `
              )}
            </tr>
            ${this.filterable
              ? html`
                  <tr class="filter-row">
                    ${this.selectable ? html`<th></th>` : ""}
                    ${this.columns.map(
                      (column) => html`
                        <th>
                          ${column.filterable
                            ? html`
                                <input
                                  class="filter-input"
                                  type="text"
                                  placeholder="Filter ${column.label}"
                                  .value=${this._filters[column.key] || ""}
                                  @input=${(e) =>
                                    this._handleFilter(column, e.target.value)}
                                />
                              `
                            : ""}
                        </th>
                      `
                    )}
                  </tr>
                `
              : ""}
          </thead>
          <tbody>
            ${this.visibleData.map(
              (row) => html`
                <tr class=${this.selected.includes(row.id) ? "selected" : ""}>
                  ${this.selectable
                    ? html`
                        <td class="checkbox-cell">
                          <input
                            type="checkbox"
                            .checked=${this.selected.includes(row.id)}
                            @change=${(e) =>
                              this._handleRowSelect(row, e.target.checked)}
                          />
                        </td>
                      `
                    : ""}
                  ${this.columns.map(
                    (column) => html` <td>${row[column.key]}</td> `
                  )}
                </tr>
              `
            )}
          </tbody>
        </table>
        ${this.paginated
          ? html`
              <div class="pagination">
                <div class="page-info">
                  Showing ${(this.currentPage - 1) * this.pageSize + 1} to
                  ${Math.min(
                    this.currentPage * this.pageSize,
                    this.filteredData.length
                  )}
                  of ${this.filteredData.length} entries
                </div>
                <div class="page-controls">
                  <button
                    class="page-button"
                    ?disabled=${this.currentPage === 1}
                    @click=${() => this._handlePageChange(1)}
                  >
                    <span class="material-icons">first_page</span>
                  </button>
                  <button
                    class="page-button"
                    ?disabled=${this.currentPage === 1}
                    @click=${() => this._handlePageChange(this.currentPage - 1)}
                  >
                    <span class="material-icons">chevron_left</span>
                  </button>
                  ${Array.from(
                    { length: this.totalPages },
                    (_, i) => i + 1
                  ).map(
                    (page) => html`
                      <button
                        class="page-button ${page === this.currentPage
                          ? "active"
                          : ""}"
                        @click=${() => this._handlePageChange(page)}
                      >
                        ${page}
                      </button>
                    `
                  )}
                  <button
                    class="page-button"
                    ?disabled=${this.currentPage === this.totalPages}
                    @click=${() => this._handlePageChange(this.currentPage + 1)}
                  >
                    <span class="material-icons">chevron_right</span>
                  </button>
                  <button
                    class="page-button"
                    ?disabled=${this.currentPage === this.totalPages}
                    @click=${() => this._handlePageChange(this.totalPages)}
                  >
                    <span class="material-icons">last_page</span>
                  </button>
                </div>
              </div>
            `
          : ""}
      </div>
    `;
  }
}

customElements.define("neo-table", NeoTable);
