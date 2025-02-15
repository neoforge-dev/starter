import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../../components/atoms/select/select.js";

describe("NeoSelect", () => {
  let element;
  const basicOptions = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ];

  beforeEach(async () => {
    element = await fixture(html`
      <neo-select .options="${basicOptions}" label="Test Select"></neo-select>
    `);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.value).to.equal("");
    expect(element.multiple).to.be.false;
    expect(element.searchable).to.be.false;
    expect(element.disabled).to.be.false;
    expect(element.required).to.be.false;
    expect(element.label).to.equal("Test Select");
  });

  it("reflects attribute changes", async () => {
    element.value = "1";
    element.multiple = true;
    element.searchable = true;
    element.disabled = true;
    element.required = true;
    await element.updateComplete;

    expect(element.value).to.equal("1");
    expect(element.multiple).to.be.true;
    expect(element.searchable).to.be.true;
    expect(element.disabled).to.be.true;
    expect(element.required).to.be.true;
  });

  it("handles single selection", async () => {
    const trigger = element.shadowRoot.querySelector(".select-trigger");
    trigger.click();
    await element.updateComplete;

    const option = element.shadowRoot.querySelector(".option");
    option.click();
    await element.updateComplete;

    expect(element.value).to.equal("1");
    expect(
      element.shadowRoot.querySelector(".selected-value").textContent.trim()
    ).to.equal("Option 1");
  });

  it("handles multiple selection", async () => {
    element.multiple = true;
    await element.updateComplete;

    const trigger = element.shadowRoot.querySelector(".select-trigger");
    trigger.click();
    await element.updateComplete;

    const options = element.shadowRoot.querySelectorAll(".option");
    options[0].click();
    options[1].click();
    await element.updateComplete;

    expect(element.value).to.deep.equal(["1", "2"]);
  });

  it("supports search functionality", async () => {
    element.searchable = true;
    await element.updateComplete;

    const trigger = element.shadowRoot.querySelector(".select-trigger");
    trigger.click();
    await element.updateComplete;

    const searchInput = element.shadowRoot.querySelector(".search-input");
    expect(searchInput).to.exist;

    searchInput.value = "Option 1";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const visibleOptions = element.shadowRoot.querySelectorAll(
      ".option:not(.hidden)"
    );
    expect(visibleOptions.length).to.equal(1);
  });

  it("handles keyboard navigation", async () => {
    const trigger = element.shadowRoot.querySelector(".select-trigger");
    trigger.click();
    await element.updateComplete;

    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    await element.updateComplete;
    expect(element.shadowRoot.activeElement).to.exist;

    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await element.updateComplete;
    expect(element.value).to.equal("1");
  });

  it("closes dropdown when clicking outside", async () => {
    const trigger = element.shadowRoot.querySelector(".select-trigger");
    trigger.click();
    await element.updateComplete;
    expect(
      element.shadowRoot.querySelector(".dropdown").classList.contains("open")
    ).to.be.true;

    document.body.click();
    await element.updateComplete;
    expect(
      element.shadowRoot.querySelector(".dropdown").classList.contains("open")
    ).to.be.false;
  });

  it("handles option groups", async () => {
    const groupedOptions = [
      {
        group: true,
        label: "Group 1",
        options: [
          { value: "1", label: "Option 1" },
          { value: "2", label: "Option 2" },
        ],
      },
    ];

    element.options = groupedOptions;
    await element.updateComplete;

    const trigger = element.shadowRoot.querySelector(".select-trigger");
    trigger.click();
    await element.updateComplete;

    const group = element.shadowRoot.querySelector(".option-group");
    expect(group).to.exist;
    expect(group.querySelector(".group-label").textContent.trim()).to.equal(
      "Group 1"
    );
  });

  it("handles accessibility requirements", async () => {
    const trigger = element.shadowRoot.querySelector(".select-trigger");
    expect(trigger.getAttribute("role")).to.equal("combobox");
    expect(trigger.getAttribute("aria-expanded")).to.equal("false");
    expect(trigger.getAttribute("aria-haspopup")).to.equal("listbox");

    trigger.click();
    await element.updateComplete;

    const listbox = element.shadowRoot.querySelector(".dropdown");
    expect(listbox.getAttribute("role")).to.equal("listbox");
    expect(trigger.getAttribute("aria-expanded")).to.equal("true");
  });

  it("dispatches change events", async () => {
    let eventFired = false;
    let eventDetail = null;

    element.addEventListener("neo-change", (e) => {
      eventFired = true;
      eventDetail = e.detail;
    });

    const trigger = element.shadowRoot.querySelector(".select-trigger");
    trigger.click();
    await element.updateComplete;

    const option = element.shadowRoot.querySelector(".option");
    option.click();
    await element.updateComplete;

    expect(eventFired).to.be.true;
    expect(eventDetail.value).to.equal("1");
  });
});
