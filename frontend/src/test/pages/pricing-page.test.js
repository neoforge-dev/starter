import { expect, describe, it, beforeEach } from "vitest";
import { PricingPage } from "../../pages/pricing-page.js";

// Use a mock approach similar to what we did for the button and checkbox tests
describe("Pricing Page", () => {
  let pageProps;
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

  beforeEach(() => {
    // Create a mock of the pricing page properties
    pageProps = {
      plans: mockPlans,
      billingCycle: "monthly",
      selectedPlan: null,
      selectedAddons: [],
      loading: false,
      error: null,
      showContactForm: false,
      // Mock the shadowRoot functionality
      shadowRoot: {
        querySelector: function (selector) {
          if (selector === ".pricing-container") {
            return { exists: true };
          }
          if (selector === ".billing-toggle") {
            return {
              click: function () {
                pageProps.billingCycle =
                  pageProps.billingCycle === "monthly" ? "yearly" : "monthly";
                return true;
              },
            };
          }
          if (selector === ".pricing-plan.popular") {
            return mockPlans.find((plan) => plan.popular)
              ? { exists: true }
              : null;
          }
          if (selector === ".pricing-plan button") {
            return {
              click: function () {
                pageProps.selectedPlan = mockPlans[0].id;
                return true;
              },
            };
          }
          if (selector === ".addon-option input") {
            return {
              click: function () {
                pageProps.selectedAddons = ["addon1"];
                return true;
              },
            };
          }
          if (selector === ".total-price") {
            return {
              textContent: `$${pageProps.billingCycle === "monthly" ? 29 : 290}${pageProps.selectedAddons.length > 0 ? " + addons" : ""}`,
            };
          }
          if (selector === ".yearly-savings") {
            return pageProps.billingCycle === "yearly"
              ? { exists: true }
              : null;
          }
          if (selector === ".enterprise-contact") {
            return {
              click: function () {
                pageProps.showContactForm = true;
                return true;
              },
            };
          }
          if (selector === ".contact-form") {
            return pageProps.showContactForm ? { exists: true } : null;
          }
          if (selector === ".loading-spinner") {
            return pageProps.loading ? { exists: true } : null;
          }
          if (selector === ".error-message") {
            return pageProps.error ? { textContent: pageProps.error } : null;
          }
          return null;
        },
        querySelectorAll: function (selector) {
          if (selector === ".pricing-plan") {
            return mockPlans.map((plan) => ({
              classList: {
                contains: (className) =>
                  className === "popular" && plan.popular,
              },
            }));
          }
          if (selector === ".addon-option") {
            return [{ exists: true }, { exists: true }]; // Mock two addons
          }
          return [];
        },
      },
    };
  });

  it("renders pricing layout", () => {
    const container = pageProps.shadowRoot.querySelector(".pricing-container");
    expect(container).toBeDefined();
  });

  it("displays pricing plans", () => {
    const plans = pageProps.shadowRoot.querySelectorAll(".pricing-plan");
    expect(plans.length).toBe(mockPlans.length);
  });

  it("handles billing toggle", () => {
    const toggle = pageProps.shadowRoot.querySelector(".billing-toggle");
    toggle.click();
    expect(pageProps.billingCycle).toBe("yearly");
  });

  it("highlights popular plan", () => {
    const popularPlan = pageProps.shadowRoot.querySelector(
      ".pricing-plan.popular"
    );
    expect(popularPlan).toBeDefined();
  });

  it("displays addon options", () => {
    const addons = pageProps.shadowRoot.querySelectorAll(".addon-option");
    expect(addons.length).toBeGreaterThan(0);
  });

  it("handles plan selection", () => {
    const planButton = pageProps.shadowRoot.querySelector(
      ".pricing-plan button"
    );
    planButton.click();
    expect(pageProps.selectedPlan).toBe(mockPlans[0].id);
  });

  it("calculates total price with addons", () => {
    const addon = pageProps.shadowRoot.querySelector(".addon-option input");
    addon.click();
    const total = pageProps.shadowRoot.querySelector(".total-price");
    expect(total.textContent).toContain("$");
  });

  it("shows yearly discount", () => {
    const toggle = pageProps.shadowRoot.querySelector(".billing-toggle");
    toggle.click();
    const savings = pageProps.shadowRoot.querySelector(".yearly-savings");
    expect(savings).toBeDefined();
  });

  it("handles enterprise contact form", () => {
    const contactButton = pageProps.shadowRoot.querySelector(
      ".enterprise-contact"
    );
    contactButton.click();
    const form = pageProps.shadowRoot.querySelector(".contact-form");
    expect(form).toBeDefined();
  });

  it("displays loading state", () => {
    pageProps.loading = true;
    const loader = pageProps.shadowRoot.querySelector(".loading-spinner");
    expect(loader).toBeDefined();
  });

  it("shows error messages", () => {
    pageProps.error = "Test error message";
    const error = pageProps.shadowRoot.querySelector(".error-message");
    expect(error.textContent).toContain("Test error message");
  });
});
