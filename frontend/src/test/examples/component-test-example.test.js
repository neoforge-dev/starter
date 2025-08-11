import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createMockElement,
  createMockEvent,
  // createMockComponent,
  mockCreateElement,
} from "../utils/dom-mock-utils";

/**
 * This is an example test that demonstrates how to use the DOM mock utilities
 * to test a web component. In a real test, you would import the component
 * you want to test and test its behavior.
 */

// Mock component class that we'll test
class ExampleComponent {
  constructor() {
    this.button = createMockElement("button");
    this.button.addEventListener = vi.fn();
    this.button.removeEventListener = vi.fn();

    this.shadowRoot = {
      querySelector: vi.fn(() => this.button),
      appendChild: vi.fn(),
    };

    this.addEventListener = vi.fn();
    this.removeEventListener = vi.fn();
    this.dispatchEvent = vi.fn();
    this.render = vi.fn();
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  setupEventListeners() {
    const button = this.shadowRoot.querySelector("button");
    if (button) {
      button.addEventListener("click", this.handleClick.bind(this));
    }
  }

  removeEventListeners() {
    const button = this.shadowRoot.querySelector("button");
    if (button) {
      button.removeEventListener("click", this.handleClick.bind(this));
    }
  }

  handleClick() {
    this.dispatchEvent(
      new CustomEvent("example-clicked", {
        detail: { value: "clicked" },
      })
    );
  }
}

describe("Example Component Test", () => {
  let component;
  let restoreCreateElement;

  beforeEach(() => {
    // Mock document.createElement
    restoreCreateElement = mockCreateElement();

    // Create a new instance of our ExampleComponent
    component = new ExampleComponent();
  });

  afterEach(() => {
    // Restore document.createElement
    if (restoreCreateElement) {
      restoreCreateElement();
    }

    // Clean up mocks
    vi.resetAllMocks();
  });

  describe("Lifecycle Methods", () => {
    it("calls render and setupEventListeners when connected", () => {
      // Spy on the methods
      vi.spyOn(component, "render");
      vi.spyOn(component, "setupEventListeners");

      // Call connectedCallback
      component.connectedCallback();

      // Verify that render and setupEventListeners were called
      expect(component.render).toHaveBeenCalled();
      expect(component.setupEventListeners).toHaveBeenCalled();
    });

    it("calls removeEventListeners when disconnected", () => {
      // Spy on the method
      vi.spyOn(component, "removeEventListeners");

      // Call disconnectedCallback
      component.disconnectedCallback();

      // Verify that removeEventListeners was called
      expect(component.removeEventListeners).toHaveBeenCalled();
    });
  });

  describe("Event Handling", () => {
    it("dispatches a custom event when clicked", () => {
      // Set up the event handling
      component.setupEventListeners();

      // Get the click handler that was registered
      const clickHandler = component.button.addEventListener.mock.calls[0][1];

      // Call the click handler directly
      clickHandler(createMockEvent("click"));

      // Verify that dispatchEvent was called with a custom event
      expect(component.dispatchEvent).toHaveBeenCalled();
      const dispatchedEvent = component.dispatchEvent.mock.calls[0][0];
      expect(dispatchedEvent.type).toBe("example-clicked");
      expect(dispatchedEvent.detail).toEqual({ value: "clicked" });
    });
  });

  describe("Rendering", () => {
    it("renders the component", () => {
      // Create a mock template
      const template = createMockElement("template");
      const content = createMockElement("div");
      template.content = { cloneNode: vi.fn().mockReturnValue(content) };

      // Mock document.createElement to return the template
      document.createElement.mockReturnValue(template);

      // Define a render method that uses the template
      component.render = function () {
        const template = document.createElement("template");
        template.innerHTML = "<div>Example Component</div>";
        const content = template.content.cloneNode(true);
        this.shadowRoot.appendChild(content);
      };

      // Call render
      component.render();

      // Verify that shadowRoot.appendChild was called with the content
      expect(component.shadowRoot.appendChild).toHaveBeenCalledWith(content);
    });
  });
});
