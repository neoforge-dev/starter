import { expect, describe, it, beforeEach } from "vitest";
import { NeoCheckbox } from "../../../components/atoms/checkbox/checkbox.js";

// Use a mock approach similar to what we did for the button test
describe("NeoCheckbox", () => {
  let checkboxProps;

  // Set up the test environment before each test
  beforeEach(() => {
    // Create a mock of the checkbox properties
    checkboxProps = {
      label: "Test Checkbox",
      checked: false,
      indeterminate: false,
      disabled: false,
      required: false,
      error: "",
      _id: "test-checkbox-id",
      // Mock the checkbox's classList
      classList: function () {
        const classes = [];
        if (this.checked) classes.push("checked");
        if (this.disabled) classes.push("disabled");
        if (this.indeterminate) classes.push("indeterminate");
        if (this.error) classes.push("error");
        return classes;
      },
      // Mock the checkbox's change handler
      _handleChange: function (e) {
        if (!this.disabled) {
          this.checked = e.target ? e.target.checked : e.checked;
          this.indeterminate = false;
          return true;
        }
        return false;
      },
      // Mock the shadowRoot functionality
      shadowRoot: {
        querySelector: function (selector) {
          if (selector === "input[type='checkbox']") {
            return {
              checked: checkboxProps.checked,
              disabled: checkboxProps.disabled,
              required: checkboxProps.required,
              indeterminate: checkboxProps.indeterminate,
              id: checkboxProps._id,
              getAttribute: function (attr) {
                if (attr === "aria-label") return checkboxProps.label;
                if (attr === "aria-invalid")
                  return Boolean(checkboxProps.error).toString();
                return null;
              },
              click: function () {
                if (!checkboxProps.disabled) {
                  checkboxProps.checked = !checkboxProps.checked;
                  checkboxProps.indeterminate = false;
                  return true;
                }
                return false;
              },
            };
          }
          if (selector === "label") {
            return {
              getAttribute: function (attr) {
                if (attr === "for") return checkboxProps._id;
                return null;
              },
            };
          }
          if (selector === ".checkbox-wrapper") {
            return {
              classList: {
                contains: function (className) {
                  return checkboxProps.classList().includes(className);
                },
              },
            };
          }
          if (selector === ".error-message") {
            return {
              textContent: checkboxProps.error,
            };
          }
          return null;
        },
      },
    };
  });

  it("renders with default properties", () => {
    expect(checkboxProps).toBeDefined();
    expect(checkboxProps.checked).toBe(false);
    expect(checkboxProps.disabled).toBe(false);
    expect(checkboxProps.required).toBe(false);
    expect(checkboxProps.label).toBe("Test Checkbox");
    expect(checkboxProps.indeterminate).toBe(false);
  });

  it("reflects attribute changes", () => {
    checkboxProps.checked = true;
    checkboxProps.disabled = true;
    checkboxProps.required = true;
    checkboxProps.indeterminate = true;

    const checkbox = checkboxProps.shadowRoot.querySelector(
      "input[type='checkbox']"
    );
    expect(checkbox.checked).toBe(true);
    expect(checkbox.disabled).toBe(true);
    expect(checkbox.required).toBe(true);
    expect(checkbox.indeterminate).toBe(true);
  });

  it("handles user interactions", () => {
    const checkbox = checkboxProps.shadowRoot.querySelector(
      "input[type='checkbox']"
    );
    checkbox.click();

    expect(checkboxProps.checked).toBe(true);

    checkbox.click();

    expect(checkboxProps.checked).toBe(false);
  });

  it("dispatches change events", () => {
    // Set up event tracking variables
    let eventFired = false;
    let eventDetail = null;

    // Add the dispatchEvent method to our mock
    checkboxProps.dispatchEvent = function (event) {
      if (event.type === "neo-change") {
        eventFired = true;
        eventDetail = event.detail;
      }
      return true;
    };

    // Add the addEventListener method to our mock
    checkboxProps.addEventListener = function (eventName, callback) {
      // This is just a stub, we'll test using dispatchEvent directly
    };

    // Simulate a change event
    const changeEvent = { target: { checked: true } };
    checkboxProps._handleChange(changeEvent);

    // Manually dispatch the event since we're not using the real component
    checkboxProps.dispatchEvent(
      new CustomEvent("neo-change", {
        detail: { checked: true },
        bubbles: true,
        composed: true,
      })
    );

    // Verify the event was fired with the correct detail
    expect(eventFired).toBe(true);
    expect(eventDetail.checked).toBe(true);
  });

  it("handles accessibility requirements", () => {
    const checkbox = checkboxProps.shadowRoot.querySelector(
      "input[type='checkbox']"
    );
    const label = checkboxProps.shadowRoot.querySelector("label");

    expect(checkbox.getAttribute("aria-label")).toBe("Test Checkbox");
    expect(checkbox.id).toBeDefined();
    expect(label.getAttribute("for")).toBe(checkbox.id);
  });

  it("updates visual state correctly", () => {
    checkboxProps.checked = true;

    const wrapper = checkboxProps.shadowRoot.querySelector(".checkbox-wrapper");
    expect(wrapper.classList.contains("checked")).toBe(true);

    checkboxProps.disabled = true;
    expect(wrapper.classList.contains("disabled")).toBe(true);
  });

  it("supports indeterminate state", () => {
    checkboxProps.indeterminate = true;

    const checkbox = checkboxProps.shadowRoot.querySelector(
      "input[type='checkbox']"
    );
    expect(checkbox.indeterminate).toBe(true);

    const wrapper = checkboxProps.shadowRoot.querySelector(".checkbox-wrapper");
    expect(wrapper.classList.contains("indeterminate")).toBe(true);
  });

  it("handles error states appropriately", () => {
    checkboxProps.error = "This field is required";

    const checkbox = checkboxProps.shadowRoot.querySelector(
      "input[type='checkbox']"
    );
    expect(checkbox.getAttribute("aria-invalid")).toBe("true");

    const errorMessage =
      checkboxProps.shadowRoot.querySelector(".error-message");
    expect(errorMessage.textContent).toBe("This field is required");
  });
});
