import { expect } from "@esm-bundle/chai";
import { fixture } from "@open-wc/testing";
import { vi, describe, it, beforeEach, afterEach } from "vitest";

import { BaseComponent } from "./base-component.js";
import { tenantService } from "../services/tenant.js";

// Register the component for testing
customElements.define("base-component", BaseComponent);

// Mock tenant service
vi.mock("../services/tenant.js", () => ({
  tenantService: {
    getTenant: vi.fn(),
    getTenantConfig: vi.fn(),
    getTenantStyles: vi.fn(),
    getTenantClassName: vi.fn(),
    isTenantActive: vi.fn(),
    addListener: vi.fn(),
  },
}));

// Mock console for development mode testing
const originalConsole = console.log;
let consoleOutput = [];

describe("BaseComponent", () => {
  let element;

  beforeEach(() => {
    // Mock console.log to capture development output
    console.log = vi.fn((...args) => {
      consoleOutput.push(args.join(" "));
    });

    // Reset mocks
    vi.clearAllMocks();
    consoleOutput = [];

    // Default mock implementations
    tenantService.getTenant.mockReturnValue({ id: "default", slug: "default" });
    tenantService.getTenantConfig.mockReturnValue({});
    tenantService.getTenantStyles.mockReturnValue({});
    tenantService.getTenantClassName.mockReturnValue("base-class");
    tenantService.isTenantActive.mockReturnValue(false);
    tenantService.addListener.mockReturnValue(vi.fn());
  });

  afterEach(() => {
    console.log = originalConsole;
    if (element && typeof element.disconnectedCallback === 'function') {
      element.disconnectedCallback();
    }
  });

  describe("Initialization", () => {
    it("should create a BaseComponent instance", () => {
      element = new BaseComponent();
      expect(element).to.be.instanceOf(BaseComponent);
      expect(element.tenant).to.be.null;
      expect(element.tenantConfig).to.deep.equal({});
      expect(element.tenantUnsubscribe).to.be.null;
    });

    it("should bind event handlers", () => {
      const bindSpy = vi.spyOn(BaseComponent.prototype, "_bindEventHandlers");
      element = new BaseComponent();
      expect(bindSpy).toHaveBeenCalled();
    });
  });

  describe("Lifecycle Methods", () => {
    it("should initialize tenant awareness on connected", async () => {
      element = await fixture("<base-component></base-component>");

      expect(tenantService.getTenant).toHaveBeenCalled();
      expect(tenantService.getTenantConfig).toHaveBeenCalled();
      expect(tenantService.addListener).toHaveBeenCalled();
    });

    it("should log connection in development mode", async () => {
      // Set development mode
      process.env.NODE_ENV = "development";

      element = await fixture("<base-component></base-component>");

      expect(consoleOutput).to.include("Connected: BASE-COMPONENT");
    });

    it("should not log in production mode", async () => {
      // Set production mode
      process.env.NODE_ENV = "production";

      element = await fixture("<base-component></base-component>");

      expect(consoleOutput).to.not.include("Connected: BASE-COMPONENT");
    });

    it("should cleanup tenant listeners on disconnect", async () => {
      const unsubscribeMock = vi.fn();
      tenantService.addListener.mockReturnValue(unsubscribeMock);

      element = await fixture("<base-component></base-component>");

      if (typeof element.disconnectedCallback === 'function') {
        element.disconnectedCallback();
        expect(unsubscribeMock).toHaveBeenCalled();
        expect(element.tenantUnsubscribe).to.be.null;
      }
    });
  });

  describe("Tenant Awareness", () => {
    it("should initialize with default tenant", async () => {
      const mockTenant = { id: "test", slug: "test-tenant" };
      tenantService.getTenant.mockReturnValue(mockTenant);

      element = await fixture("<base-component></base-component>");

      expect(element.tenant).to.equal(mockTenant);
      expect(tenantService.getTenant).toHaveBeenCalled();
    });

    it("should apply tenant-specific styles", async () => {
      const mockStyles = {
        "--primary-color": "#ff0000",
        "--font-family": "Arial",
      };
      tenantService.getTenantStyles.mockReturnValue(mockStyles);

      element = await fixture("<base-component></base-component>");

      expect(tenantService.getTenantStyles).toHaveBeenCalled();
    });

    it("should add tenant-specific class", async () => {
      const mockTenant = { id: "test", slug: "test-tenant" };
      tenantService.getTenant.mockReturnValue(mockTenant);

      element = await fixture("<base-component></base-component>");

      expect(element.classList.contains("tenant-test-tenant")).to.be.true;
    });

    it("should handle tenant changes", async () => {
      const newTenant = { id: "new", slug: "new-tenant" };
      let listenerCallback;

      tenantService.addListener.mockImplementation((callback) => {
        listenerCallback = callback;
        return vi.fn();
      });

      element = await fixture("<base-component></base-component>");

      // Simulate tenant change
      if (listenerCallback) {
        listenerCallback(newTenant);
        expect(element.tenant).to.equal(newTenant);
        expect(element.tenantConfig).to.deep.equal({});
      }
    });
  });

  describe("Utility Methods", () => {
    it("should create shadow DOM root", async () => {
      element = new BaseComponent();
      const root = element.createRenderRoot();

      expect(root).to.be.instanceOf(ShadowRoot);
      expect(root.mode).to.equal("open");
    });

    it("should handle fetchData with tenant headers", async () => {
      const mockTenant = { id: "test", uuid: "test-uuid", slug: "test-tenant" };
      tenantService.getTenant.mockReturnValue(mockTenant);

      element = await fixture("<base-component></base-component>");

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      });

      await element.fetchData("/api/test");

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "test-uuid",
          "X-Tenant-Slug": "test-tenant",
        },
      });
    });

    it("should handle fetchData without tenant", async () => {
      element = await fixture("<base-component></base-component>");

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      });

      await element.fetchData("/api/test");

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should handle fetchData errors", async () => {
      element = await fixture("<base-component></base-component>");

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      try {
        await element.fetchData("/api/test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.equal("HTTP 404: Not Found");
      }
    });

    it("should generate tenant-aware API URLs", async () => {
      const mockTenant = { id: "test", slug: "test-tenant" };
      tenantService.getTenant.mockReturnValue(mockTenant);

      element = await fixture("<base-component></base-component>");

      const url = element.getTenantApiUrl("/users");
      expect(url).to.equal("/api/v1/tenants/test/users");
    });

    it("should return original URL for default tenant", async () => {
      element = await fixture("<base-component></base-component>");

      const url = element.getTenantApiUrl("/users");
      expect(url).to.equal("/users");
    });

    it("should get tenant-aware class name", async () => {
      element = await fixture("<base-component></base-component>");

      const className = element.getTenantClassName("my-component");
      expect(tenantService.getTenantClassName).toHaveBeenCalledWith("my-component");
    });

    it("should check if tenant is active", async () => {
      tenantService.isTenantActive.mockReturnValue(true);

      element = await fixture("<base-component></base-component>");

      const isActive = element.isTenantActive();
      expect(isActive).to.be.true;
      expect(tenantService.isTenantActive).toHaveBeenCalled();
    });
  });

  describe("Component Readiness", () => {
    it("should wait for update completion", async () => {
      element = await fixture("<base-component></base-component>");

      // Mock shadowRoot with nested components
      const mockNestedComponent = {
        updateComplete: Promise.resolve(),
      };

      element.shadowRoot = {
        querySelectorAll: vi.fn().mockReturnValue([mockNestedComponent]),
      };

      await element._ensureReady();

      expect(element.updateComplete).to.have.been.fulfilled;
    });

    it("should handle empty shadow root", async () => {
      element = await fixture("<base-component></base-component>");

      element.shadowRoot = null;

      await element._ensureReady();

      expect(element.updateComplete).to.have.been.fulfilled;
    });
  });

  describe("Development Mode Features", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should log tenant changes in development", async () => {
      const newTenant = { id: "new", slug: "new-tenant" };
      let listenerCallback;

      tenantService.addListener.mockImplementation((callback) => {
        listenerCallback = callback;
        return vi.fn();
      });

      element = await fixture("<base-component></base-component>");

      // Reset console output
      consoleOutput = [];

      // Simulate tenant change
      if (listenerCallback) {
        listenerCallback(newTenant);
        expect(consoleOutput).to.include("BASE-COMPONENT tenant changed: new-tenant");
      }
    });

    it("should log fetch errors in development", async () => {
      element = await fixture("<base-component></base-component>");

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      try {
        await element.fetchData("/api/test");
      } catch (error) {
        // Expected to throw
      }

      expect(consoleOutput).to.include("Error fetching /api/test:");
    });
  });
});