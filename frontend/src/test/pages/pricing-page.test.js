import { fixture, expect, oneEvent, TestUtils } from "../setup.mjs";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { PricingPage } from "../../pages/pricing-page.js";

describe("Pricing Page", () => {
  let element;
  const mockPlans = [
    {
      id: "starter",
      name: "Starter",
      price: {
        monthly: 29,
        yearly: 290,
        currency: "USD",
      },
      features: [
        "Up to 5 projects",
        "10GB storage",
        "Basic support",
        "Core features",
      ],
      popular: false,
      cta: "Get Started",
    },
    {
      id: "pro",
      name: "Professional",
      price: {
        monthly: 99,
        yearly: 990,
        currency: "USD",
      },
      features: [
        "Up to 15 projects",
        "50GB storage",
        "Priority support",
        "Advanced features",
        "Team collaboration",
      ],
      popular: true,
      cta: "Go Pro",
    },
  ];

  beforeEach(async () => {
    element = await fixture(html`<pricing-page></pricing-page>`);
    element.plans = mockPlans;
    await element.updateComplete;
  });

  it("renders pricing layout", async () => {
    const container = element.shadowRoot.querySelector(".pricing-container");
    expect(container).to.exist;
  });

  it("displays pricing plans", async () => {
    const plans = element.shadowRoot.querySelectorAll(".pricing-plan");
    expect(plans.length).to.equal(mockPlans.length);
  });

  it("handles billing toggle", async () => {
    const toggle = element.shadowRoot.querySelector(".billing-toggle");
    toggle.click();
    await element.updateComplete;
    expect(element.billingCycle).to.equal("yearly");
  });

  it("highlights popular plan", async () => {
    const popularPlan = element.shadowRoot.querySelector(
      ".pricing-plan.popular"
    );
    expect(popularPlan).to.exist;
  });

  it("displays addon options", async () => {
    const addons = element.shadowRoot.querySelectorAll(".addon-option");
    expect(addons.length).to.be.greaterThan(0);
  });

  it("handles plan selection", async () => {
    const planButton = element.shadowRoot.querySelector(".pricing-plan button");
    planButton.click();
    await element.updateComplete;
    expect(element.selectedPlan).to.equal(mockPlans[0].id);
  });

  it("calculates total price with addons", async () => {
    const addon = element.shadowRoot.querySelector(".addon-option input");
    addon.click();
    await element.updateComplete;
    const total = element.shadowRoot.querySelector(".total-price");
    expect(total.textContent).to.include("$");
  });

  it("shows yearly discount", async () => {
    const toggle = element.shadowRoot.querySelector(".billing-toggle");
    toggle.click();
    await element.updateComplete;
    const savings = element.shadowRoot.querySelector(".yearly-savings");
    expect(savings).to.exist;
  });

  it("handles enterprise contact form", async () => {
    const contactButton = element.shadowRoot.querySelector(
      ".enterprise-contact"
    );
    contactButton.click();
    await element.updateComplete;
    const form = element.shadowRoot.querySelector(".contact-form");
    expect(form).to.exist;
  });

  it("displays loading state", async () => {
    element.loading = true;
    await element.updateComplete;
    const loader = element.shadowRoot.querySelector(".loading-spinner");
    expect(loader).to.exist;
  });

  it("shows error messages", async () => {
    element.error = "Test error message";
    await element.updateComplete;
    const error = element.shadowRoot.querySelector(".error-message");
    expect(error.textContent).to.include("Test error message");
  });
});
