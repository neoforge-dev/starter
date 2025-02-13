import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/ui/data-table.js";

describe("DataTable", () => {
  let element;
  const columns = [
    { field: "id", header: "ID" },
    { field: "name", header: "Name" },
    { field: "email", header: "Email" },
    { field: "role", header: "Role" },
  ];

  const data = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
    { id: 3, name: "Bob Wilson", email: "bob@example.com", role: "Editor" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", role: "User" },
    {
      id: 5,
      name: "Charlie Davis",
      email: "charlie@example.com",
      role: "Admin",
    },
  ];

  beforeEach(async () => {
    element = await fixture(html`
      <neo-data-table
        .columns=${columns}
        .data=${data}
        .pageSize=${2}
      ></neo-data-table>
    `);
  });

  it("renders with default properties", () => {
    const table = element.shadowRoot.querySelector("table");
    const headers = element.shadowRoot.querySelectorAll("th");
    const rows = element.shadowRoot.querySelectorAll("tbody tr");

    expect(table).to.exist;
    expect(headers.length).to.equal(columns.length);
    expect(rows.length).to.equal(2); // pageSize is 2
  });

  it("handles sorting", async () => {
    const nameHeader = element.shadowRoot.querySelector(
      'th[data-field="name"]'
    );

    // First click - sort ascending
    nameHeader.click();
    await element.updateComplete;

    let displayData = element.displayData;
    expect(displayData[0].name).to.equal("Alice Brown");
    expect(displayData[1].name).to.equal("Bob Wilson");

    // Second click - sort descending
    nameHeader.click();
    await element.updateComplete;

    displayData = element.displayData;
    expect(displayData[0].name).to.equal("John Doe");
    expect(displayData[1].name).to.equal("Jane Smith");
  });

  it("handles filtering", async () => {
    element.filter = { field: "role", value: "Admin" };
    await element.updateComplete;

    const displayData = element.displayData;
    expect(displayData.length).to.equal(2);
    expect(displayData.every((item) => item.role === "Admin")).to.be.true;

    // Clear filter
    element.filter = null;
    await element.updateComplete;
    expect(element.displayData.length).to.equal(2); // back to pageSize
  });

  it("handles pagination", async () => {
    // Check first page
    expect(element.currentPage).to.equal(1);
    expect(element.displayData.length).to.equal(2);
    expect(element.displayData[0].id).to.equal(1);
    expect(element.displayData[1].id).to.equal(2);

    // Go to next page
    const nextButton = element.shadowRoot.querySelector(".pagination-next");
    nextButton.click();
    await element.updateComplete;

    expect(element.currentPage).to.equal(2);
    expect(element.displayData[0].id).to.equal(3);
    expect(element.displayData[1].id).to.equal(4);

    // Go to previous page
    const prevButton = element.shadowRoot.querySelector(".pagination-prev");
    prevButton.click();
    await element.updateComplete;

    expect(element.currentPage).to.equal(1);
    expect(element.displayData[0].id).to.equal(1);
  });

  it("handles row selection", async () => {
    const rowSelectPromise = oneEvent(element, "row-select");
    const firstRow = element.shadowRoot.querySelector("tbody tr");

    firstRow.click();
    const { detail } = await rowSelectPromise;

    expect(detail).to.deep.equal(data[0]);
  });

  it("combines sorting and filtering", async () => {
    // Set filter first
    element.filter = { field: "role", value: "User" };
    await element.updateComplete;

    // Then sort by name
    const nameHeader = element.shadowRoot.querySelector(
      'th[data-field="name"]'
    );
    nameHeader.click();
    await element.updateComplete;

    const displayData = element.displayData;
    expect(displayData.length).to.equal(2);
    expect(displayData.every((item) => item.role === "User")).to.be.true;
    expect(displayData[0].name).to.equal("Alice Brown");
    expect(displayData[1].name).to.equal("Jane Smith");
  });

  it("handles empty data", async () => {
    element.data = [];
    await element.updateComplete;

    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    expect(rows.length).to.equal(0);

    const pagination = element.shadowRoot.querySelector(".pagination");
    expect(pagination).to.not.exist;
  });

  it("updates when data changes", async () => {
    const newData = [
      { id: 6, name: "New User", email: "new@example.com", role: "User" },
    ];

    element.data = newData;
    await element.updateComplete;

    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    expect(rows.length).to.equal(1);
    expect(rows[0].textContent).to.include("New User");
  });

  it("maintains state through data updates", async () => {
    // Set initial sort
    const nameHeader = element.shadowRoot.querySelector(
      'th[data-field="name"]'
    );
    nameHeader.click();
    await element.updateComplete;

    // Update data
    const newData = [
      ...data,
      { id: 6, name: "Aaron Smith", email: "aaron@example.com", role: "User" },
    ];
    element.data = newData;
    await element.updateComplete;

    // Check if sort is maintained
    const displayData = element.displayData;
    expect(displayData[0].name).to.equal("Aaron Smith");
  });

  it("handles combined sorting, filtering, and pagination", async () => {
    // Set filter
    element.filter = { field: "role", value: "User" };
    await element.updateComplete;

    // Set sort
    const nameHeader = element.shadowRoot.querySelector(
      'th[data-field="name"]'
    );
    nameHeader.click();
    await element.updateComplete;

    // Check first page
    let displayData = element.displayData;
    expect(displayData.length).to.equal(2);
    expect(displayData[0].name).to.equal("Alice Brown");
    expect(displayData[0].role).to.equal("User");

    // Go to next page
    const nextButton = element.shadowRoot.querySelector(".pagination-next");
    nextButton.click();
    await element.updateComplete;

    displayData = element.displayData;
    expect(displayData.length).to.equal(0); // No more users with role "User"
  });
});
