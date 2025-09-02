import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";

/**
 * Slider component for numeric input with visual feedback
 * @element neo-slider
 *
 * @prop {number} value - Current value of the slider
 * @prop {number} min - Minimum value (default: 0)
 * @prop {number} max - Maximum value (default: 100)
 * @prop {number} step - Step increment (default: 1)
 * @prop {string} label - Label text for the slider
 * @prop {string} name - Name attribute for forms
 * @prop {boolean} disabled - Whether the slider is disabled
 * @prop {boolean} readonly - Whether the slider is read-only
 * @prop {boolean} showValue - Whether to show the current value
 * @prop {boolean} showTicks - Whether to show tick marks
 * @prop {boolean} showLabels - Whether to show min/max labels
 * @prop {string} size - Size variant (sm, md, lg)
 * @prop {string} variant - Visual variant (default, primary, success, warning, error)
 * @prop {string} valuePrefix - Prefix for displayed value (e.g., '$')
 * @prop {string} valueSuffix - Suffix for displayed value (e.g., '%', 'px')
 * @prop {function} formatValue - Custom function to format the displayed value
 * @prop {Array} marks - Array of mark objects with value and label
 * 
 * @event input - Fired when the value changes during sliding
 * @event change - Fired when the slider loses focus after value changed
 */
export class NeoSlider extends BaseComponent {
  static get properties() {
    return {
      value: { type: Number },
      min: { type: Number },
      max: { type: Number },
      step: { type: Number },
      label: { type: String },
      name: { type: String },
      disabled: { type: Boolean, reflect: true },
      readonly: { type: Boolean, reflect: true },
      showValue: { type: Boolean },
      showTicks: { type: Boolean },
      showLabels: { type: Boolean },
      size: { type: String, reflect: true },
      variant: { type: String, reflect: true },
      valuePrefix: { type: String },
      valueSuffix: { type: String },
      formatValue: { type: Function },
      marks: { type: Array },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          width: 100%;
          --slider-height: 6px;
          --thumb-size: 20px;
          --track-color: var(--color-surface-variant);
          --fill-color: var(--color-primary);
          --thumb-color: var(--color-surface);
          --thumb-border-color: var(--color-primary);
        }

        :host([disabled]) {
          opacity: 0.5;
          pointer-events: none;
        }

        /* Size variants */
        :host([size="sm"]) {
          --slider-height: 4px;
          --thumb-size: 16px;
        }

        :host([size="lg"]) {
          --slider-height: 8px;
          --thumb-size: 24px;
        }

        /* Variant colors */
        :host([variant="primary"]) {
          --fill-color: var(--color-primary);
          --thumb-border-color: var(--color-primary);
        }

        :host([variant="success"]) {
          --fill-color: var(--color-success);
          --thumb-border-color: var(--color-success);
        }

        :host([variant="warning"]) {
          --fill-color: var(--color-warning);
          --thumb-border-color: var(--color-warning);
        }

        :host([variant="error"]) {
          --fill-color: var(--color-error);
          --thumb-border-color: var(--color-error);
        }

        .slider-container {
          width: 100%;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text);
        }

        .value-display {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-primary);
          min-width: fit-content;
          text-align: right;
        }

        .slider-track-container {
          position: relative;
          padding: calc(var(--thumb-size) / 2) 0;
          margin: var(--spacing-sm) 0;
        }

        .slider-track {
          position: relative;
          width: 100%;
          height: var(--slider-height);
          background: var(--track-color);
          border-radius: calc(var(--slider-height) / 2);
          overflow: hidden;
        }

        .slider-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: var(--fill-color);
          border-radius: calc(var(--slider-height) / 2);
          transition: width 0.1s ease-out;
          pointer-events: none;
        }

        .slider-input {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: var(--thumb-size);
          margin: 0;
          padding: 0;
          transform: translateY(-50%);
          opacity: 0;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          outline: none;
        }

        .slider-input:disabled {
          cursor: not-allowed;
        }

        .slider-thumb {
          position: absolute;
          top: 50%;
          width: var(--thumb-size);
          height: var(--thumb-size);
          background: var(--thumb-color);
          border: 2px solid var(--thumb-border-color);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: all 0.1s ease-out;
          pointer-events: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider-input:focus + .slider-track .slider-thumb {
          box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.1),
            0 0 0 3px var(--color-primary-light);
        }

        .slider-input:hover + .slider-track .slider-thumb {
          transform: translate(-50%, -50%) scale(1.1);
        }

        .slider-input:active + .slider-track .slider-thumb {
          transform: translate(-50%, -50%) scale(1.2);
        }

        /* Ticks */
        .slider-ticks {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 2px;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .tick {
          position: absolute;
          width: 2px;
          height: 8px;
          background: var(--color-border);
          transform: translateX(-50%) translateY(-50%);
        }

        .tick.major {
          height: 12px;
          background: var(--color-text-secondary);
        }

        /* Labels */
        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: var(--spacing-xs);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        /* Marks */
        .slider-marks {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          margin-top: var(--spacing-xs);
          pointer-events: none;
        }

        .mark {
          position: absolute;
          transform: translateX(-50%);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          white-space: nowrap;
        }

        .mark.active {
          color: var(--color-primary);
          font-weight: var(--font-weight-medium);
        }

        /* Readonly state */
        :host([readonly]) .slider-input {
          pointer-events: none;
        }

        :host([readonly]) .slider-thumb {
          opacity: 0.7;
        }

        /* Screen reader only content */
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

        /* WebKit-specific styling for native range input fallback */
        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: var(--thumb-size);
          height: var(--thumb-size);
          border-radius: 50%;
          background: var(--thumb-color);
          border: 2px solid var(--thumb-border-color);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider-input::-webkit-slider-track {
          -webkit-appearance: none;
          height: var(--slider-height);
          background: transparent;
          border: none;
        }

        /* Firefox-specific styling */
        .slider-input::-moz-range-thumb {
          width: var(--thumb-size);
          height: var(--thumb-size);
          border-radius: 50%;
          background: var(--thumb-color);
          border: 2px solid var(--thumb-border-color);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider-input::-moz-range-track {
          height: var(--slider-height);
          background: transparent;
          border: none;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.value = 50;
    this.min = 0;
    this.max = 100;
    this.step = 1;
    this.label = "";
    this.name = "";
    this.disabled = false;
    this.readonly = false;
    this.showValue = true;
    this.showTicks = false;
    this.showLabels = false;
    this.size = "md";
    this.variant = "default";
    this.valuePrefix = "";
    this.valueSuffix = "";
    this.formatValue = null;
    this.marks = [];
  }

  /**
   * Get the percentage of the current value within the range
   */
  get percentage() {
    return ((this.value - this.min) / (this.max - this.min)) * 100;
  }

  /**
   * Get the formatted display value
   */
  get displayValue() {
    let formatted = this.value.toString();
    
    if (this.formatValue && typeof this.formatValue === 'function') {
      formatted = this.formatValue(this.value);
    } else {
      formatted = `${this.valuePrefix}${this.value}${this.valueSuffix}`;
    }
    
    return formatted;
  }

  /**
   * Handle input events (while sliding)
   */
  _handleInput(e) {
    const newValue = parseFloat(e.target.value);
    this.value = newValue;

    this.dispatchEvent(
      new CustomEvent("input", {
        bubbles: true,
        composed: true,
        detail: { value: newValue, originalEvent: e },
      })
    );
  }

  /**
   * Handle change events (on release)
   */
  _handleChange(e) {
    this.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value, originalEvent: e },
      })
    );
  }

  /**
   * Generate tick marks
   */
  _renderTicks() {
    if (!this.showTicks) return html``;

    const ticks = [];
    const range = this.max - this.min;
    const stepCount = Math.floor(range / this.step);
    
    // Determine tick interval - show maximum 10 ticks
    const tickInterval = Math.max(1, Math.floor(stepCount / 10));
    
    for (let i = 0; i <= stepCount; i += tickInterval) {
      const value = this.min + (i * this.step);
      const percentage = ((value - this.min) / range) * 100;
      const isMajor = i === 0 || i === stepCount || i % (tickInterval * 2) === 0;
      
      ticks.push(html`
        <div 
          class="tick ${isMajor ? 'major' : ''}"
          style="left: ${percentage}%"
        ></div>
      `);
    }

    return html`<div class="slider-ticks">${ticks}</div>`;
  }

  /**
   * Render custom marks
   */
  _renderMarks() {
    if (!this.marks || this.marks.length === 0) return html``;

    return html`
      <div class="slider-marks">
        ${this.marks.map(mark => {
          const percentage = ((mark.value - this.min) / (this.max - this.min)) * 100;
          const isActive = Math.abs(this.value - mark.value) < this.step / 2;
          
          return html`
            <div 
              class="mark ${isActive ? 'active' : ''}"
              style="left: ${percentage}%"
            >
              ${mark.label || mark.value}
            </div>
          `;
        })}
      </div>
    `;
  }

  /**
   * Public method to focus the slider
   */
  focus() {
    const input = this.shadowRoot.querySelector('.slider-input');
    if (input) {
      input.focus();
    }
  }

  /**
   * Public method to blur the slider
   */
  blur() {
    const input = this.shadowRoot.querySelector('.slider-input');
    if (input) {
      input.blur();
    }
  }

  render() {
    const percentage = this.percentage;
    const thumbPosition = percentage;
    const isDisabled = this.disabled;
    const isReadonly = this.readonly;

    return html`
      <div class="slider-container">
        ${this.label || this.showValue
          ? html`
              <div class="slider-header">
                ${this.label
                  ? html`<label class="label">${this.label}</label>`
                  : html``}
                ${this.showValue
                  ? html`<span class="value-display">${this.displayValue}</span>`
                  : html``}
              </div>
            `
          : html``}

        <div class="slider-track-container">
          <input
            class="slider-input"
            type="range"
            .value="${this.value}"
            min="${this.min}"
            max="${this.max}"
            step="${this.step}"
            name="${this.name}"
            ?disabled="${isDisabled}"
            ?readonly="${isReadonly}"
            aria-label="${this.label || 'Slider input'}"
            aria-valuemin="${this.min}"
            aria-valuemax="${this.max}"
            aria-valuenow="${this.value}"
            aria-valuetext="${this.displayValue}"
            @input="${this._handleInput}"
            @change="${this._handleChange}"
          />

          <div class="slider-track">
            <div 
              class="slider-fill" 
              style="width: ${percentage}%"
            ></div>
            ${this._renderTicks()}
            <div 
              class="slider-thumb" 
              style="left: ${thumbPosition}%"
            ></div>
          </div>

          ${this._renderMarks()}
        </div>

        ${this.showLabels
          ? html`
              <div class="slider-labels">
                <span>${this.min}</span>
                <span>${this.max}</span>
              </div>
            `
          : html``}

        <!-- Screen reader announcements -->
        <div class="sr-only" aria-live="polite" aria-atomic="true">
          Current value: ${this.displayValue}
        </div>
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-slider")) {
  customElements.define("neo-slider", NeoSlider);
}