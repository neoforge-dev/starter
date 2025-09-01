import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";

/**
 * Avatar component for displaying user profile images or initials
 * @element neo-avatar
 *
 * @prop {string} src - Image URL for the avatar
 * @prop {string} name - Full name used for generating initials and alt text
 * @prop {string} size - Size of the avatar (sm, md, lg, xl)
 * @prop {string} status - Status indicator (online, offline, away, busy)
 * @prop {string} alt - Custom alt text (falls back to name)
 * @prop {boolean} showStatus - Whether to show the status indicator
 *
 * @example
 * <neo-avatar src="https://..." name="John Doe" size="md"></neo-avatar>
 * <neo-avatar name="Jane Smith" status="online" size="lg"></neo-avatar>
 */
export class NeoAvatar extends BaseComponent {
  static get properties() {
    return {
      src: { type: String },
      name: { type: String },
      size: { type: String, reflect: true },
      status: { type: String, reflect: true },
      alt: { type: String },
      showStatus: { type: Boolean, attribute: "show-status" },
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

        .avatar-container {
          position: relative;
          display: inline-block;
        }

        .avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-gray-300);
          color: var(--color-gray-700);
          border-radius: 50%;
          font-weight: var(--font-weight-medium);
          overflow: hidden;
          user-select: none;
          transition: all var(--transition-fast);
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .avatar-initials {
          text-transform: uppercase;
          line-height: 1;
        }

        /* Size variants - WCAG AA compliant touch targets */
        .size-sm .avatar {
          width: 32px;
          height: 32px;
          font-size: 0.75rem;
        }

        .size-md .avatar {
          width: 40px;
          height: 40px;
          font-size: 0.875rem;
        }

        .size-lg .avatar {
          width: 48px;
          height: 48px;
          font-size: 1rem;
        }

        .size-xl .avatar {
          width: 64px;
          height: 64px;
          font-size: 1.25rem;
        }

        /* Status indicator */
        .status-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 25%;
          height: 25%;
          min-width: 8px;
          min-height: 8px;
          border-radius: 50%;
          border: 2px solid white;
          z-index: 1;
        }

        .status-online {
          background: var(--color-success);
        }

        .status-offline {
          background: var(--color-gray-400);
        }

        .status-away {
          background: var(--color-warning);
        }

        .status-busy {
          background: var(--color-error);
        }

        /* Error state for broken images */
        .avatar-error {
          background: var(--color-gray-200);
          color: var(--color-gray-500);
        }

        /* Focus styles for accessibility */
        :host(:focus-within) .avatar {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .avatar {
            border: 2px solid var(--color-text);
          }

          .status-indicator {
            border-width: 3px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .avatar {
            transition: none;
          }
        }

        /* Hover effects */
        :host(:hover) .avatar {
          transform: scale(1.05);
        }

        @media (prefers-reduced-motion: reduce) {
          :host(:hover) .avatar {
            transform: none;
          }
        }
      `,
    ];
  }

  constructor() {
    super();
    this.src = "";
    this.name = "";
    this.size = "md";
    this.status = "";
    this.alt = "";
    this.showStatus = false;
    this._imageLoaded = false;
    this._imageError = false;
  }

  /**
   * Generate initials from name
   * @param {string} name
   * @returns {string}
   */
  _getInitials(name) {
    if (!name) return "?";

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Handle image load success
   */
  _handleImageLoad() {
    this._imageLoaded = true;
    this._imageError = false;
    this.requestUpdate();
  }

  /**
   * Handle image load error
   */
  _handleImageError() {
    this._imageLoaded = false;
    this._imageError = true;
    this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent("neo-avatar-error", {
        bubbles: true,
        composed: true,
        detail: { src: this.src, name: this.name },
      })
    );
  }

  /**
   * Get the alt text for the avatar
   */
  _getAltText() {
    if (this.alt) return this.alt;
    if (this.name) return `${this.name}'s avatar`;
    return "User avatar";
  }

  /**
   * Get status label for accessibility
   */
  _getStatusLabel(status) {
    const labels = {
      online: "Online",
      offline: "Offline",
      away: "Away",
      busy: "Busy",
    };
    return labels[status] || "";
  }

  render() {
    const containerClasses = {
      "avatar-container": true,
      [`size-${this.size}`]: true,
    };

    const avatarClasses = {
      avatar: true,
      "avatar-error": this._imageError,
    };

    const shouldShowImage = this.src && !this._imageError;
    const initials = this._getInitials(this.name);
    const statusLabel = this._getStatusLabel(this.status);

    return html`
      <div
        class="${Object.entries(containerClasses)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")}"
        role="img"
        aria-label="${this._getAltText()}${statusLabel ? `, ${statusLabel}` : ""}"
      >
        <div
          class="${Object.entries(avatarClasses)
            .filter(([, value]) => value)
            .map(([key]) => key)
            .join(" ")}"
        >
          ${shouldShowImage
            ? html`
                <img
                  src="${this.src}"
                  alt="${this._getAltText()}"
                  @load="${this._handleImageLoad}"
                  @error="${this._handleImageError}"
                  loading="lazy"
                />
              `
            : html`
                <span class="avatar-initials" aria-hidden="true">
                  ${initials}
                </span>
              `}
        </div>

        ${this.showStatus && this.status
          ? html`
              <div
                class="status-indicator status-${this.status}"
                role="img"
                aria-label="${statusLabel}"
                title="${statusLabel}"
              ></div>
            `
          : ""}
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-avatar")) {
  customElements.define("neo-avatar", NeoAvatar);
}
