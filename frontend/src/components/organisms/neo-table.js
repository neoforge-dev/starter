import { LitElement, html, css } from 'lit';

export class NeoTable extends LitElement {
  static properties = {
    columns: { type: Array },
    data: { type: Array },
    pageSize: { type: Number, attribute: "page-size" },
    currentPage: { type: Number, attribute: "current-page" },
    sortField: { type: String, attribute: "sort-field" },
    sortDirection: { type: String, attribute: "sort-direction" },
    filters: { type: Object },
    selectable: { type: Boolean },
    selectedRows: { type: Array, attribute: "selected-rows" },
    virtualScroll: { type: Boolean, attribute: "virtual-scroll" },
    exportable: { type: Boolean },
    resizable: { type: Boolean },
    striped: { type: Boolean },
    bordered: { type: Boolean },
    hover: { type: Boolean },
    loading: { type: Boolean },
    emptyMessage: { type: String, attribute: "empty-message" },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .table-container {
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #fafafa;
      border-bottom: 1px solid #e5e5e5;
    }

    .table-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .search-input {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      min-width: 200px;
    }

    .export-btn {
      padding: 8px 16px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .export-btn:hover {
      background: #1d4ed8;
    }

    .table-wrapper {
      overflow: auto;
      max-height: var(--neo-table-max-height, none);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    thead {
      background: #f9fafb;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e5e5;
      cursor: pointer;
      user-select: none;
      position: relative;
    }

    th:hover {
      background: #f3f4f6;
    }

    th.sortable::after {
      content: '↕';
      position: absolute;
      right: 8px;
      opacity: 0.5;
      font-size: 12px;
    }

    th.sorted-asc::after {
      content: '↑';
      opacity: 1;
      color: #2563eb;
    }

    th.sorted-desc::after {
      content: '↓';
      opacity: 1;
      color: #2563eb;
    }

    tbody tr {
      transition: background-color 0.15s;
    }

    :host(.striped) tbody tr:nth-child(even) {
      background: #f9fafb;
    }

    :host(.hoverable) tbody tr:hover {
      background: #eff6ff;
    }

    td {
      padding: 12px 16px;
      vertical-align: middle;
    }

    :host(.bordered) td {
      border-bottom: 1px solid #e5e5e5;
    }

    .checkbox {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .row-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .pagination {
      display: flex;
      justify-content: between;
      align-items: center;
      padding: 16px 20px;
      background: #fafafa;
      border-top: 1px solid #e5e5e5;
    }

    .pagination-info {
      color: #6b7280;
      font-size: 14px;
    }

    .pagination-controls {
      display: flex;
      gap: 8px;
    }

    .page-btn {
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      background: white;
      cursor: pointer;
      border-radius: 4px;
      font-size: 14px;
    }

    .page-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-btn.active {
      background: #2563eb;
      color: white;
      border-color: #2563eb;
    }

    .loading-overlay {
      position: relative;
    }

    .loading-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 32px;
      height: 32px;
      border: 3px solid #f3f4f6;
      border-top: 3px solid #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }

    .empty-state {
      padding: 40px;
      text-align: center;
      color: #6b7280;
    }

    .filter-row {
      background: #f9fafb;
    }

    .filter-input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 12px;
    }

    .resize-handle {
      position: absolute;
      right: 0;
      top: 0;
      width: 4px;
      height: 100%;
      cursor: col-resize;
      background: transparent;
    }

    .resize-handle:hover {
      background: #2563eb;
    }
  `;

  constructor() {
    super();
    this.data = [];
    this.columns = [];
    this.pageSize = 10;
    this.currentPage = 1;
    this.sortField = null;
    this.sortDirection = "asc";
    this.filters = {};
    this.selectable = false;
    this.selectedRows = [];
    this.virtualScroll = false;
    this.exportable = false;
    this.resizable = false;
    this.striped = true;
    this.bordered = true;
    this.hover = true;
    this.loading = false;
    this.emptyMessage = "No data available";
    this.globalFilter = "";
  }

  updated(changed) {
    // Reflect boolean style state via host classes for CSS selectors
    this.classList.toggle('striped', !!this.striped)
    this.classList.toggle('bordered', !!this.bordered)
    this.classList.toggle('hoverable', !!this.hover)
    // Control max-height via CSS variable to avoid dynamic CSS in static styles
    this.style.setProperty(
      '--neo-table-max-height',
      this.virtualScroll ? '400px' : 'none'
    )
  }

  get filteredData() {
    let data = [...this.data];

    // Apply global search filter
    if (this.globalFilter) {
      data = data.filter(row =>
        this.columns.some(col => {
          const value = String(row[col.field] || '').toLowerCase();
          return value.includes(this.globalFilter.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(this.filters).forEach(([field, filterValue]) => {
      if (filterValue) {
        data = data.filter(row =>
          String(row[field] || '').toLowerCase()
            .includes(String(filterValue).toLowerCase())
        );
      }
    });

    return data;
  }

  get sortedData() {
    let data = [...this.filteredData];

    if (this.sortField) {
      data.sort((a, b) => {
        const aVal = a[this.sortField];
        const bVal = b[this.sortField];
        const direction = this.sortDirection === "asc" ? 1 : -1;
        
        if (aVal < bVal) return -direction;
        if (aVal > bVal) return direction;
        return 0;
      });
    }

    return data;
  }

  get paginatedData() {
    const data = this.sortedData;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return data.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.sortedData.length / this.pageSize);
  }

  _handleSort(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }
    this.dispatchEvent(new CustomEvent('sort-change', {
      detail: { field: this.sortField, direction: this.sortDirection }
    }));
  }

  _handleFilter(field, value) {
    this.filters = { ...this.filters, [field]: value };
    this.currentPage = 1; // Reset to first page
    this.dispatchEvent(new CustomEvent('filter-change', {
      detail: { field, value, allFilters: this.filters }
    }));
  }

  _handleGlobalFilter(value) {
    this.globalFilter = value;
    this.currentPage = 1;
    this.dispatchEvent(new CustomEvent('global-filter-change', {
      detail: { value }
    }));
  }

  _handleRowSelection(row, checked) {
    if (checked) {
      this.selectedRows = [...this.selectedRows, row];
    } else {
      this.selectedRows = this.selectedRows.filter(r => r !== row);
    }
    this.dispatchEvent(new CustomEvent('selection-change', {
      detail: { selectedRows: this.selectedRows, row, checked }
    }));
  }

  _handleSelectAll(checked) {
    if (checked) {
      this.selectedRows = [...this.paginatedData];
    } else {
      this.selectedRows = [];
    }
    this.dispatchEvent(new CustomEvent('select-all-change', {
      detail: { selectedRows: this.selectedRows, checked }
    }));
  }

  _handlePageChange(page) {
    this.currentPage = page;
    this.dispatchEvent(new CustomEvent('page-change', {
      detail: { page, pageSize: this.pageSize }
    }));
  }

  _exportData(format = 'csv') {
    const data = this.sortedData;
    let content = '';
    let filename = `table-export-${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      // CSV export
      const headers = this.columns.map(col => col.header).join(',');
      const rows = data.map(row => 
        this.columns.map(col => `"${row[col.field] || ''}"`).join(',')
      ).join('\n');
      content = headers + '\n' + rows;
      filename += '.csv';
    } else if (format === 'json') {
      // JSON export
      content = JSON.stringify(data, null, 2);
      filename += '.json';
    }

    // Create and trigger download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    this.dispatchEvent(new CustomEvent('export-complete', {
      detail: { format, filename, rowCount: data.length }
    }));
  }

  render() {
    const displayData = this.paginatedData;
    const hasData = displayData.length > 0;

    return html`
      <div class="table-container">
        <div class="table-header">
          <div class="table-controls">
            <input
              type="text"
              class="search-input"
              placeholder="Search table..."
              @input=${(e) => this._handleGlobalFilter(e.target.value)}
            />
            ${this.exportable ? html`
              <button 
                class="export-btn"
                @click=${() => this._exportData('csv')}
                title="Export as CSV"
              >
                Export CSV
              </button>
              <button 
                class="export-btn"
                @click=${() => this._exportData('json')}
                title="Export as JSON"
              >
                Export JSON
              </button>
            ` : ''}
          </div>
        </div>

        <div class="table-wrapper ${this.loading ? 'loading-overlay' : ''}">
          ${this.loading ? html`<div class="loading-spinner"></div>` : ''}
          
          ${hasData ? html`
            <table>
              <thead>
                <tr>
                  ${this.selectable ? html`
                    <th>
                      <input
                        type="checkbox"
                        class="checkbox"
                        @change=${(e) => this._handleSelectAll(e.target.checked)}
                        .checked=${this.selectedRows.length === displayData.length}
                      />
                    </th>
                  ` : ''}
                  ${this.columns.map(col => html`
                    <th 
                      class="sortable ${this.sortField === col.field ? 'sorted-' + this.sortDirection : ''}"
                      @click=${() => this._handleSort(col.field)}
                      style=${col.width ? `width: ${col.width}` : ''}
                    >
                      ${col.header}
                      ${this.resizable ? html`<div class="resize-handle"></div>` : ''}
                    </th>
                  `)}
                </tr>
                <!-- Filter row -->
                <tr class="filter-row">
                  ${this.selectable ? html`<th></th>` : ''}
                  ${this.columns.map(col => html`
                    <th>
                      <input
                        type="text"
                        class="filter-input"
                        placeholder="Filter ${col.header}..."
                        @input=${(e) => this._handleFilter(col.field, e.target.value)}
                      />
                    </th>
                  `)}
                </tr>
              </thead>
              <tbody>
                ${displayData.map(row => html`
                  <tr>
                    ${this.selectable ? html`
                      <td>
                        <input
                          type="checkbox"
                          class="checkbox"
                          @change=${(e) => this._handleRowSelection(row, e.target.checked)}
                          .checked=${this.selectedRows.includes(row)}
                        />
                      </td>
                    ` : ''}
                    ${this.columns.map(col => html`
                      <td>
                        ${col.render ? col.render(row[col.field], row) : row[col.field]}
                      </td>
                    `)}
                  </tr>
                `)}
              </tbody>
            </table>
          ` : html`
            <div class="empty-state">
              <p>${this.emptyMessage}</p>
            </div>
          `}
        </div>

        ${hasData && this.totalPages > 1 ? html`
          <div class="pagination">
            <div class="pagination-info">
              Showing ${(this.currentPage - 1) * this.pageSize + 1} to 
              ${Math.min(this.currentPage * this.pageSize, this.sortedData.length)} 
              of ${this.sortedData.length} entries
            </div>
            <div class="pagination-controls">
              <button
                class="page-btn"
                ?disabled=${this.currentPage === 1}
                @click=${() => this._handlePageChange(this.currentPage - 1)}
              >
                Previous
              </button>
              ${Array.from({ length: Math.min(this.totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return html`
                  <button
                    class="page-btn ${page === this.currentPage ? 'active' : ''}"
                    @click=${() => this._handlePageChange(page)}
                  >
                    ${page}
                  </button>
                `;
              })}
              <button
                class="page-btn"
                ?disabled=${this.currentPage === this.totalPages}
                @click=${() => this._handlePageChange(this.currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define("neo-table", NeoTable);