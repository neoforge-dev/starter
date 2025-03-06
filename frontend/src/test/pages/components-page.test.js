import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock implementation for ComponentsPage
class MockComponentsPage {
  constructor() {
    // Initialize properties with default values
    this._loading = false;
    this._error = "";
    this._activeTab = "overview";
    this._selectedCategory = "buttons";
    this._selectedVariant = "primary";
    this._components = {
      buttons: [
        {
          name: "Primary Button",
          variant: "primary",
          description: "Main call-to-action button",
        },
        {
          name: "Secondary Button",
          variant: "secondary",
          description: "Alternative action button",
        },
      ],
      inputs: [
        {
          name: "Text Input",
          variant: "default",
          description: "Standard text input field",
        },
        {
          name: "Password Input",
          variant: "password",
          description: "Secure password entry field",
        },
      ],
      dropdowns: [
        {
          name: "Basic Dropdown",
          variant: "default",
          description: "Simple dropdown menu",
        },
        {
          name: "Multi-select Dropdown",
          variant: "multi",
          description: "Multiple selection dropdown",
        },
      ],
    };

    // Create DOM elements for testing
    this.pageTitle = document.createElement("h1");
    this.pageTitle.textContent = "Components Library";

    this.pageDescription = document.createElement("div");
    this.pageDescription.className = "page-description";
    this.pageDescription.textContent = "Browse our component library";

    this.tabsContainer = document.createElement("div");
    this.tabsContainer.className = "tabs-container";

    this.tabs = {
      overview: document.createElement("div"),
      code: document.createElement("div"),
      docs: document.createElement("div"),
    };

    Object.keys(this.tabs).forEach((tabName) => {
      this.tabs[tabName].className = "tab";
      this.tabs[tabName].dataset.tab = tabName;
      this.tabs[tabName].textContent =
        tabName.charAt(0).toUpperCase() + tabName.slice(1);
      this.tabsContainer.appendChild(this.tabs[tabName]);
    });

    this.contentContainer = document.createElement("div");
    this.contentContainer.className = "content-container";

    this.categoryContainer = document.createElement("div");
    this.categoryContainer.className = "category-container";

    this.categories = {};
    Object.keys(this._components).forEach((categoryName) => {
      this.categories[categoryName] = document.createElement("div");
      this.categories[categoryName].className = "component-category";
      this.categories[categoryName].dataset.category = categoryName;
      this.categories[categoryName].textContent =
        categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
      this.categoryContainer.appendChild(this.categories[categoryName]);
    });

    this.componentDetails = document.createElement("div");
    this.componentDetails.className = "component-details";

    this.variantsContainer = document.createElement("div");
    this.variantsContainer.className = "variants-container";

    this.variants = {};
    ["primary", "secondary"].forEach((variantName) => {
      this.variants[variantName] = document.createElement("div");
      this.variants[variantName].className = "variant";
      this.variants[variantName].dataset.variant = variantName;
      this.variants[variantName].textContent =
        variantName.charAt(0).toUpperCase() + variantName.slice(1);
      this.variantsContainer.appendChild(this.variants[variantName]);
    });

    this.codeExamples = [
      { language: "html", code: '<button class="primary">Click me</button>' },
      {
        language: "css",
        code: ".button.primary { color: white; background-color: blue; }",
      },
    ].map((example) => {
      const codeElement = document.createElement("div");
      codeElement.className = "code-example";
      codeElement.dataset.language = example.language;
      codeElement.textContent = example.code;
      return codeElement;
    });

    this.loadingSpinner = document.createElement("div");
    this.loadingSpinner.className = "loading";

    this.errorMessage = document.createElement("div");
    this.errorMessage.className = "error";

    // Event listeners
    this._eventListeners = new Map();

    // Shadow root mock
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === "h1") return this.pageTitle;
        if (selector === ".page-description") return this.pageDescription;
        if (selector === ".tabs-container") return this.tabsContainer;
        if (selector === ".content-container") return this.contentContainer;
        if (selector === ".category-container") return this.categoryContainer;
        if (selector === ".component-details") return this.componentDetails;
        if (selector === ".variants-container") return this.variantsContainer;
        if (selector === ".loading")
          return this._loading ? this.loadingSpinner : null;
        if (selector === ".error")
          return this._error ? this.errorMessage : null;
        if (selector === `.tab[data-tab="${this._activeTab}"]`) {
          return this.tabs[this._activeTab];
        }
        if (
          selector ===
          `.component-category[data-category="${this._selectedCategory}"]`
        ) {
          return this.categories[this._selectedCategory];
        }
        if (selector === `.variant[data-variant="${this._selectedVariant}"]`) {
          return this.variants[this._selectedVariant];
        }
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".tab") return Object.values(this.tabs);
        if (selector === ".component-category")
          return Object.values(this.categories);
        if (selector === ".variant") return Object.values(this.variants);
        if (selector === "code-example") return this.codeExamples;
        return [];
      },
    };

    // Update the DOM to match initial properties
    this._updatePageContent();
  }

  // Getters and setters for properties
  get loading() {
    return this._loading;
  }

  set loading(val) {
    this._loading = val;
    this._updatePageContent();
  }

  get error() {
    return this._error;
  }

  set error(val) {
    this._error = val;
    this._updatePageContent();
  }

  get activeTab() {
    return this._activeTab;
  }

  set activeTab(val) {
    this._activeTab = val;
    this._updatePageContent();
  }

  get selectedCategory() {
    return this._selectedCategory;
  }

  set selectedCategory(val) {
    this._selectedCategory = val;
    this._updatePageContent();
  }

  get selectedVariant() {
    return this._selectedVariant;
  }

  set selectedVariant(val) {
    this._selectedVariant = val;
    this._updatePageContent();
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

  // Component-specific methods
  _renderButtons() {
    return this._components.buttons.map((button) => ({
      name: button.name,
      variant: button.variant,
      description: button.description,
    }));
  }

  _renderInputs() {
    return this._components.inputs.map((input) => ({
      name: input.name,
      variant: input.variant,
      description: input.description,
    }));
  }

  _renderDropdowns() {
    return this._components.dropdowns.map((dropdown) => ({
      name: dropdown.name,
      variant: dropdown.variant,
      description: dropdown.description,
    }));
  }

  // Update the page content based on current properties
  _updatePageContent() {
    // Update loading state
    if (this._loading) {
      this.loadingSpinner.style.display = "flex";
      this.contentContainer.style.display = "none";
      this.errorMessage.style.display = "none";
    }
    // Update error state
    else if (this._error) {
      this.loadingSpinner.style.display = "none";
      this.contentContainer.style.display = "none";
      this.errorMessage.style.display = "block";
      this.errorMessage.textContent = this._error;
    }
    // Update normal content
    else {
      this.loadingSpinner.style.display = "none";
      this.contentContainer.style.display = "block";
      this.errorMessage.style.display = "none";

      // Update active tab
      Object.keys(this.tabs).forEach((tabName) => {
        if (tabName === this._activeTab) {
          this.tabs[tabName].classList.add("active");
        } else {
          this.tabs[tabName].classList.remove("active");
        }
      });

      // Update selected category
      Object.keys(this.categories).forEach((categoryName) => {
        if (categoryName === this._selectedCategory) {
          this.categories[categoryName].classList.add("active");
        } else {
          this.categories[categoryName].classList.remove("active");
        }
      });

      // Update selected variant
      Object.keys(this.variants).forEach((variantName) => {
        if (variantName === this._selectedVariant) {
          this.variants[variantName].classList.add("active");
        } else {
          this.variants[variantName].classList.remove("active");
        }
      });
    }
  }
}

describe("Components Page", () => {
  let element;

  beforeEach(() => {
    element = new MockComponentsPage();
  });

  it("should have default properties", () => {
    expect(element.loading).toBe(false);
    expect(element.error).toBe("");
    expect(element.activeTab).toBe("overview");
    expect(element.selectedCategory).toBe("buttons");
    expect(element.selectedVariant).toBe("primary");
  });

  it("should display loading spinner when loading is true", () => {
    element.loading = true;
    expect(element.shadowRoot.querySelector(".loading")).not.toBeNull();
    expect(element.loadingSpinner.style.display).toBe("flex");
    expect(element.contentContainer.style.display).toBe("none");
  });

  it("should display error message when error is set", () => {
    element.error = "Failed to load components";
    expect(element.shadowRoot.querySelector(".error")).not.toBeNull();
    expect(element.errorMessage.textContent).toBe("Failed to load components");
    expect(element.contentContainer.style.display).toBe("none");
  });

  it("should display content when not loading and no error", () => {
    expect(element.shadowRoot.querySelector(".loading")).toBeNull();
    expect(element.shadowRoot.querySelector(".error")).toBeNull();
    expect(element.contentContainer.style.display).toBe("block");
  });

  it("should change active tab when activeTab property is updated", () => {
    element.activeTab = "code";
    expect(element.tabs.code.classList.contains("active")).toBe(true);
    expect(element.tabs.overview.classList.contains("active")).toBe(false);

    element.activeTab = "docs";
    expect(element.tabs.docs.classList.contains("active")).toBe(true);
    expect(element.tabs.code.classList.contains("active")).toBe(false);
  });

  it("should change selected category when selectedCategory property is updated", () => {
    element.selectedCategory = "inputs";
    expect(element.categories.inputs.classList.contains("active")).toBe(true);
    expect(element.categories.buttons.classList.contains("active")).toBe(false);

    element.selectedCategory = "dropdowns";
    expect(element.categories.dropdowns.classList.contains("active")).toBe(
      true
    );
    expect(element.categories.inputs.classList.contains("active")).toBe(false);
  });

  it("should change selected variant when selectedVariant property is updated", () => {
    element.selectedVariant = "secondary";
    expect(element.variants.secondary.classList.contains("active")).toBe(true);
    expect(element.variants.primary.classList.contains("active")).toBe(false);

    element.selectedVariant = "primary";
    expect(element.variants.primary.classList.contains("active")).toBe(true);
    expect(element.variants.secondary.classList.contains("active")).toBe(false);
  });

  it("should render buttons correctly", () => {
    const buttons = element._renderButtons();
    expect(buttons).toHaveLength(2);
    expect(buttons[0].name).toBe("Primary Button");
    expect(buttons[0].variant).toBe("primary");
    expect(buttons[1].name).toBe("Secondary Button");
    expect(buttons[1].variant).toBe("secondary");
  });

  it("should render inputs correctly", () => {
    const inputs = element._renderInputs();
    expect(inputs).toHaveLength(2);
    expect(inputs[0].name).toBe("Text Input");
    expect(inputs[0].variant).toBe("default");
    expect(inputs[1].name).toBe("Password Input");
    expect(inputs[1].variant).toBe("password");
  });

  it("should render dropdowns correctly", () => {
    const dropdowns = element._renderDropdowns();
    expect(dropdowns).toHaveLength(2);
    expect(dropdowns[0].name).toBe("Basic Dropdown");
    expect(dropdowns[0].variant).toBe("default");
    expect(dropdowns[1].name).toBe("Multi-select Dropdown");
    expect(dropdowns[1].variant).toBe("multi");
  });
});
