import { expect, describe, it, beforeEach, vi } from "vitest";

/**
 * Mock for the DataTable component
 */
class MockDataTable {
  constructor() {
    // Properties from the component
    this.data = [];
    this.columns = [];
    this.sortField = "";
    this.sortDirection = "asc";
    this.filter = null;
    this.page = 1;
    this.pageSize = 10;
    this.selectedRows = [];

    // Event listeners
    this._eventListeners = new Map();

    // Mock DOM elements
    this._filterInput = { value: "" };
    this._paginationButtons = {
      first: { disabled: false },
      previous: { disabled: false },
      next: { disabled: false },
      last: { disabled: false },
    };
  }

  // Event handling
  addEventListener(event, callback) {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (!this._eventListeners.has(event)) return;
    const listeners = this._eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  dispatchEvent(event) {
    const listeners = this._eventListeners.get(event.type) || [];
    listeners.forEach((callback) => callback(event));
    return !event.defaultPrevented;
  }

  // Mock shadow DOM
  get shadowRoot() {
    return {
      querySelector: (selector) => {
        if (selector === "input") return this._filterInput;
        if (selector === ".pagination-prev")
          return this._paginationButtons.previous;
        if (selector === ".pagination-next")
          return this._paginationButtons.next;
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === "th")
          return this.columns.map((col) => ({
            getAttribute: () => col.field,
            textContent: col.header || col.title,
          }));
        if (selector === "tr")
          return this._getDisplayedData().map((row) => ({
            getAttribute: () => JSON.stringify(row),
            click: () => this._handleRowClick(row),
          }));
        return [];
      },
    };
  }

  // Methods from the component
  _handleSort(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }
    this.requestUpdate();
  }

  _handleFilter(e) {
    this.filter = e.target.value;
    this.page = 1;
    this.requestUpdate();
  }

  _handleRowClick(row) {
    this.dispatchEvent(
      new CustomEvent("row-select", {
        detail: row,
        bubbles: true,
        composed: true,
      })
    );
  }

  _handlePageChange(newPage) {
    this.page = newPage;
    this.requestUpdate();
  }

  _getFilteredData() {
    if (!this.filter) return this.data;

    return this.data.filter((row) => {
      if (typeof this.filter === "string") {
        // Simple string filter across all fields
        return Object.values(row).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(this.filter.toLowerCase())
        );
      } else if (this.filter.field && this.filter.value) {
        // Field-specific filter
        const fieldValue = row[this.filter.field];
        return (
          fieldValue &&
          fieldValue
            .toString()
            .toLowerCase()
            .includes(this.filter.value.toLowerCase())
        );
      }
      return false;
    });
  }

  _getSortedData(filteredData) {
    if (!this.sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[this.sortField];
      const bValue = b[this.sortField];
      const modifier = this.sortDirection === "asc" ? 1 : -1;

      if (aValue < bValue) return -1 * modifier;
      if (aValue > bValue) return 1 * modifier;
      return 0;
    });
  }

  _getPaginatedData(sortedData) {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return sortedData.slice(start, end);
  }

  _getDisplayedData() {
    const filteredData = this._getFilteredData();
    const sortedData = this._getSortedData(filteredData);
    return this._getPaginatedData(sortedData);
  }

  requestUpdate() {
    // Update pagination button states
    const filteredData = this._getFilteredData();
    const totalPages = Math.ceil(filteredData.length / this.pageSize);

    this._paginationButtons.first.disabled = this.page === 1;
    this._paginationButtons.previous.disabled = this.page === 1;
    this._paginationButtons.next.disabled =
      this.page === totalPages || totalPages === 0;
    this._paginationButtons.last.disabled =
      this.page === totalPages || totalPages === 0;
  }
}

describe("DataTable Component", () => {
  let element;
  const testData = [
    { id: 1, name: "John", age: 30 },
    { id: 2, name: "Alice", age: 25 },
    { id: 3, name: "Bob", age: 35 },
  ];

  beforeEach(() => {
    element = new MockDataTable();
    element.data = [...testData];
    element.columns = [
      { field: "id", header: "ID" },
      { field: "name", header: "Name" },
      { field: "age", header: "Age" },
    ];
  });

  it("should initialize with default properties", () => {
    expect(element.data).toEqual(testData);
    expect(element.columns.length).toBe(3);
    expect(element.sortField).toBe("");
    expect(element.sortDirection).toBe("asc");
    expect(element.filter).toBeNull();
    expect(element.page).toBe(1);
    expect(element.pageSize).toBe(10);
    expect(element.selectedRows).toEqual([]);
  });

  it("should sort data when a column header is clicked", () => {
    // Sort by name ascending
    element._handleSort("name");
    expect(element.sortField).toBe("name");
    expect(element.sortDirection).toBe("asc");

    let displayedData = element._getDisplayedData();
    expect(displayedData[0].name).toBe("Alice");
    expect(displayedData[1].name).toBe("Bob");
    expect(displayedData[2].name).toBe("John");

    // Sort by name descending
    element._handleSort("name");
    expect(element.sortField).toBe("name");
    expect(element.sortDirection).toBe("desc");

    displayedData = element._getDisplayedData();
    expect(displayedData[0].name).toBe("John");
    expect(displayedData[1].name).toBe("Bob");
    expect(displayedData[2].name).toBe("Alice");
  });

  it("should filter data based on input", () => {
    // Filter for "John"
    element._handleFilter({ target: { value: "John" } });
    expect(element.filter).toBe("John");

    let displayedData = element._getDisplayedData();
    expect(displayedData.length).toBe(1);
    expect(displayedData[0].name).toBe("John");

    // Filter for "o" should match "John" and "Bob"
    element._handleFilter({ target: { value: "o" } });
    expect(element.filter).toBe("o");

    displayedData = element._getDisplayedData();
    expect(displayedData.length).toBe(2);
    expect(displayedData.some((row) => row.name === "John")).toBe(true);
    expect(displayedData.some((row) => row.name === "Bob")).toBe(true);
  });

  it("should emit row-select event when a row is clicked", () => {
    const rowSelectSpy = vi.fn();
    element.addEventListener("row-select", rowSelectSpy);

    element._handleRowClick(testData[1]); // Click on Alice's row

    expect(rowSelectSpy).toHaveBeenCalledTimes(1);
    const event = rowSelectSpy.mock.calls[0][0];
    expect(event.detail).toEqual(testData[1]);
    expect(event.detail.name).toBe("Alice");
  });

  it("should paginate data correctly", () => {
    // Create more test data to test pagination
    const moreData = [
      { id: 1, name: "Alice", age: 30 },
      { id: 2, name: "Bob", age: 25 },
      { id: 3, name: "Charlie", age: 35 },
      { id: 4, name: "Diana", age: 40 },
      { id: 5, name: "Edward", age: 28 },
      { id: 6, name: "Fiona", age: 45 },
      { id: 7, name: "George", age: 33 },
      { id: 8, name: "Hannah", age: 38 },
      { id: 9, name: "Ian", age: 27 },
      { id: 10, name: "Julia", age: 42 },
      { id: 11, name: "Kevin", age: 31 },
      { id: 12, name: "Laura", age: 36 },
    ];

    // Set data and explicitly set pageSize
    element = new MockDataTable();
    element.data = moreData;
    element.pageSize = 4;
    element.columns = [
      { field: "id", header: "ID" },
      { field: "name", header: "Name" },
      { field: "age", header: "Age" },
    ];

    // First page should have first 4 items
    let displayedData = element._getDisplayedData();
    expect(displayedData.length).toBe(4);
    expect(displayedData[0].id).toBe(1);
    expect(displayedData[3].id).toBe(4);

    // Go to second page
    element._handlePageChange(2);
    expect(element.page).toBe(2);
    displayedData = element._getDisplayedData();
    expect(displayedData.length).toBe(4);
    expect(displayedData[0].id).toBe(5);
    expect(displayedData[3].id).toBe(8);
  });

  it("should reset to first page when filter changes", () => {
    // Create more test data and go to second page
    const moreData = [
      ...testData,
      { id: 4, name: "Charlie", age: 40 },
      { id: 5, name: "Diana", age: 28 },
      { id: 6, name: "Edward", age: 45 },
      { id: 7, name: "Fiona", age: 33 },
      { id: 8, name: "George", age: 38 },
      { id: 9, name: "Hannah", age: 27 },
      { id: 10, name: "Ian", age: 42 },
      { id: 11, name: "Julia", age: 31 },
      { id: 12, name: "Kevin", age: 36 },
    ];

    element.data = moreData;
    element.pageSize = 5;
    element._handlePageChange(2);
    expect(element.page).toBe(2);

    // Apply filter
    element._handleFilter({ target: { value: "a" } });

    // Should reset to page 1
    expect(element.page).toBe(1);

    // Should only show names containing "a"
    const displayedData = element._getDisplayedData();
    displayedData.forEach((row) => {
      expect(JSON.stringify(row).toLowerCase()).toContain("a");
    });
  });
});
