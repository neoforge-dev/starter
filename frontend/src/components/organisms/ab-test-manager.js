/**
 * A/B Test Manager Component - Organism
 * Comprehensive test management interface for creating, configuring, and monitoring A/B tests
 * Follows atomic design principles and provides full CRUD functionality
 */

import { LitElement, html, css } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import abTestingService, { AbTestStatus } from '../../services/ab-testing.js';

@customElement('ab-test-manager')
export class AbTestManager extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .manager-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;
    }

    .manager-title {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .create-test-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .create-test-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .tests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .test-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .test-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .test-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .test-name {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .test-key {
      font-size: 12px;
      color: #6b7280;
      font-family: monospace;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .test-status {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-draft { background: #f3f4f6; color: #374151; }
    .status-active { background: #dcfce7; color: #166534; }
    .status-paused { background: #fef3c7; color: #92400e; }
    .status-completed { background: #dbeafe; color: #1e40af; }
    .status-archived { background: #f3f4f6; color: #6b7280; }

    .test-description {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .test-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    .metric {
      text-align: center;
    }

    .metric-value {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
    }

    .metric-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .test-variants {
      margin-bottom: 16px;
    }

    .variants-label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }

    .variant-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .variant-chip {
      padding: 4px 8px;
      background: #f3f4f6;
      border-radius: 6px;
      font-size: 12px;
      color: #374151;
    }

    .variant-chip.control {
      background: #dbeafe;
      color: #1e40af;
    }

    .test-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .action-btn.primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .action-btn.primary:hover {
      background: #2563eb;
    }

    .action-btn.danger {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }

    .action-btn.danger:hover {
      background: #dc2626;
    }

    .test-form {
      background: white;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #e5e7eb;
      margin-bottom: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .variants-editor {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background: #f9fafb;
    }

    .variant-editor {
      background: white;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 12px;
      border: 1px solid #e5e7eb;
    }

    .variant-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .add-variant-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .remove-variant-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .loading-state {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    .error-state {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      color: #dc2626;
      margin-bottom: 24px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #374151;
    }

    @media (max-width: 768px) {
      .tests-grid {
        grid-template-columns: 1fr;
      }
      
      .manager-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .test-metrics {
        grid-template-columns: 1fr;
      }
    }
  `;

  @property({ type: Boolean, attribute: 'show-form' })
  showForm = false;

  @property({ type: String, attribute: 'mode' })
  mode = 'list'; // 'list', 'create', 'edit'

  @state()
  private tests = [];

  @state()
  private isLoading = false;

  @state()
  private error = null;

  @state()
  private editingTest = null;

  @state()
  private formData = this._getDefaultFormData();

  connectedCallback() {
    super.connectedCallback();
    this._loadTests();
    
    // Listen for A/B testing service events
    this.unsubscribeFromAbTesting = abTestingService.subscribe((eventType, data) => {
      if (eventType === 'test_created' || eventType === 'test_updated' || 
          eventType === 'test_started' || eventType === 'test_stopped') {
        this._loadTests();
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeFromAbTesting) {
      this.unsubscribeFromAbTesting();
    }
  }

  async _loadTests() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await abTestingService.listTests();
      this.tests = response.tests || [];
    } catch (error) {
      console.error('Failed to load tests:', error);
      this.error = 'Failed to load A/B tests. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  _getDefaultFormData() {
    return {
      test_key: '',
      name: '',
      description: '',
      primary_metric: 'conversion',
      confidence_level: 0.95,
      minimum_detectable_effect: 0.05,
      minimum_sample_size: 1000,
      traffic_allocation: 1.0,
      variants: [
        {
          variant_key: 'control',
          name: 'Control',
          description: 'Original version',
          traffic_allocation: 0.5,
          is_control: true,
          configuration: {}
        },
        {
          variant_key: 'variant_a',
          name: 'Variant A',
          description: 'Test variation',
          traffic_allocation: 0.5,
          is_control: false,
          configuration: {}
        }
      ]
    };
  }

  _showCreateForm() {
    this.mode = 'create';
    this.formData = this._getDefaultFormData();
    this.editingTest = null;
  }

  _showEditForm(test) {
    this.mode = 'edit';
    this.editingTest = test;
    this.formData = {
      test_key: test.test_key,
      name: test.name,
      description: test.description || '',
      primary_metric: test.primary_metric,
      confidence_level: test.confidence_level,
      minimum_detectable_effect: test.minimum_detectable_effect,
      minimum_sample_size: test.minimum_sample_size,
      traffic_allocation: test.traffic_allocation,
      variants: test.variants.map(v => ({
        variant_key: v.variant_key,
        name: v.name,
        description: v.description || '',
        traffic_allocation: v.traffic_allocation,
        is_control: v.is_control,
        configuration: v.configuration || {}
      }))
    };
  }

  _cancelForm() {
    this.mode = 'list';
    this.editingTest = null;
    this.formData = this._getDefaultFormData();
  }

  async _saveTest() {
    try {
      this.isLoading = true;
      
      if (this.mode === 'create') {
        await abTestingService.createTest(this.formData);
      } else if (this.mode === 'edit') {
        const updateData = { ...this.formData };
        delete updateData.test_key; // Can't update test key
        delete updateData.variants; // Variants updated separately
        await abTestingService.updateTest(this.editingTest.id, updateData);
      }
      
      this._cancelForm();
      await this._loadTests();
      
    } catch (error) {
      console.error('Failed to save test:', error);
      this.error = `Failed to ${this.mode} test: ${error.message}`;
    } finally {
      this.isLoading = false;
    }
  }

  async _startTest(test) {
    try {
      await abTestingService.startTest(test.id);
      await this._loadTests();
    } catch (error) {
      console.error('Failed to start test:', error);
      this.error = `Failed to start test: ${error.message}`;
    }
  }

  async _stopTest(test, winnerVariantId = null) {
    try {
      await abTestingService.stopTest(test.id, winnerVariantId);
      await this._loadTests();
    } catch (error) {
      console.error('Failed to stop test:', error);
      this.error = `Failed to stop test: ${error.message}`;
    }
  }

  _updateFormField(field, value) {
    this.formData = { ...this.formData, [field]: value };
  }

  _updateVariant(index, field, value) {
    const variants = [...this.formData.variants];
    variants[index] = { ...variants[index], [field]: value };
    this.formData = { ...this.formData, variants };
    this.requestUpdate();
  }

  _addVariant() {
    const newVariant = {
      variant_key: `variant_${String.fromCharCode(97 + this.formData.variants.length - 1)}`,
      name: `Variant ${String.fromCharCode(65 + this.formData.variants.length - 1)}`,
      description: '',
      traffic_allocation: 0.33,
      is_control: false,
      configuration: {}
    };
    
    this.formData = {
      ...this.formData,
      variants: [...this.formData.variants, newVariant]
    };
    this.requestUpdate();
  }

  _removeVariant(index) {
    if (this.formData.variants.length <= 2) return; // Must have at least 2 variants
    
    const variants = this.formData.variants.filter((_, i) => i !== index);
    this.formData = { ...this.formData, variants };
    this.requestUpdate();
  }

  _getStatusClass(status) {
    return `test-status status-${status}`;
  }

  _formatDate(dateString) {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  }

  _formatPercentage(value) {
    return `${(value * 100).toFixed(1)}%`;
  }

  _renderTestCard(test) {
    const totalParticipants = test.variants.reduce((sum, v) => sum + v.total_users, 0);
    const totalConversions = test.variants.reduce((sum, v) => sum + v.total_conversions, 0);
    const overallConversionRate = totalParticipants > 0 ? totalConversions / totalParticipants : 0;

    return html`
      <div class="test-card">
        <div class="test-card-header">
          <div>
            <h3 class="test-name">${test.name}</h3>
            <div class="test-key">${test.test_key}</div>
          </div>
          <div class="${this._getStatusClass(test.status)}">${test.status}</div>
        </div>

        ${test.description ? html`
          <p class="test-description">${test.description}</p>
        ` : ''}

        <div class="test-metrics">
          <div class="metric">
            <div class="metric-value">${totalParticipants}</div>
            <div class="metric-label">Participants</div>
          </div>
          <div class="metric">
            <div class="metric-value">${totalConversions}</div>
            <div class="metric-label">Conversions</div>
          </div>
          <div class="metric">
            <div class="metric-value">${this._formatPercentage(overallConversionRate)}</div>
            <div class="metric-label">Conversion Rate</div>
          </div>
        </div>

        <div class="test-variants">
          <div class="variants-label">Variants:</div>
          <div class="variant-list">
            ${test.variants.map(variant => html`
              <div class="variant-chip ${variant.is_control ? 'control' : ''}">
                ${variant.name} (${this._formatPercentage(variant.conversion_rate)})
              </div>
            `)}
          </div>
        </div>

        <div class="test-actions">
          ${test.status === 'draft' ? html`
            <button class="action-btn primary" @click=${() => this._startTest(test)}>
              Start Test
            </button>
          ` : ''}
          
          ${test.status === 'active' ? html`
            <button class="action-btn danger" @click=${() => this._stopTest(test)}>
              Stop Test
            </button>
          ` : ''}
          
          ${test.status === 'paused' ? html`
            <button class="action-btn primary" @click=${() => this._startTest(test)}>
              Resume Test
            </button>
          ` : ''}
          
          <button class="action-btn" @click=${() => this._showEditForm(test)}>
            Edit
          </button>
          
          <button class="action-btn" @click=${() => this._viewAnalytics(test)}>
            Analytics
          </button>
        </div>
      </div>
    `;
  }

  _renderTestForm() {
    const isEditing = this.mode === 'edit';
    
    return html`
      <div class="test-form">
        <h3>${isEditing ? 'Edit Test' : 'Create New Test'}</h3>
        
        <div class="form-group">
          <label class="form-label">Test Key</label>
          <input 
            class="form-input" 
            type="text" 
            .value=${this.formData.test_key}
            @input=${(e) => this._updateFormField('test_key', e.target.value)}
            ?disabled=${isEditing}
            placeholder="unique_test_key"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Test Name</label>
          <input 
            class="form-input" 
            type="text" 
            .value=${this.formData.name}
            @input=${(e) => this._updateFormField('name', e.target.value)}
            placeholder="Descriptive test name"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea 
            class="form-input form-textarea" 
            .value=${this.formData.description}
            @input=${(e) => this._updateFormField('description', e.target.value)}
            placeholder="Test hypothesis and goals"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Primary Metric</label>
          <input 
            class="form-input" 
            type="text" 
            .value=${this.formData.primary_metric}
            @input=${(e) => this._updateFormField('primary_metric', e.target.value)}
            placeholder="conversion"
          />
        </div>

        <div class="variants-editor">
          <div class="variants-label">Test Variants:</div>
          ${this.formData.variants.map((variant, index) => html`
            <div class="variant-editor">
              <div class="variant-header">
                <strong>Variant ${index + 1}</strong>
                ${this.formData.variants.length > 2 ? html`
                  <button class="remove-variant-btn" @click=${() => this._removeVariant(index)}>
                    Remove
                  </button>
                ` : ''}
              </div>
              
              <div class="form-group">
                <label class="form-label">Variant Key</label>
                <input 
                  class="form-input" 
                  type="text" 
                  .value=${variant.variant_key}
                  @input=${(e) => this._updateVariant(index, 'variant_key', e.target.value)}
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Name</label>
                <input 
                  class="form-input" 
                  type="text" 
                  .value=${variant.name}
                  @input=${(e) => this._updateVariant(index, 'name', e.target.value)}
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Traffic Allocation</label>
                <input 
                  class="form-input" 
                  type="number" 
                  min="0" 
                  max="1" 
                  step="0.01"
                  .value=${variant.traffic_allocation}
                  @input=${(e) => this._updateVariant(index, 'traffic_allocation', parseFloat(e.target.value))}
                />
              </div>
              
              <div class="form-group">
                <label>
                  <input 
                    type="checkbox" 
                    .checked=${variant.is_control}
                    @change=${(e) => this._updateVariant(index, 'is_control', e.target.checked)}
                  />
                  Control Variant
                </label>
              </div>
            </div>
          `)}
          
          <button class="add-variant-btn" @click=${this._addVariant}>
            Add Variant
          </button>
        </div>

        <div class="form-actions">
          <button class="action-btn" @click=${this._cancelForm}>Cancel</button>
          <button class="action-btn primary" @click=${this._saveTest}>
            ${isEditing ? 'Update Test' : 'Create Test'}
          </button>
        </div>
      </div>
    `;
  }

  _viewAnalytics(test) {
    this.dispatchEvent(new CustomEvent('view-analytics', {
      detail: { test },
      bubbles: true
    }));
  }

  render() {
    return html`
      <div class="ab-test-manager">
        ${this.error ? html`
          <div class="error-state">
            ${this.error}
            <button @click=${() => { this.error = null; }}>✕</button>
          </div>
        ` : ''}

        <div class="manager-header">
          <h2 class="manager-title">A/B Test Manager</h2>
          ${this.mode === 'list' ? html`
            <button class="create-test-btn" @click=${this._showCreateForm}>
              Create New Test
            </button>
          ` : ''}
        </div>

        ${this.mode !== 'list' ? this._renderTestForm() : ''}

        ${this.mode === 'list' ? html`
          ${this.isLoading ? html`
            <div class="loading-state">Loading tests...</div>
          ` : ''}

          ${!this.isLoading && this.tests.length === 0 ? html`
            <div class="empty-state">
              <h3>No A/B Tests Yet</h3>
              <p>Create your first test to start optimizing conversions</p>
            </div>
          ` : ''}

          ${!this.isLoading && this.tests.length > 0 ? html`
            <div class="tests-grid">
              ${this.tests.map(test => this._renderTestCard(test))}
            </div>
          ` : ''}
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ab-test-manager': AbTestManager;
  }
}