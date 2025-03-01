import { html, expect, oneEvent, TestUtils } from "../setup.mjs";
import "../../pages/status-page.js";

describe("Status Page", () => {
  let element;
  const mockStatus = {
    overall: "operational",
    lastUpdated: "2024-03-15T12:00:00Z",
    uptime: 99.99,
    services: [
      {
        id: "api",
        name: "API",
        status: "operational",
        uptime: 99.98,
        incidents: [],
      },
      {
        id: "web",
        name: "Web Interface",
        status: "operational",
        uptime: 99.99,
        incidents: [],
      },
    ],
    incidents: [
      {
        id: "inc-1",
        title: "API Latency Issues",
        status: "resolved",
        createdAt: "2024-03-14T10:00:00Z",
        resolvedAt: "2024-03-14T11:00:00Z",
        updates: [
          {
            id: "upd-1",
            message: "Issue resolved",
            timestamp: "2024-03-14T11:00:00Z",
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    // Mock status service
    window.status = {
      getStatus: vi.fn().mockResolvedValue(mockStatus),
      getServiceStatus: vi.fn((id) =>
        Promise.resolve(mockStatus.services.find((s) => s.id === id))
      ),
      getIncidents: vi.fn().mockResolvedValue(mockStatus.incidents),
      subscribeToUpdates: vi.fn().mockResolvedValue({ success: true }),
      unsubscribeFromUpdates: vi.fn().mockResolvedValue({ success: true }),
    };

    element = await TestUtils.fixture(html`<status-page></status-page>`);
    await TestUtils.waitForComponent(element);
  });

  it("renders status overview", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const overview = shadowRoot.querySelector(".status-overview");
    const systemStatus = overview.querySelector(".system-status");
    const uptimeDisplay = overview.querySelector(".uptime-display");

    expect(overview).to.exist;
    expect(systemStatus).to.exist;
    expect(uptimeDisplay).to.exist;
    expect(systemStatus.textContent).to.include("operational");
    expect(uptimeDisplay.textContent).to.include("99.99");
  });

  it("displays service statuses", () => {
    const services = element.shadowRoot.querySelectorAll(".service-status");
    expect(services.length).to.equal(mockStatus.services.length);

    const firstService = services[0];
    expect(firstService.querySelector(".service-name").textContent).to.equal(
      mockStatus.services[0].name
    );
    expect(
      firstService.querySelector(".status-indicator").textContent
    ).to.include(mockStatus.services[0].status);
  });

  it("shows incident history", () => {
    const incidents = element.shadowRoot.querySelector(".incident-history");
    const incidentItems = incidents.querySelectorAll(".incident-item");

    expect(incidents).to.exist;
    expect(incidentItems.length).to.equal(mockStatus.incidents.length);
  });

  it("displays incident details", async () => {
    const incidentItem = element.shadowRoot.querySelector(".incident-item");

    incidentItem.click();
    await element.updateComplete;

    const details = element.shadowRoot.querySelector(".incident-details");
    const updates = details.querySelectorAll(".incident-update");

    expect(details).to.exist;
    expect(updates.length).to.equal(mockStatus.incidents[0].updates.length);
  });

  it("shows service metrics", () => {
    const metrics = element.shadowRoot.querySelectorAll(".service-metrics");

    metrics.forEach((metric, index) => {
      const responseTime = metric.querySelector(".response-time");
      expect(responseTime.textContent).to.include(
        mockStatus.services[index].uptime.toString()
      );
    });
  });

  it("handles metric updates", async () => {
    const service = element.shadowRoot.querySelector(".service-status");
    const metrics = service.querySelector(".service-metrics");

    // Simulate metric update
    element.updateMetrics({
      id: "api",
      metrics: {
        responseTime: 160,
      },
    });
    await element.updateComplete;

    const responseTime = metrics.querySelector(".response-time");
    expect(responseTime.textContent).to.include("160");
  });

  it("supports status filtering", async () => {
    const filterSelect = element.shadowRoot.querySelector(".status-filter");
    filterSelect.value = "degraded";
    filterSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const visibleServices = element.shadowRoot.querySelectorAll(
      ".service-status:not(.hidden)"
    );
    expect(visibleServices.length).to.equal(1);
    expect(
      visibleServices[0].querySelector(".status-indicator").textContent
    ).to.include("degraded");
  });

  it("handles subscription to updates", async () => {
    const subscribeButton =
      element.shadowRoot.querySelector(".subscribe-button");
    const emailInput = element.shadowRoot.querySelector('input[type="email"]');

    emailInput.value = "test@example.com";
    setTimeout(() => subscribeButton.click());
    const { detail } = await oneEvent(element, "subscribe");

    expect(detail.email).to.equal("test@example.com");
  });

  it("displays status history chart", () => {
    const chart = element.shadowRoot.querySelector(".status-history-chart");
    const canvas = chart.querySelector("canvas");

    expect(chart).to.exist;
    expect(canvas).to.exist;
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
    const services = element.shadowRoot.querySelectorAll(".service-status");
    services.forEach((service) => {
      expect(service.getAttribute("role")).to.equal("region");
      expect(service.getAttribute("aria-label")).to.exist;
    });

    const statusIndicators =
      element.shadowRoot.querySelectorAll(".status-indicator");
    statusIndicators.forEach((indicator) => {
      expect(indicator.getAttribute("role")).to.equal("status");
    });
  });

  it("supports keyboard navigation", async () => {
    const services = element.shadowRoot.querySelectorAll(".service-status");
    const firstService = services[0];

    firstService.focus();
    firstService.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown" })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(services[1]);
  });

  it("handles time zone display", () => {
    const timestamps = element.shadowRoot.querySelectorAll(".timestamp");
    timestamps.forEach((timestamp) => {
      expect(timestamp.getAttribute("title")).to.exist;
      expect(timestamp.textContent).to.include("ago");
    });
  });

  it("supports dark mode", async () => {
    element.darkMode = true;
    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".page-container");
    expect(container.classList.contains("dark")).to.be.true;
  });

  it("shows loading states", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".status-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("handles error states", async () => {
    const error = "Failed to load status";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
  });

  it("supports auto-refresh", async () => {
    const refreshToggle = element.shadowRoot.querySelector(
      ".auto-refresh-toggle"
    );
    refreshToggle.click();
    await element.updateComplete;

    expect(element.autoRefresh).to.be.true;
    expect(element.refreshInterval).to.exist;
  });

  it("handles RSS feed subscription", async () => {
    const rssButton = element.shadowRoot.querySelector(".rss-feed-button");

    setTimeout(() => rssButton.click());
    const { detail } = await oneEvent(element, "subscribe-rss");

    expect(detail.type).to.equal("rss");
  });

  it("displays maintenance windows", () => {
    const maintenance = element.shadowRoot.querySelector(
      ".maintenance-schedule"
    );
    const windows = maintenance.querySelectorAll(".maintenance-window");

    expect(maintenance).to.exist;
    expect(windows.length).to.be.greaterThan(0);
  });
});
