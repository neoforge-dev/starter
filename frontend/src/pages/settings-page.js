import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../styles/base.js";
import "../components/ui/card.js";
import "../components/ui/button.js";
import "../components/ui/input.js";
import "../components/ui/tabs.js";
import "../components/ui/spinner.js";
import "../components/ui/dropdown.js";

export class SettingsPage extends LitElement {
  static tagName = "settings-page";

  static properties = {
    loading: { type: Boolean },
    saving: { type: Boolean },
    activeTab: { type: String },
    settings: { type: Object },
    error: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
      }
      h1 {
        color: var(--text-color);
        margin-bottom: var(--spacing-lg);
      }

      .settings-header {
        margin-bottom: var(--space-8);
      }

      .settings-title {
        font-size: var(--text-3xl);
        font-weight: var(--weight-bold);
        color: var(--text-1);
        margin-bottom: var(--space-2);
      }

      .settings-subtitle {
        color: var(--text-2);
        font-size: var(--text-lg);
      }

      .settings-card {
        padding: var(--space-6);
        margin-bottom: var(--space-6);
      }

      .settings-section {
        margin-bottom: var(--space-8);
      }

      .section-title {
        font-size: var(--text-xl);
        font-weight: var(--weight-bold);
        color: var(--text-1);
        margin-bottom: var(--space-4);
      }

      .section-description {
        color: var(--text-2);
        margin-bottom: var(--space-4);
      }

      .setting-group {
        display: grid;
        gap: var(--space-6);
      }

      .setting-item {
        display: grid;
        grid-template-columns: 2fr 3fr;
        gap: var(--space-4);
        align-items: start;
      }

      .setting-info {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .setting-label {
        font-weight: var(--weight-medium);
        color: var(--text-1);
      }

      .setting-description {
        color: var(--text-2);
        font-size: var(--text-sm);
      }

      .setting-control {
        display: flex;
        gap: var(--space-4);
        align-items: center;
      }

      .toggle {
        position: relative;
        width: 50px;
        height: 28px;
      }

      .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--surface-2);
        transition: 0.4s;
        border-radius: 34px;
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
      }

      input:checked + .toggle-slider {
        background-color: var(--brand);
      }

      input:checked + .toggle-slider:before {
        transform: translateX(22px);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-4);
        margin-top: var(--space-6);
        padding-top: var(--space-6);
        border-top: 1px solid var(--border-color);
      }

      @media (max-width: 640px) {
        .setting-item {
          grid-template-columns: 1fr;
          gap: var(--space-2);
        }

        .setting-control {
          margin-top: var(--space-2);
        }

        .form-actions {
          flex-direction: column;
        }

        .form-actions button {
          width: 100%;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.loading = true;
    this.saving = false;
    this.activeTab = "general";
    this.settings = {
      theme: "system",
      notifications: {
        email: true,
        push: true,
        updates: false,
        newsletter: true,
      },
      privacy: {
        profileVisibility: "public",
        activityStatus: true,
        searchable: true,
      },
      language: "en",
      timezone: "UTC",
    };
    this.error = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadSettings();
  }

  async _loadSettings() {
    try {
      // In a real app, you would fetch settings from the API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.loading = false;
    } catch (error) {
      console.error("Error loading settings:", error);
      this.error = error.message;
      this.loading = false;
    }
  }

  async _handleSettingChange(section, key, value) {
    try {
      this.settings = {
        ...this.settings,
        [section]: {
          ...this.settings[section],
          [key]: value,
        },
      };

      // In a real app, you would save the settings to the API
      console.log("Saving setting:", { section, key, value });
    } catch (error) {
      console.error("Error saving setting:", error);
      this.error = error.message;
    }
  }

  async _handleSubmit(e) {
    e.preventDefault();
    try {
      this.saving = true;
      this.error = "";

      // In a real app, you would save all settings to the API
      console.log("Saving all settings:", this.settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error saving settings:", error);
      this.error = error.message;
    } finally {
      this.saving = false;
    }
  }

  _renderGeneral() {
    return html`
      <neo-card class="settings-card">
        <form @submit=${this._handleSubmit}>
          <div class="settings-section">
            <h3 class="section-title">General Settings</h3>
            <p class="section-description">
              Customize your application experience.
            </p>

            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">Theme</div>
                  <div class="setting-description">
                    Choose your preferred color theme.
                  </div>
                </div>
                <div class="setting-control">
                  <neo-dropdown
                    label="Select Theme"
                    .value=${this.settings.theme}
                    .items=${[
                      { value: "system", label: "System Default" },
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                    ]}
                    @change=${(e) =>
                      this._handleSettingChange("theme", e.detail.value)}
                  ></neo-dropdown>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">Language</div>
                  <div class="setting-description">
                    Select your preferred language.
                  </div>
                </div>
                <div class="setting-control">
                  <neo-dropdown
                    label="Select Language"
                    .value=${this.settings.language}
                    .items=${[
                      { value: "en", label: "English" },
                      { value: "es", label: "Español" },
                      { value: "fr", label: "Français" },
                    ]}
                    @change=${(e) =>
                      this._handleSettingChange("language", e.detail.value)}
                  ></neo-dropdown>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">Timezone</div>
                  <div class="setting-description">
                    Set your local timezone.
                  </div>
                </div>
                <div class="setting-control">
                  <neo-dropdown
                    label="Select Timezone"
                    .value=${this.settings.timezone}
                    .items=${[
                      { value: "UTC", label: "UTC" },
                      { value: "America/New_York", label: "Eastern Time" },
                      { value: "America/Los_Angeles", label: "Pacific Time" },
                    ]}
                    @change=${(e) =>
                      this._handleSettingChange("timezone", e.detail.value)}
                  ></neo-dropdown>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <neo-button variant="outline" type="button"
              >Reset to Default</neo-button
            >
            <neo-button variant="primary" type="submit" ?loading=${this.saving}>
              Save Changes
            </neo-button>
          </div>
        </form>
      </neo-card>
    `;
  }

  _renderNotifications() {
    return html`
      <neo-card class="settings-card">
        <div class="settings-section">
          <h3 class="section-title">Notification Preferences</h3>
          <p class="section-description">
            Choose how you want to be notified about important updates.
          </p>

          <div class="setting-group">
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Email Notifications</div>
                <div class="setting-description">
                  Receive important updates via email.
                </div>
              </div>
              <div class="setting-control">
                <label class="toggle">
                  <input
                    type="checkbox"
                    .checked=${this.settings.notifications.email}
                    @change=${(e) =>
                      this._handleSettingChange(
                        "notifications",
                        "email",
                        e.target.checked
                      )}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Push Notifications</div>
                <div class="setting-description">
                  Receive notifications in your browser.
                </div>
              </div>
              <div class="setting-control">
                <label class="toggle">
                  <input
                    type="checkbox"
                    .checked=${this.settings.notifications.push}
                    @change=${(e) =>
                      this._handleSettingChange(
                        "notifications",
                        "push",
                        e.target.checked
                      )}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Product Updates</div>
                <div class="setting-description">
                  Receive updates about new features and improvements.
                </div>
              </div>
              <div class="setting-control">
                <label class="toggle">
                  <input
                    type="checkbox"
                    .checked=${this.settings.notifications.updates}
                    @change=${(e) =>
                      this._handleSettingChange(
                        "notifications",
                        "updates",
                        e.target.checked
                      )}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Newsletter</div>
                <div class="setting-description">
                  Receive our monthly newsletter.
                </div>
              </div>
              <div class="setting-control">
                <label class="toggle">
                  <input
                    type="checkbox"
                    .checked=${this.settings.notifications.newsletter}
                    @change=${(e) =>
                      this._handleSettingChange(
                        "notifications",
                        "newsletter",
                        e.target.checked
                      )}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </neo-card>
    `;
  }

  _renderPrivacy() {
    return html`
      <neo-card class="settings-card">
        <div class="settings-section">
          <h3 class="section-title">Privacy Settings</h3>
          <p class="section-description">
            Control who can see your profile and activity.
          </p>

          <div class="setting-group">
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Profile Visibility</div>
                <div class="setting-description">
                  Choose who can see your profile.
                </div>
              </div>
              <div class="setting-control">
                <neo-dropdown
                  label="Select Visibility"
                  .value=${this.settings.privacy.profileVisibility}
                  .items=${[
                    { value: "public", label: "Public" },
                    { value: "private", label: "Private" },
                    { value: "contacts", label: "Contacts Only" },
                  ]}
                  @change=${(e) =>
                    this._handleSettingChange(
                      "privacy",
                      "profileVisibility",
                      e.detail.value
                    )}
                ></neo-dropdown>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Activity Status</div>
                <div class="setting-description">Show when you're active.</div>
              </div>
              <div class="setting-control">
                <label class="toggle">
                  <input
                    type="checkbox"
                    .checked=${this.settings.privacy.activityStatus}
                    @change=${(e) =>
                      this._handleSettingChange(
                        "privacy",
                        "activityStatus",
                        e.target.checked
                      )}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Search Visibility</div>
                <div class="setting-description">
                  Allow others to find you by name.
                </div>
              </div>
              <div class="setting-control">
                <label class="toggle">
                  <input
                    type="checkbox"
                    .checked=${this.settings.privacy.searchable}
                    @change=${(e) =>
                      this._handleSettingChange(
                        "privacy",
                        "searchable",
                        e.target.checked
                      )}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </neo-card>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="flex justify-center items-center" style="height: 400px;">
          <neo-spinner size="large"></neo-spinner>
        </div>
      `;
    }

    return html`
      <div class="settings-header">
        <h1 class="settings-title">Settings</h1>
        <p class="settings-subtitle">
          Manage your application settings and preferences.
        </p>
      </div>

      ${this.error
        ? html` <div class="error-message">${this.error}</div> `
        : ""}

      <neo-tabs
        .tabs=${[
          { id: "general", label: "General", icon: "settings" },
          {
            id: "notifications",
            label: "Notifications",
            icon: "notifications",
          },
          { id: "privacy", label: "Privacy", icon: "security" },
        ]}
        .activeTab=${this.activeTab}
        @tab-change=${(e) => (this.activeTab = e.detail.tabId)}
      >
        <div slot="general">${this._renderGeneral()}</div>

        <div slot="notifications">${this._renderNotifications()}</div>

        <div slot="privacy">${this._renderPrivacy()}</div>
      </neo-tabs>
    `;
  }
}

customElements.define(SettingsPage.tagName, SettingsPage);
