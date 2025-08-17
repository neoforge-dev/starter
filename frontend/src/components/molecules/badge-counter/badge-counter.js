import { html, css } from "lit";
import { BaseComponent } from "../../base-component.js";
import { baseStyles } from "../../styles/base.js";
import "../../atoms/badge/badge.js";

/**
 * Badge with animated count updates and accessibility features
 * @element neo-badge-counter
 * 
 * @prop {number} count - Current count value
 * @prop {number} maxCount - Maximum count to display (shows 99+ if exceeded)
 * @prop {string} variant - Badge variant (primary, secondary, success, warning, error, neutral)
 * @prop {string} size - Badge size (sm, md, lg)
 * @prop {boolean} pulseOnChange - Whether to pulse when count changes
 * @prop {boolean} hideOnZero - Whether to hide badge when count is 0
 * @prop {string} label - Accessible label for screen readers
 * @prop {string} suffix - Text suffix for count (e.g., "new messages")
 * @prop {boolean} showZero - Whether to show the badge when count is 0
 * @prop {number} animationDuration - Animation duration in milliseconds
 * 
 * @fires neo-count-change - When count value changes
 * @fires neo-badge-click - When badge is clicked
 */
export class NeoBadgeCounter extends BaseComponent {
  static get properties() {
    return {
      count: { type: Number },
      maxCount: { type: Number, attribute: 'max-count' },
      variant: { type: String },
      size: { type: String },
      pulseOnChange: { type: Boolean, attribute: 'pulse-on-change' },
      hideOnZero: { type: Boolean, attribute: 'hide-on-zero' },
      label: { type: String },
      suffix: { type: String },
      showZero: { type: Boolean, attribute: 'show-zero' },
      animationDuration: { type: Number, attribute: 'animation-duration' },
      _previousCount: { type: Number, state: true },
      _isAnimating: { type: Boolean, state: true },
      _displayCount: { type: String, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: inline-block;
          position: relative;
        }

        :host([hidden]) {
          display: none !important;
        }

        .badge-container {
          position: relative;
          display: inline-block;
        }

        neo-badge {
          transition: all var(--transition-fast);
          transform-origin: center;
        }

        /* Pulse animation */
        .pulse {
          animation: pulse var(--animation-duration, 600ms) ease-out;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        /* Count change animation */
        .count-change {
          animation: countChange var(--animation-duration, 400ms) ease-out;
        }

        @keyframes countChange {
          0% {
            transform: scale(1) rotateY(0deg);
          }
          50% {
            transform: scale(1.1) rotateY(90deg);
          }
          100% {
            transform: scale(1) rotateY(0deg);
          }
        }

        /* Bounce animation for new items */
        .bounce {
          animation: bounce var(--animation-duration, 500ms) ease-out;
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }

        /* Glow effect for important notifications */
        .glow {
          position: relative;
        }

        .glow::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: currentColor;
          border-radius: inherit;
          opacity: 0;
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from {
            opacity: 0;
            transform: scale(1);
          }
          to {
            opacity: 0.3;
            transform: scale(1.05);
          }
        }

        /* Size-specific animations */
        :host([size="sm"]) neo-badge {
          --animation-scale: 0.9;
        }

        :host([size="lg"]) neo-badge {
          --animation-scale: 1.1;
        }

        /* Accessibility */
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

        /* Interactive states */
        :host([clickable]) {
          cursor: pointer;
        }

        :host([clickable]) neo-badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        :host([clickable]) neo-badge:active {
          transform: translateY(0);
        }

        /* Focus styles */
        :host([clickable]:focus) {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
          border-radius: var(--radius-sm);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.count = 0;
    this.maxCount = 99;
    this.variant = 'primary';
    this.size = 'md';
    this.pulseOnChange = true;
    this.hideOnZero = true;
    this.label = '';
    this.suffix = '';
    this.showZero = false;
    this.animationDuration = 400;
    this._previousCount = 0;
    this._isAnimating = false;
    this._displayCount = '0';
  }

  connectedCallback() {
    super.connectedCallback();
    this._updateDisplayCount();
    this._updateVisibility();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('count')) {
      this._handleCountChange(changedProperties.get('count'));
    }

    if (changedProperties.has('animationDuration')) {
      this.style.setProperty('--animation-duration', `${this.animationDuration}ms`);
    }
  }

  /**
   * Handle count changes with animations
   */
  _handleCountChange(previousCount) {
    const oldCount = previousCount ?? this._previousCount;
    const newCount = this.count;
    
    this._previousCount = oldCount;
    this._updateDisplayCount();
    this._updateVisibility();

    // Don't animate on initial render
    if (oldCount === undefined) return;

    // Trigger animation if count changed and pulse is enabled
    if (newCount !== oldCount && this.pulseOnChange) {
      this._triggerAnimation(oldCount, newCount);
    }

    // Dispatch count change event
    this.dispatchEvent(new CustomEvent('neo-count-change', {
      detail: {
        oldCount,
        newCount,
        displayCount: this._displayCount
      },
      bubbles: true,
      composed: true
    }));

    // Announce count change to screen readers
    this._announceCountChange(oldCount, newCount);
  }

  /**
   * Update the display count (handles max count formatting)
   */
  _updateDisplayCount() {
    if (this.count <= this.maxCount) {
      this._displayCount = this.count.toString();
    } else {
      this._displayCount = `${this.maxCount}+`;
    }
  }

  /**
   * Update visibility based on count and settings
   */
  _updateVisibility() {
    const shouldHide = this.count === 0 && this.hideOnZero && !this.showZero;
    
    if (shouldHide) {
      this.setAttribute('hidden', '');
    } else {
      this.removeAttribute('hidden');
    }
  }

  /**
   * Trigger appropriate animation based on count change
   */
  _triggerAnimation(oldCount, newCount) {
    if (this._isAnimating) return;

    this._isAnimating = true;
    const badge = this.shadowRoot?.querySelector('neo-badge');
    
    if (!badge) {
      this._isAnimating = false;
      return;
    }

    // Remove existing animation classes
    badge.classList.remove('pulse', 'count-change', 'bounce', 'glow');

    // Choose animation based on count change type
    let animationClass = 'pulse';
    
    if (newCount > oldCount) {
      // Count increased
      if (newCount - oldCount > 5) {
        animationClass = 'bounce'; // Big increase
      } else {
        animationClass = 'pulse'; // Small increase
      }
    } else if (newCount < oldCount) {
      // Count decreased
      animationClass = 'count-change';
    }

    // Add glow for high priority notifications
    if (this.variant === 'error' && newCount > 0) {
      badge.classList.add('glow');
    }

    // Trigger animation
    requestAnimationFrame(() => {
      badge.classList.add(animationClass);
      
      setTimeout(() => {
        if (badge) {
          badge.classList.remove(animationClass, 'glow');
        }
        this._isAnimating = false;
      }, this.animationDuration);
    });
  }

  /**
   * Announce count changes to screen readers
   */
  _announceCountChange(oldCount, newCount) {
    const announcement = this._getCountAnnouncement(newCount);
    
    // Create temporary live region for announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = announcement;
    
    this.shadowRoot?.appendChild(liveRegion);
    
    // Remove after announcement
    setTimeout(() => {
      if (liveRegion.parentNode) {
        liveRegion.parentNode.removeChild(liveRegion);
      }
    }, 1000);
  }

  /**
   * Get accessible announcement text
   */
  _getCountAnnouncement(count) {
    const baseLabel = this.label || 'notifications';
    const suffix = this.suffix || '';
    
    if (count === 0) {
      return `No ${baseLabel}`;
    } else if (count === 1) {
      return `1 ${baseLabel.replace(/s$/, '')} ${suffix}`.trim();
    } else if (count <= this.maxCount) {
      return `${count} ${baseLabel} ${suffix}`.trim();
    } else {
      return `More than ${this.maxCount} ${baseLabel} ${suffix}`.trim();
    }
  }

  /**
   * Handle badge click
   */
  _handleClick(e) {
    this.dispatchEvent(new CustomEvent('neo-badge-click', {
      detail: {
        count: this.count,
        displayCount: this._displayCount
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle keyboard interaction
   */
  _handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._handleClick(e);
    }
  }

  /**
   * Public method to increment count
   */
  increment(amount = 1) {
    this.count += amount;
  }

  /**
   * Public method to decrement count
   */
  decrement(amount = 1) {
    this.count = Math.max(0, this.count - amount);
  }

  /**
   * Public method to reset count
   */
  reset() {
    this.count = 0;
  }

  render() {
    const isClickable = this.hasAttribute('clickable') || 
                       this.hasEventListener('neo-badge-click');
    
    const ariaLabel = this._getCountAnnouncement(this.count);

    return html`
      <div class="badge-container">
        <neo-badge
          variant="${this.variant}"
          size="${this.size}"
          @click="${this._handleClick}"
          @keydown="${this._handleKeyDown}"
          role="${isClickable ? 'button' : ''}"
          tabindex="${isClickable ? '0' : '-1'}"
          aria-label="${ariaLabel}">
          ${this._displayCount}
        </neo-badge>
        
        <span class="sr-only" aria-live="polite" aria-atomic="true"></span>
      </div>
    `;
  }

  /**
   * Check if element has event listener
   */
  hasEventListener(eventType) {
    // This is a simplified check - in a real implementation you might
    // want to track event listeners more precisely
    return this.getAttribute(`on${eventType}`) !== null;
  }
}

// Register the component
if (!customElements.get("neo-badge-counter")) {
  customElements.define("neo-badge-counter", NeoBadgeCounter);
}