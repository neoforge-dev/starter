import { LitElement, html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class NeoFormBuilder extends LitElement {
  static properties = {
    schema: { type: Object },
    values: { type: Object },
    mode: { type: String }, // 'builder' | 'preview' | 'runtime'
    dragEnabled: { type: Boolean, attribute: "drag-enabled" },
    validationEnabled: { type: Boolean, attribute: "validation-enabled" },
    multiStep: { type: Boolean, attribute: "multi-step" },
    currentStep: { type: Number, attribute: "current-step" },
    autoSave: { type: Boolean, attribute: "auto-save" },
    readonly: { type: Boolean },
    compact: { type: Boolean },
    theme: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .form-builder {
      display: flex;
      min-height: 500px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .builder-sidebar {
      width: 280px;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
    }

    .field-palette {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .palette-section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .field-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 6px;
      cursor: grab;
      transition: all 0.2s;
    }

    .field-item:hover {
      border-color: #3b82f6;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .field-item:active {
      cursor: grabbing;
    }

    .field-icon {
      font-size: 16px;
      color: #64748b;
    }

    .field-label {
      font-size: 14px;
      color: #374151;
    }

    .form-canvas {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .canvas-toolbar {
      display: flex;
      justify-content: between;
      align-items: center;
      padding: 12px 16px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
    }

    .toolbar-left,
    .toolbar-right {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .toolbar-btn {
      padding: 6px 12px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      color: #475569;
      transition: all 0.2s;
    }

    .toolbar-btn:hover {
      background: #e2e8f0;
    }

    .toolbar-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .canvas-area {
      flex: 1;
      padding: 20px;
      background: #fafbfc;
      overflow-y: auto;
      position: relative;
    }

    .drop-zone {
      min-height: 300px;
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-size: 14px;
      transition: all 0.2s;
    }

    .drop-zone.drag-over {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
      color: #3b82f6;
    }

    .form-preview {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-field {
      margin-bottom: 20px;
      position: relative;
      transition: all 0.2s;
    }

    .form-field:hover {
      outline: 2px solid rgba(59, 130, 246, 0.2);
      outline-offset: 2px;
    }

    .form-field.selected {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .form-field.dragging {
      opacity: 0.6;
      transform: rotate(5deg);
    }

    .field-controls {
      position: absolute;
      top: -12px;
      right: -12px;
      display: none;
      gap: 4px;
      z-index: 10;
    }

    .form-field:hover .field-controls,
    .form-field.selected .field-controls {
      display: flex;
    }

    .control-btn {
      width: 24px;
      height: 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .control-btn:hover {
      background: #2563eb;
    }

    .control-btn.delete {
      background: #ef4444;
    }

    .control-btn.delete:hover {
      background: #dc2626;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-label.required::after {
      content: ' *';
      color: #ef4444;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      background: white;
    }

    .form-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      resize: vertical;
      min-height: 80px;
    }

    .form-checkbox,
    .form-radio {
      margin-right: 8px;
    }

    .checkbox-group,
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-help {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }

    .form-error {
      font-size: 12px;
      color: #ef4444;
      margin-top: 4px;
    }

    .step-indicator {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }

    .step-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f1f5f9;
      color: #64748b;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .step-item.active {
      background: #3b82f6;
      color: white;
    }

    .step-item.completed {
      background: #10b981;
      color: white;
    }

    .step-content {
      display: none;
    }

    .step-content.active {
      display: block;
    }

    .step-navigation {
      display: flex;
      justify-content: between;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .nav-btn {
      padding: 10px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .nav-btn:hover {
      background: #2563eb;
    }

    .nav-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .nav-btn.secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .nav-btn.secondary:hover {
      background: #e2e8f0;
    }

    .properties-panel {
      width: 300px;
      background: #f8fafc;
      border-left: 1px solid #e2e8f0;
      padding: 16px;
      overflow-y: auto;
    }

    .properties-panel.hidden {
      display: none;
    }

    .panel-header {
      font-weight: 600;
      color: #374151;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .property-group {
      margin-bottom: 20px;
    }

    .property-label {
      font-size: 13px;
      font-weight: 500;
      color: #4b5563;
      margin-bottom: 6px;
      display: block;
    }

    .property-input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 13px;
    }

    .validation-summary {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 20px;
    }

    .validation-title {
      font-size: 14px;
      font-weight: 500;
      color: #dc2626;
      margin-bottom: 8px;
    }

    .validation-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .validation-item {
      font-size: 13px;
      color: #7f1d1d;
      margin-bottom: 4px;
    }

    .auto-save-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #10b981;
    }

    .save-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .preview-mode {
      max-width: 600px;
      margin: 0 auto;
    }

    .compact-mode .form-field {
      margin-bottom: 12px;
    }

    .compact-mode .form-input,
    .compact-mode .form-select,
    .compact-mode .form-textarea {
      padding: 6px 8px;
      font-size: 13px;
    }

    .drag-placeholder {
      height: 4px;
      background: #3b82f6;
      border-radius: 2px;
      margin: 8px 0;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .drag-placeholder.visible {
      opacity: 1;
    }

    @media (max-width: 1024px) {
      .form-builder {
        flex-direction: column;
      }
      
      .builder-sidebar,
      .properties-panel {
        width: 100%;
      }
      
      .properties-panel {
        max-height: 300px;
      }
    }
  `;

  constructor() {
    super();
    this.schema = { fields: [], steps: [] };
    this.values = {};
    this.mode = 'builder';
    this.dragEnabled = true;
    this.validationEnabled = true;
    this.multiStep = false;
    this.currentStep = 0;
    this.autoSave = false;
    this.readonly = false;
    this.compact = false;
    this.theme = 'default';

    // Internal state
    this.selectedField = null;
    this.draggedField = null;
    this.validationErrors = new Map();
    this.isDragging = false;
    this.showProperties = true;

    // Available field types
    this.fieldTypes = [
      { type: 'text', icon: '📝', label: 'Text Input' },
      { type: 'email', icon: '📧', label: 'Email' },
      { type: 'number', icon: '🔢', label: 'Number' },
      { type: 'password', icon: '🔒', label: 'Password' },
      { type: 'textarea', icon: '📄', label: 'Text Area' },
      { type: 'select', icon: '📋', label: 'Select' },
      { type: 'checkbox', icon: '☑️', label: 'Checkbox' },
      { type: 'radio', icon: '🔘', label: 'Radio Group' },
      { type: 'date', icon: '📅', label: 'Date' },
      { type: 'file', icon: '📎', label: 'File Upload' },
      { type: 'section', icon: '📂', label: 'Section' },
      { type: 'spacer', icon: '➖', label: 'Spacer' }
    ];
  }

  firstUpdated() {
    this.setupDragAndDrop();
    this.setupAutoSave();
  }

  setupDragAndDrop() {
    if (!this.dragEnabled) return;

    this.addEventListener('dragover', this._handleDragOver.bind(this));
    this.addEventListener('drop', this._handleDrop.bind(this));
  }

  setupAutoSave() {
    if (this.autoSave) {
      setInterval(() => {
        this._saveForm();
      }, 30000); // Auto-save every 30 seconds
    }
  }

  _handleFieldDragStart(e, fieldType) {
    this.draggedField = { type: fieldType, isNew: true };
    this.isDragging = true;
    e.dataTransfer.effectAllowed = 'copy';
    this.requestUpdate();
  }

  _handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  _handleDrop(e) {
    e.preventDefault();
    this.isDragging = false;

    if (!this.draggedField) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Calculate drop position
    const fields = this.shadowRoot.querySelectorAll('.form-field');
    let insertIndex = fields.length;

    for (let i = 0; i < fields.length; i++) {
      const fieldRect = fields[i].getBoundingClientRect();
      if (y < fieldRect.top - rect.top + fieldRect.height / 2) {
        insertIndex = i;
        break;
      }
    }

    // Add new field
    if (this.draggedField.isNew) {
      this._addField(this.draggedField.type, insertIndex);
    }

    this.draggedField = null;
    this.requestUpdate();
  }

  _addField(type, index = -1) {
    const newField = this._createField(type);
    const fields = [...this.schema.fields];

    if (index >= 0 && index < fields.length) {
      fields.splice(index, 0, newField);
    } else {
      fields.push(newField);
    }

    this.schema = { ...this.schema, fields };
    this.selectedField = newField;
    
    this.dispatchEvent(new CustomEvent('field-add', {
      detail: { field: newField, index }
    }));
    
    this.requestUpdate();
  }

  _createField(type) {
    const id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const baseField = {
      id,
      type,
      label: `${type.charAt(0).toUpperCase()}${type.slice(1)} Field`,
      name: id,
      required: false,
      placeholder: '',
      helpText: ''
    };

    switch (type) {
      case 'select':
      case 'radio':
        return {
          ...baseField,
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' }
          ]
        };
      case 'checkbox':
        return {
          ...baseField,
          options: [
            { label: 'Checkbox 1', value: 'checkbox1' },
            { label: 'Checkbox 2', value: 'checkbox2' }
          ]
        };
      case 'number':
        return { ...baseField, min: '', max: '', step: '' };
      case 'textarea':
        return { ...baseField, rows: 4 };
      case 'section':
        return { ...baseField, label: 'Section Title', description: '' };
      default:
        return baseField;
    }
  }

  _selectField(field) {
    this.selectedField = field;
    this.requestUpdate();
  }

  _deleteField(field) {
    this.schema = {
      ...this.schema,
      fields: this.schema.fields.filter(f => f.id !== field.id)
    };
    
    if (this.selectedField?.id === field.id) {
      this.selectedField = null;
    }
    
    this.dispatchEvent(new CustomEvent('field-delete', {
      detail: { field }
    }));
    
    this.requestUpdate();
  }

  _duplicateField(field) {
    const duplicatedField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`
    };
    
    const index = this.schema.fields.indexOf(field);
    this.schema = {
      ...this.schema,
      fields: [
        ...this.schema.fields.slice(0, index + 1),
        duplicatedField,
        ...this.schema.fields.slice(index + 1)
      ]
    };
    
    this.requestUpdate();
  }

  _updateFieldProperty(property, value) {
    if (!this.selectedField) return;

    this.selectedField = { ...this.selectedField, [property]: value };
    
    // Update in schema
    const index = this.schema.fields.findIndex(f => f.id === this.selectedField.id);
    if (index >= 0) {
      this.schema = {
        ...this.schema,
        fields: [
          ...this.schema.fields.slice(0, index),
          this.selectedField,
          ...this.schema.fields.slice(index + 1)
        ]
      };
    }
    
    this.dispatchEvent(new CustomEvent('field-update', {
      detail: { field: this.selectedField, property, value }
    }));
    
    this.requestUpdate();
  }

  _updateValue(fieldName, value) {
    this.values = { ...this.values, [fieldName]: value };
    
    // Validate if enabled
    if (this.validationEnabled) {
      this._validateField(fieldName, value);
    }
    
    this.dispatchEvent(new CustomEvent('value-change', {
      detail: { field: fieldName, value, allValues: this.values }
    }));
    
    this.requestUpdate();
  }

  _validateField(fieldName, value) {
    const field = this.schema.fields.find(f => f.name === fieldName);
    if (!field) return;

    const errors = [];

    if (field.required && (!value || value === '')) {
      errors.push(`${field.label} is required`);
    }

    if (field.type === 'email' && value && !value.includes('@')) {
      errors.push(`${field.label} must be a valid email`);
    }

    if (field.type === 'number' && value) {
      if (field.min && parseFloat(value) < parseFloat(field.min)) {
        errors.push(`${field.label} must be at least ${field.min}`);
      }
      if (field.max && parseFloat(value) > parseFloat(field.max)) {
        errors.push(`${field.label} must be at most ${field.max}`);
      }
    }

    if (errors.length > 0) {
      this.validationErrors.set(fieldName, errors);
    } else {
      this.validationErrors.delete(fieldName);
    }
  }

  _validateForm() {
    this.schema.fields.forEach(field => {
      if (field.type !== 'section' && field.type !== 'spacer') {
        this._validateField(field.name, this.values[field.name]);
      }
    });
    return this.validationErrors.size === 0;
  }

  _saveForm() {
    if (this._validateForm()) {
      this.dispatchEvent(new CustomEvent('form-save', {
        detail: { schema: this.schema, values: this.values }
      }));
    }
  }

  _submitForm() {
    if (this._validateForm()) {
      this.dispatchEvent(new CustomEvent('form-submit', {
        detail: { schema: this.schema, values: this.values }
      }));
    }
  }

  _renderField(field) {
    const value = this.values[field.name] || '';
    const errors = this.validationErrors.get(field.name) || [];
    const hasError = errors.length > 0;

    switch (field.type) {
      case 'section':
        return html`
          <div class="form-field" @click=${() => this._selectField(field)}>
            ${this.mode === 'builder' ? this._renderFieldControls(field) : ''}
            <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #374151;">${field.label}</h3>
            ${field.description ? html`<p style="margin: 0; color: #6b7280; font-size: 14px;">${field.description}</p>` : ''}
          </div>
        `;

      case 'spacer':
        return html`
          <div class="form-field" @click=${() => this._selectField(field)}>
            ${this.mode === 'builder' ? this._renderFieldControls(field) : ''}
            <div style="height: 20px; border-top: 1px dashed #d1d5db; margin: 10px 0;"></div>
          </div>
        `;

      case 'select':
        return html`
          <div class="form-field" @click=${() => this._selectField(field)}>
            ${this.mode === 'builder' ? this._renderFieldControls(field) : ''}
            <label class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
            <select 
              class="form-select" 
              .value=${value}
              @change=${(e) => this._updateValue(field.name, e.target.value)}
              ?disabled=${this.readonly}
            >
              <option value="">Select an option...</option>
              ${field.options?.map(opt => html`
                <option value=${opt.value} ?selected=${opt.value === value}>${opt.label}</option>
              `)}
            </select>
            ${field.helpText ? html`<div class="form-help">${field.helpText}</div>` : ''}
            ${hasError ? html`<div class="form-error">${errors[0]}</div>` : ''}
          </div>
        `;

      case 'textarea':
        return html`
          <div class="form-field" @click=${() => this._selectField(field)}>
            ${this.mode === 'builder' ? this._renderFieldControls(field) : ''}
            <label class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
            <textarea 
              class="form-textarea"
              rows=${field.rows || 4}
              placeholder=${field.placeholder || ''}
              .value=${value}
              @input=${(e) => this._updateValue(field.name, e.target.value)}
              ?disabled=${this.readonly}
            ></textarea>
            ${field.helpText ? html`<div class="form-help">${field.helpText}</div>` : ''}
            ${hasError ? html`<div class="form-error">${errors[0]}</div>` : ''}
          </div>
        `;

      case 'checkbox':
        return html`
          <div class="form-field" @click=${() => this._selectField(field)}>
            ${this.mode === 'builder' ? this._renderFieldControls(field) : ''}
            <label class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
            <div class="checkbox-group">
              ${field.options?.map(opt => html`
                <label style="display: flex; align-items: center; font-weight: normal;">
                  <input 
                    type="checkbox" 
                    class="form-checkbox"
                    value=${opt.value}
                    .checked=${Array.isArray(value) && value.includes(opt.value)}
                    @change=${(e) => {
                      const currentValues = Array.isArray(value) ? [...value] : [];
                      if (e.target.checked) {
                        currentValues.push(opt.value);
                      } else {
                        const index = currentValues.indexOf(opt.value);
                        if (index > -1) currentValues.splice(index, 1);
                      }
                      this._updateValue(field.name, currentValues);
                    }}
                    ?disabled=${this.readonly}
                  />
                  ${opt.label}
                </label>
              `)}
            </div>
            ${field.helpText ? html`<div class="form-help">${field.helpText}</div>` : ''}
            ${hasError ? html`<div class="form-error">${errors[0]}</div>` : ''}
          </div>
        `;

      case 'radio':
        return html`
          <div class="form-field" @click=${() => this._selectField(field)}>
            ${this.mode === 'builder' ? this._renderFieldControls(field) : ''}
            <label class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
            <div class="radio-group">
              ${field.options?.map(opt => html`
                <label style="display: flex; align-items: center; font-weight: normal;">
                  <input 
                    type="radio" 
                    class="form-radio"
                    name=${field.name}
                    value=${opt.value}
                    .checked=${opt.value === value}
                    @change=${(e) => this._updateValue(field.name, e.target.value)}
                    ?disabled=${this.readonly}
                  />
                  ${opt.label}
                </label>
              `)}
            </div>
            ${field.helpText ? html`<div class="form-help">${field.helpText}</div>` : ''}
            ${hasError ? html`<div class="form-error">${errors[0]}</div>` : ''}
          </div>
        `;

      default:
        return html`
          <div class="form-field" @click=${() => this._selectField(field)}>
            ${this.mode === 'builder' ? this._renderFieldControls(field) : ''}
            <label class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
            <input 
              type=${field.type}
              class="form-input"
              placeholder=${field.placeholder || ''}
              .value=${value}
              min=${field.min || ''}
              max=${field.max || ''}
              step=${field.step || ''}
              @input=${(e) => this._updateValue(field.name, e.target.value)}
              ?disabled=${this.readonly}
            />
            ${field.helpText ? html`<div class="form-help">${field.helpText}</div>` : ''}
            ${hasError ? html`<div class="form-error">${errors[0]}</div>` : ''}
          </div>
        `;
    }
  }

  _renderFieldControls(field) {
    return html`
      <div class="field-controls">
        <button class="control-btn" @click=${(e) => { e.stopPropagation(); this._duplicateField(field); }} title="Duplicate">
          ⧉
        </button>
        <button class="control-btn delete" @click=${(e) => { e.stopPropagation(); this._deleteField(field); }} title="Delete">
          ×
        </button>
      </div>
    `;
  }

  _renderPropertiesPanel() {
    if (!this.selectedField) {
      return html`
        <div class="properties-panel ${!this.showProperties ? 'hidden' : ''}">
          <div class="panel-header">Properties</div>
          <p style="color: #6b7280; font-size: 13px;">Select a field to edit its properties</p>
        </div>
      `;
    }

    const field = this.selectedField;

    return html`
      <div class="properties-panel ${!this.showProperties ? 'hidden' : ''}">
        <div class="panel-header">Field Properties</div>
        
        <div class="property-group">
          <label class="property-label">Label</label>
          <input 
            type="text" 
            class="property-input"
            .value=${field.label || ''}
            @input=${(e) => this._updateFieldProperty('label', e.target.value)}
          />
        </div>

        <div class="property-group">
          <label class="property-label">Field Name</label>
          <input 
            type="text" 
            class="property-input"
            .value=${field.name || ''}
            @input=${(e) => this._updateFieldProperty('name', e.target.value)}
          />
        </div>

        ${field.type !== 'section' && field.type !== 'spacer' ? html`
          <div class="property-group">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input 
                type="checkbox" 
                .checked=${field.required || false}
                @change=${(e) => this._updateFieldProperty('required', e.target.checked)}
              />
              <span class="property-label" style="margin: 0;">Required</span>
            </label>
          </div>

          <div class="property-group">
            <label class="property-label">Placeholder</label>
            <input 
              type="text" 
              class="property-input"
              .value=${field.placeholder || ''}
              @input=${(e) => this._updateFieldProperty('placeholder', e.target.value)}
            />
          </div>

          <div class="property-group">
            <label class="property-label">Help Text</label>
            <textarea 
              class="property-input"
              rows="2"
              .value=${field.helpText || ''}
              @input=${(e) => this._updateFieldProperty('helpText', e.target.value)}
            ></textarea>
          </div>
        ` : ''}

        ${field.type === 'section' ? html`
          <div class="property-group">
            <label class="property-label">Description</label>
            <textarea 
              class="property-input"
              rows="2"
              .value=${field.description || ''}
              @input=${(e) => this._updateFieldProperty('description', e.target.value)}
            ></textarea>
          </div>
        ` : ''}

        ${(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') ? html`
          <div class="property-group">
            <label class="property-label">Options</label>
            ${field.options?.map((opt, index) => html`
              <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                <input 
                  type="text" 
                  placeholder="Label"
                  style="flex: 1;"
                  class="property-input"
                  .value=${opt.label}
                  @input=${(e) => {
                    const options = [...field.options];
                    options[index] = { ...opt, label: e.target.value };
                    this._updateFieldProperty('options', options);
                  }}
                />
                <input 
                  type="text" 
                  placeholder="Value"
                  style="flex: 1;"
                  class="property-input"
                  .value=${opt.value}
                  @input=${(e) => {
                    const options = [...field.options];
                    options[index] = { ...opt, value: e.target.value };
                    this._updateFieldProperty('options', options);
                  }}
                />
                <button 
                  style="width: 24px; height: 24px; border: none; background: #ef4444; color: white; border-radius: 4px; cursor: pointer;"
                  @click=${() => {
                    const options = field.options.filter((_, i) => i !== index);
                    this._updateFieldProperty('options', options);
                  }}
                >×</button>
              </div>
            `)}
            <button 
              style="width: 100%; padding: 6px; border: 1px dashed #d1d5db; background: none; border-radius: 4px; cursor: pointer;"
              @click=${() => {
                const options = [...(field.options || []), { label: 'New Option', value: `option_${Date.now()}` }];
                this._updateFieldProperty('options', options);
              }}
            >+ Add Option</button>
          </div>
        ` : ''}

        ${field.type === 'number' ? html`
          <div class="property-group">
            <label class="property-label">Min Value</label>
            <input 
              type="number" 
              class="property-input"
              .value=${field.min || ''}
              @input=${(e) => this._updateFieldProperty('min', e.target.value)}
            />
          </div>
          <div class="property-group">
            <label class="property-label">Max Value</label>
            <input 
              type="number" 
              class="property-input"
              .value=${field.max || ''}
              @input=${(e) => this._updateFieldProperty('max', e.target.value)}
            />
          </div>
          <div class="property-group">
            <label class="property-label">Step</label>
            <input 
              type="number" 
              class="property-input"
              .value=${field.step || ''}
              @input=${(e) => this._updateFieldProperty('step', e.target.value)}
            />
          </div>
        ` : ''}

        ${field.type === 'textarea' ? html`
          <div class="property-group">
            <label class="property-label">Rows</label>
            <input 
              type="number" 
              class="property-input"
              min="2"
              max="20"
              .value=${field.rows || 4}
              @input=${(e) => this._updateFieldProperty('rows', parseInt(e.target.value))}
            />
          </div>
        ` : ''}
      </div>
    `;
  }

  render() {
    const hasValidationErrors = this.validationErrors.size > 0;

    if (this.mode === 'preview' || this.mode === 'runtime') {
      return html`
        <div class="form-preview ${this.compact ? 'compact-mode' : ''}">
          ${hasValidationErrors ? html`
            <div class="validation-summary">
              <div class="validation-title">Please fix the following errors:</div>
              <ul class="validation-list">
                ${Array.from(this.validationErrors.values()).flat().map(error => html`
                  <li class="validation-item">${error}</li>
                `)}
              </ul>
            </div>
          ` : ''}

          ${this.schema.fields.map(field => this._renderField(field))}

          ${this.mode === 'runtime' ? html`
            <div style="margin-top: 24px; display: flex; gap: 12px;">
              <button class="nav-btn" @click=${this._submitForm} ?disabled=${hasValidationErrors}>
                Submit Form
              </button>
              <button class="nav-btn secondary" @click=${() => this.values = {}}>
                Clear Form
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }

    return html`
      <div class="form-builder">
        <div class="builder-sidebar">
          <div class="sidebar-header">Form Builder</div>
          <div class="field-palette">
            <div class="palette-section">
              <div class="section-title">Input Fields</div>
              ${this.fieldTypes.filter(f => ['text', 'email', 'number', 'password', 'textarea', 'date', 'file'].includes(f.type)).map(fieldType => html`
                <div 
                  class="field-item"
                  draggable="true"
                  @dragstart=${(e) => this._handleFieldDragStart(e, fieldType.type)}
                >
                  <span class="field-icon">${fieldType.icon}</span>
                  <span class="field-label">${fieldType.label}</span>
                </div>
              `)}
            </div>

            <div class="palette-section">
              <div class="section-title">Selection Fields</div>
              ${this.fieldTypes.filter(f => ['select', 'radio', 'checkbox'].includes(f.type)).map(fieldType => html`
                <div 
                  class="field-item"
                  draggable="true"
                  @dragstart=${(e) => this._handleFieldDragStart(e, fieldType.type)}
                >
                  <span class="field-icon">${fieldType.icon}</span>
                  <span class="field-label">${fieldType.label}</span>
                </div>
              `)}
            </div>

            <div class="palette-section">
              <div class="section-title">Layout Elements</div>
              ${this.fieldTypes.filter(f => ['section', 'spacer'].includes(f.type)).map(fieldType => html`
                <div 
                  class="field-item"
                  draggable="true"
                  @dragstart=${(e) => this._handleFieldDragStart(e, fieldType.type)}
                >
                  <span class="field-icon">${fieldType.icon}</span>
                  <span class="field-label">${fieldType.label}</span>
                </div>
              `)}
            </div>
          </div>
        </div>

        <div class="form-canvas">
          <div class="canvas-toolbar">
            <div class="toolbar-left">
              <button class="toolbar-btn ${this.mode === 'builder' ? 'active' : ''}" @click=${() => this.mode = 'builder'}>
                🔨 Builder
              </button>
              <button class="toolbar-btn ${this.mode === 'preview' ? 'active' : ''}" @click=${() => this.mode = 'preview'}>
                👁 Preview
              </button>
              <button class="toolbar-btn ${this.mode === 'runtime' ? 'active' : ''}" @click=${() => this.mode = 'runtime'}>
                ⚡ Runtime
              </button>
            </div>
            <div class="toolbar-right">
              ${this.autoSave ? html`
                <div class="auto-save-indicator">
                  <div class="save-dot"></div>
                  Auto-save enabled
                </div>
              ` : ''}
              <button class="toolbar-btn" @click=${() => this.showProperties = !this.showProperties}>
                ${this.showProperties ? '🗂 Hide Properties' : '🗂 Show Properties'}
              </button>
              <button class="toolbar-btn" @click=${this._saveForm}>
                💾 Save
              </button>
            </div>
          </div>

          <div class="canvas-area">
            ${this.schema.fields.length === 0 ? html`
              <div class="drop-zone ${this.isDragging ? 'drag-over' : ''}">
                Drag field types from the sidebar to build your form
              </div>
            ` : html`
              <div class="form-preview">
                ${this.schema.fields.map(field => this._renderField(field))}
              </div>
            `}
          </div>
        </div>

        ${this._renderPropertiesPanel()}
      </div>
    `;
  }
}

customElements.define("neo-form-builder", NeoFormBuilder);