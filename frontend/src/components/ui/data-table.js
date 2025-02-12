import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Enhanced data table component with sorting, filtering, pagination, and selection
 * @element neo-data-table
 *
 * @prop {Array} columns - Table columns configuration
 * @prop {Array} data - Table data
 * @prop {boolean} selectable - Enable row selection
 * @prop {boolean} sortable - Enable column sorting
 * @prop {boolean} filterable - Enable column filtering
 * @prop {boolean} pageable - Enable pagination
 * @prop {number} pageSize - Number of rows per page
 * @prop {Array} selected - Selected row IDs
 *
 * @fires sort - When a column is sorted
 * @fires filter - When a filter is applied
 * @fires page - When page is changed
 * @fires select - When rows are selected/deselected
 */
export class DataTable extends LitElement {
  static properties = {
    columns: { type: Array },
    data: { type: Array },
    selectable: { type: Boolean },
    sortable: { type: Boolean },
    filterable: { type: Boolean },
    pageable: { type: Boolean },
    pageSize: { type: Number },
    currentPage: { type: Number, state: true },
    sortField: { type: String, state: true },
    sortDirection: { type: String, state: true },
    filters: { type: Object, state: true },
    selected: { type: Array },
    loading: { type: Boolean, reflect: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        overflow: hidden;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
      }

      .table-container {
        overflow-x: auto;
        min-height: 200px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--font-size-sm);
      }

      th,
      td {
        padding: var(--spacing-sm) var(--spacing-md);
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      th {
        background: var(--surface-color);
        font-weight: var(--font-weight-semibold);
        color: var(--text-secondary);
        white-space: nowrap;
        position: sticky;
        top: 0;
        z-index: 1;
      }

      tr:hover td {
        background: color-mix(in srgb, var(--primary-color) 5%, transparent);
      }

      .sortable {
        cursor: pointer;
        user-select: none;
      }

      .sortable:hover {
        background: color-mix(
          in srgb,
          var(--primary-color) 5%,
          var(--surface-color)
        );
      }

      .sort-icon {
        display: inline-block;
        width: 16px;
        height: 16px;
        margin-left: var(--spacing-xs);
        opacity: 0.5;
      }

      .sort-active {
        color: var(--primary-color);
      }

      .sort-active .sort-icon {
        opacity: 1;
      }

      .checkbox-cell {
        width: 40px;
        text-align: center;
      }

      .table-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-sm) var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
        background: var(--surface-color);
      }

      .table-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-sm) var(--spacing-md);
        border-top: 1px solid var(--border-color);
        background: var(--surface-color);
      }

      .pagination {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .page-info {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
      }

      button {
        padding: var(--spacing-xs) var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--surface-color);
        color: var(--text-color);
        cursor: pointer;
      }

      button:hover {
        background: color-mix(
          in srgb,
          var(--primary-color) 5%,
          var(--surface-color)
        );
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .filter-row th {
        padding: var(--spacing-xs) var(--spacing-md);
        border-top: 1px solid var(--border-color);
      }

      .filter-input {
        width: 100%;
        padding: var(--spacing-xs);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-sm);
      }

      :host([loading]) .table-container {
        opacity: 0.5;
        pointer-events: none;
      }

      @media (max-width: 640px) {
        .table-toolbar,
        .table-footer {
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .pagination {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.columns = [];
    this.data = [];
    this.selectable = false;
    this.sortable = false;
    this.filterable = false;
    this.pageable = false;
    this.pageSize = 10;
    this.currentPage = 1;
    this.sortField = "";
    this.sortDirection = "asc";
    this.filters = {};
    this.selected = [];
    this.loading = false;
  }

  /**
   * Get filtered, sorted, and paginated data
   */
  get processedData() {
    let result = [...this.data];

    // Apply filters
    if (this.filterable) {
      Object.entries(this.filters).forEach(([field, value]) => {
        if (value) {
          result = result.filter((item) => {
            const fieldValue = String(item[field] || "").toLowerCase();
            return fieldValue.includes(value.toLowerCase());
          });
        }
      });
    }

    // Apply sorting
    if (this.sortable && this.sortField) {
      result.sort((a, b) => {
        let aVal = a[this.sortField];
        let bVal = b[this.sortField];

        // Handle null values
        if (aVal === null) return 1;
        if (bVal === null) return -1;

        // Convert to strings for comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();

        if (aVal < bVal) return this.sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Get total count before pagination
    this.totalItems = result.length;

    // Apply pagination
    if (this.pageable) {
      const start = (this.currentPage - 1) * this.pageSize;
      result = result.slice(start, start + this.pageSize);
    }

    return result;
  }

  /**
   * Handle sort click
   * @param {string} field - Field to sort by
   */
  handleSort(field) {
    if (!this.sortable) return;

    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }

    this.dispatchEvent(
      new CustomEvent("sort", {
        detail: { field, direction: this.sortDirection },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle filter change
   * @param {string} field - Field to filter
   * @param {string} value - Filter value
   */
  handleFilter(field, value) {
    this.filters = {
      ...this.filters,
      [field]: value,
    };

    // Reset to first page when filtering
    this.currentPage = 1;

    this.dispatchEvent(
      new CustomEvent("filter", {
        detail: { field, value },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle page change
   * @param {number} page - Page number
   */
  handlePageChange(page) {
    this.currentPage = page;
    this.dispatchEvent(
      new CustomEvent("page", {
        detail: { page, pageSize: this.pageSize },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle row selection
   * @param {string} id - Row ID
   * @param {boolean} checked - Selection state
   */
  handleSelect(id, checked) {
    if (checked) {
      this.selected = [...this.selected, id];
    } else {
      this.selected = this.selected.filter((item) => item !== id);
    }

    this.dispatchEvent(
      new CustomEvent("select", {
        detail: { selected: this.selected },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle select all
   * @param {boolean} checked - Selection state
   */
  handleSelectAll(checked) {
    if (checked) {
      this.selected = this.processedData.map((row) => row.id);
    } else {
      this.selected = [];
    }

    this.dispatchEvent(
      new CustomEvent("select", {
        detail: { selected: this.selected },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Render table header
   */
  renderHeader() {
    return html`
      <tr>
        ${this.selectable
          ? html`
              <th class="checkbox-cell">
                <input
                  type="checkbox"
                  .checked=${this.selected.length === this.processedData.length}
                  .indeterminate=${this.selected.length > 0 &&
                  this.selected.length < this.processedData.length}
                  @change=${(e) => this.handleSelectAll(e.target.checked)}
                />
              </th>
            `
          : ""}
        ${this.columns.map(
          (col) => html`
            <th
              class=${this.sortable ? "sortable" : ""}
              @click=${() => this.handleSort(col.field)}
            >
              ${col.header}
              ${this.sortable && this.sortField === col.field
                ? html`
                    <span class="sort-icon">
                      ${this.sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  `
                : ""}
            </th>
          `
        )}
      </tr>
    `;
  }

  /**
   * Render filter row
   */
  renderFilters() {
    if (!this.filterable) return "";

    return html`
      <tr class="filter-row">
        ${this.selectable ? html`<th></th>` : ""}
        ${this.columns.map(
          (col) => html`
            <th>
              <input
                class="filter-input"
                type="text"
                .value=${this.filters[col.field] || ""}
                @input=${(e) => this.handleFilter(col.field, e.target.value)}
                placeholder="Filter ${col.header.toLowerCase()}"
              />
            </th>
          `
        )}
      </tr>
    `;
  }

  /**
   * Render pagination
   */
  renderPagination() {
    if (!this.pageable) return "";

    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, this.totalItems);

    return html`
      <div class="table-footer">
        <div class="page-info">
          Showing ${start} to ${end} of ${this.totalItems} entries
        </div>
        <div class="pagination">
          <button
            ?disabled=${this.currentPage === 1}
            @click=${() => this.handlePageChange(this.currentPage - 1)}
          >
            Previous
          </button>
          <span>${this.currentPage} of ${totalPages}</span>
          <button
            ?disabled=${this.currentPage === totalPages}
            @click=${() => this.handlePageChange(this.currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      ${this.filterable || this.selected.length > 0
        ? html`
            <div class="table-toolbar">
              ${this.selected.length > 0
                ? html`
                    <div>
                      ${this.selected.length}
                      row${this.selected.length === 1 ? "" : "s"} selected
                    </div>
                  `
                : ""}
            </div>
          `
        : ""}

      <div class="table-container">
        <table>
          <thead>
            ${this.renderHeader()} ${this.renderFilters()}
          </thead>
          <tbody>
            ${this.processedData.map(
              (row) => html`
                <tr>
                  ${this.selectable
                    ? html`
                        <td class="checkbox-cell">
                          <input
                            type="checkbox"
                            .checked=${this.selected.includes(row.id)}
                            @change=${(e) =>
                              this.handleSelect(row.id, e.target.checked)}
                          />
                        </td>
                      `
                    : ""}
                  ${this.columns.map(
                    (col) => html`
                      <td>
                        ${col.template
                          ? col.template(row[col.field], row)
                          : row[col.field]}
                      </td>
                    `
                  )}
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>

      ${this.renderPagination()}
    `;
  }
}

customElements.define("neo-data-table", DataTable);
