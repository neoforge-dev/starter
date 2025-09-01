/**
 * Variant Renderer Component - Molecule
 * Dynamically renders content based on A/B test variant assignment
 * Follows atomic design principles and integrates with A/B testing service
 */

import { LitElement, html, css } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import abTestingService from '../../services/ab-testing.js';

@customElement('variant-renderer')
export class VariantRenderer extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .variant-content {
      transition: opacity 0.3s ease-in-out;
    }

    .variant-content.loading {
      opacity: 0.6;
    }

    .variant-content.loaded {
      opacity: 1;
    }

    .error-state {
      padding: 16px;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-size: 14px;
    }

    .loading-state {
      padding: 16px;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #6b7280;
      font-size: 14px;
      text-align: center;
    }

    .debug-info {
      position: absolute;
      top: 0;
      right: 0;
      padding: 4px 8px;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      font-size: 12px;
      border-radius: 0 0 0 8px;
      font-family: monospace;
      z-index: 1000;
    }

    .variant-wrapper {
      position: relative;
    }

    /* Performance optimization classes */
    .variant-content.fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Accessibility improvements */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  @property({ type: String, attribute: 'test-key' })
  testKey = '';

  @property({ type: Object })
  variants = {};

  @property({ type: String, attribute: 'default-variant' })
  defaultVariant = 'control';

  @property({ type: Boolean, attribute: 'show-debug' })
  showDebug = false;

  @property({ type: Boolean, attribute: 'lazy-load' })
  lazyLoad = false;

  @property({ type: Number, attribute: 'timeout' })
  timeout = 5000;

  @property({ type: String, attribute: 'loading-strategy' })
  loadingStrategy = 'immediate'; // 'immediate', 'visible', 'interaction'

  @state()
  private currentVariant = null;

  @state()
  private isLoading = false;

  @state()
  private error = null;

  @state()
  private assignmentData = null;

  @state()
  private isVisible = false;

  private intersectionObserver = null;
  private timeoutId = null;
  private abortController = null;

  connectedCallback() {
    super.connectedCallback();

    if (this.loadingStrategy === 'visible') {
      this._setupIntersectionObserver();
    } else if (this.loadingStrategy === 'immediate') {
      this._loadVariant();
    }

    // Listen for A/B testing service events
    this.unsubscribeFromAbTesting = abTestingService.subscribe((eventType, data) => {
      if (eventType === 'assignment' && data.testKey === this.testKey) {
        this._handleAssignmentUpdate(data.assignment);
      } else if (eventType === 'error' && data.testKey === this.testKey) {
        this._handleError(data.error);
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    if (this.abortController) {
      this.abortController.abort();
    }

    if (this.unsubscribeFromAbTesting) {
      this.unsubscribeFromAbTesting();
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('testKey') && this.testKey) {
      if (this.loadingStrategy === 'immediate') {
        this._loadVariant();
      }
    }
  }

  async _loadVariant() {
    if (!this.testKey || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.abortController = new AbortController();

    // Set timeout for assignment request
    this.timeoutId = setTimeout(() => {
      this.abortController.abort();
      this._handleTimeout();
    }, this.timeout);

    try {
      const assignment = await abTestingService.getTestAssignment(this.testKey);

      if (this.abortController.signal.aborted) {
        return;
      }

      clearTimeout(this.timeoutId);

      if (assignment) {
        this.assignmentData = assignment;
        this.currentVariant = assignment.variant_key;

        // Track exposure
        this._trackExposure(assignment);
      } else {
        // Fall back to default variant
        this.currentVariant = this.defaultVariant;
      }

    } catch (error) {
      if (!this.abortController.signal.aborted) {
        this._handleError(error);
      }
    } finally {
      this.isLoading = false;
      this.abortController = null;
    }
  }

  _setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this._loadVariant();
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isVisible) {
            this.isVisible = true;
            this._loadVariant();
            this.intersectionObserver.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Load 50px before element becomes visible
        threshold: 0.1
      }
    );

    this.intersectionObserver.observe(this);
  }

  _handleAssignmentUpdate(assignment) {
    this.assignmentData = assignment;
    this.currentVariant = assignment.variant_key;
    this.error = null;
    this._trackExposure(assignment);
  }

  _handleError(error) {
    console.error(`Variant renderer error for test ${this.testKey}:`, error);
    this.error = error.message || 'Failed to load test variant';
    this.currentVariant = this.defaultVariant;

    // Dispatch custom error event
    this.dispatchEvent(new CustomEvent('variant-error', {
      detail: { testKey: this.testKey, error },
      bubbles: true
    }));
  }

  _handleTimeout() {
    this._handleError(new Error('Assignment request timed out'));
  }

  _trackExposure(assignment) {
    // Track exposure event for analytics
    this.dispatchEvent(new CustomEvent('variant-exposed', {
      detail: {
        testKey: this.testKey,
        variantKey: assignment.variant_key,
        isControl: assignment.is_control,
        assignmentData: assignment
      },
      bubbles: true
    }));
  }

  _getVariantContent() {
    if (this.error) {
      return this._renderErrorState();
    }

    if (this.isLoading) {
      return this._renderLoadingState();
    }

    const variantKey = this.currentVariant || this.defaultVariant;
    const variantContent = this.variants[variantKey];

    if (!variantContent) {
      // Try to render slot content for the variant
      return html`<slot name="${variantKey}"><slot></slot></slot>`;
    }

    // Handle different content types
    if (typeof variantContent === 'string') {
      return html`<div class="variant-content loaded fade-in">${variantContent}</div>`;
    }

    if (variantContent.template) {
      return html`<div class="variant-content loaded fade-in">${variantContent.template}</div>`;
    }

    return html`<div class="variant-content loaded fade-in">${variantContent}</div>`;
  }

  _renderLoadingState() {
    return html`
      <div class="loading-state">
        <div class="sr-only">Loading test variant...</div>
        Loading...
      </div>
    `;
  }

  _renderErrorState() {
    return html`
      <div class="error-state">
        <div class="sr-only">Error loading test variant</div>
        ${this.error}
      </div>
    `;
  }

  _renderDebugInfo() {
    if (!this.showDebug) return '';

    return html`
      <div class="debug-info">
        <div>Test: ${this.testKey}</div>
        <div>Variant: ${this.currentVariant || 'none'}</div>
        ${this.assignmentData ? html`
          <div>Control: ${this.assignmentData.is_control ? 'Yes' : 'No'}</div>
          <div>Test ID: ${this.assignmentData.test_id}</div>
        ` : ''}
        ${this.error ? html`<div>Error: ${this.error}</div>` : ''}
      </div>
    `;
  }

  /**
   * Public API for triggering load (useful for interaction-based loading)
   */
  triggerLoad() {
    if (this.loadingStrategy === 'interaction' && !this.isLoading && !this.currentVariant) {
      this._loadVariant();
    }
  }

  /**
   * Public API for tracking conversion
   */
  async trackConversion(metricName, value = null, properties = {}) {
    if (!this.testKey) {
      console.warn('Cannot track conversion: no test key specified');
      return false;
    }

    try {
      const success = await abTestingService.trackConversion(
        this.testKey,
        metricName,
        value,
        properties
      );

      if (success) {
        this.dispatchEvent(new CustomEvent('variant-conversion', {
          detail: {
            testKey: this.testKey,
            variantKey: this.currentVariant,
            metricName,
            value,
            properties
          },
          bubbles: true
        }));
      }

      return success;
    } catch (error) {
      console.error('Failed to track conversion:', error);
      return false;
    }
  }

  /**
   * Get current variant information
   */
  getVariantInfo() {
    return {
      testKey: this.testKey,
      currentVariant: this.currentVariant,
      isControl: this.assignmentData?.is_control || false,
      assignmentData: this.assignmentData,
      isLoading: this.isLoading,
      error: this.error
    };
  }

  render() {
    return html`
      <div class="variant-wrapper">
        ${this._renderDebugInfo()}
        ${this._getVariantContent()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'variant-renderer': VariantRenderer;
  }
}
