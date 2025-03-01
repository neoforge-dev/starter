import { fixture, expect, oneEvent, TestUtils } from "../setup.mjs";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../pages/landing-page.js";

describe("Landing Page", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<landing-page></landing-page>`);
    await element.updateComplete;
  });

  it("renders hero section", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const hero = shadowRoot.querySelector(".hero-section");
    const title = hero.querySelector("h1");
    const subtitle = hero.querySelector("p");

    expect(hero).to.exist;
    expect(title).to.exist;
    expect(subtitle).to.exist;
  });

  it("displays feature cards", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const features = shadowRoot.querySelectorAll(".feature-card");
    expect(features.length).to.be.greaterThan(0);
  });

  it("shows call-to-action button", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const cta = shadowRoot.querySelector(".cta-button");
    expect(cta).to.exist;
    expect(cta.textContent).to.include("Get Started");
  });

  it("handles navigation links", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const navLinks = shadowRoot.querySelectorAll(".nav-link");
    expect(navLinks.length).to.be.greaterThan(0);
  });

  it("handles scroll-to-section navigation", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const navLinks = shadowRoot.querySelectorAll(".nav-link");
    const firstLink = navLinks[0];

    firstLink.click();
    await element.updateComplete;

    const { detail } = await oneEvent(element, "section-scroll");
    expect(detail.section).to.exist;
  });

  it("displays testimonials", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const testimonials = shadowRoot.querySelectorAll(".testimonial-card");
    expect(testimonials.length).to.be.greaterThan(0);
  });

  it("shows footer content", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const footer = shadowRoot.querySelector("footer");
    const links = footer.querySelectorAll("a");
    expect(links.length).to.be.greaterThan(0);
  });

  it("handles mobile menu toggle", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const menuButton = shadowRoot.querySelector(".mobile-menu-button");
    const menu = shadowRoot.querySelector(".mobile-menu");

    menuButton.click();
    await element.updateComplete;

    expect(menu.classList.contains("visible")).to.be.true;
  });

  it("displays social media links", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const socialLinks = shadowRoot.querySelectorAll(".social-link");
    expect(socialLinks.length).to.be.greaterThan(0);
  });

  it("shows newsletter signup form", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const form = shadowRoot.querySelector(".newsletter-form");
    const input = form.querySelector("input[type='email']");
    const button = form.querySelector("button[type='submit']");

    expect(input).to.exist;
    expect(button).to.exist;
  });

  it("handles newsletter submission", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const form = shadowRoot.querySelector(".newsletter-form");
    const input = form.querySelector("input[type='email']");
    const email = "test@example.com";

    input.value = email;
    input.dispatchEvent(new Event("input"));

    setTimeout(() => form.submit());
    const { detail } = await oneEvent(element, "newsletter-signup");
    expect(detail.email).to.equal(email);
  });

  it("displays language selector", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const selector = shadowRoot.querySelector(".language-selector");
    const options = selector.querySelectorAll("option");
    expect(options.length).to.be.greaterThan(1);
  });

  it("handles language change", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const selector = shadowRoot.querySelector(".language-selector");
    const newLang = "es";

    selector.value = newLang;
    selector.dispatchEvent(new Event("change"));
    await element.updateComplete;

    expect(element.language).to.equal(newLang);
  });

  it("shows cookie consent banner", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const banner = shadowRoot.querySelector(".cookie-banner");
    const acceptButton = banner.querySelector(".accept-cookies");
    const rejectButton = banner.querySelector(".reject-cookies");

    expect(banner).to.exist;
    expect(acceptButton).to.exist;
    expect(rejectButton).to.exist;
  });

  it("handles cookie consent choice", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const acceptButton = shadowRoot.querySelector(".accept-cookies");

    acceptButton.click();
    await element.updateComplete;

    const banner = shadowRoot.querySelector(".cookie-banner");
    expect(banner.classList.contains("hidden")).to.be.true;
  });
});
