import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../styles/base.js";
import { authService } from "../services/auth-service.js";
import "../components/ui/card.js";
import "../components/ui/button.js";
import "../components/ui/input.js";
import "../components/ui/tabs.js";
import "../components/ui/spinner.js";

export class ProfilePage extends LitElement {
  static properties = {
    loading: { type: Boolean },
    saving: { type: Boolean },
    activeTab: { type: String },
    user: { type: Object },
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

      .profile-header {
        margin-bottom: var(--space-8);
      }

      .profile-title {
        font-size: var(--text-3xl);
        font-weight: var(--weight-bold);
        color: var(--text-1);
        margin-bottom: var(--space-2);
      }

      .profile-subtitle {
        color: var(--text-2);
        font-size: var(--text-lg);
      }

      .profile-card {
        padding: var(--space-6);
        margin-bottom: var(--space-6);
      }

      .avatar-section {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        margin-bottom: var(--space-6);
        padding-bottom: var(--space-6);
        border-bottom: 1px solid var(--border-color);
      }

      .avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: var(--surface-2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--text-3xl);
        color: var(--text-2);
        overflow: hidden;
      }

      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .form-section {
        margin-bottom: var(--space-6);
      }

      .form-title {
        font-size: var(--text-xl);
        font-weight: var(--weight-bold);
        color: var(--text-1);
        margin-bottom: var(--space-4);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-4);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-4);
        margin-top: var(--space-6);
      }

      .danger-zone {
        background: var(--error);
        color: white;
        padding: var(--space-4);
        border-radius: var(--radius-2);
        margin-top: var(--space-6);
      }

      .danger-zone-title {
        font-size: var(--text-lg);
        font-weight: var(--weight-bold);
        margin-bottom: var(--space-2);
      }

      .danger-zone-description {
        margin-bottom: var(--space-4);
        opacity: 0.9;
      }

      @media (max-width: 640px) {
        .avatar-section {
          flex-direction: column;
          text-align: center;
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
    this.activeTab = "profile";
    this.user = null;
    this.error = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadUserProfile();
  }

  async _loadUserProfile() {
    try {
      // In a real app, you would fetch the user profile from the API
      // For now, we'll use the user from auth service
      this.user = authService.user;
    } catch (error) {
      console.error("Error loading profile:", error);
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async _handleProfileSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      location: formData.get("location"),
      bio: formData.get("bio"),
    };

    try {
      this.saving = true;
      this.error = "";

      // In a real app, you would update the profile via API
      console.log("Updating profile:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.user = { ...this.user, ...data };
    } catch (error) {
      console.error("Error updating profile:", error);
      this.error = error.message;
    } finally {
      this.saving = false;
    }
  }

  async _handlePasswordSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    };

    if (data.newPassword !== data.confirmPassword) {
      this.error = "New passwords do not match";
      return;
    }

    try {
      this.saving = true;
      this.error = "";

      // In a real app, you would update the password via API
      console.log("Updating password:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error updating password:", error);
      this.error = error.message;
    } finally {
      this.saving = false;
    }
  }

  _renderProfile() {
    return html`
      <neo-card class="profile-card">
        <div class="avatar-section">
          <div class="avatar">
            ${this.user?.avatar
              ? html`<img src=${this.user.avatar} alt="Profile" />`
              : this.user?.name?.charAt(0) || "U"}
          </div>
          <div class="avatar-actions">
            <neo-button>Upload New Picture</neo-button>
            <neo-button variant="text">Remove Picture</neo-button>
          </div>
        </div>

        <form @submit=${this._handleProfileSubmit}>
          <div class="form-section">
            <h3 class="form-title">Personal Information</h3>
            <div class="form-grid">
              <neo-input
                label="Full Name"
                name="name"
                value=${this.user?.name || ""}
                required
              ></neo-input>
              <neo-input
                type="email"
                label="Email"
                name="email"
                value=${this.user?.email || ""}
                required
              ></neo-input>
              <neo-input
                label="Company"
                name="company"
                value=${this.user?.company || ""}
              ></neo-input>
              <neo-input
                label="Location"
                name="location"
                value=${this.user?.location || ""}
              ></neo-input>
            </div>
          </div>

          <div class="form-section">
            <h3 class="form-title">About</h3>
            <neo-input
              type="textarea"
              name="bio"
              value=${this.user?.bio || ""}
              rows="4"
              placeholder="Tell us about yourself..."
            ></neo-input>
          </div>

          <div class="form-actions">
            <neo-button variant="outline" type="button">Cancel</neo-button>
            <neo-button variant="primary" type="submit" ?loading=${this.saving}>
              Save Changes
            </neo-button>
          </div>
        </form>
      </neo-card>
    `;
  }

  _renderSecurity() {
    return html`
      <neo-card class="profile-card">
        <form @submit=${this._handlePasswordSubmit}>
          <div class="form-section">
            <h3 class="form-title">Change Password</h3>
            <div class="form-grid">
              <neo-input
                type="password"
                label="Current Password"
                name="currentPassword"
                required
              ></neo-input>
              <neo-input
                type="password"
                label="New Password"
                name="newPassword"
                required
                minlength="8"
              ></neo-input>
              <neo-input
                type="password"
                label="Confirm New Password"
                name="confirmPassword"
                required
                minlength="8"
              ></neo-input>
            </div>
          </div>

          <div class="form-actions">
            <neo-button variant="outline" type="button">Cancel</neo-button>
            <neo-button variant="primary" type="submit" ?loading=${this.saving}>
              Update Password
            </neo-button>
          </div>
        </form>

        <div class="danger-zone">
          <h3 class="danger-zone-title">Delete Account</h3>
          <p class="danger-zone-description">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <neo-button variant="error">Delete Account</neo-button>
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
      <div class="profile-header">
        <h1 class="profile-title">Profile Settings</h1>
        <p class="profile-subtitle">
          Manage your account settings and preferences.
        </p>
      </div>

      ${this.error
        ? html` <div class="error-message">${this.error}</div> `
        : ""}

      <neo-tabs
        .tabs=${[
          { id: "profile", label: "Profile", icon: "person" },
          { id: "security", label: "Security", icon: "security" },
        ]}
        .activeTab=${this.activeTab}
        @tab-change=${(e) => (this.activeTab = e.detail.tabId)}
      >
        <div slot="profile">${this._renderProfile()}</div>

        <div slot="security">${this._renderSecurity()}</div>
      </neo-tabs>
    `;
  }
}

customElements.define("profile-page", ProfilePage);
