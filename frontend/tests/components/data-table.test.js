import { html, fixture, expect } from "@open-wc/testing";
import { TestRunner, ComponentTester, Assert } from "../test-utils.js";
import "../../src/components/ui/data-table.js";

describe("DataTable Component", () => {
  let element;
  const testData = [
    { id: 1, name: "John", age: 30 },
    { id: 2, name: "Alice", age: 25 },
    { id: 3, name: "Bob", age: 35 },
  ];

  beforeEach(async () => {
    element = await fixture(html`
      <neo-data-table
        .data=${testData}
        .columns=${[
          { field: "id", header: "ID" },
          { field: "name", header: "Name" },
          { field: "age", header: "Age" },
        ]}
      ></neo-data-table>
    `);
    await element.updateComplete;
  });

  it("renders with data", async () => {
    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    Assert.equal(rows.length, testData.length);

    const firstRow = rows[0];
    const cells = firstRow.querySelectorAll("td");
    Assert.equal(cells[0].textContent, "1");
    Assert.equal(cells[1].textContent, "John");
    Assert.equal(cells[2].textContent, "30");
  });

  it("sorts data when clicking header", async () => {
    const nameHeader = element.shadowRoot.querySelector(
      'th[data-field="name"]'
    );
    await ComponentTester.click(nameHeader);
    await element.updateComplete;

    const cells = element.shadowRoot.querySelectorAll('td[data-field="name"]');
    Assert.equal(cells[0].textContent, "Alice");
  });

  it("filters data", async () => {
    element.filter = { field: "name", value: "John" };
    await element.updateComplete;

    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    Assert.equal(rows.length, 1);
    const nameCell = rows[0].querySelector('td[data-field="name"]');
    Assert.equal(nameCell.textContent, "John");
  });

  it("handles row selection", async () => {
    let selectedRow = null;
    element.addEventListener("row-select", (e) => (selectedRow = e.detail));

    const firstRow = element.shadowRoot.querySelector("tbody tr");
    await ComponentTester.click(firstRow);

    Assert.notNull(selectedRow);
    Assert.equal(selectedRow.id, 1);
  });

  it("handles pagination", async () => {
    element.pageSize = 2;
    await element.updateComplete;

    let rows = element.shadowRoot.querySelectorAll("tbody tr");
    Assert.equal(rows.length, 2);

    const nextButton = element.shadowRoot.querySelector(".pagination-next");
    await ComponentTester.click(nextButton);
    await element.updateComplete;

    rows = element.shadowRoot.querySelectorAll("tbody tr");
    Assert.equal(rows.length, 1);
  });
});
