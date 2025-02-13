import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/organisms/data-table/data-table.js";

const sampleData = [
  { id: 1, name: "John Doe", age: 30, email: "john@example.com" },
  { id: 2, name: "Jane Smith", age: 25, email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", age: 35, email: "bob@example.com" },
];

const columns = [
  { field: "name", header: "Name", sortable: true },
  { field: "age", header: "Age", sortable: true },
  { field: "email", header: "Email" },
];

describe("NeoDataTable", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <neo-data-table
        .data="\${sampleData}"
        .columns="\${columns}"
      ></neo-data-table>
    `);
  });

  it("renders with default properties", () => {
    expect(element.data).to.deep.equal(sampleData);
    expect(element.columns).to.deep.equal(columns);
    expect(element.sortable).to.be.true;
    expect(element.filterable).to.be.true;
    expect(element.selectable).to.be.false;
    expect(element.pageSize).to.equal(10);
    expect(element.currentPage).to.equal(1);
  });

  it("renders correct number of rows and columns", async () => {
    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    const headerCells = element.shadowRoot.querySelectorAll("thead th");

    expect(rows.length).to.equal(sampleData.length);
    expect(headerCells.length).to.equal(columns.length);
  });

  it("handles sorting on column click", async () => {
    const nameHeader = element.shadowRoot.querySelector(
      'th[data-field="name"]'
    );
    const sortPromise = oneEvent(element, "sort-change");

    nameHeader.click();
    const event = await sortPromise;

    expect(event.detail.field).to.equal("name");
    expect(event.detail.direction).to.equal("asc");

    // Click again for descending sort
    const sortPromise2 = oneEvent(element, "sort-change");
    nameHeader.click();
    const event2 = await sortPromise2;

    expect(event2.detail.field).to.equal("name");
    expect(event2.detail.direction).to.equal("desc");
  });

  it("handles row selection", async () => {
    element.selectable = true;
    await element.updateComplete;

    const firstRow = element.shadowRoot.querySelector("tbody tr");
    const selectionPromise = oneEvent(element, "selection-change");

    firstRow.click();
    const event = await selectionPromise;

    expect(event.detail.selected).to.deep.equal([sampleData[0]]);
    expect(firstRow).to.have.class("selected");
  });

  it("handles multiple row selection", async () => {
    element.selectable = true;
    element.multiSelect = true;
    await element.updateComplete;

    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    const selectionPromise = oneEvent(element, "selection-change");

    // Hold Ctrl/Cmd key for multi-select
    rows[0].click();
    rows[1].dispatchEvent(new MouseEvent("click", { ctrlKey: true }));

    const event = await selectionPromise;
    expect(event.detail.selected).to.deep.equal([sampleData[0], sampleData[1]]);
  });

  it("handles filtering", async () => {
    const filterInput = element.shadowRoot.querySelector(".filter-input");
    const filterPromise = oneEvent(element, "filter-change");

    filterInput.value = "John";
    filterInput.dispatchEvent(new Event("input"));

    const event = await filterPromise;
    expect(event.detail.filter).to.equal("John");

    await element.updateComplete;
    const visibleRows = element.shadowRoot.querySelectorAll(
      "tbody tr:not(.hidden)"
    );
    expect(visibleRows.length).to.equal(1);
  });

  it("handles pagination", async () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Person ${i + 1}`,
      age: 20 + i,
      email: `person${i + 1}@example.com`,
    }));

    element.data = largeData;
    element.pageSize = 10;
    await element.updateComplete;

    expect(element.totalPages).to.equal(3);
    expect(element.shadowRoot.querySelectorAll("tbody tr").length).to.equal(10);

    const pageChangePromise = oneEvent(element, "page-change");
    element.currentPage = 2;
    const event = await pageChangePromise;

    expect(event.detail.page).to.equal(2);
    expect(event.detail.pageSize).to.equal(10);
  });

  it("handles page size changes", async () => {
    const pageSizeSelect =
      element.shadowRoot.querySelector(".page-size-select");
    const pageSizePromise = oneEvent(element, "page-size-change");

    pageSizeSelect.value = "25";
    pageSizeSelect.dispatchEvent(new Event("change"));

    const event = await pageSizePromise;
    expect(event.detail.pageSize).to.equal(25);
  });

  it("supports custom row rendering", async () => {
    const tableWithCustomRow = await fixture(html`
      <neo-data-table .data="\${sampleData}" .columns="\${columns}">
        <template slot="row">
          <tr class="custom-row">
            <td>\${item.name}</td>
            <td>\${item.age}</td>
            <td>\${item.email}</td>
          </tr>
        </template>
      </neo-data-table>
    `);

    expect(tableWithCustomRow.shadowRoot.querySelector(".custom-row")).to.exist;
  });

  it("handles column resizing", async () => {
    const resizer = element.shadowRoot.querySelector(".column-resizer");
    const resizePromise = oneEvent(element, "column-resize");

    const startX = 0;
    const endX = 50;

    resizer.dispatchEvent(new MouseEvent("mousedown", { clientX: startX }));
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: endX }));
    document.dispatchEvent(new MouseEvent("mouseup"));

    const event = await resizePromise;
    expect(event.detail.field).to.equal("name");
    expect(event.detail.width).to.be.closeTo(50, 1);
  });

  it("supports keyboard navigation", async () => {
    element.selectable = true;
    await element.updateComplete;

    const firstRow = element.shadowRoot.querySelector("tbody tr");
    firstRow.focus();

    // Arrow down
    firstRow.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    await element.updateComplete;

    const secondRow = element.shadowRoot.querySelectorAll("tbody tr")[1];
    expect(document.activeElement).to.equal(secondRow);

    // Arrow up
    secondRow.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    await element.updateComplete;
    expect(document.activeElement).to.equal(firstRow);
  });

  it("maintains proper ARIA attributes", async () => {
    const table = element.shadowRoot.querySelector("table");
    expect(table).to.have.attribute("role", "grid");

    const headers = element.shadowRoot.querySelectorAll("th");
    headers.forEach((header) => {
      expect(header).to.have.attribute("role", "columnheader");
      if (header.dataset.sortable === "true") {
        expect(header).to.have.attribute("aria-sort");
      }
    });

    element.selectable = true;
    await element.updateComplete;

    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      expect(row).to.have.attribute("role", "row");
      expect(row).to.have.attribute("aria-selected");
    });
  });

  it("supports custom cell rendering", async () => {
    const tableWithCustomCell = await fixture(html`
      <neo-data-table
        .data=\${sampleData}
        .columns=\${[
          ...columns,
          {
            field: "actions",
            header: "Actions",
            template: (item) => html\`
              <neo-button @click=\${() => console.log(item)}>Edit</neo-button>
            \`
          }
        ]}
      ></neo-data-table>
    `);

    expect(tableWithCustomCell.shadowRoot.querySelector("neo-button")).to.exist;
  });

  it("handles empty state", async () => {
    element.data = [];
    await element.updateComplete;

    const emptyState = element.shadowRoot.querySelector(".empty-state");
    expect(emptyState).to.exist;
    expect(emptyState.textContent).to.include("No data available");
  });

  it("supports row expansion", async () => {
    const tableWithExpansion = await fixture(html`
      <neo-data-table .data="\${sampleData}" .columns="\${columns}" expandable>
        <template slot="expanded-row">
          <tr class="expanded-content">
            <td colspan="3">
              <div>Expanded details for \${item.name}</div>
            </td>
          </tr>
        </template>
      </neo-data-table>
    `);

    const expandButton =
      tableWithExpansion.shadowRoot.querySelector(".expand-button");
    const expansionPromise = oneEvent(tableWithExpansion, "row-expand");

    expandButton.click();
    const event = await expansionPromise;

    expect(event.detail.expanded).to.deep.equal(sampleData[0]);
    expect(tableWithExpansion.shadowRoot.querySelector(".expanded-content")).to
      .exist;
  });
});
