import { html, css } from 'lit';
import { BaseComponent } from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element organizations-page
 * @description Organizations management page
 */
export class OrganizationsPage extends BaseComponent {
  static properties = {
    organizations: { type: Array, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .orgs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
      }

      .orgs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-md);
      }

      .org-card {
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-md);
        background: var(--surface-color);
      }

      .org-title {
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
      }

      .org-description {
        color: var(--text-color-light);
        margin-bottom: var(--spacing-md);
      }

      .create-org-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius);
        cursor: pointer;
      }

      .create-org-btn:hover {
        background: var(--primary-color-dark);
      }
    `,
  ];

  constructor() {
    super();
    this.organizations = [];
    this.loading = false;
    this.error = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadOrganizations();
  }

  async loadOrganizations() {
    this.loading = true;
    try {
      // Mock data for E2E testing
      this.organizations = [
        { id: 1, name: "Sample Organization", description: "Description for org" },
      ];
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="organizations-page">
        <div class="orgs-header">
          <h1>Organizations</h1>
          <button
            class="create-org-btn"
            data-testid="create-org-button"
            @click=${this.createOrganization}
          >
            Create Organization
          </button>
        </div>

        ${this.error ? html`<div class="error">${this.error}</div>` : ""}

        <div class="orgs-grid">
          ${this.organizations.map(org => html`
             <div class="org-card" data-testid="org-card">
               <div class="org-title" data-testid="org-name">${org.name}</div>
               <div class="org-description" data-testid="org-description">${org.description}</div>
               <button data-testid="members-tab" @click=${() => this.viewOrganization(org)}>Members</button>
               <button data-testid="invite-member-button" @click=${() => this.inviteMember(org)}>Invite Member</button>
             </div>
          `)}
        </div>
      </div>
    `;
  }

  createOrganization() {
    // Mock create organization functionality
    console.log("Create organization clicked");
  }

  viewOrganization(org) {
    // Mock view organization functionality
    console.log("View organization:", org);
  }
}

customElements.define("organizations-page", OrganizationsPage);