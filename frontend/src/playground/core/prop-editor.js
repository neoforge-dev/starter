/**
 * Prop Editor - Interactive property editor for components
 * 
 * Creates interactive controls for component properties based on argTypes
 */
import { html, css, LitElement } from 'lit';

export class PropEditor extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .prop-group {
      margin-bottom: 16px;
    }
    
    .prop-label {
      display: block;
      font-weight: 500;
      margin-bottom: 4px;
      font-size: 14px;
      color: #495057;
    }
    
    .prop-description {
      font-size: 12px;
      color: #6c757d;
      margin-bottom: 8px;
    }
    
    .prop-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .prop-control:focus {
      outline: none;
      border-color: #80bdff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }
    
    .checkbox-control {
      width: auto;
      margin-right: 8px;
    }
    
    .reset-button {
      background: #6c757d;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-top: 16px;
    }
    
    .reset-button:hover {
      background: #5a6268;
    }
  `;

  static properties = {
    argTypes: { type: Object },
    values: { type: Object },
    component: { type: String },
    targetComponent: { type: Object }
  };

  constructor() {
    super();
    this.argTypes = {};
    this.values = {};
    this.component = '';
    this.targetComponent = null;
  }

  /**
   * Create controls from argTypes configuration
   * @param {Object} argTypes - Component argTypes definition
   * @returns {Object} Control configuration
   */
  createControls(argTypes) {
    const controls = {};
    
    Object.entries(argTypes).forEach(([propName, config]) => {
      controls[propName] = {
        type: config.control?.type || 'text',
        options: config.options || config.control?.options || [],
        defaultValue: config.defaultValue || config.table?.defaultValue?.summary,
        description: config.description,
        ...config.control
      };
    });
    
    return controls;
  }

  /**
   * Handle property value changes
   * @param {string} propName - Name of the property
   * @param {any} value - New value
   */
  onPropChange(propName, value) {
    const newValues = { ...this.values };
    newValues[propName] = value;
    this.values = newValues;
    
    // Update the target component directly if available
    if (this.targetComponent && this.targetComponent[propName] !== undefined) {
      this.targetComponent[propName] = value;
    }
    
    // Dispatch change event with new values
    this.dispatchEvent(new CustomEvent('prop-change', {
      detail: {
        property: propName,
        value: value,
        allValues: newValues,
        targetComponent: this.targetComponent
      },
      bubbles: true
    }));
  }

  /**
   * Reset all properties to default values
   */
  resetToDefaults() {
    const defaultValues = {};
    Object.entries(this.argTypes).forEach(([propName, config]) => {
      const defaultValue = config.defaultValue || config.table?.defaultValue?.summary;
      if (defaultValue !== undefined) {
        defaultValues[propName] = defaultValue;
      }
    });
    
    this.values = defaultValues;
    this.dispatchEvent(new CustomEvent('props-reset', {
      detail: { values: defaultValues },
      bubbles: true
    }));
  }

  /**
   * Render a control for a specific property
   */
  renderControl(propName, config) {
    const currentValue = this.values[propName] || config.defaultValue;
    
    switch (config.control?.type || 'text') {
      case 'select':
        return html`
          <select 
            class="prop-control" 
            @change="${(e) => this.onPropChange(propName, e.target.value)}"
            .value="${currentValue}"
          >
            ${(config.options || config.control.options || []).map(option => 
              html`<option value="${option}" ?selected="${option === currentValue}">${option}</option>`
            )}
          </select>
        `;
      
      case 'boolean':
        return html`
          <label>
            <input 
              type="checkbox" 
              class="prop-control checkbox-control"
              ?checked="${currentValue}"
              @change="${(e) => this.onPropChange(propName, e.target.checked)}"
            />
            ${config.description || propName}
          </label>
        `;
      
      case 'color':
        return html`
          <input 
            type="color" 
            class="prop-control"
            .value="${currentValue || '#000000'}"
            @input="${(e) => this.onPropChange(propName, e.target.value)}"
          />
        `;
      
      case 'number':
        return html`
          <input 
            type="number" 
            class="prop-control"
            .value="${currentValue || 0}"
            min="${config.min || 0}"
            max="${config.max || 100}"
            step="${config.step || 1}"
            @input="${(e) => this.onPropChange(propName, Number(e.target.value))}"
          />
        `;
      
      case 'range':
        return html`
          <input 
            type="range" 
            class="prop-control"
            .value="${currentValue || config.min || 0}"
            min="${config.min || 0}"
            max="${config.max || 100}"
            step="${config.step || 1}"
            @input="${(e) => this.onPropChange(propName, Number(e.target.value))}"
          />
          <span>${currentValue}</span>
        `;
      
      case 'text':
      default:
        return html`
          <input 
            type="text" 
            class="prop-control"
            .value="${currentValue || ''}"
            placeholder="${config.placeholder || `Enter ${propName}`}"
            @input="${(e) => this.onPropChange(propName, e.target.value)}"
          />
        `;
    }
  }

  render() {
    if (!this.argTypes || Object.keys(this.argTypes).length === 0) {
      return html`<p>No configurable properties for this component.</p>`;
    }

    return html`
      <h3>Component Properties</h3>
      ${Object.entries(this.argTypes).map(([propName, config]) => html`
        <div class="prop-group">
          <label class="prop-label">${propName}</label>
          ${config.description ? html`
            <div class="prop-description">${config.description}</div>
          ` : ''}
          ${this.renderControl(propName, config)}
        </div>
      `)}
      
      <button class="reset-button" @click="${this.resetToDefaults}">
        Reset to Defaults
      </button>
    `;
  }
}

// Register the prop editor component
customElements.define('prop-editor', PropEditor);