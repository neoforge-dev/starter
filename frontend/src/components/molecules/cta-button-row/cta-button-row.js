import { html, css } from "lit";
import { BaseComponent } from "../../base-component.js";
import { baseStyles } from "../../styles/base.js";
import "../../atoms/button/button.js";

/**
 * Call-to-action button row for form actions and key decisions
 * @element neo-cta-button-row
 *
 * @prop {Array|string} actions - Array of action objects or JSON string
 * @prop {string} alignment - Button alignment (left, center, right, space-between, space-around)
 * @prop {string} orientation - Button orientation (horizontal, vertical)
 * @prop {string} size - Button size (sm, md, lg)
 * @prop {string} variant - Default button variant
 * @prop {boolean} fullWidth - Whether buttons should take full width
 * @prop {boolean} equal - Whether buttons should have equal width
 * @prop {string} gap - Gap between buttons (xs, sm, md, lg)
 * @prop {boolean} wrap - Whether buttons should wrap on small screens
 * @prop {boolean} sticky - Whether to stick to bottom on mobile
 * @prop {string} primaryAction - ID of the primary action
 * @prop {boolean} loading - Whether any action is loading
 *
 * @fires neo-action-click - When an action button is clicked
 * @fires neo-primary-action - When the primary action is triggered
 */
export class NeoCTAButtonRow extends BaseComponent {
  static get properties() {
    return {
      actions: { type: Array },
      alignment: { type: String },
      orientation: { type: String },
      size: { type: String },
      variant: { type: String },
      fullWidth: { type: Boolean, attribute: 'full-width' },
      equal: { type: Boolean },
      gap: { type: String },
      wrap: { type: Boolean },
      sticky: { type: Boolean },
      primaryAction: { type: String, attribute: 'primary-action' },
      loading: { type: Boolean },
      _actionsData: { type: Array, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          width: 100%;
        }

        :host([sticky]) {
          position: sticky;
          bottom: 0;
          z-index: var(--z-index-sticky);
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          padding: var(--spacing-md);
          margin: 0 calc(-1 * var(--spacing-md));
        }

        .button-row {
          display: flex;
          transition: all var(--transition-fast);
        }

        /* Alignment options */
        .align-left {
          justify-content: flex-start;
        }

        .align-center {
          justify-content: center;
        }

        .align-right {
          justify-content: flex-end;
        }

        .align-space-between {
          justify-content: space-between;
        }

        .align-space-around {
          justify-content: space-around;
        }

        /* Orientation */
        .orientation-horizontal {
          flex-direction: row;
        }

        .orientation-vertical {
          flex-direction: column;
        }

        /* Gap sizes */
        .gap-xs {
          gap: var(--spacing-xs);
        }

        .gap-sm {
          gap: var(--spacing-sm);
        }

        .gap-md {
          gap: var(--spacing-md);
        }

        .gap-lg {
          gap: var(--spacing-lg);
        }

        /* Wrapping */
        .wrap {
          flex-wrap: wrap;
        }

        /* Equal width buttons */
        .equal neo-button {
          flex: 1;
        }

        /* Full width buttons */
        .full-width neo-button {
          width: 100%;
        }

        /* Primary action emphasis */
        neo-button[data-primary="true"] {
          position: relative;
        }

        neo-button[data-primary="true"]::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border: 2px solid var(--color-primary);
          border-radius: calc(var(--radius-md) + 2px);
          opacity: 0;
          animation: primaryPulse 2s ease-in-out infinite;
        }

        @keyframes primaryPulse {
          0%, 100% {
            opacity: 0;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.02);
          }
        }

        /* Loading state */
        :host([loading]) .button-row {
          pointer-events: none;
          opacity: 0.6;
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .button-row {
            flex-direction: column;
            gap: var(--spacing-sm);
          }

          .button-row neo-button {
            width: 100%;
          }

          :host([sticky]) {
            padding: var(--spacing-sm);
            margin: 0 calc(-1 * var(--spacing-sm));
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          :host([sticky]) {
            border-top-width: 2px;
          }

          neo-button[data-primary="true"]::after {
            border-width: 3px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          neo-button[data-primary="true"]::after {
            animation: none;
          }
        }

        /* Focus management */
        .button-row:focus-within {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
          border-radius: var(--radius-md);
        }

        /* Action-specific styling */
        neo-button[data-action="cancel"] {
          --button-bg: var(--color-gray-100);
          --button-color: var(--color-text);
          --button-border: var(--color-gray-300);
        }

        neo-button[data-action="delete"],
        neo-button[data-action="remove"] {
          --button-bg: var(--color-error);
          --button-color: var(--color-white);
        }

        neo-button[data-action="save"],
        neo-button[data-action="submit"] {
          --button-bg: var(--color-primary);
          --button-color: var(--color-white);
        }

        /* Keyboard navigation */
        neo-button:focus {
          z-index: 1;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.actions = [];
    this.alignment = 'right';
    this.orientation = 'horizontal';
    this.size = 'md';
    this.variant = 'secondary';
    this.fullWidth = false;
    this.equal = false;
    this.gap = 'md';
    this.wrap = false;
    this.sticky = false;
    this.primaryAction = '';
    this.loading = false;
    this._actionsData = [];
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('actions')) {
      this._parseActionsData();
    }
  }

  /**
   * Parse actions data from prop (handles both array and JSON string)
   */
  _parseActionsData() {
    try {
      if (typeof this.actions === 'string') {
        this._actionsData = JSON.parse(this.actions);
      } else if (Array.isArray(this.actions)) {
        this._actionsData = [...this.actions];
      } else {
        this._actionsData = [];
      }
    } catch (error) {
      console.warn('Invalid actions data provided to neo-cta-button-row:', error);
      this._actionsData = [];
    }
  }

  /**
   * Handle action button click
   */
  _handleActionClick(action, index, e) {
    if (this.loading || action.disabled) {
      e.preventDefault();
      return;
    }

    // Dispatch generic action event
    this.dispatchEvent(new CustomEvent('neo-action-click', {
      detail: {
        action,
        index,
        id: action.id,
        type: action.type || 'button'
      },
      bubbles: true,
      composed: true
    }));

    // Dispatch primary action event if this is the primary action
    if (action.id === this.primaryAction || action.primary) {
      this.dispatchEvent(new CustomEvent('neo-primary-action', {
        detail: {
          action,
          index
        },
        bubbles: true,
        composed: true
      }));
    }

    // Handle action callback if provided
    if (typeof action.onClick === 'function') {
      action.onClick(e, action);
    }
  }

  /**
   * Get button variant for action
   */
  _getActionVariant(action, index) {
    // Use action-specific variant if provided
    if (action.variant) {
      return action.variant;
    }

    // Primary action gets primary variant
    if (action.id === this.primaryAction || action.primary) {
      return 'primary';
    }

    // First action gets primary, others get default variant
    if (index === 0 && this._actionsData.length > 1) {
      return 'primary';
    }

    return this.variant;
  }

  /**
   * Get action type for accessibility
   */
  _getActionType(action) {
    const actionTypes = {
      submit: 'submit',
      reset: 'reset',
      save: 'submit',
      delete: 'button',
      cancel: 'button'
    };

    return actionTypes[action.type] || actionTypes[action.id] || 'button';
  }

  /**
   * Public method to disable/enable action
   */
  setActionDisabled(actionId, disabled) {
    const action = this._actionsData.find(a => a.id === actionId);
    if (action) {
      action.disabled = disabled;
      this.requestUpdate();
    }
  }

  /**
   * Public method to set loading state for specific action
   */
  setActionLoading(actionId, loading) {
    const action = this._actionsData.find(a => a.id === actionId);
    if (action) {
      action.loading = loading;
      this.requestUpdate();
    }
  }

  /**
   * Public method to update action text
   */
  updateActionText(actionId, text) {
    const action = this._actionsData.find(a => a.id === actionId);
    if (action) {
      action.text = text;
      this.requestUpdate();
    }
  }

  render() {
    if (!this._actionsData || this._actionsData.length === 0) {
      return html``;
    }

    const containerClasses = [
      'button-row',
      `align-${this.alignment}`,
      `orientation-${this.orientation}`,
      `gap-${this.gap}`,
      this.wrap ? 'wrap' : '',
      this.equal ? 'equal' : '',
      this.fullWidth ? 'full-width' : ''
    ].filter(Boolean).join(' ');

    return html`
      <div class="${containerClasses}" role="group" aria-label="Action buttons">
        ${this._actionsData.map((action, index) => {
          const isPrimary = action.id === this.primaryAction || action.primary;
          const variant = this._getActionVariant(action, index);
          const actionType = this._getActionType(action);

          return html`
            <neo-button
              variant="${variant}"
              size="${action.size || this.size}"
              type="${actionType}"
              ?disabled="${action.disabled || this.loading}"
              ?loading="${action.loading}"
              ?full-width="${this.fullWidth}"
              data-action="${action.id || action.type || 'action'}"
              data-primary="${isPrimary}"
              aria-describedby="${action.description ? `${action.id}-desc` : ''}"
              @click="${(e) => this._handleActionClick(action, index, e)}">
              ${action.icon ? html`<neo-icon name="${action.icon}"></neo-icon>` : ''}
              ${action.text || action.label || 'Action'}
            </neo-button>

            ${action.description ? html`
              <span id="${action.id}-desc" class="sr-only">
                ${action.description}
              </span>
            ` : ''}
          `;
        })}
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-cta-button-row")) {
  customElements.define("neo-cta-button-row", NeoCTAButtonRow);
}
