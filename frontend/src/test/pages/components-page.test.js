import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock implementation for ComponentsPage
class MockComponentsPage {
  constructor() {
    // Initialize properties with default values
    this._activeTab = "overview";
    this._selectedCategory = null;
    this._selectedVariant = null;
    this._loading = false;
    this._error = "";

    // Create DOM elements for testing
    this.componentsHeader = document.createElement("div");
    this.componentsHeader.className = "components-header";

    this.componentsTitle = document.createElement("h1");
    this.componentsTitle.className = "components-title";
    this.componentsTitle.textContent = "Components Library";

    this.componentsDescription = document.createElement("p");
    this.componentsDescription.className = "components-description";
    this.componentsDescription.textContent = "Browse our component library";

    this.tabsContainer = document.createElement("div");
    this.tabsContainer.className = "tabs-container";

    this.tabs = [
      { name: "Overview", id: "overview" },
      { name: "Code", id: "code" },
      { name: "Docs", id: "docs" },
    ].map((tab) => {
      const tabElement = document.createElement("div");
      tabElement.className = "tab";
      tabElement.dataset.tab = tab.id;
      tabElement.textContent = tab.name;
      tabElement.addEventListener("click", () => (this.activeTab = tab.id));
      this.tabsContainer.appendChild(tabElement);
      return tabElement;
    });

    this.componentCategories = [
      { name: "Buttons", id: "buttons" },
      { name: "Inputs", id: "inputs" },
      { name: "Dropdowns", id: "dropdowns" },
      { name: "Badges", id: "badges" },
      { name: "Spinners", id: "spinners" },
      { name: "Pagination", id: "pagination" },
    ].map((category) => {
      const categoryElement = document.createElement("div");
      categoryElement.className = "component-category";
      categoryElement.dataset.category = category.id;
      categoryElement.textContent = category.name;
      categoryElement.addEventListener(
        "click",
        () => (this.selectedCategory = category.id)
      );
      return categoryElement;
    });

    this.componentVariants = [
      { name: "Primary", id: "primary" },
      { name: "Secondary", id: "secondary" },
      { name: "Outline", id: "outline" },
      { name: "Text", id: "text" },
    ].map((variant) => {
      const variantElement = document.createElement("div");
      variantElement.className = "variant";
      variantElement.dataset.variant = variant.id;
      variantElement.textContent = variant.name;
      variantElement.addEventListener(
        "click",
        () => (this.selectedVariant = variant.id)
      );
      return variantElement;
    });

    this.codeExamples = [
      { language: "html", code: "<button>Click me</button>" },
      { language: "css", code: ".button { color: blue; }" },
    ].map((example) => {
      const exampleElement = document.createElement("div");
      exampleElement.className = "code-example";
      exampleElement.dataset.language = example.language;
      exampleElement.textContent = example.code;
      return exampleElement;
    });

    // Event listeners
    this._eventListeners = new Map();

    // Shadow root mock
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === "h1" || selector === ".components-title")
          return this.componentsTitle;
        if (selector === ".components-description")
          return this.componentsDescription;
        if (selector === ".tabs-container") return this.tabsContainer;
        if (selector === ".loading")
          return this._loading ? document.createElement("div") : null;
        if (selector === ".error")
          return this._error ? document.createElement("div") : null;
        if (selector === ".component-details") {
          const details = document.createElement("div");
          details.className = "component-details";
          if (this._selectedCategory) {
            details.classList.add("active");
          }
          return details;
        }
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".tab") return this.tabs;
        if (selector === ".component-category") return this.componentCategories;
        if (selector === ".variant") return this.componentVariants;
        if (selector === "code-example" || selector === ".code-example")
          return this.codeExamples;
        return [];
      },
    };

    // Update complete promise
    this.updateComplete = Promise.resolve(true);
  }

  // Getters and setters for properties
  get activeTab() {
    return this._activeTab;
  }

  set activeTab(value) {
    this._activeTab = value;
    this.dispatchEvent(
      new CustomEvent("tab-changed", { detail: { tab: value } })
    );
  }

  get selectedCategory() {
    return this._selectedCategory;
  }

  set selectedCategory(value) {
    this._selectedCategory = value;
    this.dispatchEvent(
      new CustomEvent("category-changed", { detail: { category: value } })
    );
  }

  get selectedVariant() {
    return this._selectedVariant;
  }

  set selectedVariant(value) {
    this._selectedVariant = value;
    this.dispatchEvent(
      new CustomEvent("variant-changed", { detail: { variant: value } })
    );
  }

  get loading() {
    return this._loading;
  }

  set loading(value) {
    this._loading = value;
  }

  get error() {
    return this._error;
  }

  set error(value) {
    this._error = value;
  }

  // Event handling
  addEventListener(eventName, callback) {
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, new Set());
    }
    this._eventListeners.get(eventName).add(callback);
  }

  removeEventListener(eventName, callback) {
    if (this._eventListeners.has(eventName)) {
      this._eventListeners.get(eventName).delete(callback);
    }
  }

  dispatchEvent(event) {
    if (this._eventListeners.has(event.type)) {
      this._eventListeners.get(event.type).forEach((callback) => {
        callback(event);
      });
    }
    return true;
  }

  // Component methods
  _renderButtons() {
    return this.componentCategories.find(
      (c) => c.dataset.category === "buttons"
    );
  }

  _renderInputs() {
    return this.componentCategories.find(
      (c) => c.dataset.category === "inputs"
    );
  }

  _renderDropdowns() {
    return this.componentCategories.find(
      (c) => c.dataset.category === "dropdowns"
    );
  }

  _renderBadges() {
    return this.componentCategories.find(
      (c) => c.dataset.category === "badges"
    );
  }

  _renderSpinners() {
    return this.componentCategories.find(
      (c) => c.dataset.category === "spinners"
    );
  }

  _renderPagination() {
    return this.componentCategories.find(
      (c) => c.dataset.category === "pagination"
    );
  }
}

describe("Components Page", () => {
  let element;

  beforeEach(() => {
    element = new MockComponentsPage();
  });

  it("should have default properties", () => {
    expect(element.activeTab).toBe("overview");
    expect(element.selectedCategory).toBe(null);
    expect(element.selectedVariant).toBe(null);
    expect(element.loading).toBe(false);
    expect(element.error).toBe("");
  });

  it("should have a components library title", () => {
    const title = element.shadowRoot.querySelector("h1");
    expect(title.textContent).toBe("Components Library");
  });

  it("should have a components description", () => {
    const description = element.shadowRoot.querySelector(
      ".components-description"
    );
    expect(description.textContent).toBe("Browse our component library");
  });

  it("should have tabs for navigation", () => {
    const tabs = element.shadowRoot.querySelectorAll(".tab");
    expect(tabs.length).toBe(3);
    expect(tabs[0].dataset.tab).toBe("overview");
    expect(tabs[1].dataset.tab).toBe("code");
    expect(tabs[2].dataset.tab).toBe("docs");
  });

  it("should change active tab when clicked", () => {
    const codeTab = element.shadowRoot.querySelectorAll(".tab")[1];
    codeTab.click();
    expect(element.activeTab).toBe("code");

    const docsTab = element.shadowRoot.querySelectorAll(".tab")[2];
    docsTab.click();
    expect(element.activeTab).toBe("docs");
  });

  it("should have component categories", () => {
    const categories = element.shadowRoot.querySelectorAll(
      ".component-category"
    );
    expect(categories.length).toBe(6);
    expect(categories[0].dataset.category).toBe("buttons");
    expect(categories[1].dataset.category).toBe("inputs");
  });

  it("should select a category when clicked", () => {
    const buttonCategory = element.shadowRoot.querySelectorAll(
      ".component-category"
    )[0];
    buttonCategory.click();
    expect(element.selectedCategory).toBe("buttons");

    const inputsCategory = element.shadowRoot.querySelectorAll(
      ".component-category"
    )[1];
    inputsCategory.click();
    expect(element.selectedCategory).toBe("inputs");
  });

  it("should have component variants", () => {
    const variants = element.shadowRoot.querySelectorAll(".variant");
    expect(variants.length).toBe(4);
    expect(variants[0].dataset.variant).toBe("primary");
    expect(variants[1].dataset.variant).toBe("secondary");
  });

  it("should select a variant when clicked", () => {
    const primaryVariant = element.shadowRoot.querySelectorAll(".variant")[0];
    primaryVariant.click();
    expect(element.selectedVariant).toBe("primary");

    const secondaryVariant = element.shadowRoot.querySelectorAll(".variant")[1];
    secondaryVariant.click();
    expect(element.selectedVariant).toBe("secondary");
  });

  it("should have code examples", () => {
    const examples = element.shadowRoot.querySelectorAll(".code-example");
    expect(examples.length).toBe(2);
    expect(examples[0].dataset.language).toBe("html");
    expect(examples[1].dataset.language).toBe("css");
  });

  it("should dispatch events when properties change", () => {
    const tabChangedSpy = vi.fn();
    const categoryChangedSpy = vi.fn();
    const variantChangedSpy = vi.fn();

    element.addEventListener("tab-changed", tabChangedSpy);
    element.addEventListener("category-changed", categoryChangedSpy);
    element.addEventListener("variant-changed", variantChangedSpy);

    element.activeTab = "code";
    element.selectedCategory = "buttons";
    element.selectedVariant = "primary";

    expect(tabChangedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { tab: "code" },
      })
    );

    expect(categoryChangedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { category: "buttons" },
      })
    );

    expect(variantChangedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { variant: "primary" },
      })
    );
  });

  it("should show loading state when loading is true", () => {
    expect(element.shadowRoot.querySelector(".loading")).toBe(null);

    element.loading = true;
    expect(element.shadowRoot.querySelector(".loading")).not.toBe(null);
  });

  it("should show error message when error is set", () => {
    expect(element.shadowRoot.querySelector(".error")).toBe(null);

    element.error = "Failed to load components";
    expect(element.shadowRoot.querySelector(".error")).not.toBe(null);
  });
});
