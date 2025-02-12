import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { Logger } from "../utils/logger.js";

export class CommunityPage extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .community-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero {
      text-align: center;
      padding: 4rem 2rem;
      background: linear-gradient(
        135deg,
        var(--primary-color) 0%,
        var(--secondary-color) 100%
      );
      border-radius: 12px;
      margin-bottom: 4rem;
      color: white;
    }

    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .hero p {
      font-size: 1.25rem;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto 2rem;
    }

    .join-slack {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: white;
      color: var(--primary-color);
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }

    .join-slack:hover {
      transform: translateY(-2px);
    }

    .community-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .community-card {
      background: var(--surface-color);
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      transition: transform 0.2s;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .community-card:hover {
      transform: translateY(-4px);
    }

    .card-icon {
      font-size: 3rem;
      color: var(--primary-color);
      margin-bottom: 1rem;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--text-color);
    }

    .card-description {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .card-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
    }

    .card-link:hover {
      text-decoration: underline;
    }

    .stats-section {
      background: var(--surface-color);
      padding: 3rem;
      border-radius: 12px;
      margin-bottom: 4rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .stat-item {
      padding: 1rem;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: var(--text-secondary);
      font-size: 1.1rem;
    }

    .events-section {
      margin-bottom: 4rem;
    }

    .section-title {
      font-size: 2rem;
      color: var(--text-color);
      margin-bottom: 2rem;
      text-align: center;
    }

    .event-card {
      background: var(--surface-color);
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .event-date {
      text-align: center;
      min-width: 80px;
    }

    .event-month {
      color: var(--primary-color);
      font-weight: 600;
      font-size: 1.1rem;
    }

    .event-day {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .event-details h3 {
      color: var(--text-color);
      margin-bottom: 0.5rem;
    }

    .event-details p {
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
      .hero {
        padding: 3rem 1rem;
      }

      .hero h1 {
        font-size: 2.5rem;
      }

      .event-card {
        flex-direction: column;
        text-align: center;
      }
    }
  `;

  render() {
    return html`
      <div class="community-container">
        <section class="hero">
          <h1>Join Our Community</h1>
          <p>
            Connect with developers, share knowledge, and build amazing things
            together.
          </p>
          <a
            href="https://join.slack.com/t/neoforge/shared_invite/xxxxx"
            class="join-slack"
            target="_blank"
          >
            <span class="material-icons">forum</span>
            Join us on Slack
          </a>
        </section>

        <div class="community-grid">
          <div class="community-card">
            <span class="material-icons card-icon">forum</span>
            <h3 class="card-title">Slack Community</h3>
            <p class="card-description">
              Join our active Slack community to connect with other developers,
              get help, and share your work.
            </p>
            <a
              href="https://join.slack.com/t/neoforge/shared_invite/xxxxx"
              class="card-link"
              target="_blank"
            >
              Join Slack Channel →
            </a>
          </div>

          <div class="community-card">
            <span class="material-icons card-icon">code</span>
            <h3 class="card-title">GitHub Discussions</h3>
            <p class="card-description">
              Participate in technical discussions, contribute to the project,
              and help shape the future of NeoForge.
            </p>
            <a
              href="https://github.com/neoforge/neoforge/discussions"
              class="card-link"
              target="_blank"
            >
              View Discussions →
            </a>
          </div>

          <div class="community-card">
            <span class="material-icons card-icon">school</span>
            <h3 class="card-title">Learning Resources</h3>
            <p class="card-description">
              Access tutorials, guides, and best practices shared by the
              community.
            </p>
            <a href="/docs" class="card-link"> Browse Resources → </a>
          </div>
        </div>

        <section class="stats-section">
          <h2 class="section-title">Community Stats</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">5,000+</div>
              <div class="stat-label">Community Members</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">100+</div>
              <div class="stat-label">Open Source Projects</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">50+</div>
              <div class="stat-label">Countries</div>
            </div>
          </div>
        </section>

        <section class="events-section">
          <h2 class="section-title">Upcoming Events</h2>
          <div class="event-card">
            <div class="event-date">
              <div class="event-month">MAR</div>
              <div class="event-day">15</div>
            </div>
            <div class="event-details">
              <h3>NeoForge Community Meetup</h3>
              <p>
                Join us for our monthly virtual meetup where we showcase
                projects and share knowledge.
              </p>
              <a href="#" class="card-link">Learn More →</a>
            </div>
          </div>

          <div class="event-card">
            <div class="event-date">
              <div class="event-month">APR</div>
              <div class="event-day">01</div>
            </div>
            <div class="event-details">
              <h3>Contributor Workshop</h3>
              <p>
                Learn how to contribute to NeoForge and make your first pull
                request.
              </p>
              <a href="#" class="card-link">Learn More →</a>
            </div>
          </div>
        </section>
      </div>
    `;
  }
}

customElements.define("community-page", CommunityPage);
