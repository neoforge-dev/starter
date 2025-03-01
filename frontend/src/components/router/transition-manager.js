import {  LitElement, html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

/**
 * Transition manager component for handling page transitions
 * @element neo-transition-manager
 *
 * @prop {string} transition - Transition type (fade, slide, scale)
 * @prop {number} duration - Transition duration in milliseconds
 * @prop {boolean} enabled - Whether transitions are enabled
 *
 * @slot - Default slot for current page
 * @slot previous - Slot for previous page during transition
 *
 * @fires transition-start - When transition starts
 * @fires transition-end - When transition ends
 */
export class TransitionManager extends LitElement {
  static properties = {
    transition: { type: String, reflect: true },
    duration: { type: Number },
    enabled: { type: Boolean },
    _transitioning: { type: Boolean, state: true },
    _currentContent: { type: String, state: true },
    _previousContent: { type: String, state: true },
  };

  constructor() {
    super();
    this.transition = "fade";
    this.duration = 300;
    this.enabled = true;
    this._transitioning = false;
    this._currentContent = "";
    this._previousContent = "";
    this._transitionEndHandler = this._handleTransitionEnd.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("transitionend", this._transitionEndHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("transitionend", this._transitionEndHandler);
  }

  /**
   * Start transition to new content
   * @param {string|HTMLElement} content - New content to transition to
   * @param {string} [transition] - Optional override for transition type
   * @returns {Promise<void>} Resolves when transition is complete
   */
  async transitionTo(content, transition = this.transition) {
    if (!this.enabled) {
      this._setContent(content);
      return;
    }

    // Store current content as previous
    this._previousContent = this._currentContent;

    // Start transition
    this._transitioning = true;
    this.transition = transition;

    // Notify transition start
    this.dispatchEvent(
      new CustomEvent("transition-start", {
        bubbles: true,
        composed: true,
        detail: { content, transition },
      })
    );

    // Set new content
    this._setContent(content);

    // Wait for transition to complete
    await new Promise((resolve) => {
      this._transitionEndPromise = resolve;
    });
  }

  /**
   * Set content without transition
   * @param {string|HTMLElement} content
   */
  _setContent(content) {
    if (typeof content === "string") {
      this._currentContent = content;
    } else if (content instanceof HTMLElement) {
      this._currentContent = content.outerHTML;
    }
  }

  /**
   * Handle transition end
   */
  _handleTransitionEnd() {
    if (!this._transitioning) return;

    this._transitioning = false;
    this._previousContent = "";

    // Notify transition end
    this.dispatchEvent(
      new CustomEvent("transition-end", {
        bubbles: true,
        composed: true,
      })
    );

    // Resolve transition promise
    if (this._transitionEndPromise) {
      this._transitionEndPromise();
      this._transitionEndPromise = null;
    }
  }

  render() {
    return html`
      <div
        class="transition-container"
        data-transition=${this.transition}
        data-transitioning=${this._transitioning}
        style="--transition-duration: ${this.duration}ms"
      >
        ${this._transitioning && this._previousContent
          ? html`
              <div class="transition-page previous">
                ${this._previousContent}
              </div>
            `
          : null}

        <div class="transition-page current">${this._currentContent}</div>
      </div>
    `;
  }

  /**
   * Define styles in a separate CSS file
   */
  static styles = [];
}

customElements.define("neo-transition-manager", TransitionManager);
