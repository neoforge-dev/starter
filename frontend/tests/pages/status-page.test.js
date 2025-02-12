import { TestRunner, Assert, ComponentTester } from "../test-utils.js";
import { StatusPage } from "../../pages/status-page.js";

const runner = new TestRunner();

runner.describe("StatusPage", () => {
  let element;
  const mockStatus = {
    overall: {
      status: "operational",
      lastUpdated: "2024-02-10T15:00:00Z",
    },
    services: [
      {
        name: "API",
        status: "operational",
        uptime: "99.99%",
        lastIncident: null,
      },
      {
        name: "Database",
        status: "operational",
        uptime: "99.95%",
        lastIncident: "2024-02-01T10:30:00Z",
      },
      {
        name: "Storage",
        status: "degraded",
        uptime: "99.50%",
        lastIncident: "2024-02-10T14:30:00Z",
      },
    ],
    incidents: [
      {
        id: 1,
        title: "Storage Performance Degradation",
        status: "investigating",
        createdAt: "2024-02-10T14:30:00Z",
        updatedAt: "2024-02-10T15:00:00Z",
        updates: [
          {
            id: 1,
            message: "Investigating storage performance issues",
            timestamp: "2024-02-10T14:30:00Z",
          },
        ],
      },
    ],
    maintenance: [
      {
        id: 1,
        title: "Scheduled Database Maintenance",
        scheduledFor: "2024-02-15T02:00:00Z",
        duration: "2 hours",
        affectedServices: ["Database"],
      },
    ],
  };

  runner.beforeEach(async () => {
    element = await ComponentTester.render(StatusPage);
    element.status = mockStatus;
    await element.updateComplete;
  });

  runner.afterEach(() => {
    ComponentTester.cleanup();
  });

  runner.it("should render overall status", async () => {
    const shadowRoot = element.shadowRoot;
    const overallStatus = shadowRoot.querySelector(".overall-status");
    const statusIndicator = overallStatus.querySelector(".status-indicator");
    const lastUpdated = overallStatus.querySelector(".last-updated");

    Assert.notNull(overallStatus, "Overall status section should be present");
    Assert.include(
      statusIndicator.textContent.toLowerCase(),
      mockStatus.overall.status,
      "Should show correct overall status"
    );
    Assert.include(
      lastUpdated.textContent,
      new Date(mockStatus.overall.lastUpdated).toLocaleString(),
      "Should show last updated time"
    );
  });

  runner.it("should render service statuses", async () => {
    const shadowRoot = element.shadowRoot;
    const serviceItems = shadowRoot.querySelectorAll(".service-item");

    Assert.equal(
      serviceItems.length,
      mockStatus.services.length,
      "Should show all services"
    );

    serviceItems.forEach((item, index) => {
      const service = mockStatus.services[index];
      const statusIndicator = item.querySelector(".status-indicator");
      const uptimeDisplay = item.querySelector(".uptime");

      Assert.include(
        item.textContent,
        service.name,
        "Should show service name"
      );
      Assert.include(
        statusIndicator.textContent.toLowerCase(),
        service.status,
        "Should show correct service status"
      );
      Assert.include(
        uptimeDisplay.textContent,
        service.uptime,
        "Should show service uptime"
      );
    });
  });

  runner.it("should render active incidents", async () => {
    const shadowRoot = element.shadowRoot;
    const incidentItems = shadowRoot.querySelectorAll(".incident-item");

    Assert.equal(
      incidentItems.length,
      mockStatus.incidents.length,
      "Should show all active incidents"
    );

    incidentItems.forEach((item, index) => {
      const incident = mockStatus.incidents[index];
      const title = item.querySelector(".incident-title");
      const status = item.querySelector(".incident-status");
      const updates = item.querySelectorAll(".incident-update");

      Assert.include(
        title.textContent,
        incident.title,
        "Should show incident title"
      );
      Assert.include(
        status.textContent.toLowerCase(),
        incident.status,
        "Should show incident status"
      );
      Assert.equal(
        updates.length,
        incident.updates.length,
        "Should show all incident updates"
      );
    });
  });

  runner.it("should render scheduled maintenance", async () => {
    const shadowRoot = element.shadowRoot;
    const maintenanceItems = shadowRoot.querySelectorAll(".maintenance-item");

    Assert.equal(
      maintenanceItems.length,
      mockStatus.maintenance.length,
      "Should show all scheduled maintenance"
    );

    maintenanceItems.forEach((item, index) => {
      const maintenance = mockStatus.maintenance[index];
      const title = item.querySelector(".maintenance-title");
      const schedule = item.querySelector(".maintenance-schedule");
      const duration = item.querySelector(".maintenance-duration");
      const services = item.querySelector(".affected-services");

      Assert.include(
        title.textContent,
        maintenance.title,
        "Should show maintenance title"
      );
      Assert.include(
        schedule.textContent,
        new Date(maintenance.scheduledFor).toLocaleString(),
        "Should show maintenance schedule"
      );
      Assert.include(
        duration.textContent,
        maintenance.duration,
        "Should show maintenance duration"
      );
      maintenance.affectedServices.forEach((service) => {
        Assert.include(
          services.textContent,
          service,
          "Should list affected services"
        );
      });
    });
  });

  runner.it("should handle status updates", async () => {
    const shadowRoot = element.shadowRoot;
    const refreshButton = shadowRoot.querySelector(".refresh-status");
    let refreshCalled = false;

    // Mock refresh handler
    element.refreshStatus = async () => {
      refreshCalled = true;
      return { success: true };
    };

    Assert.notNull(refreshButton, "Refresh button should be present");

    await ComponentTester.click(refreshButton);
    Assert.true(refreshCalled, "Should call refresh handler");
  });

  runner.it("should handle incident subscription", async () => {
    const shadowRoot = element.shadowRoot;
    const subscribeButton = shadowRoot.querySelector(".subscribe-button");
    const emailInput = shadowRoot.querySelector('input[type="email"]');
    let subscribedEmail = null;

    // Mock subscribe handler
    element.handleSubscribe = async (email) => {
      subscribedEmail = email;
      return { success: true };
    };

    Assert.notNull(subscribeButton, "Subscribe button should be present");
    Assert.notNull(emailInput, "Email input should be present");

    // Subscribe to updates
    await ComponentTester.type(emailInput, "user@example.com");
    await ComponentTester.click(subscribeButton);

    Assert.equal(
      subscribedEmail,
      "user@example.com",
      "Should submit subscription email"
    );
  });

  runner.it("should handle historical uptime view", async () => {
    const shadowRoot = element.shadowRoot;
    const historyToggle = shadowRoot.querySelector(".view-history");
    const historyChart = shadowRoot.querySelector(".uptime-history");

    Assert.notNull(historyToggle, "History toggle should be present");

    // Toggle history view
    await ComponentTester.click(historyToggle);

    Assert.notNull(historyChart, "Should show uptime history chart");
    Assert.true(
      historyChart.classList.contains("show"),
      "History chart should be visible"
    );
  });
});

// Run tests
runner.run();
