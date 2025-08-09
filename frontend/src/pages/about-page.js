import { 
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import {
  BaseComponent,
  registerComponent,
} from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element about-page
 * @description About page component with company information and team members
 */
export class AboutPage extends BaseComponent {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .hero-section {
        text-align: center;
        padding: 4rem 0;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        margin-bottom: 3rem;
      }

      .company-name {
        font-size: 3rem;
        color: var(--color-primary);
        margin-bottom: 1rem;
      }

      .mission-section,
      .team-section,
      .values-section,
      .contact-section {
        margin-bottom: 4rem;
      }

      .mission-statement,
      .vision-statement {
        font-size: 1.2rem;
        line-height: 1.6;
        color: var(--color-text);
        margin-bottom: 1.5rem;
      }

      .team-member {
        background: var(--color-surface);
        padding: 1.5rem;
        border-radius: var(--radius-lg);
        text-align: center;
      }

      .member-name {
        font-size: 1.2rem;
        color: var(--color-primary);
        margin: 1rem 0 0.5rem;
      }

      .member-role {
        color: var(--color-text-light);
        margin-bottom: 1rem;
      }

      .social-link {
        color: var(--color-primary);
        text-decoration: none;
        margin: 0 0.5rem;
      }

      .value-item {
        background: var(--color-surface-variant);
        padding: 1rem;
        border-radius: var(--radius-md);
        margin-bottom: 1rem;
      }

      .company-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
        margin-top: 2rem;
      }

      .stat-item {
        text-align: center;
        padding: 1.5rem;
        background: var(--color-surface);
        border-radius: var(--radius-md);
      }

      .office-location {
        margin-bottom: 1rem;
        padding: 1rem;
        background: var(--color-surface-light);
        border-radius: var(--radius-sm);
      }

      .newsletter-form {
        margin-top: 2rem;
        text-align: center;
      }
    `,
  ];

  constructor() {
    super();
    this.loadData();
  }

  async loadData() {
    try {
      const [teamMembers, companyInfo] = await Promise.all([
        window.api.getTeamMembers(),
        window.api.getCompanyInfo(),
      ]);
      this.teamMembers = teamMembers;
      this.companyInfo = companyInfo;
      await this.requestUpdate();
    } catch (error) {
      console.error("Failed to load about page data:", error);
    }
  }

  async handleNewsletterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;

    try {
      const result = await window.api.subscribeNewsletter(email);
      this.dispatchEvent(
        new CustomEvent("newsletter-subscribe", {
          detail: { email, success: result.success },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      console.error("Newsletter subscription failed:", error);
    }
  }

  render() {
    if (!this.companyInfo || !this.teamMembers) {
      return html`<div>Loading...</div>`;
    }

    return html`
      <div>
        <section class="hero-section">
          <h1 class="company-name">${this.companyInfo.name}</h1>
          <p>Founded in ${this.companyInfo.founded}</p>
        </section>

        <section class="mission-section">
          <h2>Our Mission</h2>
          <p class="mission-statement">${this.companyInfo.mission}</p>
          <p class="vision-statement">${this.companyInfo.vision}</p>
        </section>

        <section class="team-section">
          <h2>Our Team</h2>
          <div class="team-grid">
            ${this.teamMembers.map(
              (member) => html`
                <div class="team-member">
                  <img src="${member.avatar}" alt="${member.name}" />
                  <h3 class="member-name">${member.name}</h3>
                  <p class="member-role">${member.role}</p>
                  <div class="social-links">
                    <a
                      href="${member.social.github}"
                      class="social-link"
                      target="_blank"
                      >GitHub</a
                    >
                    <a
                      href="${member.social.linkedin}"
                      class="social-link"
                      target="_blank"
                      >LinkedIn</a
                    >
                    <a
                      href="${member.social.twitter}"
                      class="social-link"
                      target="_blank"
                      >Twitter</a
                    >
                  </div>
                </div>
              `
            )}
          </div>
        </section>

        <section class="values-section">
          <h2>Our Values</h2>
          ${this.companyInfo.values.map(
            (value) => html`
              <div class="value-item">
                <h3>${value}</h3>
              </div>
            `
          )}
        </section>

        <section class="stats-section">
          <h2>Company Statistics</h2>
          <div class="company-stats">
            <div class="stat-item">
              <h3>Users</h3>
              <p>${this.companyInfo.stats.users}</p>
            </div>
            <div class="stat-item">
              <h3>Projects</h3>
              <p>${this.companyInfo.stats.projects}</p>
            </div>
            <div class="stat-item">
              <h3>Contributors</h3>
              <p>${this.companyInfo.stats.contributors}</p>
            </div>
          </div>
        </section>

        <section class="contact-section">
          <h2>Our Offices</h2>
          ${this.companyInfo.locations.map(
            (location) => html`
              <div class="office-location">
                <p>${location}</p>
              </div>
            `
          )}

          <form class="newsletter-form" @submit=${this.handleNewsletterSubmit}>
            <h3>Stay Updated</h3>
            <input type="email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </section>
      </div>
    `;
  }
}
