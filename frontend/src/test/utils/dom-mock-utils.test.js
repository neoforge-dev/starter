import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createMockElement,
  createMockShadowRoot,
  createMockDocumentFragment,
  createMockEvent,
  createMockCustomEvent,
  mockCreateElement,
  createMockComponent,
  createAndRegisterMockComponent,
} from "./dom-mock-utils";

describe("DOM Mock Utilities", () => {
  describe("createMockElement", () => {
    it("creates a mock element with the specified tag name", () => {
      const element = createMockElement("div");
      expect(element.tagName).toBe("DIV");
      expect(element.nodeType).toBe(1);
      expect(element.nodeName).toBe("DIV");
    });

    it("adds properties to the mock element", () => {
      const element = createMockElement("div", {
        className: "test-class",
        id: "test-id",
        textContent: "Test content",
      });
      expect(element.className).toBe("test-class");
      expect(element.id).toBe("test-id");
      expect(element.textContent).toBe("Test content");
    });

    it("supports getAttribute and setAttribute", () => {
      const element = createMockElement("div");
      element.setAttribute("data-test", "test-value");
      expect(element.getAttribute("data-test")).toBe("test-value");
    });

    it("supports appendChild and removeChild", () => {
      const parent = createMockElement("div");
      const child = createMockElement("span");

      parent.appendChild(child);
      expect(parent.children).toContain(child);
      expect(parent.childNodes).toContain(child);

      parent.removeChild(child);
      expect(parent.children).not.toContain(child);
      expect(parent.childNodes).not.toContain(child);
    });

    it("supports remove", () => {
      const parent = createMockElement("div");
      const child = createMockElement("span");

      parent.appendChild(child);
      child.parentNode = parent;

      child.remove();
      expect(parent.children).not.toContain(child);
      expect(parent.childNodes).not.toContain(child);
    });

    it("supports cloneNode", () => {
      const element = createMockElement("div", {
        className: "test-class",
        id: "test-id",
      });

      const clone = element.cloneNode(false);
      expect(clone.tagName).toBe("DIV");
      expect(clone.className).toBe("test-class");
      expect(clone.id).toBe("test-id");
      expect(clone.children).toHaveLength(0);

      const child = createMockElement("span");
      element.appendChild(child);

      const deepClone = element.cloneNode(true);
      expect(deepClone.children).toHaveLength(1);
      expect(deepClone.children[0].tagName).toBe("SPAN");
    });

    it("supports querySelector", () => {
      const parent = createMockElement("div");
      const child1 = createMockElement("span", { className: "test-class" });
      const child2 = createMockElement("p", { id: "test-id" });

      parent.appendChild(child1);
      parent.appendChild(child2);

      expect(parent.querySelector(".test-class")).toBe(child1);
      expect(parent.querySelector("#test-id")).toBe(child2);
      expect(parent.querySelector("span")).toBe(child1);
      expect(parent.querySelector("p")).toBe(child2);
    });

    it("supports querySelectorAll", () => {
      const parent = createMockElement("div");
      const child1 = createMockElement("span", { className: "test-class" });
      const child2 = createMockElement("span", { className: "test-class" });
      const child3 = createMockElement("p", { className: "test-class" });

      parent.appendChild(child1);
      parent.appendChild(child2);
      parent.appendChild(child3);

      const spanElements = parent.querySelectorAll("span");
      expect(spanElements).toHaveLength(2);
      expect(spanElements).toContain(child1);
      expect(spanElements).toContain(child2);

      const classElements = parent.querySelectorAll(".test-class");
      expect(classElements).toHaveLength(3);
      expect(classElements).toContain(child1);
      expect(classElements).toContain(child2);
      expect(classElements).toContain(child3);
    });
  });

  describe("createMockShadowRoot", () => {
    it("creates a mock shadow root", () => {
      const shadowRoot = createMockShadowRoot();
      expect(shadowRoot.mode).toBe("open");
      expect(shadowRoot.host).toBeNull();
    });

    it("adds properties to the mock shadow root", () => {
      const shadowRoot = createMockShadowRoot({
        mode: "closed",
        host: { tagName: "DIV" },
      });
      expect(shadowRoot.mode).toBe("closed");
      expect(shadowRoot.host).toEqual({ tagName: "DIV" });
    });
  });

  describe("createMockDocumentFragment", () => {
    it("creates a mock document fragment", () => {
      const fragment = createMockDocumentFragment();
      expect(fragment.nodeType).toBe(11);
    });

    it("adds properties to the mock document fragment", () => {
      const fragment = createMockDocumentFragment({
        id: "test-id",
      });
      expect(fragment.id).toBe("test-id");
    });
  });

  describe("createMockEvent", () => {
    it("creates a mock event with the specified type", () => {
      const event = createMockEvent("click");
      expect(event.type).toBe("click");
      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(true);
      expect(event.defaultPrevented).toBe(false);
    });

    it("adds properties to the mock event", () => {
      const target = createMockElement("div");
      const event = createMockEvent("click", {
        target,
        bubbles: false,
      });
      expect(event.target).toBe(target);
      expect(event.bubbles).toBe(false);
    });

    it("supports preventDefault", () => {
      const event = createMockEvent("click");
      event.preventDefault();
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe("createMockCustomEvent", () => {
    it("creates a mock custom event with the specified type and detail", () => {
      const event = createMockCustomEvent("custom", {
        detail: { foo: "bar" },
      });
      expect(event.type).toBe("custom");
      expect(event.detail).toEqual({ foo: "bar" });
    });
  });

  describe("mockCreateElement", () => {
    let restoreCreateElement;

    afterEach(() => {
      if (restoreCreateElement) {
        restoreCreateElement();
        restoreCreateElement = null;
      }
    });

    it("mocks document.createElement", () => {
      restoreCreateElement = mockCreateElement();

      const element = document.createElement("div");
      expect(element.tagName).toBe("DIV");
      expect(document.createElement).toHaveBeenCalledWith("div");
    });

    it("returns a function to restore the original createElement", () => {
      const originalCreateElement = document.createElement;
      restoreCreateElement = mockCreateElement();

      expect(document.createElement).not.toBe(originalCreateElement);

      restoreCreateElement();
      expect(document.createElement).toBe(originalCreateElement);
    });
  });

  describe("createMockComponent", () => {
    it("creates a mock component with the specified tag name", () => {
      const component = createMockComponent("my-component");
      expect(component.tagName).toBe("MY-COMPONENT");
    });

    it("creates a shadow root for the component", () => {
      const component = createMockComponent("my-component");
      expect(component.shadowRoot).toBeTruthy();
      expect(component.shadowRoot.host).toBe(component);
    });

    it("adds event handling to the component", () => {
      const component = createMockComponent("my-component");
      const callback = vi.fn();

      component.addEventListener("click", callback);

      const event = createMockEvent("click");
      component.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith(event);
    });

    it("adds Lit lifecycle methods to the component", () => {
      const component = createMockComponent("my-component");
      expect(component.connectedCallback).toBeDefined();
      expect(component.disconnectedCallback).toBeDefined();
      expect(component.attributeChangedCallback).toBeDefined();
    });

    it("adds Lit update methods to the component", () => {
      const component = createMockComponent("my-component");
      expect(component.requestUpdate).toBeDefined();
      expect(component.performUpdate).toBeDefined();
      expect(component.firstUpdated).toBeDefined();
      expect(component.updated).toBeDefined();
    });

    it("adds properties to the component", () => {
      const component = createMockComponent("my-component", {
        foo: "bar",
        baz: 42,
      });
      expect(component.foo).toBe("bar");
      expect(component.baz).toBe(42);
    });
  });

  describe("createAndRegisterMockComponent", () => {
    it("creates and registers a mock component", () => {
      const MockComponent = createAndRegisterMockComponent("test-component", {
        foo: "bar",
      });

      expect(customElements.get("test-component")).toBe(MockComponent);

      const instance = new MockComponent();
      expect(instance.foo).toBe("bar");
      expect(instance.shadowRoot).toBeTruthy();
    });

    it("adds event handling to the component", () => {
      const MockComponent = createAndRegisterMockComponent("test-component-2");
      const instance = new MockComponent();

      const callback = vi.fn();
      instance.addEventListener("click", callback);

      const event = createMockEvent("click");
      instance.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith(event);
    });

    it("adds Lit lifecycle methods to the component", () => {
      const connectedCallback = vi.fn();
      const disconnectedCallback = vi.fn();
      const attributeChangedCallback = vi.fn();

      const MockComponent = createAndRegisterMockComponent("test-component-3", {
        connectedCallback,
        disconnectedCallback,
        attributeChangedCallback,
      });

      const instance = new MockComponent();

      instance.connectedCallback();
      expect(connectedCallback).toHaveBeenCalled();

      instance.disconnectedCallback();
      expect(disconnectedCallback).toHaveBeenCalled();

      instance.attributeChangedCallback("foo", null, "bar");
      expect(attributeChangedCallback).toHaveBeenCalledWith("foo", null, "bar");
    });
  });
});
