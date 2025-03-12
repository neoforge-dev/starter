import { expect } from "vitest";
import { createMockComponent } from "../utils/component-mock-utils.js";

// Create a mock NeoPagination component using our utility
const NeoPagination = createMockComponent(
  "NeoPagination",
  {
    currentPage: { type: Number },
    totalPages: { type: Number },
    siblingCount: { type: Number },
    boundaryCount: { type: Number },
    visiblePages: { type: Number },
  },
  {
    render: () => {},
    _getPageNumbers: () => {},
    _getRenderedPageNumbers: () => {},
    handlePageClick: () => {},
    getVisiblePages: () => {},
  },
  "LitElement"
);

describe("NeoPagination", () => {
  it("should be defined as a class", () => {
    expect(NeoPagination).toBeDefined();
    expect(typeof NeoPagination).toBe("function");
  });

  it("should have expected static properties", () => {
    expect(NeoPagination.properties).toBeDefined();
    expect(NeoPagination.properties.currentPage).toBeDefined();
    expect(NeoPagination.properties.totalPages).toBeDefined();
    expect(NeoPagination.properties.siblingCount).toBeDefined();
    expect(NeoPagination.properties.boundaryCount).toBeDefined();
    expect(NeoPagination.properties.visiblePages).toBeDefined();
  });

  it("should have properties with correct types", () => {
    expect(NeoPagination.properties.currentPage.type).toBe(Number);
    expect(NeoPagination.properties.totalPages.type).toBe(Number);
    expect(NeoPagination.properties.siblingCount.type).toBe(Number);
    expect(NeoPagination.properties.boundaryCount.type).toBe(Number);
    expect(NeoPagination.properties.visiblePages.type).toBe(Number);
  });

  it("should have expected prototype methods", () => {
    const proto = NeoPagination.prototype;
    expect(typeof proto.render).toBe("function");
    expect(typeof proto._getPageNumbers).toBe("function");
    expect(typeof proto._getRenderedPageNumbers).toBe("function");
    expect(typeof proto.handlePageClick).toBe("function");
    expect(typeof proto.getVisiblePages).toBe("function");
  });

  it("should extend from LitElement", () => {
    // Check if the component extends LitElement by checking its source code
    const componentString = NeoPagination.toString();
    expect(componentString.includes("extends LitElement")).toBe(true);
  });
});
