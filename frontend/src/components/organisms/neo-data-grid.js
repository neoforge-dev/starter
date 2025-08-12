import { LitElement, html, css } from 'lit';

export class NeoDataGrid extends LitElement {
  static properties = {
    columns: { type: Array },
    data: { type: Array },
    editable: { type: Boolean },
    sortable: { type: Boolean },
    filterable: { type: Boolean },
    resizable: { type: Boolean },
    reorderable: { type: Boolean },
    autoSave: { type: Boolean, attribute: "auto-save" },
    validateOnEdit: { type: Boolean, attribute: "validate-on-edit" },
    showRowNumbers: { type: Boolean, attribute: "show-row-numbers" },
    multiSelect: { type: Boolean, attribute: "multi-select" },
    dragToReorder: { type: Boolean, attribute: "drag-to-reorder" },
    realTimeUpdates: { type: Boolean, attribute: "real-time-updates" },
    pageSize: { type: Number, attribute: "page-size" },
    currentPage: { type: Number, attribute: "current-page" },
    theme: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .grid-container {
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      position: relative;
    }

    .grid-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .toolbar-left,
    .toolbar-right {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .toolbar-btn {
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .toolbar-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .grid-wrapper {
      overflow: auto;
      position: relative;
    }

    .grid-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .grid-header {
      background: #f8fafc;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .grid-header th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      cursor: pointer;
      user-select: none;
      position: relative;
      min-width: 100px;
    }

    .grid-header th:hover {
      background: #f1f5f9;
    }

    .grid-header th.sortable::after {
      content: '⇅';
      position: absolute;
      right: 8px;
      opacity: 0.5;
      font-size: 12px;
    }

    .grid-header th.sorted-asc::after {
      content: '↑';
      opacity: 1;
      color: #3b82f6;
    }

    .grid-header th.sorted-desc::after {
      content: '↓';
      opacity: 1;
      color: #3b82f6;
    }

    .resizer {
      position: absolute;
      right: 0;
      top: 0;
      width: 4px;
      height: 100%;
      cursor: col-resize;
      background: transparent;
    }

    .resizer:hover {
      background: #3b82f6;
    }

    .grid-body tr {
      transition: all 0.2s;
      border-bottom: 1px solid #f1f5f9;
    }

    .grid-body tr:hover {
      background: #fefce8;
    }

    .grid-body tr.selected {
      background: #dbeafe !important;
    }

    .grid-body tr.editing {
      background: #fef3c7 !important;
      box-shadow: inset 0 0 0 2px #f59e0b;
    }

    .grid-body tr.drag-over {
      background: #ecfccb !important;
      border-top: 3px solid #84cc16;
    }

    .grid-cell {
      padding: 12px 16px;
      position: relative;
      vertical-align: middle;
      border-right: 1px solid #f1f5f9;
    }

    .grid-cell:last-child {
      border-right: none;
    }

    .cell-content {
      min-height: 20px;
      cursor: text;
    }

    .cell-input {
      width: 100%;
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 14px;
      background: white;
    }

    .cell-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .cell-select {
      width: 100%;
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 14px;
      background: white;
    }

    .cell-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .validation-error {
      position: absolute;
      bottom: -20px;
      left: 0;
      right: 0;
      background: #fee2e2;
      color: #dc2626;
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 0 0 4px 4px;
      z-index: 20;
    }

    .row-number {
      background: #f9fafb;
      font-weight: 600;
      color: #6b7280;
      text-align: center;
      width: 50px;
    }

    .row-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .grid-body tr:hover .row-actions {
      opacity: 1;
    }

    .action-btn {
      padding: 2px 6px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      color: #374151;
    }

    .action-btn:hover {
      background: #e5e7eb;
    }

    .action-btn.save {
      background: #dcfce7;
      border-color: #16a34a;
      color: #16a34a;
    }

    .action-btn.cancel {
      background: #fee2e2;
      border-color: #dc2626;
      color: #dc2626;
    }

    .action-btn.delete {
      background: #fef2f2;
      border-color: #ef4444;
      color: #ef4444;
    }

    .context-menu {
      position: absolute;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      padding: 4px 0;
      z-index: 1000;
      min-width: 150px;
    }

    .context-menu-item {
      padding: 8px 16px;
      cursor: pointer;
      font-size: 13px;
      color: #374151;
    }

    .context-menu-item:hover {
      background: #f3f4f6;
    }

    .context-menu-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 4px 0;
    }

    .bulk-actions {
      padding: 8px 16px;
      background: #eff6ff;
      border-bottom: 1px solid #dbeafe;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .bulk-actions.hidden {
      display: none;
    }

    .status-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
    }

    .status-indicator.saving {
      background: #f59e0b;
      animation: pulse 1s infinite;
    }

    .status-indicator.error {
      background: #ef4444;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .drag-handle {
      cursor: move;
      color: #9ca3af;
      padding: 4px;
    }

    .drag-handle:hover {
      color: #6b7280;
    }

    .filter-row {
      background: #f8fafc;
    }

    .filter-input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 12px;
    }

    .real-time-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #10b981;
    }

    .real-time-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      animation: blink 2s infinite;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.3; }
    }
  `;

  constructor() {
    super();
    this.data = [];
    this.columns = [];
    this.editable = false;
    this.sortable = true;
    this.filterable = true;
    this.resizable = true;
    this.reorderable = false;
    this.autoSave = false;
    this.validateOnEdit = false;
    this.showRowNumbers = false;
    this.multiSelect = false;
    this.dragToReorder = false;
    this.realTimeUpdates = false;
    this.pageSize = 50;
    this.currentPage = 1;
    this.theme = 'default';

    // Internal state
    this.editingCell = null;
    this.selectedRows = new Set();
    this.sortField = null;
    this.sortDirection = 'asc';
    this.filters = {};
    this.contextMenu = null;
    this.validationErrors = new Map();
    this.pendingChanges = new Map();
    this.draggedRow = null;
  }

  firstUpdated() {
    this.setupKeyboardShortcuts();
    this.setupRealtimeConnection();
  }

  setupKeyboardShortcuts() {
    this.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            this.saveChanges();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              this.redo();
            } else {
              this.undo();
            }
            break;
        }
      }
      
      if (e.key === 'Escape') {
        this.cancelEdit();
      }
    });
  }

  setupRealtimeConnection() {
    if (this.realTimeUpdates) {
      // Simulate real-time updates
      setInterval(() => {
        this.dispatchEvent(new CustomEvent('real-time-update', {
          detail: { message: 'Data synchronized' }
        }));
      }, 30000);
    }
  }

  _startEdit(rowIndex, colIndex) {
    if (!this.editable) return;
    
    this.editingCell = { row: rowIndex, col: colIndex };
    this.requestUpdate();
    
    this.dispatchEvent(new CustomEvent('cell-edit-start', {
      detail: { rowIndex, colIndex, data: this.data[rowIndex] }
    }));
  }

  _updateCell(rowIndex, colIndex, value) {
    const row = this.data[rowIndex];
    const column = this.columns[colIndex];
    const oldValue = row[column.field];
    
    // Validate if validation is enabled
    if (this.validateOnEdit && column.validate) {
      const validation = column.validate(value, row);
      if (!validation.valid) {
        this.validationErrors.set(`${rowIndex}-${colIndex}`, validation.message);
        this.requestUpdate();
        return;
      } else {
        this.validationErrors.delete(`${rowIndex}-${colIndex}`);
      }
    }
    
    // Update the value
    row[column.field] = value;
    
    // Track pending changes
    const changeKey = `${rowIndex}-${colIndex}`;
    this.pendingChanges.set(changeKey, { oldValue, newValue: value, row, column });
    
    // Auto-save if enabled
    if (this.autoSave) {
      this._saveCell(rowIndex, colIndex);
    }
    
    this.dispatchEvent(new CustomEvent('cell-value-change', {
      detail: { rowIndex, colIndex, oldValue, newValue: value, row }
    }));
    
    this.requestUpdate();
  }

  async _saveCell(rowIndex, colIndex) {
    const changeKey = `${rowIndex}-${colIndex}`;
    const change = this.pendingChanges.get(changeKey);
    
    if (!change) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.pendingChanges.delete(changeKey);
      
      this.dispatchEvent(new CustomEvent('cell-save-success', {
        detail: { rowIndex, colIndex, change }
      }));
    } catch (error) {
      this.dispatchEvent(new CustomEvent('cell-save-error', {
        detail: { rowIndex, colIndex, error, change }
      }));
    }
    
    this.requestUpdate();
  }

  _finishEdit() {
    this.editingCell = null;
    this.requestUpdate();
  }

  _cancelEdit() {
    if (this.editingCell) {
      const { row, col } = this.editingCell;
      const changeKey = `${row}-${col}`;
      const change = this.pendingChanges.get(changeKey);
      
      if (change) {
        this.data[row][change.column.field] = change.oldValue;
        this.pendingChanges.delete(changeKey);
        this.validationErrors.delete(changeKey);
      }
      
      this.editingCell = null;
      this.requestUpdate();
    }
  }

  _handleSort(field) {
    if (!this.sortable) return;
    
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.data.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      const direction = this.sortDirection === 'asc' ? 1 : -1;
      
      if (aVal < bVal) return -direction;
      if (aVal > bVal) return direction;
      return 0;
    });
    
    this.requestUpdate();
  }

  _handleRowSelect(rowIndex, selected) {
    if (selected) {
      this.selectedRows.add(rowIndex);
    } else {
      this.selectedRows.delete(rowIndex);
    }
    
    this.dispatchEvent(new CustomEvent('row-selection-change', {
      detail: { rowIndex, selected, selectedRows: Array.from(this.selectedRows) }
    }));
    
    this.requestUpdate();
  }

  _renderCell(row, column, rowIndex, colIndex) {
    const isEditing = this.editingCell && 
                     this.editingCell.row === rowIndex && 
                     this.editingCell.col === colIndex;
    
    const value = row[column.field];
    const hasError = this.validationErrors.has(`${rowIndex}-${colIndex}`);
    const isPending = this.pendingChanges.has(`${rowIndex}-${colIndex}`);

    if (isEditing && this.editable) {
      return this._renderEditCell(column, value, rowIndex, colIndex);
    }

    return html`
      <div 
        class="cell-content"
        @click=${() => this._startEdit(rowIndex, colIndex)}
        @dblclick=${() => this._startEdit(rowIndex, colIndex)}
      >
        ${column.render ? column.render(value, row, { rowIndex, colIndex }) : value}
        ${hasError ? html`
          <div class="validation-error">
            ${this.validationErrors.get(`${rowIndex}-${colIndex}`)}
          </div>
        ` : ''}
        ${isPending ? html`<div class="status-indicator saving"></div>` : ''}
      </div>
    `;
  }

  _renderEditCell(column, value, rowIndex, colIndex) {
    switch (column.type) {
      case 'select':
        return html`
          <select 
            class="cell-select"
            .value=${value}
            @change=${(e) => this._updateCell(rowIndex, colIndex, e.target.value)}
            @blur=${() => this._finishEdit()}
            @keydown=${(e) => {
              if (e.key === 'Enter') this._finishEdit();
              if (e.key === 'Escape') this._cancelEdit();
            }}
          >
            ${column.options?.map(opt => html`
              <option value=${opt.value} ?selected=${opt.value === value}>
                ${opt.label}
              </option>
            `)}
          </select>
        `;
      
      case 'checkbox':
        return html`
          <input
            type="checkbox"
            class="cell-checkbox"
            .checked=${Boolean(value)}
            @change=${(e) => this._updateCell(rowIndex, colIndex, e.target.checked)}
            @blur=${() => this._finishEdit()}
          />
        `;
      
      case 'number':
        return html`
          <input
            type="number"
            class="cell-input"
            .value=${value || ''}
            @input=${(e) => this._updateCell(rowIndex, colIndex, parseFloat(e.target.value) || 0)}
            @blur=${() => this._finishEdit()}
            @keydown=${(e) => {
              if (e.key === 'Enter') this._finishEdit();
              if (e.key === 'Escape') this._cancelEdit();
            }}
          />
        `;
      
      default:
        return html`
          <input
            type="text"
            class="cell-input"
            .value=${value || ''}
            @input=${(e) => this._updateCell(rowIndex, colIndex, e.target.value)}
            @blur=${() => this._finishEdit()}
            @keydown=${(e) => {
              if (e.key === 'Enter') this._finishEdit();
              if (e.key === 'Escape') this._cancelEdit();
            }}
          />
        `;
    }
  }

  _addRow() {
    const newRow = {};
    this.columns.forEach(col => {
      newRow[col.field] = col.defaultValue || '';
    });
    
    this.data = [...this.data, newRow];
    
    this.dispatchEvent(new CustomEvent('row-add', {
      detail: { row: newRow, index: this.data.length - 1 }
    }));
  }

  _deleteRow(rowIndex) {
    const row = this.data[rowIndex];
    this.data = this.data.filter((_, index) => index !== rowIndex);
    this.selectedRows.delete(rowIndex);
    
    this.dispatchEvent(new CustomEvent('row-delete', {
      detail: { row, index: rowIndex }
    }));
    
    this.requestUpdate();
  }

  _exportData() {
    const csv = [
      this.columns.map(col => col.header).join(','),
      ...this.data.map(row => 
        this.columns.map(col => `"${row[col.field] || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-grid-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  render() {
    const hasSelection = this.selectedRows.size > 0;
    
    return html`
      <div class="grid-container">
        <div class="grid-toolbar">
          <div class="toolbar-left">
            ${this.editable ? html`
              <button class="toolbar-btn" @click=${this._addRow}>
                + Add Row
              </button>
            ` : ''}
            <button class="toolbar-btn" @click=${this._exportData}>
              📥 Export
            </button>
            ${this.realTimeUpdates ? html`
              <div class="real-time-indicator">
                <div class="real-time-dot"></div>
                Live
              </div>
            ` : ''}
          </div>
          <div class="toolbar-right">
            <span>Total: ${this.data.length} rows</span>
          </div>
        </div>

        ${hasSelection ? html`
          <div class="bulk-actions">
            <span>${this.selectedRows.size} rows selected</span>
            <button class="toolbar-btn" @click=${() => this._bulkDelete()}>
              Delete Selected
            </button>
          </div>
        ` : ''}

        <div class="grid-wrapper">
          <table class="grid-table">
            <thead class="grid-header">
              <tr>
                ${this.multiSelect ? html`<th width="40"></th>` : ''}
                ${this.showRowNumbers ? html`<th class="row-number">#</th>` : ''}
                ${this.dragToReorder ? html`<th width="30"></th>` : ''}
                ${this.columns.map(col => html`
                  <th 
                    class="${this.sortable ? 'sortable' : ''} ${this.sortField === col.field ? 'sorted-' + this.sortDirection : ''}"
                    style=${col.width ? `width: ${col.width}` : ''}
                    @click=${() => this._handleSort(col.field)}
                  >
                    ${col.header}
                    ${this.resizable ? html`<div class="resizer"></div>` : ''}
                  </th>
                `)}
                <th width="100">Actions</th>
              </tr>
              ${this.filterable ? html`
                <tr class="filter-row">
                  ${this.multiSelect ? html`<th></th>` : ''}
                  ${this.showRowNumbers ? html`<th></th>` : ''}
                  ${this.dragToReorder ? html`<th></th>` : ''}
                  ${this.columns.map(col => html`
                    <th>
                      <input
                        class="filter-input"
                        placeholder="Filter..."
                        @input=${(e) => this._handleFilter(col.field, e.target.value)}
                      />
                    </th>
                  `)}
                  <th></th>
                </tr>
              ` : ''}
            </thead>
            <tbody class="grid-body">
              ${this.data.map((row, rowIndex) => html`
                <tr 
                  class="${this.selectedRows.has(rowIndex) ? 'selected' : ''} ${this.editingCell && this.editingCell.row === rowIndex ? 'editing' : ''}"
                  @contextmenu=${(e) => this._showContextMenu(e, rowIndex)}
                >
                  ${this.multiSelect ? html`
                    <td>
                      <input
                        type="checkbox"
                        class="cell-checkbox"
                        .checked=${this.selectedRows.has(rowIndex)}
                        @change=${(e) => this._handleRowSelect(rowIndex, e.target.checked)}
                      />
                    </td>
                  ` : ''}
                  ${this.showRowNumbers ? html`
                    <td class="row-number">${rowIndex + 1}</td>
                  ` : ''}
                  ${this.dragToReorder ? html`
                    <td>
                      <div class="drag-handle" draggable="true">⋮⋮</div>
                    </td>
                  ` : ''}
                  ${this.columns.map((col, colIndex) => html`
                    <td class="grid-cell">
                      ${this._renderCell(row, col, rowIndex, colIndex)}
                    </td>
                  `)}
                  <td>
                    <div class="row-actions">
                      ${this.editingCell && this.editingCell.row === rowIndex ? html`
                        <button class="action-btn save" @click=${() => this._finishEdit()}>
                          ✓
                        </button>
                        <button class="action-btn cancel" @click=${() => this._cancelEdit()}>
                          ✕
                        </button>
                      ` : html`
                        <button class="action-btn delete" @click=${() => this._deleteRow(rowIndex)}>
                          🗑
                        </button>
                      `}
                    </div>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

customElements.define("neo-data-grid", NeoDataGrid);