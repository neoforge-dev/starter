import {   html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { BaseComponent } from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element settings-page
 * @description Settings page component with user preferences
 */
export class SettingsPage extends BaseComponent {
  static properties = {
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    settings: { type: Object, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .settings-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      h1 {
        font-size: var(--font-size-xxl);
        margin-bottom: var(--spacing-xl);
      }

      .settings-grid {
        display: grid;
        gap: var(--spacing-lg);
      }

      .settings-section {
        padding: var(--spacing-lg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
      }

      h2 {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-md);
      }

      .settings-form {
        display: grid;
        gap: var(--spacing-md);
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) 0;
        border-bottom: 1px solid var(--color-border);
      }

      .setting-item:last-child {
        border-bottom: none;
      }

      .setting-label {
        font-weight: 500;
      }

      .setting-description {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        margin-top: var(--spacing-xs);
      }

      .loading-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      .error-message {
        color: var(--color-error);
        text-align: center;
        padding: var(--spacing-lg);
      }

      @media (max-width: 768px) {
        .page-container {
          padding: var(--spacing-md);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.loading = false;
    this.error = null;
    this.settings = {
      theme: "light",
      notifications: {
        email: true,
        push: false,
      },
      privacy: {
        shareData: true,
        analytics: true,
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
      },
      language: "en",
    };
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-indicator">
          <neo-spinner></neo-spinner>
        </div>
      `;
    }

    if (this.error) {
      return html`<div class="error-message">${this.error}</div>`;
    }

    return html`
      <div class="settings-container">
        <h1>Settings</h1>
        <div class="settings-grid">
          <section class="settings-section theme-section">
            <h2>Theme</h2>
            <div class="settings-form">
              <div class="setting-item">
                <div>
                  <div class="setting-label">Theme Mode</div>
                  <div class="setting-description">
                    Choose your preferred color theme
                  </div>
                </div>
                <select
                  class="theme-toggle"
                  .value=${this.settings.theme}
                  @change=${this._handleThemeChange}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </section>

          <section class="settings-section notifications-section">
            <h2>Notifications</h2>
            <div class="settings-form">
              <div class="setting-item">
                <div>
                  <div class="setting-label">Email Notifications</div>
                  <div class="setting-description">
                    Receive updates and alerts via email
                  </div>
                </div>
                <input
                  type="checkbox"
                  class="notifications-toggle"
                  .checked=${this.settings.notifications.email}
                  @change=${this._handleNotificationsChange}
                />
              </div>

              <div class="setting-item">
                <div>
                  <div class="setting-label">Push Notifications</div>
                  <div class="setting-description">
                    Receive notifications in your browser
                  </div>
                </div>
                <input
                  type="checkbox"
                  class="notifications-toggle"
                  .checked=${this.settings.notifications.push}
                  @change=${this._handleNotificationsChange}
                />
              </div>
            </div>
          </section>

          <section class="settings-section privacy-section">
            <h2>Privacy</h2>
            <div class="settings-form">
              <div class="setting-item">
                <div>
                  <div class="setting-label">Data Collection</div>
                  <div class="setting-description">
                    Allow anonymous usage data collection
                  </div>
                </div>
                <input
                  type="checkbox"
                  class="privacy-toggle"
                  name="shareData"
                  .checked=${this.settings.privacy.shareData}
                  @change=${this._handlePrivacyChange}
                />
              </div>

              <div class="setting-item">
                <div>
                  <div class="setting-label">Analytics</div>
                  <div class="setting-description">
                    Help us improve by sharing analytics
                  </div>
                </div>
                <input
                  type="checkbox"
                  class="privacy-toggle"
                  name="analytics"
                  .checked=${this.settings.privacy.analytics}
                  @change=${this._handlePrivacyChange}
                />
              </div>
            </div>
          </section>

          <section class="settings-section accessibility-section">
            <h2>Accessibility</h2>
            <div class="settings-form">
              <div class="setting-item">
                <div>
                  <div class="setting-label">High Contrast</div>
                  <div class="setting-description">
                    Increase contrast for better visibility
                  </div>
                </div>
                <input
                  type="checkbox"
                  class="accessibility-toggle"
                  name="highContrast"
                  .checked=${this.settings.accessibility.highContrast}
                  @change=${this._handleAccessibilityChange}
                />
              </div>

              <div class="setting-item">
                <div>
                  <div class="setting-label">Reduced Motion</div>
                  <div class="setting-description">
                    Minimize animations and transitions
                  </div>
                </div>
                <input
                  type="checkbox"
                  class="accessibility-toggle"
                  name="reducedMotion"
                  .checked=${this.settings.accessibility.reducedMotion}
                  @change=${this._handleAccessibilityChange}
                />
              </div>
            </div>
          </section>

          <section class="settings-section language-section">
            <h2>Language</h2>
            <div class="settings-form">
              <div class="setting-item">
                <div>
                  <div class="setting-label">Language</div>
                  <div class="setting-description">
                    Select your preferred language
                  </div>
                </div>
                <select
                  name="language"
                  .value=${this.settings.language}
                  @change=${this._handleLanguageChange}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        <div class="settings-actions">
          <button
            class="reset-settings-button"
            @click=${this._handleResetSettings}
          >
            Reset Settings
          </button>
          <button
            class="save-settings-button"
            @click=${this._handleSaveSettings}
          >
            Save Changes
          </button>
        </div>
      </div>
    `;
  }

  _handleThemeChange(e) {
    this.settings = {
      ...this.settings,
      theme: e.target.value,
    };
  }

  _handleNotificationsChange(e) {
    const type = e.target.classList.contains("email-notifications-toggle")
      ? "email"
      : "push";
    this.settings = {
      ...this.settings,
      notifications: {
        ...this.settings.notifications,
        [type]: e.target.checked,
      },
    };
  }

  _handlePrivacyChange(e) {
    const setting = e.target.name;
    this.settings = {
      ...this.settings,
      privacy: {
        ...this.settings.privacy,
        [setting]: e.target.checked,
      },
    };
  }

  _handleAccessibilityChange(e) {
    const setting = e.target.name;
    this.settings = {
      ...this.settings,
      accessibility: {
        ...this.settings.accessibility,
        [setting]: e.target.checked,
      },
    };
  }

  _handleLanguageChange(e) {
    this.settings = {
      ...this.settings,
      language: e.target.value,
    };
  }

  _handleResetSettings() {
    this.dispatchEvent(
      new CustomEvent("show-modal", {
        detail: { type: "confirm-reset-settings" },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSaveSettings() {
    this.dispatchEvent(
      new CustomEvent("settings-save", {
        detail: { settings: this.settings },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("settings-page", SettingsPage);
