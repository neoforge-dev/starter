import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { baseStyles } from "../styles/base.js";

@customElement("settings-page")
export class SettingsPage extends LitElement {
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
    `,
  ];

  render() {
    return html`
      <div class="settings-container">
        <h1>Settings</h1>
        <div class="settings-grid">
          <section class="settings-section">
            <h2>General</h2>
            <div class="settings-form">
              <div class="setting-item">
                <div>
                  <div class="setting-label">Theme</div>
                  <div class="setting-description">
                    Choose your preferred color theme
                  </div>
                </div>
                <select>
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>

              <div class="setting-item">
                <div>
                  <div class="setting-label">Language</div>
                  <div class="setting-description">
                    Select your preferred language
                  </div>
                </div>
                <select>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </section>

          <section class="settings-section">
            <h2>Notifications</h2>
            <div class="settings-form">
              <div class="setting-item">
                <div>
                  <div class="setting-label">Email Notifications</div>
                  <div class="setting-description">
                    Receive updates and alerts via email
                  </div>
                </div>
                <input type="checkbox" checked />
              </div>

              <div class="setting-item">
                <div>
                  <div class="setting-label">Push Notifications</div>
                  <div class="setting-description">
                    Receive notifications in your browser
                  </div>
                </div>
                <input type="checkbox" />
              </div>
            </div>
          </section>

          <section class="settings-section">
            <h2>Privacy</h2>
            <div class="settings-form">
              <div class="setting-item">
                <div>
                  <div class="setting-label">Data Collection</div>
                  <div class="setting-description">
                    Allow anonymous usage data collection
                  </div>
                </div>
                <input type="checkbox" checked />
              </div>

              <div class="setting-item">
                <div>
                  <div class="setting-label">Profile Visibility</div>
                  <div class="setting-description">
                    Control who can see your profile
                  </div>
                </div>
                <select>
                  <option>Public</option>
                  <option>Private</option>
                  <option>Friends Only</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }
}
