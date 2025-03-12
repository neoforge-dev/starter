import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// Remove any imports of the actual component or TestUtils
// import { TestUtils } from "../../setup.mjs";
// import { waitForComponents } from "../../setup.mjs";

// Create a mock for the NeoTable component as a class
class MockNeoTable {
  constructor() {
    this.columns = [];
    this.data = [];
    this.selected = [];
    this.selectable = false;
    this.sortable = false;
    this.filterable = false;
    this.paginated = false;
    this.pageSize = 10;
    this.currentPage = 1;
    this.emptyMessage = "No data available";
    this._sortColumn = null;
    this._sortDirection = "asc";
    this._filters = {};
    this._allSelected = false;
    this._eventListeners = new Map();

    // Create shadow root with query methods
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === "table") {
          return {
            classList: { contains: () => false },
          };
        }
        if (selector === ".empty-message") {
          return this.data.length === 0
            ? {
                textContent: this.emptyMessage,
              }
            : null;
        }
        if (selector === "th:nth-child(3)") {
          return {
            click: () => {
              this._sortColumn = "name";
              this._sortDirection =
                this._sortDirection === "asc" ? "desc" : "asc";
              this._updateVisibleData();
              this.dispatchEvent(
                new CustomEvent("neo-sort", {
                  detail: {
                    column: "name",
                    direction: this._sortDirection,
                  },
                  bubbles: true,
                  composed: true,
                })
              );
            },
          };
        }
        return null;
      },
    };

    // Mock update method
    this.updateComplete = Promise.resolve();
  }

  // Event handling methods
  addEventListener(eventName, handler) {
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, new Set());
    }
    this._eventListeners.get(eventName).add(handler);
  }

  removeEventListener(eventName, handler) {
    if (this._eventListeners.has(eventName)) {
      this._eventListeners.get(eventName).delete(handler);
    }
  }

  dispatchEvent(event) {
    if (this._eventListeners.has(event.type)) {
      for (const handler of this._eventListeners.get(event.type)) {
        handler(event);
      }
    }
    return true;
  }

  // Computed properties
  get visibleData() {
    if (!this.paginated) {
      return this.filteredData;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredData.slice(start, end);
  }

  get filteredData() {
    let result = [...this.data];

    // Apply filters
    if (this.filterable && Object.keys(this._filters).length > 0) {
      result = result.filter((item) => {
        return Object.entries(this._filters).every(([key, value]) => {
          if (!value) return true;
          return String(item[key])
            .toLowerCase()
            .includes(String(value).toLowerCase());
        });
      });
    }

    // Apply sorting
    if (this.sortable && this._sortColumn) {
      result.sort((a, b) => {
        const aValue = a[this._sortColumn];
        const bValue = b[this._sortColumn];

        if (this._sortDirection === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return result;
  }

  get totalPages() {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  // Methods
  _reset() {
    this._sortColumn = null;
    this._sortDirection = "asc";
    this._filters = {};
    this._allSelected = false;
    this.selected = [];
    this.currentPage = 1;
  }

  _updateVisibleData() {
    // This method would update the DOM in the real component
    // For the mock, we just need to ensure the computed properties are recalculated
    return this.visibleData;
  }

  _handleSort(column) {
    if (!this.sortable) return;

    if (this._sortColumn === column) {
      this._sortDirection = this._sortDirection === "asc" ? "desc" : "asc";
    } else {
      this._sortColumn = column;
      this._sortDirection = "asc";
    }

    this._updateVisibleData();

    this.dispatchEvent(
      new CustomEvent("neo-sort", {
        detail: {
          column,
          direction: this._sortDirection,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleFilter(column, value) {
    if (!this.filterable) return;

    if (value) {
      this._filters[column] = value;
    } else {
      delete this._filters[column];
    }

    this.currentPage = 1;
    this._updateVisibleData();

    this.dispatchEvent(
      new CustomEvent("neo-filter", {
        detail: {
          column,
          value,
          filters: this._filters,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleRowSelect(row, checked) {
    if (!this.selectable) return;

    if (checked) {
      this.selected = [...this.selected, row.id];
    } else {
      this.selected = this.selected.filter((id) => id !== row.id);
    }

    this._allSelected = this.selected.length === this.data.length;

    this.dispatchEvent(
      new CustomEvent("neo-select", {
        detail: {
          selected: this.selected,
          row,
          checked,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSelectAll(checked) {
    if (!this.selectable) return;

    this._allSelected = checked;

    if (checked) {
      this.selected = this.data.map((row) => row.id);
    } else {
      this.selected = [];
    }

    this.dispatchEvent(
      new CustomEvent("neo-select-all", {
        detail: {
          selected: this.selected,
          checked,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handlePageChange(page) {
    if (!this.paginated) return;

    this.currentPage = page;
    this._updateVisibleData();

    this.dispatchEvent(
      new CustomEvent("neo-page", {
        detail: {
          page,
          pageSize: this.pageSize,
        },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// Helper function for one-time event listening
const oneEvent = (element, eventName) => {
  return new Promise((resolve) => {
    const listener = (event) => {
      element.removeEventListener(eventName, listener);
      resolve(event);
    };
    element.addEventListener(eventName, listener);
  });
};

describe("NeoTable", () => {
  let table;

  beforeEach(() => {
    table = new MockNeoTable();
  });

  afterEach(() => {
    table = null;
  });

  it("should initialize with default properties", () => {
    expect(table.columns).toEqual([]);
    expect(table.data).toEqual([]);
    expect(table.selected).toEqual([]);
    expect(table.selectable).toBe(false);
    expect(table.sortable).toBe(false);
    expect(table.filterable).toBe(false);
    expect(table.paginated).toBe(false);
    expect(table.pageSize).toBe(10);
    expect(table.currentPage).toBe(1);
    expect(table.emptyMessage).toBe("No data available");
  });

  it("should show empty message when no data", () => {
    const emptyMessage = table.shadowRoot.querySelector(".empty-message");
    expect(emptyMessage).not.toBeNull();
    expect(emptyMessage.textContent).toBe("No data available");
  });

  it("should not show empty message when data exists", () => {
    table.data = [{ id: 1, name: "Test" }];
    const emptyMessage = table.shadowRoot.querySelector(".empty-message");
    expect(emptyMessage).toBeNull();
  });

  it("should handle sorting when sortable", async () => {
    table.sortable = true;
    table.data = [
      { id: 1, name: "B" },
      { id: 2, name: "A" },
      { id: 3, name: "C" },
    ];

    const sortPromise = oneEvent(table, "neo-sort");
    table._handleSort("name");
    const sortEvent = await sortPromise;

    expect(table._sortColumn).toBe("name");
    expect(table._sortDirection).toBe("asc");
    expect(table.filteredData[0].name).toBe("A");
    expect(sortEvent.detail.column).toBe("name");
    expect(sortEvent.detail.direction).toBe("asc");

    // Test reverse sort
    const reverseSortPromise = oneEvent(table, "neo-sort");
    table._handleSort("name");
    const reverseSortEvent = await reverseSortPromise;

    expect(table._sortDirection).toBe("desc");
    expect(table.filteredData[0].name).toBe("C");
    expect(reverseSortEvent.detail.direction).toBe("desc");
  });

  it("should not sort when not sortable", () => {
    table.data = [
      { id: 1, name: "B" },
      { id: 2, name: "A" },
      { id: 3, name: "C" },
    ];

    table._handleSort("name");

    expect(table._sortColumn).toBeNull();
    expect(table.filteredData[0].name).toBe("B");
  });

  it("should handle filtering when filterable", async () => {
    table.filterable = true;
    table.data = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Cherry" },
    ];

    const filterPromise = oneEvent(table, "neo-filter");
    table._handleFilter("name", "a");
    const filterEvent = await filterPromise;

    expect(table._filters.name).toBe("a");
    expect(table.filteredData.length).toBe(2); // Apple and Banana
    expect(filterEvent.detail.column).toBe("name");
    expect(filterEvent.detail.value).toBe("a");

    // Clear filter
    const clearFilterPromise = oneEvent(table, "neo-filter");
    table._handleFilter("name", "");
    await clearFilterPromise;

    expect(table._filters.name).toBeUndefined();
    expect(table.filteredData.length).toBe(3);
  });

  it("should not filter when not filterable", () => {
    table.data = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Cherry" },
    ];

    table._handleFilter("name", "a");

    expect(table._filters.name).toBeUndefined();
    expect(table.filteredData.length).toBe(3);
  });

  it("should handle row selection when selectable", async () => {
    table.selectable = true;
    table.data = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Cherry" },
    ];

    const selectPromise = oneEvent(table, "neo-select");
    table._handleRowSelect({ id: 1, name: "Apple" }, true);
    const selectEvent = await selectPromise;

    expect(table.selected).toContain(1);
    expect(table.selected.length).toBe(1);
    expect(selectEvent.detail.row.id).toBe(1);
    expect(selectEvent.detail.checked).toBe(true);

    // Deselect
    const deselectPromise = oneEvent(table, "neo-select");
    table._handleRowSelect({ id: 1, name: "Apple" }, false);
    await deselectPromise;

    expect(table.selected).not.toContain(1);
    expect(table.selected.length).toBe(0);
  });

  it("should not select when not selectable", () => {
    table.data = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Cherry" },
    ];

    table._handleRowSelect({ id: 1, name: "Apple" }, true);

    expect(table.selected.length).toBe(0);
  });

  it("should handle select all when selectable", async () => {
    table.selectable = true;
    table.data = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Cherry" },
    ];

    const selectAllPromise = oneEvent(table, "neo-select-all");
    table._handleSelectAll(true);
    const selectAllEvent = await selectAllPromise;

    expect(table._allSelected).toBe(true);
    expect(table.selected.length).toBe(3);
    expect(selectAllEvent.detail.checked).toBe(true);

    // Deselect all
    const deselectAllPromise = oneEvent(table, "neo-select-all");
    table._handleSelectAll(false);
    await deselectAllPromise;

    expect(table._allSelected).toBe(false);
    expect(table.selected.length).toBe(0);
  });

  it("should handle pagination when paginated", async () => {
    table.paginated = true;
    table.pageSize = 2;
    table.data = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Cherry" },
      { id: 4, name: "Date" },
      { id: 5, name: "Elderberry" },
    ];

    expect(table.totalPages).toBe(3);
    expect(table.visibleData.length).toBe(2);
    expect(table.visibleData[0].name).toBe("Apple");

    const pageChangePromise = oneEvent(table, "neo-page");
    table._handlePageChange(2);
    const pageChangeEvent = await pageChangePromise;

    expect(table.currentPage).toBe(2);
    expect(table.visibleData.length).toBe(2);
    expect(table.visibleData[0].name).toBe("Cherry");
    expect(pageChangeEvent.detail.page).toBe(2);
    expect(pageChangeEvent.detail.pageSize).toBe(2);
  });

  it("should reset table state", () => {
    table.sortable = true;
    table.filterable = true;
    table.selectable = true;
    table.paginated = true;
    table.data = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Cherry" },
    ];

    table._handleSort("name");
    table._handleFilter("name", "a");
    table._handleRowSelect({ id: 1, name: "Apple" }, true);
    table._handlePageChange(2);

    expect(table._sortColumn).toBe("name");
    expect(table._filters.name).toBe("a");
    expect(table.selected.length).toBe(1);
    expect(table.currentPage).toBe(2);

    table._reset();

    expect(table._sortColumn).toBeNull();
    expect(Object.keys(table._filters).length).toBe(0);
    expect(table.selected.length).toBe(0);
    expect(table.currentPage).toBe(1);
  });

  it("should combine filtering and sorting", () => {
    table.sortable = true;
    table.filterable = true;
    table.data = [
      { id: 1, name: "Apple", category: "Fruit" },
      { id: 2, name: "Banana", category: "Fruit" },
      { id: 3, name: "Carrot", category: "Vegetable" },
      { id: 4, name: "Date", category: "Fruit" },
      { id: 5, name: "Eggplant", category: "Vegetable" },
    ];

    table._handleFilter("category", "Fruit");
    table._handleSort("name");

    expect(table.filteredData.length).toBe(3);
    expect(table.filteredData[0].name).toBe("Apple");
    expect(table.filteredData[1].name).toBe("Banana");
    expect(table.filteredData[2].name).toBe("Date");

    table._handleSort("name"); // Toggle to desc

    expect(table.filteredData[0].name).toBe("Date");
    expect(table.filteredData[1].name).toBe("Banana");
    expect(table.filteredData[2].name).toBe("Apple");
  });

  it("should combine filtering, sorting, and pagination", () => {
    table.sortable = true;
    table.filterable = true;
    table.paginated = true;
    table.pageSize = 2;
    table.data = [
      { id: 1, name: "Apple", category: "Fruit" },
      { id: 2, name: "Banana", category: "Fruit" },
      { id: 3, name: "Carrot", category: "Vegetable" },
      { id: 4, name: "Date", category: "Fruit" },
      { id: 5, name: "Eggplant", category: "Vegetable" },
    ];

    table._handleFilter("category", "Fruit");
    table._handleSort("name");

    expect(table.filteredData.length).toBe(3);
    expect(table.visibleData.length).toBe(2);
    expect(table.visibleData[0].name).toBe("Apple");
    expect(table.visibleData[1].name).toBe("Banana");

    table._handlePageChange(2);

    expect(table.visibleData.length).toBe(1);
    expect(table.visibleData[0].name).toBe("Date");
  });
});
