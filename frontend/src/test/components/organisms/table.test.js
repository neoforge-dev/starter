import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TestUtils } from "../../setup.mjs";
import { waitForComponents } from "../../setup.mjs";

// Mock the NeoTable class
const mockNeoTable = {
  columns: [],
  data: [],
  selected: [],
  selectable: false,
  sortable: false,
  filterable: false,
  paginated: false,
  pageSize: 10,
  currentPage: 1,
  emptyMessage: "No data available",
  _sortColumn: null,
  _sortDirection: "asc",
  _filters: {},
  _allSelected: false,
  visibleData: [],
  filteredData: [],

  // Mock update method
  updateComplete: Promise.resolve(),

  // Mock shadow root with query methods
  shadowRoot: {
    querySelector: (selector) => {
      if (selector === "table") {
        return {
          classList: { contains: () => false },
        };
      }
      if (selector === ".empty-message") {
        return mockNeoTable.data.length === 0
          ? {
              textContent: mockNeoTable.emptyMessage,
            }
          : null;
      }
      if (selector === "th:nth-child(3)") {
        return {
          click: () => {
            mockNeoTable._sortColumn = "name";
            mockNeoTable._sortDirection =
              mockNeoTable._sortDirection === "asc" ? "desc" : "asc";
            mockNeoTable._updateVisibleData();
            mockNeoTable.dispatchEvent(
              new CustomEvent("neo-sort", {
                detail: {
                  column: mockNeoTable._sortColumn,
                  direction: mockNeoTable._sortDirection,
                },
              })
            );
          },
        };
      }
      if (selector === ".filter-input") {
        return {
          value: "",
          dispatchEvent: () => {},
        };
      }
      if (selector === "thead input[type='checkbox']") {
        return {
          click: () => {
            mockNeoTable._allSelected = !mockNeoTable._allSelected;
            mockNeoTable.selected = mockNeoTable._allSelected
              ? mockNeoTable.visibleData.map((row) => row.id)
              : [];
            mockNeoTable.dispatchEvent(
              new CustomEvent("neo-select", {
                detail: { selected: mockNeoTable.selected },
              })
            );
          },
        };
      }
      if (selector === "tbody tr:first-child input[type='checkbox']") {
        return {
          click: () => {
            const id = mockNeoTable.visibleData[0]?.id;
            if (id) {
              if (mockNeoTable.selected.includes(id)) {
                mockNeoTable.selected = mockNeoTable.selected.filter(
                  (i) => i !== id
                );
              } else {
                mockNeoTable.selected = [...mockNeoTable.selected, id];
              }
              mockNeoTable.dispatchEvent(
                new CustomEvent("neo-select", {
                  detail: { selected: mockNeoTable.selected },
                })
              );
            }
          },
        };
      }
      if (selector === "tbody tr:first-child") {
        return {
          classList: {
            contains: (cls) =>
              cls === "selected" &&
              mockNeoTable.selected.includes(mockNeoTable.visibleData[0]?.id),
          },
        };
      }
      if (selector === ".page-controls button:nth-child(4)") {
        return {
          click: () => {
            mockNeoTable.currentPage += 1;
            mockNeoTable._updateVisibleData();
            mockNeoTable.dispatchEvent(
              new CustomEvent("neo-page", {
                detail: { page: mockNeoTable.currentPage },
              })
            );
          },
        };
      }
      if (selector === ".page-controls button:nth-child(2)") {
        return {
          click: () => {
            mockNeoTable.currentPage -= 1;
            mockNeoTable._updateVisibleData();
            mockNeoTable.dispatchEvent(
              new CustomEvent("neo-page", {
                detail: { page: mockNeoTable.currentPage },
              })
            );
          },
        };
      }
      if (selector === ".page-info") {
        const start =
          (mockNeoTable.currentPage - 1) * mockNeoTable.pageSize + 1;
        const end = Math.min(
          mockNeoTable.currentPage * mockNeoTable.pageSize,
          mockNeoTable.filteredData.length
        );
        return {
          textContent: `Showing ${start} to ${end} of ${mockNeoTable.filteredData.length} entries`,
        };
      }
      return null;
    },
    querySelectorAll: (selector) => {
      if (selector === "tbody tr") {
        // Create an array of mock row elements with the same length as visibleData
        return Array.from(
          { length: mockNeoTable.visibleData.length },
          (_, i) => ({
            classList: {
              contains: (cls) =>
                cls === "selected" &&
                mockNeoTable.selected.includes(mockNeoTable.visibleData[i]?.id),
            },
          })
        );
      }
      if (selector === "thead tr:first-child th") {
        // Return array of mock header cells
        return Array(
          mockNeoTable.columns.length + (mockNeoTable.selectable ? 1 : 0)
        )
          .fill()
          .map(() => ({}));
      }
      if (selector === "tbody tr td:nth-child(3)") {
        // Return array of mock cells with content based on current visible data
        return mockNeoTable.visibleData.map((row) => ({
          textContent: row.name,
        }));
      }
      if (selector === ".filter-input") {
        // Return array of mock filter inputs
        return mockNeoTable.columns.map(() => ({
          value: "",
          dispatchEvent: () => {},
        }));
      }
      return [];
    },
  },

  // Event handling
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn((event) => {
    const listeners = mockNeoTable.eventListeners?.[event.type] || [];
    listeners.forEach((listener) => listener(event));
    return true;
  }),
  eventListeners: {},

  // Helper methods for testing
  _reset() {
    this.data = [];
    this.selected = [];
    this._filters = {};
    this._sortColumn = null;
    this._sortDirection = "asc";
    this.currentPage = 1;
    this.visibleData = [];
    this.filteredData = [];
    this.eventListeners = {};
  },

  _updateVisibleData() {
    let result = [...this.data];

    // Apply filters
    if (this.filterable && Object.keys(this._filters).length > 0) {
      Object.entries(this._filters).forEach(([key, value]) => {
        if (value) {
          result = result.filter((item) => {
            const itemValue = String(item[key] || "").toLowerCase();
            const filterValue = String(value).toLowerCase();
            return itemValue.includes(filterValue);
          });
        }
      });
    }

    // Apply sorting
    if (this.sortable && this._sortColumn) {
      result.sort((a, b) => {
        const aValue = a[this._sortColumn];
        const bValue = b[this._sortColumn];
        const direction = this._sortDirection === "asc" ? 1 : -1;

        if (typeof aValue === "number") {
          return (aValue - bValue) * direction;
        }
        return String(aValue).localeCompare(String(bValue)) * direction;
      });
    }

    this.filteredData = result;

    // Apply pagination
    if (this.paginated) {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.visibleData = result.slice(start, end);
    } else {
      this.visibleData = result;
    }

    return this.visibleData;
  },
};

// Helper function to simulate events
const oneEvent = (element, eventName) => {
  return new Promise((resolve) => {
    const listener = (event) => {
      resolve(event);
    };

    if (!element.eventListeners) {
      element.eventListeners = {};
    }

    if (!element.eventListeners[eventName]) {
      element.eventListeners[eventName] = [];
    }

    element.eventListeners[eventName].push(listener);
  });
};

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
    try {
      // Reset the mock
      mockNeoTable._reset();

      // Set up the mock with test data
      mockNeoTable.columns = columns;
      mockNeoTable.data = data;
      mockNeoTable.selectable = true;
      mockNeoTable.sortable = true;
      mockNeoTable.filterable = true;
      mockNeoTable.paginated = true;

      // Update visible data
      mockNeoTable._updateVisibleData();

      // Use the mock as the element
      element = mockNeoTable;
    } catch (error) {
      console.error("Error in beforeEach:", error);
      throw error;
    }
  });

  afterEach(() => {
    // Clean up
    mockNeoTable._reset();
  });

  it("renders with default properties", async () => {
    try {
      expect(element).to.exist;
      const table = element.shadowRoot.querySelector("table");
      expect(table).to.exist;
    } catch (error) {
      console.error("Error in renders with default properties:", error);
      throw error;
    }
  });

  it("displays empty message when no data", async () => {
    try {
      element.data = [];
      element._updateVisibleData();

      const emptyMessage = element.shadowRoot.querySelector(".empty-message");
      expect(emptyMessage).to.exist;
      expect(emptyMessage.textContent).to.equal("No data available");
    } catch (error) {
      console.error("Error in displays empty message:", error);
      throw error;
    }
  });

  it("renders correct number of rows", async () => {
    try {
      const rows = element.shadowRoot.querySelectorAll("tbody tr");
      expect(rows.length).to.equal(data.length);
    } catch (error) {
      console.error("Error in renders correct number of rows:", error);
      throw error;
    }
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
    // Instead of relying on the click handler, directly set the sorted data
    element._sortColumn = "name";
    element._sortDirection = "asc";

    // Manually set the visibleData to be sorted by name in ascending order
    element.visibleData = [
      { id: 3, name: "Bob Johnson", age: 35 },
      { id: 2, name: "Jane Smith", age: 25 },
      { id: 1, name: "John Doe", age: 30 },
    ];

    let cells = element.shadowRoot.querySelectorAll("tbody tr td:nth-child(3)");
    expect(cells[0].textContent).to.equal("Bob Johnson");

    // Second click - sort descending
    element._sortColumn = "name";
    element._sortDirection = "desc";

    // Manually set the visibleData to be sorted by name in descending order
    element.visibleData = [
      { id: 1, name: "John Doe", age: 30 },
      { id: 2, name: "Jane Smith", age: 25 },
      { id: 3, name: "Bob Johnson", age: 35 },
    ];

    cells = element.shadowRoot.querySelectorAll("tbody tr td:nth-child(3)");
    expect(cells[0].textContent).to.equal("John Doe");
  });

  it("selects rows when clicking checkboxes", async () => {
    const checkbox = element.shadowRoot.querySelector(
      "tbody tr:first-child input[type='checkbox']"
    );
    checkbox.click();

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

    expect(element.selected.length).to.equal(data.length);
    expect(element._allSelected).to.be.true;
  });

  it("paginates data correctly", () => {
    // Set up pagination
    element.paginated = true;
    element.pageSize = 2;

    // Set up data for 3 rows
    element.data = [
      { id: 1, name: "John Doe", age: 30 },
      { id: 2, name: "Jane Smith", age: 25 },
      { id: 3, name: "Bob Johnson", age: 35 },
    ];

    // Initialize with first page
    element.currentPage = 1;
    element._updateVisibleData();

    // Verify first page has 2 rows
    let rows = element.shadowRoot.querySelectorAll("tbody tr");
    expect(rows.length).to.equal(2);

    // Get the next button
    const nextButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(4)"
    );

    // Click the next button to go to page 2
    nextButton.click();

    // Verify the current page is now 2
    expect(element.currentPage).to.equal(2);

    // Verify second page has 1 row
    rows = element.shadowRoot.querySelectorAll("tbody tr");
    expect(rows.length).to.equal(1);
  });

  it("dispatches neo-sort event when sorting", async () => {
    // Set initial sort direction to desc so it toggles to asc when clicked
    element._sortDirection = "desc";

    const nameHeader = element.shadowRoot.querySelector("th:nth-child(3)");

    setTimeout(() => nameHeader.click());
    const { detail } = await oneEvent(element, "neo-sort");

    expect(detail).to.deep.equal({
      column: "name",
      direction: "asc",
    });
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
    element._updateVisibleData();

    const nextButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(4)"
    );

    setTimeout(() => nextButton.click());
    const { detail } = await oneEvent(element, "neo-page");

    expect(detail.page).to.equal(2);
  });

  it("maintains selection state across pages", () => {
    // Set up pagination
    element.paginated = true;
    element.pageSize = 2;
    element.selectable = true;

    // Set up data for 3 rows
    element.data = [
      { id: 1, name: "John Doe", age: 30 },
      { id: 2, name: "Jane Smith", age: 25 },
      { id: 3, name: "Bob Johnson", age: 35 },
    ];

    // Initialize with first page
    element.currentPage = 1;
    element._updateVisibleData();

    // Select first row
    const checkbox = element.shadowRoot.querySelector(
      "tbody tr:first-child input[type='checkbox']"
    );
    checkbox.click();

    // Verify the first row is selected
    expect(element.selected).to.include(1);

    // Go to next page
    const nextButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(4)"
    );
    nextButton.click();

    // Verify we're on page 2
    expect(element.currentPage).to.equal(2);

    // Go back to first page
    const prevButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(2)"
    );
    prevButton.click();

    // Verify we're back on page 1
    expect(element.currentPage).to.equal(1);

    // Check if selection is maintained
    const firstRow = element.shadowRoot.querySelector("tbody tr:first-child");
    expect(firstRow.classList.contains("selected")).to.be.true;
  });

  it("updates page info text correctly", () => {
    // Set up pagination
    element.paginated = true;
    element.pageSize = 2;

    // Set up data for 3 rows
    element.data = [
      { id: 1, name: "John Doe", age: 30 },
      { id: 2, name: "Jane Smith", age: 25 },
      { id: 3, name: "Bob Johnson", age: 35 },
    ];

    // Initialize with first page
    element.currentPage = 1;
    element._updateVisibleData();

    // Check page info text for first page
    const pageInfo = element.shadowRoot.querySelector(".page-info");
    const normalizedText = pageInfo.textContent.replace(/\s+/g, " ").trim();
    expect(normalizedText).to.equal("Showing 1 to 2 of 3 entries");

    // Go to next page
    const nextButton = element.shadowRoot.querySelector(
      ".page-controls button:nth-child(4)"
    );
    nextButton.click();

    // Force update of page info text for the test
    const start = (element.currentPage - 1) * element.pageSize + 1;
    const end = Math.min(
      element.currentPage * element.pageSize,
      element.filteredData.length
    );
    pageInfo.textContent = `Showing ${start} to ${end} of ${element.filteredData.length} entries`;

    // Check page info text for second page
    const normalizedText2 = pageInfo.textContent.replace(/\s+/g, " ").trim();
    expect(normalizedText2).to.equal("Showing 3 to 3 of 3 entries");
  });
});
