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
 * @prop {boolean} loading - Loading state
 * @prop {boolean} resizable - Enable column resizing
 * @prop {boolean} stickyHeader - Enable sticky header
 * @prop {string} emptyMessage - Message to show when no data
 * @prop {Object} filterOperators - Custom filter operators
 *
 * @fires sort - When a column is sorted
 * @fires filter - When a filter is applied
 * @fires page - When page is changed
 * @fires select - When rows are selected/deselected
 * @fires resize - When column is resized
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
    resizable: { type: Boolean },
    stickyHeader: { type: Boolean, reflect: true },
    emptyMessage: { type: String },
    filterOperators: { type: Object },
    _columnWidths: { type: Object, state: true },
    _resizingColumn: { type: String, state: true },
    _startX: { type: Number, state: true },
    _startWidth: { type: Number, state: true },
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
        position: relative;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--font-size-sm);
      }

      th {
        position: relative;
        background: var(--surface-color);
        font-weight: var(--font-weight-semibold);
        color: var(--text-secondary);
        white-space: nowrap;
        user-select: none;
      }

      :host([sticky-header]) th {
        position: sticky;
        top: 0;
        z-index: 1;
      }

      th,
      td {
        padding: var(--spacing-sm) var(--spacing-md);
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      tr:hover td {
        background: color-mix(in srgb, var(--primary-color) 5%, transparent);
      }

      .sortable {
        cursor: pointer;
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
        transition: transform var(--transition-fast);
      }

      .sort-active {
        color: var(--primary-color);
      }

      .sort-active .sort-icon {
        opacity: 1;
      }

      .sort-desc .sort-icon {
        transform: rotate(180deg);
      }

      .resizer {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: col-resize;
        user-select: none;
        background: var(--border-color);
        opacity: 0;
        transition: opacity var(--transition-fast);
      }

      th:hover .resizer {
        opacity: 0.5;
      }

      .resizer:hover,
      .resizer.resizing {
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

      .page-size-selector {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      button {
        padding: var(--spacing-xs) var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--surface-color);
        color: var(--text-color);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      button:hover:not(:disabled) {
        background: color-mix(
          in srgb,
          var(--primary-color) 5%,
          var(--surface-color)
        );
        border-color: var(--primary-color);
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
        transition: all var(--transition-fast);
      }

      .filter-input:focus {
        border-color: var(--primary-color);
        outline: none;
      }

      .filter-operator {
        width: 100%;
        margin-bottom: var(--spacing-xs);
      }

      :host([loading]) .table-container {
        opacity: 0.5;
        pointer-events: none;
      }

      .empty-message {
        padding: var(--spacing-xl);
        text-align: center;
        color: var(--text-tertiary);
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

        .page-size-selector {
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
    this.resizable = false;
    this.stickyHeader = false;
    this.emptyMessage = "No data available";
    this.filterOperators = {
      text: [
        { label: "Contains", value: "contains" },
        { label: "Equals", value: "equals" },
        { label: "Starts with", value: "startsWith" },
        { label: "Ends with", value: "endsWith" },
      ],
      number: [
        { label: "Equals", value: "equals" },
        { label: "Greater than", value: "gt" },
        { label: "Less than", value: "lt" },
        { label: "Between", value: "between" },
      ],
      date: [
        { label: "Equals", value: "equals" },
        { label: "After", value: "after" },
        { label: "Before", value: "before" },
        { label: "Between", value: "between" },
      ],
    };
    this._columnWidths = {};
    this._resizingColumn = null;
    this._startX = 0;
    this._startWidth = 0;

    // Bind methods
    this._handleResize = this._handleResize.bind(this);
    this._stopResize = this._stopResize.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("mousemove", this._handleResize);
    window.addEventListener("mouseup", this._stopResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("mousemove", this._handleResize);
    window.removeEventListener("mouseup", this._stopResize);
  }

  /**
   * Get filtered, sorted, and paginated data
   */
  get processedData() {
    let result = [...this.data];

    // Apply filters
    if (this.filterable) {
      Object.entries(this.filters).forEach(([field, filter]) => {
        if (filter && filter.value) {
          result = result.filter((item) => {
            const value = item[field];
            const filterValue = filter.value.toLowerCase();
            const operator = filter.operator || "contains";

            switch (operator) {
              case "equals":
                return String(value).toLowerCase() === filterValue;
              case "contains":
                return String(value).toLowerCase().includes(filterValue);
              case "startsWith":
                return String(value).toLowerCase().startsWith(filterValue);
              case "endsWith":
                return String(value).toLowerCase().endsWith(filterValue);
              case "gt":
                return Number(value) > Number(filterValue);
              case "lt":
                return Number(value) < Number(filterValue);
              case "between":
                const [min, max] = filterValue.split(",").map(Number);
                return Number(value) >= min && Number(value) <= max;
              case "after":
                return new Date(value) > new Date(filterValue);
              case "before":
                return new Date(value) < new Date(filterValue);
              default:
                return true;
            }
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

        // Handle different data types
        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = String(bVal).toLowerCase();
        } else if (typeof aVal === "number") {
          aVal = Number(aVal);
          bVal = Number(bVal);
        } else if (aVal instanceof Date) {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

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
   * Start column resize
   * @param {string} field - Column field
   * @param {MouseEvent} e - Mouse event
   */
  _startResize(field, e) {
    if (!this.resizable) return;

    const th = e.target.closest("th");
    this._resizingColumn = field;
    this._startX = e.pageX;
    this._startWidth = th.offsetWidth;

    this.dispatchEvent(
      new CustomEvent("resize-start", {
        detail: { field, width: this._startWidth },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle column resize
   * @param {MouseEvent} e - Mouse event
   */
  _handleResize(e) {
    if (!this._resizingColumn) return;

    const diff = e.pageX - this._startX;
    const newWidth = Math.max(100, this._startWidth + diff);
    this._columnWidths = {
      ...this._columnWidths,
      [this._resizingColumn]: newWidth,
    };

    this.dispatchEvent(
      new CustomEvent("resize", {
        detail: {
          field: this._resizingColumn,
          width: newWidth,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Stop column resize
   */
  _stopResize() {
    if (!this._resizingColumn) return;

    this.dispatchEvent(
      new CustomEvent("resize-end", {
        detail: {
          field: this._resizingColumn,
          width: this._columnWidths[this._resizingColumn],
        },
        bubbles: true,
        composed: true,
      })
    );

    this._resizingColumn = null;
  }

  /**
   * Handle sort click
   * @param {string} field - Field to sort by
   */
  _handleSort(field) {
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
   * @param {string} operator - Filter operator
   */
  _handleFilter(field, value, operator = "contains") {
    this.filters = {
      ...this.filters,
      [field]: { value, operator },
    };

    // Reset to first page when filtering
    this.currentPage = 1;

    this.dispatchEvent(
      new CustomEvent("filter", {
        detail: { field, value, operator },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle page change
   * @param {number} page - Page number
   */
  _handlePageChange(page) {
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
   * Handle page size change
   * @param {Event} e - Change event
   */
  _handlePageSizeChange(e) {
    this.pageSize = Number(e.target.value);
    this.currentPage = 1;
    this.dispatchEvent(
      new CustomEvent("page-size-change", {
        detail: { pageSize: this.pageSize },
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
  _handleSelect(id, checked) {
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
  _handleSelectAll(checked) {
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
   * Get column width style
   * @param {string} field - Column field
   * @returns {string} CSS style
   */
  _getColumnStyle(field) {
    return this._columnWidths[field]
      ? `width: ${this._columnWidths[field]}px; min-width: ${this._columnWidths[field]}px;`
      : "";
  }

  /**
   * Render table header
   */
  _renderHeader() {
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
                  @change=${(e) => this._handleSelectAll(e.target.checked)}
                />
              </th>
            `
          : ""}
        ${this.columns.map(
          (col) => html`
            <th
              class=${this.sortable ? "sortable" : ""}
              style=${this._getColumnStyle(col.field)}
              @click=${() => this._handleSort(col.field)}
            >
              <div style="display: flex; align-items: center;">
                ${col.header}
                ${this.sortable && this.sortField === col.field
                  ? html`
                      <span
                        class="sort-icon ${this.sortDirection === "desc"
                          ? "sort-desc"
                          : ""}"
                      >
                        ↑
                      </span>
                    `
                  : ""}
                ${this.resizable
                  ? html`
                      <div
                        class="resizer ${this._resizingColumn === col.field
                          ? "resizing"
                          : ""}"
                        @mousedown=${(e) => this._startResize(col.field, e)}
                      ></div>
                    `
                  : ""}
              </div>
            </th>
          `
        )}
      </tr>
    `;
  }

  /**
   * Render filter row
   */
  _renderFilters() {
    if (!this.filterable) return "";

    return html`
      <tr class="filter-row">
        ${this.selectable ? html`<th></th>` : ""}
        ${this.columns.map(
          (col) => html`
            <th>
              <select
                class="filter-operator"
                @change=${(e) =>
                  this._handleFilter(
                    col.field,
                    this.filters[col.field]?.value || "",
                    e.target.value
                  )}
              >
                ${this.filterOperators[col.type || "text"]?.map(
                  (op) => html`
                    <option
                      value=${op.value}
                      ?selected=${this.filters[col.field]?.operator ===
                      op.value}
                    >
                      ${op.label}
                    </option>
                  `
                )}
              </select>
              <input
                class="filter-input"
                type=${col.type === "number" ? "number" : "text"}
                .value=${this.filters[col.field]?.value || ""}
                @input=${(e) =>
                  this._handleFilter(
                    col.field,
                    e.target.value,
                    this.filters[col.field]?.operator
                  )}
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
  _renderPagination() {
    if (!this.pageable) return "";

    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, this.totalItems);

    return html`
      <div class="table-footer">
        <div class="page-size-selector">
          <span>Rows per page:</span>
          <select .value=${this.pageSize} @change=${this._handlePageSizeChange}>
            ${[10, 25, 50, 100].map(
              (size) => html`
                <option value=${size} ?selected=${this.pageSize === size}>
                  ${size}
                </option>
              `
            )}
          </select>
        </div>

        <div class="page-info">
          Showing ${start} to ${end} of ${this.totalItems} entries
        </div>

        <div class="pagination">
          <button
            ?disabled=${this.currentPage === 1}
            @click=${() => this._handlePageChange(1)}
          >
            First
          </button>
          <button
            ?disabled=${this.currentPage === 1}
            @click=${() => this._handlePageChange(this.currentPage - 1)}
          >
            Previous
          </button>
          <span>${this.currentPage} of ${totalPages}</span>
          <button
            ?disabled=${this.currentPage === totalPages}
            @click=${() => this._handlePageChange(this.currentPage + 1)}
          >
            Next
          </button>
          <button
            ?disabled=${this.currentPage === totalPages}
            @click=${() => this._handlePageChange(totalPages)}
          >
            Last
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
            ${this._renderHeader()} ${this._renderFilters()}
          </thead>
          <tbody>
            ${this.processedData.length
              ? this.processedData.map(
                  (row) => html`
                    <tr>
                      ${this.selectable
                        ? html`
                            <td class="checkbox-cell">
                              <input
                                type="checkbox"
                                .checked=${this.selected.includes(row.id)}
                                @change=${(e) =>
                                  this._handleSelect(row.id, e.target.checked)}
                              />
                            </td>
                          `
                        : ""}
                      ${this.columns.map(
                        (col) => html`
                          <td style=${this._getColumnStyle(col.field)}>
                            ${col.template
                              ? col.template(row[col.field], row)
                              : row[col.field]}
                          </td>
                        `
                      )}
                    </tr>
                  `
                )
              : html`
                  <tr>
                    <td
                      colspan=${
                        this.selectable
                          ? this.columns.length + 1
                          : this.columns.length
                      }"
                      class="empty-message"
                    >
                      ${this.emptyMessage}
                    </td>
                  </tr>
                `}
          </tbody>
        </table>
      </div>

      ${this._renderPagination()}
    `;
  }
}

customElements.define("neo-data-table", DataTable);
