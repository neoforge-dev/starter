import { expect, describe, it, beforeEach, afterEach, vi } from "vitest";
import {
  createMockComponent,
  createMockShadowRoot,
  createMockClassList,
  createMockFixture,
  registerMockComponent,
  createAndRegisterMockComponent,
} from "./component-mock-utils.js";

describe("Component Mock Utilities", () => {
  describe("createMockComponent", () => {
    it("should create a mock component class with the specified name", () => {
      const MockButton = createMockComponent("MockButton");
      expect(MockButton).toBeDefined();
      expect(typeof MockButton).toBe("function");
      expect(MockButton.toString()).toBe("class MockButton extends LitElement");
    });

    it("should create a mock component with the specified properties", () => {
      const properties = {
        label: { type: String },
        disabled: { type: Boolean },
        count: { type: Number },
        items: { type: Array },
        config: { type: Object },
      };

      const MockButton = createMockComponent("MockButton", properties);
      expect(MockButton.properties).toBeDefined();
      expect(MockButton.properties).toEqual(properties);

      const instance = new MockButton();
      expect(instance.label).toBe("");
      expect(instance.disabled).toBe(false);
      expect(instance.count).toBe(0);
      expect(instance.items).toEqual([]);
      expect(instance.config).toEqual({});
    });

    it("should create a mock component with the specified methods", () => {
      const methods = {
        handleClick: vi.fn(),
        getValue: () => "test",
      };

      const MockButton = createMockComponent("MockButton", {}, methods);
      const instance = new MockButton();

      expect(typeof instance.handleClick).toBe("function");
      expect(typeof instance.getValue).toBe("function");
      expect(instance.getValue()).toBe("test");

      instance.handleClick();
      expect(methods.handleClick).toHaveBeenCalled();
    });

    it("should create a mock component with the specified parent class", () => {
      const MockButton = createMockComponent(
        "MockButton",
        {},
        {},
        "HTMLElement"
      );
      expect(MockButton.toString()).toBe(
        "class MockButton extends HTMLElement"
      );
    });

    it("should include common testing properties", () => {
      const MockButton = createMockComponent("MockButton");
      const instance = new MockButton();

      expect(instance.updateComplete).toBeInstanceOf(Promise);
      expect(instance.shadowRoot).toBeDefined();
      expect(instance.classList).toBeDefined();
      expect(typeof instance.render).toBe("function");
    });

    it("should support event handling", () => {
      const MockButton = createMockComponent("MockButton");
      const instance = new MockButton();

      const clickHandler = vi.fn();
      instance.addEventListener("click", clickHandler);

      const event = { type: "click" };
      instance.dispatchEvent(event);

      expect(clickHandler).toHaveBeenCalledWith(event);

      // Test removeEventListener
      instance.removeEventListener("click", clickHandler);
      instance.dispatchEvent(event);

      // Should still be called only once
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("createMockShadowRoot", () => {
    it("should create a mock shadow root with the expected methods", () => {
      const shadowRoot = createMockShadowRoot();

      expect(shadowRoot).toBeDefined();
      expect(typeof shadowRoot.querySelector).toBe("function");
      expect(typeof shadowRoot.querySelectorAll).toBe("function");
      expect(typeof shadowRoot.appendChild).toBe("function");
      expect(typeof shadowRoot.removeChild).toBe("function");
      expect(Array.isArray(shadowRoot.children)).toBe(true);
    });
  });

  describe("createMockClassList", () => {
    it("should create a mock classList with the expected methods", () => {
      const classList = createMockClassList();

      expect(classList).toBeDefined();
      expect(typeof classList.add).toBe("function");
      expect(typeof classList.remove).toBe("function");
      expect(typeof classList.toggle).toBe("function");
      expect(typeof classList.contains).toBe("function");
      expect(typeof classList.replace).toBe("function");
      expect(typeof classList.toString).toBe("function");
    });

    it("should correctly add and remove classes", () => {
      const classList = createMockClassList();

      classList.add("btn", "primary");
      expect(classList.contains("btn")).toBe(true);
      expect(classList.contains("primary")).toBe(true);
      expect(classList.contains("secondary")).toBe(false);

      classList.remove("primary");
      expect(classList.contains("btn")).toBe(true);
      expect(classList.contains("primary")).toBe(false);
    });

    it("should correctly toggle classes", () => {
      const classList = createMockClassList();

      // Toggle on
      expect(classList.toggle("active")).toBe(true);
      expect(classList.contains("active")).toBe(true);

      // Toggle off
      expect(classList.toggle("active")).toBe(false);
      expect(classList.contains("active")).toBe(false);

      // Toggle with force
      expect(classList.toggle("disabled", true)).toBe(true);
      expect(classList.contains("disabled")).toBe(true);

      expect(classList.toggle("disabled", false)).toBe(false);
      expect(classList.contains("disabled")).toBe(false);
    });

    it("should correctly replace classes", () => {
      const classList = createMockClassList();

      classList.add("btn-primary");
      expect(classList.replace("btn-primary", "btn-secondary")).toBe(true);
      expect(classList.contains("btn-primary")).toBe(false);
      expect(classList.contains("btn-secondary")).toBe(true);

      // Replace non-existent class
      expect(classList.replace("btn-danger", "btn-warning")).toBe(false);
    });

    it("should correctly convert to string", () => {
      const classList = createMockClassList();

      classList.add("btn", "primary", "large");
      // Order might vary, so we check for inclusion of each class
      const str = classList.toString();
      expect(str.includes("btn")).toBe(true);
      expect(str.includes("primary")).toBe(true);
      expect(str.includes("large")).toBe(true);
    });
  });

  describe("createMockFixture", () => {
    it("should create a mock fixture function", () => {
      const fixture = createMockFixture();
      expect(typeof fixture).toBe("function");
    });

    it("should return a mock element when called", async () => {
      const fixture = createMockFixture();
      const element = await fixture("<div>Test</div>");

      expect(element).toBeDefined();
      expect(element.updateComplete).toBeInstanceOf(Promise);
      expect(element.style).toBeDefined();
      expect(element.classList).toBeDefined();
      expect(element.shadowRoot).toBeDefined();
      expect(typeof element.addEventListener).toBe("function");
      expect(typeof element.removeEventListener).toBe("function");
      expect(typeof element.dispatchEvent).toBe("function");
      expect(typeof element.remove).toBe("function");
    });
  });

  describe("registerMockComponent", () => {
    // Mock customElements.define and customElements.get
    const originalDefine = customElements.define;
    const originalGet = customElements.get;

    beforeEach(() => {
      customElements.define = vi.fn();
      customElements.get = vi.fn().mockReturnValue(undefined);
    });

    afterEach(() => {
      customElements.define = originalDefine;
      customElements.get = originalGet;
    });

    it("should register a mock component with the custom elements registry", () => {
      const MockButton = createMockComponent("MockButton");
      registerMockComponent("mock-button", MockButton);

      expect(customElements.define).toHaveBeenCalledWith(
        "mock-button",
        MockButton
      );
    });

    it("should not register a component that is already registered", () => {
      const MockButton = createMockComponent("MockButton");
      customElements.get = vi.fn().mockReturnValue(MockButton);

      registerMockComponent("mock-button", MockButton);

      expect(customElements.define).not.toHaveBeenCalled();
    });

    it("should handle errors when registering a component", () => {
      const MockButton = createMockComponent("MockButton");
      customElements.define = vi.fn().mockImplementation(() => {
        throw new Error("Failed to register");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      registerMockComponent("mock-button", MockButton);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("createAndRegisterMockComponent", () => {
    // Mock customElements.define and customElements.get
    const originalDefine = customElements.define;
    const originalGet = customElements.get;

    beforeEach(() => {
      customElements.define = vi.fn();
      customElements.get = vi.fn().mockReturnValue(undefined);
    });

    afterEach(() => {
      customElements.define = originalDefine;
      customElements.get = originalGet;
    });

    it("should create and register a mock component in one step", () => {
      const properties = {
        label: { type: String },
        disabled: { type: Boolean },
      };

      const methods = {
        handleClick: vi.fn(),
      };

      const MockButton = createAndRegisterMockComponent(
        "mock-button",
        "MockButton",
        properties,
        methods
      );

      expect(MockButton).toBeDefined();
      expect(MockButton.properties).toEqual(properties);
      expect(customElements.define).toHaveBeenCalledWith(
        "mock-button",
        MockButton
      );

      const instance = new MockButton();
      expect(instance.label).toBe("");
      expect(instance.disabled).toBe(false);
      expect(typeof instance.handleClick).toBe("function");
    });
  });
});
