import { describe, it, expect, beforeEach } from "vitest";
import { fixture, html, oneEvent } from "@open-wc/testing-helpers";
import "../../../components/organisms/table/table.js";

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
    // Get the filter input for the name column (second column, index 1)
    const filterInputs = element.shadowRoot.querySelectorAll(".filter-input");
    const nameFilterInput = filterInputs[1]; // The second filter input (for the name column)
    console.log("Filter inputs:", filterInputs.length);

    if (nameFilterInput) {
      nameFilterInput.value = "Jane";
      nameFilterInput.dispatchEvent(new Event("input"));

      await element.updateComplete;

      console.log("Filters:", element._filters);
      console.log("Visible data:", element.visibleData);

      const rows = element.shadowRoot.querySelectorAll("tbody tr");
      console.log("Rows:", rows.length);
      expect(rows.length).to.equal(1);
    } else {
      console.error("Name filter input not found");
      expect.fail("Name filter input not found");
    }
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

    const nextButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(4)"
    );
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
    element.pageSize = 2;
    await element.updateComplete;

    const nextButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(4)"
    );

    setTimeout(() => nextButton.click());
    const { detail } = await oneEvent(element, "neo-page");

    expect(detail.page).to.equal(2);
  });

  it("handles complex data with multiple filters and sorts", async () => {
    // Apply filter to the name column
    const filterInputs = element.shadowRoot.querySelectorAll(".filter-input");
    const nameFilterInput = filterInputs[1]; // The second filter input (for the name column)

    nameFilterInput.value = "o";
    nameFilterInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    console.log("Complex test - Filters:", element._filters);
    console.log("Complex test - Visible data:", element.visibleData);

    // Apply sort
    const nameHeader = element.shadowRoot.querySelector("th:nth-child(3)");
    nameHeader.click();
    await element.updateComplete;

    console.log(
      "Complex test - After sort - Visible data:",
      element.visibleData
    );

    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    console.log("Complex test - Rows:", rows.length);
    expect(rows.length).to.equal(2); // Should show both "John Doe" and "Bob Johnson"
  });

  it("maintains selection state across pages", async () => {
    element.pageSize = 2;
    await element.updateComplete;

    // Select first row
    const checkbox = element.shadowRoot.querySelector(
      "tbody tr:first-child input[type='checkbox']"
    );
    checkbox.click();
    await element.updateComplete;

    // Go to next page
    const nextButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(4)"
    );
    nextButton.click();
    await element.updateComplete;

    // Go back to first page
    const prevButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(2)"
    );
    prevButton.click();
    await element.updateComplete;

    // Check if selection is maintained
    const firstRow = element.shadowRoot.querySelector("tbody tr:first-child");
    expect(firstRow.classList.contains("selected")).to.be.true;
  });

  it("updates page info text correctly", async () => {
    element.pageSize = 2;
    await element.updateComplete;

    const pageInfo = element.shadowRoot.querySelector(".page-info");
    const normalizedText = pageInfo.textContent.replace(/\s+/g, " ").trim();
    expect(normalizedText).to.equal("Showing 1 to 2 of 3 entries");

    const nextButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(4)"
    );
    nextButton.click();
    await element.updateComplete;

    const normalizedText2 = pageInfo.textContent.replace(/\s+/g, " ").trim();
    expect(normalizedText2).to.equal("Showing 3 to 3 of 3 entries");
  });
});
