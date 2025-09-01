/**
 * Component Generator Modal - Interactive UI for component generation
 *
 * Provides a user-friendly interface for creating new Web Components
 */

import { html, css, LitElement } from 'lit';
import { componentGenerator } from '../tools/component-generator.js';

export class ComponentGeneratorModal extends LitElement {
  static get properties() {
    return {
      isOpen: { type: Boolean, reflect: true },
      currentStep: { type: Number },
      config: { type: Object },
      preview: { type: Object },
      generationResult: { type: Object },
      isGenerating: { type: Boolean },
      errors: { type: Array }
    };
  }

  static get styles() {
    return css`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      :host([isOpen]) {
        opacity: 1;
        visibility: visible;
      }

      .modal {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        width: 90vw;
        max-width: 800px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }

      :host([isOpen]) .modal {
        transform: scale(1);
      }

      .modal-header {
        padding: 1.5rem 2rem;
        border-bottom: 1px solid #e0e0e0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .close-button {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: background 0.2s ease;
      }

      .close-button:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 0;
      }

      .steps-indicator {
        display: flex;
        background: #f8f9fa;
        border-bottom: 1px solid #e0e0e0;
      }

      .step-indicator {
        flex: 1;
        padding: 1rem;
        text-align: center;
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .step-indicator.active {
        background: #667eea;
        color: white;
      }

      .step-indicator.completed {
        background: #28a745;
        color: white;
      }

      .step-indicator:hover:not(.active) {
        background: #e9ecef;
      }

      .step-content {
        padding: 2rem;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: #333;
      }

      .form-input,
      .form-select,
      .form-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        font-size: 0.9rem;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }

      .form-input:focus,
      .form-select:focus,
      .form-textarea:focus {
        outline: none;
        border-color: #667eea;
      }

      .form-textarea {
        resize: vertical;
        min-height: 100px;
      }

      .properties-list {
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        max-height: 300px;
        overflow-y: auto;
      }

      .property-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid #f0f0f0;
        background: white;
      }

      .property-item:last-child {
        border-bottom: none;
      }

      .property-field {
        flex: 1;
        min-width: 0;
      }

      .property-field input,
      .property-field select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.85rem;
      }

      .remove-property {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        font-size: 0.8rem;
        transition: background 0.2s ease;
      }

      .remove-property:hover {
        background: #c82333;
      }

      .add-property {
        background: #28a745;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        cursor: pointer;
        font-size: 0.9rem;
        margin-top: 1rem;
        transition: background 0.2s ease;
      }

      .add-property:hover {
        background: #218838;
      }

      .preview-section {
        background: #f8f9fa;
        border-radius: 6px;
        padding: 1.5rem;
        margin-bottom: 1rem;
      }

      .preview-title {
        font-weight: 600;
        margin-bottom: 1rem;
        color: #333;
      }

      .preview-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #e0e0e0;
      }

      .preview-item:last-child {
        border-bottom: none;
      }

      .preview-label {
        font-weight: 500;
        color: #555;
      }

      .preview-value {
        color: #333;
        font-family: monospace;
        font-size: 0.9rem;
      }

      .files-list {
        margin-top: 1rem;
      }

      .file-item {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        font-family: monospace;
        font-size: 0.85rem;
        color: #555;
      }

      .modal-actions {
        padding: 1.5rem 2rem;
        border-top: 1px solid #e0e0e0;
        background: #f8f9fa;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-primary {
        background: #667eea;
        color: white;
      }

      .btn-primary:hover {
        background: #5a6fd8;
        transform: translateY(-1px);
      }

      .btn-primary:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-secondary:hover {
        background: #545b62;
      }

      .btn-success {
        background: #28a745;
        color: white;
      }

      .btn-success:hover {
        background: #218838;
      }

      .error-message {
        background: #f8d7da;
        color: #721c24;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        border: 1px solid #f5c6cb;
      }

      .success-message {
        background: #d4edda;
        color: #155724;
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        border: 1px solid #c3e6cb;
      }

      .loading-spinner {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid currentColor;
        border-radius: 50%;
        border-right-color: transparent;
        animation: spin 0.75s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .checkbox-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .checkbox-group input[type="checkbox"] {
        width: auto;
        margin-right: 0.5rem;
      }

      .help-text {
        font-size: 0.8rem;
        color: #666;
        margin-top: 0.25rem;
        font-style: italic;
      }

      @media (max-width: 768px) {
        .modal {
          width: 95vw;
          max-height: 95vh;
        }

        .step-content {
          padding: 1rem;
        }

        .property-item {
          flex-direction: column;
          align-items: stretch;
          gap: 0.5rem;
        }

        .modal-actions {
          flex-direction: column;
        }
      }
    `;
  }

  constructor() {
    super();
    this.isOpen = false;
    this.currentStep = 1;
    this.config = this.getDefaultConfig();
    this.preview = null;
    this.generationResult = null;
    this.isGenerating = false;
    this.errors = [];
  }

  getDefaultConfig() {
    return {
      name: '',
      category: 'atoms',
      description: '',
      properties: [],
      hasSlots: true,
      hasEvents: true
    };
  }

  open() {
    this.isOpen = true;
    this.currentStep = 1;
    this.config = this.getDefaultConfig();
    this.preview = null;
    this.generationResult = null;
    this.errors = [];
  }

  close() {
    this.isOpen = false;
    this.dispatchEvent(new CustomEvent('generator-closed', {
      bubbles: true,
      composed: true
    }));
  }

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
      if (this.currentStep === 3) {
        this.generatePreview();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step) {
    this.currentStep = step;
    if (step === 3) {
      this.generatePreview();
    }
  }

  addProperty() {
    this.config = {
      ...this.config,
      properties: [
        ...this.config.properties,
        {
          name: '',
          type: 'String',
          description: '',
          defaultValue: '',
          reflect: true
        }
      ]
    };
  }

  removeProperty(index) {
    const properties = [...this.config.properties];
    properties.splice(index, 1);
    this.config = { ...this.config, properties };
  }

  updateProperty(index, field, value) {
    const properties = [...this.config.properties];
    properties[index] = { ...properties[index], [field]: value };
    this.config = { ...this.config, properties };
  }

  updateConfig(field, value) {
    this.config = { ...this.config, [field]: value };
  }

  async generatePreview() {
    try {
      this.preview = componentGenerator.previewComponent(this.config);
      if (!this.preview.success) {
        this.errors = this.preview.errors || [this.preview.error];
      } else {
        this.errors = [];
      }
    } catch (error) {
      this.errors = [error.message];
      this.preview = null;
    }
  }

  async generateComponent() {
    this.isGenerating = true;
    this.errors = [];

    try {
      this.generationResult = await componentGenerator.generateComponent(this.config);

      if (this.generationResult.success) {
        this.currentStep = 4;
        this.dispatchEvent(new CustomEvent('component-generated', {
          bubbles: true,
          composed: true,
          detail: this.generationResult
        }));
      } else {
        this.errors = [this.generationResult.error];
      }
    } catch (error) {
      this.errors = [error.message];
    } finally {
      this.isGenerating = false;
    }
  }

  renderStepIndicator() {
    const steps = [
      { number: 1, title: 'Basic Info' },
      { number: 2, title: 'Properties' },
      { number: 3, title: 'Preview' },
      { number: 4, title: 'Generate' }
    ];

    return html`
      <div class="steps-indicator">
        ${steps.map(step => html`
          <div
            class="step-indicator ${step.number === this.currentStep ? 'active' : ''} ${step.number < this.currentStep ? 'completed' : ''}"
            @click="${() => this.goToStep(step.number)}"
          >
            ${step.number}. ${step.title}
          </div>
        `)}
      </div>
    `;
  }

  renderStep1() {
    return html`
      <div class="step-content">
        <h3>Basic Component Information</h3>

        <div class="form-group">
          <label class="form-label">Component Name *</label>
          <input
            type="text"
            class="form-input"
            placeholder="e.g., custom-button, data-card, user-profile"
            .value="${this.config.name}"
            @input="${(e) => this.updateConfig('name', e.target.value)}"
          />
          <div class="help-text">Use kebab-case naming. Will be prefixed with "neo-"</div>
        </div>

        <div class="form-group">
          <label class="form-label">Category *</label>
          <select
            class="form-select"
            .value="${this.config.category}"
            @change="${(e) => this.updateConfig('category', e.target.value)}"
          >
            <option value="atoms">Atoms (Basic UI elements)</option>
            <option value="molecules">Molecules (Simple combinations)</option>
            <option value="organisms">Organisms (Complex components)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Description *</label>
          <textarea
            class="form-textarea"
            placeholder="Brief description of what this component does..."
            .value="${this.config.description}"
            @input="${(e) => this.updateConfig('description', e.target.value)}"
          ></textarea>
        </div>

        <div class="form-group">
          <div class="checkbox-group">
            <input
              type="checkbox"
              id="has-slots"
              ?checked="${this.config.hasSlots}"
              @change="${(e) => this.updateConfig('hasSlots', e.target.checked)}"
            />
            <label for="has-slots">Include slot support</label>
          </div>
          <div class="help-text">Allow content to be passed into the component</div>
        </div>

        <div class="form-group">
          <div class="checkbox-group">
            <input
              type="checkbox"
              id="has-events"
              ?checked="${this.config.hasEvents}"
              @change="${(e) => this.updateConfig('hasEvents', e.target.checked)}"
            />
            <label for="has-events">Include event handling</label>
          </div>
          <div class="help-text">Generate custom event dispatching code</div>
        </div>
      </div>
    `;
  }

  renderStep2() {
    return html`
      <div class="step-content">
        <h3>Component Properties</h3>
        <p>Define custom properties for your component. Common properties for your category will be added automatically.</p>

        <div class="properties-list">
          ${this.config.properties.map((prop, index) => html`
            <div class="property-item">
              <div class="property-field">
                <input
                  type="text"
                  placeholder="Property name"
                  .value="${prop.name}"
                  @input="${(e) => this.updateProperty(index, 'name', e.target.value)}"
                />
              </div>
              <div class="property-field">
                <select
                  .value="${prop.type}"
                  @change="${(e) => this.updateProperty(index, 'type', e.target.value)}"
                >
                  <option value="String">String</option>
                  <option value="Boolean">Boolean</option>
                  <option value="Number">Number</option>
                  <option value="Array">Array</option>
                  <option value="Object">Object</option>
                </select>
              </div>
              <div class="property-field">
                <input
                  type="text"
                  placeholder="Description"
                  .value="${prop.description}"
                  @input="${(e) => this.updateProperty(index, 'description', e.target.value)}"
                />
              </div>
              <div class="property-field">
                <input
                  type="text"
                  placeholder="Default value"
                  .value="${prop.defaultValue}"
                  @input="${(e) => this.updateProperty(index, 'defaultValue', e.target.value)}"
                />
              </div>
              <button
                class="remove-property"
                @click="${() => this.removeProperty(index)}"
              >
                Remove
              </button>
            </div>
          `)}
        </div>

        <button class="add-property" @click="${this.addProperty}">
          + Add Property
        </button>
      </div>
    `;
  }

  renderStep3() {
    if (!this.preview) {
      return html`
        <div class="step-content">
          <h3>Generating Preview...</h3>
          <div class="loading-spinner"></div>
        </div>
      `;
    }

    if (!this.preview.success) {
      return html`
        <div class="step-content">
          <h3>Preview</h3>
          ${this.errors.map(error => html`
            <div class="error-message">${error}</div>
          `)}
        </div>
      `;
    }

    return html`
      <div class="step-content">
        <h3>Component Preview</h3>

        <div class="preview-section">
          <div class="preview-title">Component Details</div>
          <div class="preview-item">
            <span class="preview-label">Component Name:</span>
            <span class="preview-value">${this.preview.config.componentName}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Class Name:</span>
            <span class="preview-value">${this.preview.config.className}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Category:</span>
            <span class="preview-value">${this.preview.config.category}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Properties:</span>
            <span class="preview-value">${this.preview.config.properties.length} properties</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Estimated Size:</span>
            <span class="preview-value">${Math.round(this.preview.preview.estimatedSize / 1024)} KB</span>
          </div>
        </div>

        <div class="preview-section">
          <div class="preview-title">Files to be Created</div>
          <div class="files-list">
            ${this.preview.preview.filesWillBeCreated.map(file => html`
              <div class="file-item">${file}</div>
            `)}
          </div>
        </div>

        <div class="preview-section">
          <div class="preview-title">Properties</div>
          ${this.preview.config.properties.map(prop => html`
            <div class="preview-item">
              <span class="preview-label">${prop.name}:</span>
              <span class="preview-value">${prop.type} (${prop.description})</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  renderStep4() {
    if (this.generationResult?.success) {
      return html`
        <div class="step-content">
          <div class="success-message">
            <h3>✅ Component Generated Successfully!</h3>
            <p>${this.generationResult.message}</p>

            <div style="margin-top: 1rem;">
              <strong>Next Steps:</strong>
              <ol style="margin: 0.5rem 0; padding-left: 1.5rem;">
                <li>Create the actual files in your project</li>
                <li>Update ComponentLoader with the new component</li>
                <li>Add the component to the playground</li>
                <li>Test the component integration</li>
              </ol>
            </div>
          </div>

          <div class="preview-section">
            <div class="preview-title">Generation Results</div>
            <div class="preview-item">
              <span class="preview-label">Files Created:</span>
              <span class="preview-value">${this.generationResult.filesGenerated}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Generation Time:</span>
              <span class="preview-value">${this.generationResult.generationTime}ms</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Component Name:</span>
              <span class="preview-value">${this.generationResult.config.componentName}</span>
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="step-content">
        <h3>Ready to Generate</h3>
        <p>Click the button below to generate your component files.</p>

        ${this.errors.map(error => html`
          <div class="error-message">${error}</div>
        `)}
      </div>
    `;
  }

  renderModalActions() {
    switch (this.currentStep) {
      case 1:
        return html`
          <button class="btn btn-secondary" @click="${this.close}">Cancel</button>
          <button
            class="btn btn-primary"
            @click="${this.nextStep}"
            ?disabled="${!this.config.name || !this.config.description}"
          >
            Next: Properties
          </button>
        `;

      case 2:
        return html`
          <button class="btn btn-secondary" @click="${this.prevStep}">Back</button>
          <button class="btn btn-primary" @click="${this.nextStep}">
            Next: Preview
          </button>
        `;

      case 3:
        return html`
          <button class="btn btn-secondary" @click="${this.prevStep}">Back</button>
          <button
            class="btn btn-success"
            @click="${this.generateComponent}"
            ?disabled="${!this.preview?.success || this.isGenerating}"
          >
            ${this.isGenerating ? html`<span class="loading-spinner"></span> Generating...` : 'Generate Component'}
          </button>
        `;

      case 4:
        return html`
          <button class="btn btn-secondary" @click="${this.close}">Close</button>
          <button class="btn btn-primary" @click="${() => { this.close(); this.open(); }}">
            Generate Another
          </button>
        `;
    }
  }

  render() {
    return html`
      <div class="modal" @click="${(e) => e.target === e.currentTarget && this.close()}">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">
              🧩 Component Generator
            </h2>
            <button class="close-button" @click="${this.close}">×</button>
          </div>

          ${this.renderStepIndicator()}

          <div class="modal-body">
            ${this.currentStep === 1 ? this.renderStep1() : ''}
            ${this.currentStep === 2 ? this.renderStep2() : ''}
            ${this.currentStep === 3 ? this.renderStep3() : ''}
            ${this.currentStep === 4 ? this.renderStep4() : ''}
          </div>

          <div class="modal-actions">
            ${this.renderModalActions()}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('component-generator-modal', ComponentGeneratorModal);
