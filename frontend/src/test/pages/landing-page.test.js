import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/landing-page.js";

describe("Landing Page", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<landing-page></landing-page>`);
  });

  it("renders hero section with title and CTA", () => {
    const hero = element.shadowRoot.querySelector(".hero-section");
    const title = hero.querySelector("h1");
    const cta = hero.querySelector(".cta-button");

    expect(hero).to.exist;
    expect(title).to.exist;
    expect(cta).to.exist;
  });

  it("displays feature sections", () => {
    const features = element.shadowRoot.querySelectorAll(".feature-section");
    expect(features.length).to.be.greaterThan(0);

    features.forEach((feature) => {
      const title = feature.querySelector("h2");
      const description = feature.querySelector("p");
      const image = feature.querySelector("img");

      expect(title).to.exist;
      expect(description).to.exist;
      expect(image).to.exist;
    });
  });

  it("shows testimonials section", () => {
    const testimonials = element.shadowRoot.querySelector("ui-testimonials");
    expect(testimonials).to.exist;
    expect(testimonials.items.length).to.be.greaterThan(0);
  });

  it("displays pricing section with plans", () => {
    const pricing = element.shadowRoot.querySelector(".pricing-section");
    const plans = pricing.querySelectorAll(".pricing-plan");

    expect(pricing).to.exist;
    expect(plans.length).to.be.greaterThan(0);

    plans.forEach((plan) => {
      expect(plan.querySelector(".plan-name")).to.exist;
      expect(plan.querySelector(".plan-price")).to.exist;
      expect(plan.querySelector(".plan-features")).to.exist;
    });
  });

  it("handles CTA button clicks", async () => {
    const ctaButton = element.shadowRoot.querySelector(".cta-button");

    setTimeout(() => ctaButton.click());
    const { detail } = await oneEvent(element, "cta-click");

    expect(detail).to.exist;
    expect(detail.action).to.equal("get-started");
  });

  it("animates on scroll", async () => {
    const animatedElements =
      element.shadowRoot.querySelectorAll(".animate-on-scroll");
    expect(animatedElements.length).to.be.greaterThan(0);

    // Simulate scroll
    const observer = element._intersectionObserver;
    animatedElements.forEach((el) => {
      observer.observe(el);
      observer.triggerIntersection(el, true);
    });

    await element.updateComplete;
    animatedElements.forEach((el) => {
      expect(el.classList.contains("visible")).to.be.true;
    });
  });

  it("loads images lazily", () => {
    const images = element.shadowRoot.querySelectorAll('img[loading="lazy"]');
    expect(images.length).to.be.greaterThan(0);
  });

  it("displays FAQ section", () => {
    const faq = element.shadowRoot.querySelector("ui-faq-accordion");
    expect(faq).to.exist;
    expect(faq.items.length).to.be.greaterThan(0);
  });

  it("shows newsletter signup form", async () => {
    const form = element.shadowRoot.querySelector(".newsletter-form");
    const emailInput = form.querySelector('input[type="email"]');
    const submitButton = form.querySelector('button[type="submit"]');

    expect(form).to.exist;
    expect(emailInput).to.exist;
    expect(submitButton).to.exist;

    // Test form submission
    emailInput.value = "test@example.com";
    setTimeout(() => form.submit());
    const { detail } = await oneEvent(element, "newsletter-signup");

    expect(detail.email).to.equal("test@example.com");
  });

  it("handles mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = (query) => ({
      matches: query.includes("max-width"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const navigation = element.shadowRoot.querySelector(".mobile-nav");
    expect(navigation).to.exist;
    expect(navigation.classList.contains("visible")).to.be.false;

    // Test mobile menu toggle
    const menuButton = element.shadowRoot.querySelector(".menu-toggle");
    menuButton.click();
    await element.updateComplete;

    expect(navigation.classList.contains("visible")).to.be.true;
  });

  it("maintains accessibility attributes", () => {
    const sections = element.shadowRoot.querySelectorAll("section");
    sections.forEach((section) => {
      expect(section.getAttribute("aria-labelledby")).to.exist;
    });

    const buttons = element.shadowRoot.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const focusableElements =
      element.shadowRoot.querySelectorAll("button, a, input");
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Test tab navigation
    firstElement.focus();
    firstElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    await element.updateComplete;

    expect(document.activeElement).to.equal(focusableElements[1]);

    // Test shift+tab navigation
    lastElement.focus();
    lastElement.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: true })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(
      focusableElements[focusableElements.length - 2]
    );
  });

  it("optimizes performance with intersection observer", () => {
    const observer = element._intersectionObserver;
    expect(observer).to.exist;

    const observedElements = element.shadowRoot.querySelectorAll(
      ".lazy-load, .animate-on-scroll"
    );
    observedElements.forEach((el) => {
      expect(observer.isObserving(el)).to.be.true;
    });
  });

  it("handles scroll-to-section navigation", async () => {
    const navLinks = element.shadowRoot.querySelectorAll(".nav-link");
    const firstLink = navLinks[0];

    setTimeout(() => firstLink.click());
    const { detail } = await oneEvent(element, "section-scroll");

    expect(detail.section).to.equal(
      firstLink.getAttribute("href").substring(1)
    );
  });
});
