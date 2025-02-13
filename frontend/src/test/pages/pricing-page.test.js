import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/pricing-page.js";

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
        "Unlimited projects",
        "100GB storage",
        "Priority support",
        "Advanced features",
        "API access",
      ],
      popular: true,
      cta: "Go Pro",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: {
        monthly: 299,
        yearly: 2990,
        currency: "USD",
      },
      features: [
        "Custom solutions",
        "Unlimited storage",
        "Dedicated support",
        "Custom features",
        "SLA guarantee",
      ],
      popular: false,
      cta: "Contact Sales",
    },
  ];

  const mockAddons = [
    {
      id: "extra-storage",
      name: "Extra Storage",
      price: 10,
      description: "Additional 100GB storage",
    },
    {
      id: "api-calls",
      name: "API Calls",
      price: 20,
      description: "Additional 100K API calls",
    },
  ];

  beforeEach(async () => {
    // Mock API client
    window.api = {
      getPricingPlans: async () => mockPlans,
      getAddons: async () => mockAddons,
      subscribeToPlan: async (planId) => ({ success: true }),
      calculatePrice: async (planId, addons, billing) => ({
        subtotal: 99,
        discount: 0,
        total: 99,
      }),
    };

    element = await fixture(html`<pricing-page></pricing-page>`);
    await element.updateComplete;
  });

  it("renders pricing layout", () => {
    const plansSection = element.shadowRoot.querySelector(".pricing-plans");
    const addonsSection = element.shadowRoot.querySelector(".pricing-addons");
    const faqSection = element.shadowRoot.querySelector(".pricing-faq");

    expect(plansSection).to.exist;
    expect(addonsSection).to.exist;
    expect(faqSection).to.exist;
  });

  it("displays pricing plans", () => {
    const plans = element.shadowRoot.querySelectorAll(".pricing-plan");
    expect(plans.length).to.equal(mockPlans.length);

    const firstPlan = plans[0];
    expect(firstPlan.querySelector(".plan-name").textContent).to.equal(
      mockPlans[0].name
    );
    expect(firstPlan.querySelector(".plan-price").textContent).to.include(
      mockPlans[0].price.monthly.toString()
    );
  });

  it("shows plan features", () => {
    const firstPlan = element.shadowRoot.querySelector(".pricing-plan");
    const features = firstPlan.querySelectorAll(".plan-feature");

    expect(features.length).to.equal(mockPlans[0].features.length);
    features.forEach((feature, index) => {
      expect(feature.textContent).to.include(mockPlans[0].features[index]);
    });
  });

  it("handles billing toggle", async () => {
    const billingToggle = element.shadowRoot.querySelector(".billing-toggle");
    const monthlyLabel = element.shadowRoot.querySelector(".monthly-label");
    const yearlyLabel = element.shadowRoot.querySelector(".yearly-label");

    billingToggle.click();
    await element.updateComplete;

    expect(element.billingCycle).to.equal("yearly");
    expect(yearlyLabel.classList.contains("active")).to.be.true;
    expect(monthlyLabel.classList.contains("active")).to.be.false;
  });

  it("highlights popular plan", () => {
    const plans = element.shadowRoot.querySelectorAll(".pricing-plan");
    const popularPlan = Array.from(plans).find((plan) =>
      plan.classList.contains("popular")
    );

    expect(popularPlan).to.exist;
    expect(popularPlan.querySelector(".plan-name").textContent).to.equal(
      mockPlans[1].name
    );
  });

  it("displays addon options", () => {
    const addons = element.shadowRoot.querySelectorAll(".pricing-addon");
    expect(addons.length).to.equal(mockAddons.length);

    const firstAddon = addons[0];
    expect(firstAddon.querySelector(".addon-name").textContent).to.equal(
      mockAddons[0].name
    );
    expect(firstAddon.querySelector(".addon-price").textContent).to.include(
      mockAddons[0].price.toString()
    );
  });

  it("handles plan selection", async () => {
    const plans = element.shadowRoot.querySelectorAll(".pricing-plan");
    const selectButton = plans[0].querySelector(".select-plan-button");

    setTimeout(() => selectButton.click());
    const { detail } = await oneEvent(element, "plan-selected");

    expect(detail.planId).to.equal(mockPlans[0].id);
  });

  it("calculates total price with addons", async () => {
    const addons = element.shadowRoot.querySelectorAll(".pricing-addon");
    const firstAddon = addons[0].querySelector('input[type="checkbox"]');

    firstAddon.click();
    await element.updateComplete;

    const total = element.shadowRoot.querySelector(".total-price");
    expect(total.textContent).to.include("99");
  });

  it("shows yearly discount", async () => {
    const billingToggle = element.shadowRoot.querySelector(".billing-toggle");
    billingToggle.click();
    await element.updateComplete;

    const plans = element.shadowRoot.querySelectorAll(".pricing-plan");
    plans.forEach((plan, index) => {
      const savings = plan.querySelector(".yearly-savings");
      const discount =
        mockPlans[index].price.monthly * 12 - mockPlans[index].price.yearly;
      expect(savings.textContent).to.include(discount.toString());
    });
  });

  it("handles enterprise contact form", async () => {
    const enterprisePlan = element.shadowRoot.querySelector("#enterprise-plan");
    const contactButton = enterprisePlan.querySelector(".contact-sales-button");

    setTimeout(() => contactButton.click());
    const { detail } = await oneEvent(element, "show-modal");

    expect(detail.type).to.equal("contact-sales");
  });

  it("displays loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".pricing-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("shows error messages", async () => {
    const error = "Failed to load pricing plans";
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
    const plans = element.shadowRoot.querySelectorAll(".pricing-plan");
    plans.forEach((plan) => {
      expect(plan.getAttribute("role")).to.equal("article");
      expect(plan.getAttribute("aria-labelledby")).to.exist;
    });

    const toggle = element.shadowRoot.querySelector(".billing-toggle");
    expect(toggle.getAttribute("aria-label")).to.exist;
  });

  it("supports keyboard navigation", async () => {
    const plans = element.shadowRoot.querySelectorAll(".pricing-plan");
    const firstPlan = plans[0];

    firstPlan.focus();
    firstPlan.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight" })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(plans[1]);
  });

  it("handles currency selection", async () => {
    const currencySelect = element.shadowRoot.querySelector(".currency-select");
    currencySelect.value = "EUR";
    currencySelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const prices = element.shadowRoot.querySelectorAll(".plan-price");
    prices.forEach((price) => {
      expect(price.textContent).to.include("€");
    });
  });

  it("validates contact form inputs", async () => {
    const contactForm = element.shadowRoot.querySelector(".contact-form");
    const submitButton = contactForm.querySelector('button[type="submit"]');

    submitButton.click();
    await element.updateComplete;

    const errorMessages = contactForm.querySelectorAll(".error-message");
    expect(errorMessages.length).to.be.greaterThan(0);
  });
});
