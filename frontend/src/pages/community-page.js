import {   LitElement, html, css   } from 'lit';

export class CommunityPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
      color: var(--color-primary, #3f51b5);
    }

    .content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .section {
      margin-bottom: 2rem;
    }

    h2 {
      font-size: 1.8rem;
      margin-bottom: 1rem;
      color: var(--color-secondary, #303f9f);
    }

    p {
      line-height: 1.6;
      margin-bottom: 1rem;
    }
  `;

  render() {
    return html`
      <div class="content">
        <h1>NeoForge Community</h1>

        <div class="section">
          <h2>Join Our Community</h2>
          <p>
            Connect with other NeoForge developers, share your projects, ask
            questions, and collaborate on new ideas. Our community is open to
            developers of all skill levels.
          </p>
        </div>

        <div class="section">
          <h2>Community Resources</h2>
          <p>
            Explore our community resources including forums, chat channels,
            meetups, and contribution guidelines.
          </p>
        </div>

        <div class="section">
          <h2>Upcoming Events</h2>
          <p>
            Stay tuned for upcoming community events, webinars, and conferences.
          </p>
        </div>
      </div>
    `;
  }
}

customElements.define("community-page", CommunityPage);
