import { LitElement, html, css } from "lit";

export class AboutPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      font-size: 2.5rem;
      color: var(--color-primary);
      margin-bottom: 2rem;
    }

    section {
      margin-bottom: 3rem;
    }

    h2 {
      font-size: 1.8rem;
      color: var(--color-secondary);
      margin-bottom: 1rem;
    }

    p {
      line-height: 1.6;
      color: var(--color-text);
      margin-bottom: 1rem;
    }

    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .team-member {
      background: var(--color-surface);
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .team-member img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      margin-bottom: 1rem;
    }

    .team-member h3 {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .team-member p {
      font-size: 0.9rem;
      color: var(--color-text-light);
    }
  `;

  constructor() {
    super();
  }

  render() {
    return html`
      <div>
        <h1>About NeoForge</h1>

        <section>
          <h2>Our Mission</h2>
          <p>
            NeoForge is dedicated to revolutionizing the way developers build
            and deploy modern web applications. We believe in creating tools
            that empower developers to focus on what matters most - building
            great software.
          </p>
        </section>

        <section>
          <h2>Our Story</h2>
          <p>
            Founded in 2024, NeoForge emerged from the collective experience of
            developers who saw the need for better tooling in the modern web
            development landscape. Our platform combines cutting-edge technology
            with intuitive design to create a seamless development experience.
          </p>
        </section>

        <section>
          <h2>Our Team</h2>
          <div class="team-grid">
            <div class="team-member">
              <img src="/assets/team/alex.jpg" alt="Alex Chen" />
              <h3>Alex Chen</h3>
              <p>Founder & Lead Architect</p>
            </div>
            <div class="team-member">
              <img src="/assets/team/sarah.jpg" alt="Sarah Johnson" />
              <h3>Sarah Johnson</h3>
              <p>Head of Product</p>
            </div>
            <div class="team-member">
              <img src="/assets/team/marcus.jpg" alt="Marcus Rodriguez" />
              <h3>Marcus Rodriguez</h3>
              <p>Senior Developer</p>
            </div>
          </div>
        </section>
      </div>
    `;
  }
}

customElements.define("about-page", AboutPage);
