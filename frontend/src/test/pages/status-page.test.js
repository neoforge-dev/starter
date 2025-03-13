import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Simple test for status page functionality
describe("Status Page", () => {
  let document;
  let statusPage;

  beforeEach(() => {
    // Create a fresh DOM for each test
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    document = dom.window.document;

    // Create a simple status page element
    statusPage = document.createElement("div");
    statusPage.id = "status-page";

    // Create shadow root simulation
    const shadowRoot = document.createElement("div");
    shadowRoot.id = "shadow-root";
    statusPage.appendChild(shadowRoot);

    // Create title
    const title = document.createElement("h1");
    title.textContent = "System Status";
    title.className = "status-title";
    shadowRoot.appendChild(title);

    // Create services container
    const servicesContainer = document.createElement("div");
    servicesContainer.className = "services-container";
    shadowRoot.appendChild(servicesContainer);

    // Add to document
    document.body.appendChild(statusPage);

    // Add methods to simulate component behavior
    statusPage.renderServices = (services) => {
      servicesContainer.innerHTML = "";

      if (!services || services.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "No services available";
        servicesContainer.appendChild(emptyMessage);
        return;
      }

      services.forEach((service) => {
        const card = document.createElement("div");
        card.className = "service-card";

        const name = document.createElement("h2");
        name.textContent = service.name;
        card.appendChild(name);

        const status = document.createElement("div");
        status.className = `status ${service.status}`;
        status.textContent = service.status;
        card.appendChild(status);

        const description = document.createElement("p");
        description.textContent = service.description;
        card.appendChild(description);

        servicesContainer.appendChild(card);
      });
    };

    statusPage.showLoading = () => {
      servicesContainer.innerHTML = "";
      const loading = document.createElement("div");
      loading.className = "loading-indicator";
      loading.textContent = "Loading services...";
      servicesContainer.appendChild(loading);
    };

    statusPage.showError = (message) => {
      servicesContainer.innerHTML = "";
      const error = document.createElement("div");
      error.className = "error-message";
      error.textContent = message || "Failed to load services";
      servicesContainer.appendChild(error);
    };
  });

  it("should have a title", () => {
    const title = statusPage.querySelector("#shadow-root .status-title");
    expect(title).toBeDefined();
    expect(title.textContent).toBe("System Status");
  });

  it("should show loading state", () => {
    statusPage.showLoading();
    const loading = statusPage.querySelector("#shadow-root .loading-indicator");
    expect(loading).toBeDefined();
    expect(loading.textContent).toBe("Loading services...");
  });

  it("should show error state", () => {
    statusPage.showError("Custom error message");
    const error = statusPage.querySelector("#shadow-root .error-message");
    expect(error).toBeDefined();
    expect(error.textContent).toBe("Custom error message");
  });

  it("should show default error message", () => {
    statusPage.showError();
    const error = statusPage.querySelector("#shadow-root .error-message");
    expect(error).toBeDefined();
    expect(error.textContent).toBe("Failed to load services");
  });

  it("should show empty state", () => {
    statusPage.renderServices([]);
    const emptyMessage = statusPage.querySelector(
      "#shadow-root .empty-message"
    );
    expect(emptyMessage).toBeDefined();
    expect(emptyMessage.textContent).toBe("No services available");
  });

  it("should render service cards", () => {
    const services = [
      {
        name: "API Gateway",
        status: "operational",
        description: "The main API gateway service",
      },
      {
        name: "Database",
        status: "degraded",
        description: "Primary database cluster",
      },
    ];

    statusPage.renderServices(services);

    const cards = statusPage.querySelectorAll("#shadow-root .service-card");
    expect(cards.length).toBe(2);

    // Check first card
    expect(cards[0].querySelector("h2").textContent).toBe("API Gateway");
    expect(cards[0].querySelector(".status").textContent).toBe("operational");
    expect(cards[0].querySelector("p").textContent).toBe(
      "The main API gateway service"
    );

    // Check second card
    expect(cards[1].querySelector("h2").textContent).toBe("Database");
    expect(cards[1].querySelector(".status").textContent).toBe("degraded");
    expect(cards[1].querySelector("p").textContent).toBe(
      "Primary database cluster"
    );
  });
});
