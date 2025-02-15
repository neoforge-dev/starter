import { LitElement, html, css } from "lit";
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
  static get properties() {
    return {
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
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
        }

        .table-container {
          overflow-x: auto;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        th,
        td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--color-border);
        }

        th {
          background-color: var(--color-surface-variant);
          font-weight: 600;
          white-space: nowrap;
        }

        td {
          background-color: var(--color-surface);
        }

        tr:last-child td {
          border-bottom: none;
        }

        /* Sortable columns */
        .sortable {
          cursor: pointer;
          user-select: none;
        }

        .sortable:hover {
          background-color: var(--color-surface-hover);
        }

        .sort-icon {
          margin-left: 4px;
          opacity: 0.5;
        }

        .sort-icon.active {
          opacity: 1;
        }

        /* Selectable rows */
        .checkbox-cell {
          width: 48px;
          text-align: center;
        }

        tr.selected td {
          background-color: var(--color-primary-light);
        }

        /* Empty state */
        .empty-message {
          padding: 32px;
          text-align: center;
          color: var(--color-text-secondary);
        }

        /* Filters */
        .filter-row th {
          padding: 8px 16px;
          background-color: var(--color-surface);
        }

        .filter-input {
          width: 100%;
          padding: 4px 8px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 14px;
        }

        .filter-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        /* Pagination */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background-color: var(--color-surface);
          border-top: 1px solid var(--color-border);
        }

        .page-info {
          color: var(--color-text-secondary);
          font-size: 14px;
        }

        .page-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .page-button {
          padding: 4px 8px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: none;
          cursor: pointer;
        }

        .page-button:hover:not(:disabled) {
          background-color: var(--color-surface-hover);
        }

        .page-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-button.active {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
      `,
    ];
  }

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
    this._sortColumn = "";
    this._sortDirection = "asc";
    this._filters = {};
    this._allSelected = false;
  }

  get visibleData() {
    let result = [...this.data];

    // Apply filters
    if (this.filterable) {
      Object.entries(this._filters).forEach(([key, value]) => {
        if (value) {
          result = result.filter((item) =>
            String(item[key]).toLowerCase().includes(value.toLowerCase())
          );
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
