import { 
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import {
  BaseComponent,
  registerComponent,
} from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

export class ProfilePage extends BaseComponent {
  static properties = {
    user: { type: Object, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    hasUnsavedChanges: { type: Boolean, state: true },
    activeTab: { type: String, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
        max-width: 800px;
        margin: 0 auto;
      }

      .profile-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
      }

      .profile-avatar-container {
        position: relative;
        width: 100px;
        height: 100px;
      }

      .profile-avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid var(--color-border);
      }

      .avatar-upload {
        position: absolute;
        bottom: 0;
        right: 0;
        background: var(--color-primary);
        border-radius: 50%;
        padding: var(--spacing-xs);
        cursor: pointer;
        transition: all 0.2s;
      }

      .avatar-upload:hover {
        transform: scale(1.1);
      }

      .avatar-upload input[type="file"] {
        display: none;
      }

      .profile-name {
        font-size: var(--font-size-xl);
        font-weight: 600;
        margin: 0;
      }

      .profile-email {
        color: var(--color-text-light);
        margin: var(--spacing-xs) 0 0;
      }

      .profile-tabs {
        display: flex;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);
        border-bottom: 1px solid var(--color-border);
      }

      .profile-tab {
        padding: var(--spacing-sm) var(--spacing-md);
        border: none;
        background: none;
        color: var(--color-text);
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
      }

      .profile-tab.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
      }

      .profile-section {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
      }

      .section-title {
        font-size: var(--font-size-lg);
        margin: 0 0 var(--spacing-lg);
        color: var(--color-text);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-lg);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      label {
        font-weight: 500;
        color: var(--color-text);
      }

      input {
        padding: var(--spacing-sm);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-base);
        transition: all 0.2s;
      }

      input:focus {
        border-color: var(--color-primary);
        outline: none;
        box-shadow: 0 0 0 2px var(--color-primary-light);
      }

      .preference-toggle {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
      }

      .toggle-switch {
        position: relative;
        width: 40px;
        height: 20px;
      }

      .toggle-switch input {
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
        background-color: var(--color-border);
        transition: 0.4s;
        border-radius: 20px;
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
      }

      input:checked + .toggle-slider {
        background-color: var(--color-primary);
      }

      input:checked + .toggle-slider:before {
        transform: translateX(20px);
      }

      .button-group {
        display: flex;
        gap: var(--spacing-md);
        margin-top: var(--spacing-lg);
      }

      button {
        padding: var(--spacing-sm) var(--spacing-lg);
        border: none;
        border-radius: var(--radius-sm);
        font-size: var(--font-size-base);
        cursor: pointer;
        transition: all 0.2s;
      }

      .primary-button {
        background: var(--color-primary);
        color: white;
      }

      .primary-button:hover {
        background: var(--color-primary-dark);
      }

      .secondary-button {
        background: var(--color-surface-variant);
        color: var(--color-text);
      }

      .secondary-button:hover {
        background: var(--color-surface-variant-dark);
      }

      .danger-button {
        background: var(--color-error);
        color: white;
      }

      .danger-button:hover {
        background: var(--color-error-dark);
      }

      .error-message {
        color: var(--color-error);
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-xs);
      }

      .success-message {
        color: var(--color-success);
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-xs);
      }

      .loading-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      @media (max-width: 768px) {
        :host {
          padding: var(--spacing-md);
        }

        .profile-header {
          flex-direction: column;
          text-align: center;
        }

        .form-grid {
          grid-template-columns: 1fr;
        }

        .button-group {
          flex-direction: column;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.user = null;
    this.loading = true;
    this.error = null;
    this.hasUnsavedChanges = false;
    this.activeTab = "details";
    this.handleEvent = this.handleEvent.bind(this);
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadUserProfile();
  }

  async loadUserProfile() {
    try {
      this.loading = true;
      this.error = null;
      const user = await window.auth.getCurrentUser();
      this.user = user;
    } catch (error) {
      console.error("Failed to load profile:", error);
      this.error = "Failed to load profile";
    } finally {
      this.loading = false;
    }
  }

  handleEvent(event) {
    const action = event.target.dataset.action;

    switch (event.type) {
      case "submit":
        event.preventDefault();
        if (action === "profile") {
          this.handleProfileSubmit(event);
        } else if (action === "password") {
          this.handlePasswordSubmit(event);
        }
        break;

      case "change":
        if (event.target.type === "file") {
          this.handleAvatarChange(event);
        } else if (action === "preference") {
          this.handlePreferenceChange(event);
        }
        break;

      case "input":
        this.hasUnsavedChanges = true;
        break;

      case "click":
        if (action === "tab") {
          this.activeTab = event.target.dataset.tab;
        } else if (action === "delete") {
          this.handleDeleteAccount();
        }
        break;
    }
  }

  async handleProfileSubmit(event) {
    try {
      const form = event.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      this.loading = true;
      this.error = null;
      const result = await window.auth.updateProfile(data);

      if (result.success) {
        this.hasUnsavedChanges = false;
        this.dispatchEvent(
          new CustomEvent("profile-updated", {
            detail: { success: true },
            bubbles: true,
            composed: true,
          })
        );
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      this.error = "Failed to update profile";
    } finally {
      this.loading = false;
    }
  }

  async handlePasswordSubmit(event) {
    try {
      const form = event.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      if (data.newPassword !== data.confirmPassword) {
        this.error = "Passwords do not match";
        return;
      }

      this.loading = true;
      this.error = null;
      const result = await window.auth.updatePassword(data);

      if (result.success) {
        form.reset();
        this.dispatchEvent(
          new CustomEvent("password-updated", {
            detail: { success: true },
            bubbles: true,
            composed: true,
          })
        );
      }
    } catch (error) {
      console.error("Failed to update password:", error);
      this.error = "Failed to update password";
    } finally {
      this.loading = false;
    }
  }

  async handleAvatarChange(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      this.loading = true;
      this.error = null;
      const formData = new FormData();
      formData.append("avatar", file);
      await window.auth.updateProfile(formData);
      await this.loadUserProfile();
    } catch (error) {
      console.error("Failed to update avatar:", error);
      this.error = "Failed to update avatar";
    } finally {
      this.loading = false;
    }
  }

  async handlePreferenceChange(event) {
    try {
      const { name, checked } = event.target;
      this.loading = true;
      this.error = null;
      await window.auth.updatePreferences({
        [name]: checked,
      });
      this.user = {
        ...this.user,
        preferences: {
          ...this.user.preferences,
          [name]: checked,
        },
      };
    } catch (error) {
      console.error("Failed to update preferences:", error);
      this.error = "Failed to update preferences";
    } finally {
      this.loading = false;
    }
  }

  handleDeleteAccount() {
    this.dispatchEvent(
      new CustomEvent("show-modal", {
        detail: {
          type: "confirm-delete-account",
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-indicator">
          <div class="loading-spinner"></div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error-message">
          ${this.error}
          <button
            class="secondary-button"
            @click=${() => this.loadUserProfile()}
          >
            Retry
          </button>
        </div>
      `;
    }

    if (!this.user) {
      return html`
        <div class="error-message">
          No user data available
          <button
            class="secondary-button"
            @click=${() => this.loadUserProfile()}
          >
            Retry
          </button>
        </div>
      `;
    }

    return html`
      <div class="profile-header">
        <div class="profile-avatar-container">
          <img
            class="profile-avatar"
            src=${this.user.avatar}
            alt="${this.user.name}'s avatar"
          />
          <label class="avatar-upload">
            <input
              type="file"
              accept="image/*"
              @change=${this.handleEvent}
              aria-label="Upload new avatar"
            />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </label>
        </div>
        <div>
          <h1 class="profile-name">${this.user.name}</h1>
          <p class="profile-email">${this.user.email}</p>
        </div>
      </div>

      <div class="profile-tabs">
        <button
          class="profile-tab ${this.activeTab === "details" ? "active" : ""}"
          data-action="tab"
          data-tab="details"
          @click=${this.handleEvent}
        >
          Details
        </button>
        <button
          class="profile-tab ${this.activeTab === "security" ? "active" : ""}"
          data-action="tab"
          data-tab="security"
          @click=${this.handleEvent}
        >
          Security
        </button>
        <button
          class="profile-tab ${this.activeTab === "preferences"
            ? "active"
            : ""}"
          data-action="tab"
          data-tab="preferences"
          @click=${this.handleEvent}
        >
          Preferences
        </button>
      </div>

      ${this.activeTab === "details"
        ? html`
            <div class="profile-section">
              <h2 class="section-title">Profile Details</h2>
              <form
                class="profile-form"
                data-action="profile"
                @submit=${this.handleEvent}
              >
                <div class="form-grid">
                  <div class="form-field">
                    <label for="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      .value=${this.user.name}
                      @input=${this.handleEvent}
                      required
                    />
                  </div>
                  <div class="form-field">
                    <label for="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      .value=${this.user.email}
                      @input=${this.handleEvent}
                      required
                    />
                  </div>
                </div>
                <div class="button-group">
                  <button
                    type="submit"
                    class="primary-button"
                    ?disabled=${!this.hasUnsavedChanges}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    class="secondary-button"
                    @click=${() => this.loadUserProfile()}
                    ?disabled=${!this.hasUnsavedChanges}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          `
        : ""}
      ${this.activeTab === "security"
        ? html`
            <div class="profile-section">
              <h2 class="section-title">Security Settings</h2>
              <form
                class="profile-form"
                data-action="password"
                @submit=${this.handleEvent}
              >
                <div class="form-grid">
                  <div class="form-field">
                    <label for="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      required
                    />
                  </div>
                  <div class="form-field">
                    <label for="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      required
                    />
                  </div>
                  <div class="form-field">
                    <label for="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                    />
                  </div>
                </div>
                <div class="button-group">
                  <button type="submit" class="primary-button">
                    Update Password
                  </button>
                </div>
              </form>

              <div class="danger-zone">
                <h3 class="section-title">Danger Zone</h3>
                <button
                  class="danger-button"
                  data-action="delete"
                  @click=${this.handleEvent}
                >
                  Delete Account
                </button>
              </div>
            </div>
          `
        : ""}
      ${this.activeTab === "preferences"
        ? html`
            <div class="profile-section">
              <h2 class="section-title">Preferences</h2>
              <div class="preference-toggle">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    name="theme"
                    data-action="preference"
                    .checked=${this.user.preferences?.theme === "dark"}
                    @change=${this.handleEvent}
                  />
                  <span class="toggle-slider"></span>
                </label>
                <span>Dark Theme</span>
              </div>
              <div class="preference-toggle">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    name="notifications"
                    data-action="preference"
                    .checked=${this.user.preferences?.notifications}
                    @change=${this.handleEvent}
                  />
                  <span class="toggle-slider"></span>
                </label>
                <span>Enable Notifications</span>
              </div>
            </div>
          `
        : ""}
    `;
  }
}

// Register the component
customElements.define("profile-page", ProfilePage);
