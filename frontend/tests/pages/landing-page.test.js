import { TestRunner, Assert, ComponentTester } from "../test-utils.js";
import { LandingPage } from "../../pages/landing-page.js";

const runner = new TestRunner();

runner.describe("LandingPage", () => {
  let element;

  runner.beforeEach(async () => {
    element = await ComponentTester.render(LandingPage);
  });

  runner.afterEach(() => {
    ComponentTester.cleanup();
  });

  runner.it("should render hero section", async () => {
    const shadowRoot = element.shadowRoot;
    const hero = shadowRoot.querySelector(".hero");
    const title = hero.querySelector("h1");
    const subtitle = hero.querySelector("p");
    const ctaButton = hero.querySelector("button");

    Assert.notNull(hero, "Hero section should be present");
    Assert.notNull(title, "Hero title should be present");
    Assert.notNull(subtitle, "Hero subtitle should be present");
    Assert.notNull(ctaButton, "CTA button should be present");
  });

  runner.it("should navigate to signup on CTA click", async () => {
    const shadowRoot = element.shadowRoot;
    const ctaButton = shadowRoot.querySelector(".hero button");
    let navigatedTo = null;

    // Mock navigation
    window.history.pushState = (data, title, url) => {
      navigatedTo = url;
    };

    await ComponentTester.click(ctaButton);
    Assert.equal(navigatedTo, "/signup", "Should navigate to signup page");
  });

  runner.it("should render feature sections", async () => {
    const shadowRoot = element.shadowRoot;
    const features = shadowRoot.querySelectorAll(".feature");

    Assert.greaterThan(features.length, 0, "Should have feature sections");
    features.forEach((feature) => {
      const icon = feature.querySelector("img");
      const title = feature.querySelector("h3");
      const description = feature.querySelector("p");

      Assert.notNull(icon, "Feature should have an icon");
      Assert.notNull(title, "Feature should have a title");
      Assert.notNull(description, "Feature should have a description");
    });
  });

  runner.it("should render testimonials", async () => {
    const shadowRoot = element.shadowRoot;
    const testimonials = shadowRoot.querySelectorAll(".testimonial");

    Assert.greaterThan(testimonials.length, 0, "Should have testimonials");
    testimonials.forEach((testimonial) => {
      const quote = testimonial.querySelector("blockquote");
      const author = testimonial.querySelector(".author");

      Assert.notNull(quote, "Testimonial should have a quote");
      Assert.notNull(author, "Testimonial should have an author");
    });
  });

  runner.it("should have working navigation links", async () => {
    const shadowRoot = element.shadowRoot;
    const navLinks = shadowRoot.querySelectorAll("nav a");
    let lastNavigatedTo = null;

    // Mock navigation
    window.history.pushState = (data, title, url) => {
      lastNavigatedTo = url;
    };

    Assert.greaterThan(navLinks.length, 0, "Should have navigation links");

    for (const link of navLinks) {
      const href = link.getAttribute("href");
      await ComponentTester.click(link);
      Assert.equal(lastNavigatedTo, href, `Should navigate to ${href}`);
    }
  });
});

// Run tests
runner.run();
