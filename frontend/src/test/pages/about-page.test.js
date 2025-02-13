import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/about-page.js";

describe("About Page", () => {
  let element;
  const mockTeamMembers = [
    {
      id: "1",
      name: "Jane Smith",
      role: "Lead Developer",
      bio: "Full-stack developer with 10 years experience",
      avatar: "jane-avatar.jpg",
      social: {
        github: "github.com/janesmith",
        linkedin: "linkedin.com/in/janesmith",
        twitter: "twitter.com/janesmith",
      },
    },
    {
      id: "2",
      name: "John Doe",
      role: "UI/UX Designer",
      bio: "Designer with a passion for user experience",
      avatar: "john-avatar.jpg",
      social: {
        github: "github.com/johndoe",
        linkedin: "linkedin.com/in/johndoe",
        twitter: "twitter.com/johndoe",
      },
    },
  ];

  const mockCompanyInfo = {
    name: "NeoForge",
    founded: "2020",
    mission: "Empowering developers with modern tools",
    vision: "Creating the future of web development",
    values: ["Innovation", "Collaboration", "Open Source", "User Experience"],
    locations: ["San Francisco, CA", "London, UK", "Tokyo, Japan"],
    stats: {
      users: "10,000+",
      projects: "50,000+",
      contributors: "500+",
    },
  };

  beforeEach(async () => {
    // Mock API client
    window.api = {
      getTeamMembers: async () => mockTeamMembers,
      getCompanyInfo: async () => mockCompanyInfo,
      subscribeNewsletter: async (email) => ({ success: true }),
    };

    element = await fixture(html`<about-page></about-page>`);
    await element.updateComplete;
  });

  it("renders main sections", () => {
    const hero = element.shadowRoot.querySelector(".hero-section");
    const mission = element.shadowRoot.querySelector(".mission-section");
    const team = element.shadowRoot.querySelector(".team-section");
    const values = element.shadowRoot.querySelector(".values-section");
    const contact = element.shadowRoot.querySelector(".contact-section");

    expect(hero).to.exist;
    expect(mission).to.exist;
    expect(team).to.exist;
    expect(values).to.exist;
    expect(contact).to.exist;
  });

  it("displays company information", () => {
    const companyName = element.shadowRoot.querySelector(".company-name");
    const missionStatement =
      element.shadowRoot.querySelector(".mission-statement");
    const visionStatement =
      element.shadowRoot.querySelector(".vision-statement");

    expect(companyName.textContent).to.equal(mockCompanyInfo.name);
    expect(missionStatement.textContent).to.include(mockCompanyInfo.mission);
    expect(visionStatement.textContent).to.include(mockCompanyInfo.vision);
  });

  it("renders team members", () => {
    const teamMembers = element.shadowRoot.querySelectorAll(".team-member");
    expect(teamMembers.length).to.equal(mockTeamMembers.length);

    const firstMember = teamMembers[0];
    expect(firstMember.querySelector(".member-name").textContent).to.equal(
      mockTeamMembers[0].name
    );
    expect(firstMember.querySelector(".member-role").textContent).to.equal(
      mockTeamMembers[0].role
    );
  });

  it("displays company values", () => {
    const valueItems = element.shadowRoot.querySelectorAll(".value-item");
    expect(valueItems.length).to.equal(mockCompanyInfo.values.length);

    valueItems.forEach((item, index) => {
      expect(item.textContent).to.include(mockCompanyInfo.values[index]);
    });
  });

  it("shows company statistics", () => {
    const stats = element.shadowRoot.querySelector(".company-stats");
    const statItems = stats.querySelectorAll(".stat-item");

    expect(statItems[0].textContent).to.include(mockCompanyInfo.stats.users);
    expect(statItems[1].textContent).to.include(mockCompanyInfo.stats.projects);
    expect(statItems[2].textContent).to.include(
      mockCompanyInfo.stats.contributors
    );
  });

  it("handles newsletter subscription", async () => {
    const form = element.shadowRoot.querySelector(".newsletter-form");
    const emailInput = form.querySelector('input[type="email"]');

    emailInput.value = "test@example.com";
    setTimeout(() => form.submit());
    const { detail } = await oneEvent(element, "newsletter-subscribe");

    expect(detail.email).to.equal("test@example.com");
  });

  it("displays office locations", () => {
    const locations = element.shadowRoot.querySelectorAll(".office-location");
    expect(locations.length).to.equal(mockCompanyInfo.locations.length);

    locations.forEach((location, index) => {
      expect(location.textContent).to.include(mockCompanyInfo.locations[index]);
    });
  });

  it("shows team member social links", () => {
    const teamMembers = element.shadowRoot.querySelectorAll(".team-member");
    const firstMember = teamMembers[0];
    const socialLinks = firstMember.querySelectorAll(".social-link");

    expect(socialLinks.length).to.equal(
      Object.keys(mockTeamMembers[0].social).length
    );
    expect(socialLinks[0].href).to.include(mockTeamMembers[0].social.github);
  });

  it("handles loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".content-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("displays error messages", async () => {
    const error = "Failed to load company information";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
  });

  it("supports mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = (query) => ({
      matches: query.includes("max-width"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".page-container");
    expect(container.classList.contains("mobile")).to.be.true;
  });

  it("maintains accessibility attributes", () => {
    const sections = element.shadowRoot.querySelectorAll("section");
    sections.forEach((section) => {
      expect(section.getAttribute("aria-labelledby")).to.exist;
    });

    const images = element.shadowRoot.querySelectorAll("img");
    images.forEach((img) => {
      expect(img.getAttribute("alt")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const teamMembers = element.shadowRoot.querySelectorAll(".team-member");
    const firstMember = teamMembers[0];

    firstMember.focus();
    firstMember.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight" })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(teamMembers[1]);
  });

  it("validates newsletter form input", async () => {
    const form = element.shadowRoot.querySelector(".newsletter-form");
    const emailInput = form.querySelector('input[type="email"]');

    // Test invalid email
    emailInput.value = "invalid-email";
    emailInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const errorMessage = form.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include("valid email");
  });

  it("handles image loading errors", async () => {
    const teamMembers = element.shadowRoot.querySelectorAll(".team-member");
    const firstMember = teamMembers[0];
    const avatar = firstMember.querySelector(".member-avatar");

    avatar.dispatchEvent(new Event("error"));
    await element.updateComplete;

    expect(avatar.src).to.include("default-avatar.jpg");
  });

  it("supports lazy loading of images", () => {
    const images = element.shadowRoot.querySelectorAll("img");
    images.forEach((img) => {
      expect(img.getAttribute("loading")).to.equal("lazy");
    });
  });

  it("handles contact form submission", async () => {
    const form = element.shadowRoot.querySelector(".contact-form");
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    nameInput.value = "Test User";
    emailInput.value = "test@example.com";
    messageInput.value = "Test message";

    setTimeout(() => form.submit());
    const { detail } = await oneEvent(element, "contact-submit");

    expect(detail.name).to.equal("Test User");
    expect(detail.email).to.equal("test@example.com");
    expect(detail.message).to.equal("Test message");
  });
});
