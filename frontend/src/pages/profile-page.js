import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { baseStyles } from "../styles/base.js";

@customElement("profile-page")
export class ProfilePage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .profile-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      .profile-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
      }

      .avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: var(--color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: var(--font-size-xl);
      }

      .profile-info {
        flex: 1;
      }

      h1 {
        font-size: var(--font-size-xxl);
        margin-bottom: var(--spacing-sm);
      }

      .profile-sections {
        display: grid;
        gap: var(--spacing-lg);
      }

      .section {
        padding: var(--spacing-lg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
      }

      h2 {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-md);
      }

      .form-grid {
        display: grid;
        gap: var(--spacing-md);
      }
    `,
  ];

  render() {
    return html`
      <div class="profile-container">
        <div class="profile-header">
          <div class="avatar">U</div>
          <div class="profile-info">
            <h1>User Profile</h1>
            <p>user@example.com</p>
          </div>
        </div>

        <div class="profile-sections">
          <section class="section">
            <h2>Personal Information</h2>
            <div class="form-grid">
              <input type="text" placeholder="Full Name" value="John Doe" />
              <input
                type="email"
                placeholder="Email"
                value="user@example.com"
              />
              <input type="tel" placeholder="Phone" />
              <button>Update Profile</button>
            </div>
          </section>

          <section class="section">
            <h2>Change Password</h2>
            <div class="form-grid">
              <input type="password" placeholder="Current Password" />
              <input type="password" placeholder="New Password" />
              <input type="password" placeholder="Confirm New Password" />
              <button>Change Password</button>
            </div>
          </section>

          <section class="section">
            <h2>Preferences</h2>
            <div class="form-grid">
              <label>
                <input type="checkbox" checked />
                Receive email notifications
              </label>
              <label>
                <input type="checkbox" />
                Two-factor authentication
              </label>
            </div>
          </section>
        </div>
      </div>
    `;
  }
}
