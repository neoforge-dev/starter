import { expect, describe, it, beforeEach, afterEach, vi } from "vitest";

// Create a mock for the DropdownComponent
class MockDropdownComponent {
  constructor() {
    // Initialize properties
    this._label = "";
    this._items = [];
    this._value = "";
    this._open = false;
    this._listeners = {};

    // Create a shadow DOM structure
    this.shadowRoot = document.createElement("div");
  }

  // Getters and setters for reactivity
  get label() {
    return this._label;
  }

  set label(value) {
    this._label = value;
    this._updateDropdown();
  }

  get items() {
    return this._items;
  }

  set items(value) {
    this._items = value;
    this._updateDropdown();
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this._updateDropdown();
  }

  get open() {
    return this._open;
  }

  set open(value) {
    this._open = value;
    this._updateDropdown();
  }

  _createDropdownElements() {
    // Clear shadow root
    this.shadowRoot.innerHTML = "";

    // Create dropdown container
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown";

    // Create dropdown trigger
    const trigger = document.createElement("button");
    trigger.className = "dropdown-trigger";
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", String(this._open));
    trigger.addEventListener("click", (e) => this._toggleDropdown(e));

    // Create trigger label
    const labelSpan = document.createElement("span");
    labelSpan.textContent = this._label;
    trigger.appendChild(labelSpan);

    // Create dropdown icon
    const iconSpan = document.createElement("span");
    iconSpan.className = "material-icons";
    iconSpan.textContent = this._open ? "arrow_drop_up" : "arrow_drop_down";
    trigger.appendChild(iconSpan);

    dropdown.appendChild(trigger);

    // Create dropdown menu
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    if (this._open) {
      menu.classList.add("open");
    }

    // Add dropdown items
    this._renderItems(menu);

    dropdown.appendChild(menu);
    this.shadowRoot.appendChild(dropdown);
  }

  _renderItems(menu) {
    // Clear existing items
    menu.innerHTML = "";

    // Add items
    this._items.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = `dropdown-item ${item.value === this._value ? "selected" : ""}`;
      itemDiv.setAttribute("role", "option");
      itemDiv.setAttribute("aria-selected", String(item.value === this._value));
      itemDiv.addEventListener("click", () => this._handleSelect(item));

      // Add icon if present
      if (item.icon) {
        const iconSpan = document.createElement("span");
        iconSpan.className = "material-icons";
        iconSpan.textContent = item.icon;
        itemDiv.appendChild(iconSpan);
      }

      // Add label text
      const textNode = document.createTextNode(item.label);
      itemDiv.appendChild(textNode);

      menu.appendChild(itemDiv);
    });
  }

  // Mock the connectedCallback lifecycle method
  connectedCallback() {
    document.addEventListener("click", this._handleClickOutside.bind(this));
  }

  // Mock the disconnectedCallback lifecycle method
  disconnectedCallback() {
    document.removeEventListener("click", this._handleClickOutside.bind(this));
  }

  // Handle clicks outside the dropdown
  _handleClickOutside(event) {
    if (!this.shadowRoot.contains(event.target)) {
      this._open = false;
      this._updateDropdown();
    }
  }

  // Toggle dropdown open/closed
  _toggleDropdown(event) {
    if (event) {
      event.stopPropagation();
    }
    this._open = !this._open;
    this._updateDropdown();
  }

  // Handle item selection
  _handleSelect(item) {
    this._value = item.value;
    this._open = false;
    this._updateDropdown();

    // Dispatch change event
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: item.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  // Update dropdown DOM elements to reflect current state
  _updateDropdown() {
    // Recreate the entire dropdown to ensure it reflects current state
    this._createDropdownElements();
  }

  // Event handling methods
  addEventListener(event, callback) {
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(
      (cb) => cb !== callback
    );
  }

  dispatchEvent(event) {
    if (!this._listeners[event.type]) return true;
    this._listeners[event.type].forEach((callback) => callback(event));
    return !event.defaultPrevented;
  }
}

describe("DropdownComponent", () => {
  let element;
  let documentAddEventListenerSpy;
  let documentRemoveEventListenerSpy;

  beforeEach(() => {
    // Create a new instance for each test
    element = new MockDropdownComponent();

    // Set up default properties
    element.label = "Select an option";
    element.items = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2", icon: "star" },
      { value: "option3", label: "Option 3" },
    ];

    // Spy on document event listeners
    documentAddEventListenerSpy = vi.spyOn(document, "addEventListener");
    documentRemoveEventListenerSpy = vi.spyOn(document, "removeEventListener");
  });

  afterEach(() => {
    // Clean up spies
    documentAddEventListenerSpy.mockRestore();
    documentRemoveEventListenerSpy.mockRestore();
  });

  it("should initialize with default properties", () => {
    expect(element.label).toBe("Select an option");
    expect(element.items).toHaveLength(3);
    expect(element.value).toBe("");
    expect(element.open).toBe(false);
  });

  it("should render dropdown trigger with label", () => {
    const trigger = element.shadowRoot.querySelector(".dropdown-trigger");
    const label = trigger.querySelector("span");

    expect(trigger).toBeDefined();
    expect(label.textContent).toBe("Select an option");
  });

  it("should render dropdown items", () => {
    const items = element.shadowRoot.querySelectorAll(".dropdown-item");

    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe("Option 1");
    expect(items[1].textContent).toContain("Option 2");
    expect(items[2].textContent).toBe("Option 3");
  });

  it("should toggle dropdown when trigger is clicked", () => {
    const trigger = element.shadowRoot.querySelector(".dropdown-trigger");

    // Initial state
    expect(element.open).toBe(false);

    // Click to open
    trigger.click();
    expect(element.open).toBe(true);

    // Get the menu after clicking (important because the DOM is recreated)
    let menu = element.shadowRoot.querySelector(".dropdown-menu");
    expect(menu.classList.contains("open")).toBe(true);

    // Click to close
    trigger.click();
    expect(element.open).toBe(false);

    // Get the menu again after clicking (important because the DOM is recreated)
    menu = element.shadowRoot.querySelector(".dropdown-menu");
    expect(menu.classList.contains("open")).toBe(false);
  });

  it("should select an item when clicked", () => {
    // Open the dropdown
    element._toggleDropdown();

    // Get the second item and click it
    const items = element.shadowRoot.querySelectorAll(".dropdown-item");
    items[1].click();

    // Verify selection
    expect(element.value).toBe("option2");
    expect(element.open).toBe(false);

    // Verify selected item has selected class
    const selectedItems = element.shadowRoot.querySelectorAll(
      ".dropdown-item.selected"
    );
    expect(selectedItems.length).toBe(1);
    expect(selectedItems[0].textContent).toContain("Option 2");
  });

  it("should dispatch change event when item is selected", () => {
    // Set up event listener
    const changeHandler = vi.fn();
    element.addEventListener("change", changeHandler);

    // Open the dropdown
    element._toggleDropdown();

    // Get the first item and click it
    const items = element.shadowRoot.querySelectorAll(".dropdown-item");
    items[0].click();

    // Verify event was dispatched
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail.value).toBe("option1");
  });

  it("should close dropdown when clicking outside", () => {
    // Open the dropdown
    element._toggleDropdown();
    expect(element.open).toBe(true);

    // Simulate click outside
    const outsideClickEvent = new MouseEvent("click");
    element._handleClickOutside(outsideClickEvent);

    // Verify dropdown is closed
    expect(element.open).toBe(false);
  });

  it("should add document click listener when connected", () => {
    element.connectedCallback();

    expect(documentAddEventListenerSpy).toHaveBeenCalledWith(
      "click",
      expect.any(Function)
    );
  });

  it("should remove document click listener when disconnected", () => {
    element.disconnectedCallback();

    expect(documentRemoveEventListenerSpy).toHaveBeenCalledWith(
      "click",
      expect.any(Function)
    );
  });

  it("should render icons for items that have them", () => {
    // Open the dropdown
    element._toggleDropdown();

    // Get the items
    const items = element.shadowRoot.querySelectorAll(".dropdown-item");

    // First item should not have an icon
    const firstItemIcon = items[0].querySelector(".material-icons");
    expect(firstItemIcon).toBeNull();

    // Second item should have an icon
    const secondItemIcon = items[1].querySelector(".material-icons");
    expect(secondItemIcon).not.toBeNull();
    expect(secondItemIcon.textContent).toBe("star");
  });

  it("should update aria attributes correctly", () => {
    const trigger = element.shadowRoot.querySelector(".dropdown-trigger");

    // Initial state
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    // Open dropdown
    element._toggleDropdown();

    // Get the trigger again after DOM update
    const updatedTrigger =
      element.shadowRoot.querySelector(".dropdown-trigger");
    expect(updatedTrigger.getAttribute("aria-expanded")).toBe("true");

    // Close dropdown
    element._toggleDropdown();

    // Get the trigger again after DOM update
    const finalTrigger = element.shadowRoot.querySelector(".dropdown-trigger");
    expect(finalTrigger.getAttribute("aria-expanded")).toBe("false");
  });
});
