import { describe, it, expect, beforeEach } from "vitest";
import { fixture, html, oneEvent } from "@open-wc/testing-helpers";
import "./table.js";

describe("NeoTable", () => {
  const columns = [
    { key: "id", label: "ID", sortable: true, filterable: true },
    { key: "name", label: "Name", sortable: true, filterable: true },
    { key: "age", label: "Age", sortable: true, filterable: true },
  ];

  const data = [
    { id: 1, name: "John Doe", age: 30 },
    { id: 2, name: "Jane Smith", age: 25 },
    { id: 3, name: "Bob Johnson", age: 35 },
  ];

  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <neo-table
        .columns=${columns}
        .data=${data}
        sortable
        filterable
        paginated
        selectable
      ></neo-table>
    `);
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.shadowRoot.querySelector("table")).to.exist;
  });

  it("displays empty message when no data", async () => {
    element.data = [];
    await element.updateComplete;

    const emptyMessage = element.shadowRoot.querySelector(".empty-message");
    expect(emptyMessage).to.exist;
    expect(emptyMessage.textContent).to.equal("No data available");
  });

  it("renders correct number of rows", async () => {
    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    expect(rows.length).to.equal(data.length);
  });

  it("renders correct number of columns", async () => {
    const headerCells = element.shadowRoot.querySelectorAll(
      "thead tr:first-child th"
    );
    // +1 for checkbox column when selectable
    expect(headerCells.length).to.equal(columns.length + 1);
  });

  it("sorts data when clicking sortable column", async () => {
    const nameHeader = element.shadowRoot.querySelector("th:nth-child(3)");

    // First click - sort ascending
    nameHeader.click();
    await element.updateComplete;

    let cells = element.shadowRoot.querySelectorAll("tbody tr td:nth-child(3)");
    expect(cells[0].textContent).to.equal("Bob Johnson");

    // Second click - sort descending
    nameHeader.click();
    await element.updateComplete;

    cells = element.shadowRoot.querySelectorAll("tbody tr td:nth-child(3)");
    expect(cells[0].textContent).to.equal("John Doe");
  });

  it("filters data when entering filter text", async () => {
    element.data = [...data];
    await element.updateComplete;

    const filterInput = element.shadowRoot.querySelector(
      "tr.filter-row th:nth-child(3) input.filter-input"
    );
    expect(filterInput, "Filter input should exist").to.exist;
    filterInput.value = "Bob";
    filterInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    expect(rows.length).to.equal(1);
  });

  it("selects rows when clicking checkboxes", async () => {
    const checkbox = element.shadowRoot.querySelector(
      "tbody tr:first-child input[type='checkbox']"
    );
    checkbox.click();
    await element.updateComplete;

    expect(element.selected).to.include(1);
    expect(
      element.shadowRoot
        .querySelector("tbody tr:first-child")
        .classList.contains("selected")
    ).to.be.true;
  });

  it("selects all rows when clicking header checkbox", async () => {
    const headerCheckbox = element.shadowRoot.querySelector(
      "thead input[type='checkbox']"
    );
    headerCheckbox.click();
    await element.updateComplete;

    expect(element.selected.length).to.equal(data.length);
    expect(element._allSelected).to.be.true;
  });

  it("paginates data correctly", async () => {
    element.pageSize = 2;
    await element.updateComplete;

    let rows = element.shadowRoot.querySelectorAll("tbody tr");
    expect(rows.length).to.equal(2);

    const pageButtons = element.shadowRoot.querySelectorAll(
      ".pagination .page-controls button"
    );
    const nextButton = Array.from(pageButtons).find(
      (btn) =>
        btn.querySelector("span.material-icons")?.textContent.trim() ===
        "chevron_right"
    );
    expect(nextButton, "Next button should exist for pagination").to.exist;
    nextButton.click();
    await element.updateComplete;

    rows = element.shadowRoot.querySelectorAll("tbody tr");
    expect(rows.length).to.equal(1);
  });

  it("dispatches neo-sort event when sorting", async () => {
    const nameHeader = element.shadowRoot.querySelector("th:nth-child(3)");

    setTimeout(() => nameHeader.click());
    const { detail } = await oneEvent(element, "neo-sort");

    expect(detail).to.deep.equal({
      column: "name",
      direction: "asc",
    });
  });

  it("dispatches neo-filter event when filtering", async () => {
    const filterInput = element.shadowRoot.querySelector(".filter-input");

    setTimeout(() => {
      filterInput.value = "John";
      filterInput.dispatchEvent(new Event("input"));
    });

    const { detail } = await oneEvent(element, "neo-filter");
    expect(detail.filters).to.have.property("id", "John");
  });

  it("dispatches neo-select event when selecting rows", async () => {
    const checkbox = element.shadowRoot.querySelector(
      "tbody tr:first-child input[type='checkbox']"
    );

    setTimeout(() => checkbox.click());
    const { detail } = await oneEvent(element, "neo-select");

    expect(detail.selected).to.deep.equal([1]);
  });

  it("dispatches neo-page event when changing pages", async () => {
    const largeData = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `User ${String.fromCharCode(65 + i)}`,
      age: 20 + i,
    }));
    element.data = largeData;
    element.pageSize = 5;
    await element.updateComplete;

    const paginationControls = element.shadowRoot.querySelector(
      ".pagination .page-controls"
    );
    expect(paginationControls, "Pagination controls should exist").to.exist;

    const pageButtonsPageEvent = paginationControls.querySelectorAll("button");
    const nextButtonPageEvent = Array.from(pageButtonsPageEvent).find(
      (btn) =>
        btn.querySelector("span.material-icons")?.textContent.trim() ===
        "chevron_right"
    );
    expect(nextButtonPageEvent, "Next button should exist").to.exist;
    expect(nextButtonPageEvent.disabled).to.be.false;

    const eventPromise = oneEvent(element, "neo-page");
    nextButtonPageEvent.click();
    const { detail } = await eventPromise;

    expect(detail.page).to.equal(2);
  });

  it("handles complex data with multiple filters and sorts", async () => {
    element.data = [...data];
    await element.updateComplete;

    const filterInput = element.shadowRoot.querySelector(
      "tr.filter-row th:nth-child(3) input.filter-input"
    );
    expect(filterInput).to.exist;
    filterInput.value = "e";
    filterInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const nameHeader = element.shadowRoot.querySelector(
      "thead tr:first-child th:nth-child(3)"
    );
    expect(nameHeader).to.exist;
    nameHeader.click(); // Sort asc
    await element.updateComplete;

    const rows = element.shadowRoot.querySelectorAll("tbody tr");

    // Log actual rows for debugging
    const renderedNames = Array.from(rows).map(
      (row) => row.querySelector("td:nth-child(3)")?.textContent
    );
    console.log("DEBUG Complex Filter/Sort Rows:", renderedNames);

    expect(rows.length).to.equal(2);

    const cells = element.shadowRoot.querySelectorAll(
      "tbody tr td:nth-child(3)"
    ); // Name cells
    expect(cells[0]?.textContent).to.equal("Jane Smith");
    expect(cells[1]?.textContent).to.equal("John Doe");
  });

  it("maintains selection state across pages", async () => {
    element.pageSize = 2;
    await element.updateComplete;

    const checkbox = element.shadowRoot.querySelector(
      "tbody tr:first-child input[type='checkbox']"
    );
    checkbox.click();
    await element.updateComplete;

    const pageButtonsSelect = element.shadowRoot.querySelectorAll(
      ".pagination .page-controls button"
    );
    const nextButtonSelect = Array.from(pageButtonsSelect).find(
      (btn) =>
        btn.querySelector("span.material-icons")?.textContent.trim() ===
        "chevron_right"
    );
    expect(nextButtonSelect, "Next button should exist for selection test").to
      .exist;
    nextButtonSelect.click();
    await element.updateComplete;

    const prevButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(2)"
    );
    prevButton.click();
    await element.updateComplete;

    const firstRow = element.shadowRoot.querySelector("tbody tr:first-child");
    expect(firstRow.classList.contains("selected")).to.be.true;
  });

  it("updates page info text correctly", async () => {
    element.data = [...data];
    element.pageSize = 2;
    await element.updateComplete; // Add await after setting data

    const pageInfo = element.shadowRoot.querySelector(".pagination .page-info");
    expect(pageInfo, "Page info element should exist").to.exist;
    const normalize = (str) => str.replace(/\s+/g, " ").trim();

    // Log lengths again after explicit set + await
    console.log(
      "DEBUG PageInfo: filteredData.length =",
      element.filteredData.length
    );
    console.log("DEBUG PageInfo: data.length =", element.data.length);

    // Expect based on 5 entries now
    expect(normalize(pageInfo.textContent)).to.equal(
      "Showing 1 to 2 of 3 entries"
    );

    const pageButtonsInfo = element.shadowRoot.querySelectorAll(
      ".pagination .page-controls button"
    );
    const nextButtonInfo = Array.from(pageButtonsInfo).find(
      (btn) =>
        btn.querySelector("span.material-icons")?.textContent.trim() ===
        "chevron_right"
    );
    expect(nextButtonInfo).to.exist;
    nextButtonInfo.click();
    await element.updateComplete;

    expect(normalize(pageInfo.textContent)).to.equal(
      "Showing 3 to 3 of 3 entries"
    );
  });
});
