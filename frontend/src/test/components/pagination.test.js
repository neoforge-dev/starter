import { expect } from "@esm-bundle/chai";
import { NeoPagination } from "../../components/ui/pagination.js";

describe("NeoPagination", () => {
  it("should be defined as a class", () => {
    expect(NeoPagination).to.be.a("function");
  });

  it("should have expected static properties", () => {
    expect(NeoPagination.properties).to.exist;
    expect(NeoPagination.properties.currentPage).to.exist;
    expect(NeoPagination.properties.totalPages).to.exist;
    expect(NeoPagination.properties.siblingCount).to.exist;
    expect(NeoPagination.properties.boundaryCount).to.exist;
    expect(NeoPagination.properties.visiblePages).to.exist;
  });

  it("should have properties with correct types", () => {
    expect(NeoPagination.properties.currentPage.type).to.equal(Number);
    expect(NeoPagination.properties.totalPages.type).to.equal(Number);
    expect(NeoPagination.properties.siblingCount.type).to.equal(Number);
    expect(NeoPagination.properties.boundaryCount.type).to.equal(Number);
    expect(NeoPagination.properties.visiblePages.type).to.equal(Number);
  });

  it("should have expected prototype methods", () => {
    const proto = NeoPagination.prototype;
    expect(proto.render).to.be.a("function");
    expect(proto._getPageNumbers).to.be.a("function");
    expect(proto._getRenderedPageNumbers).to.be.a("function");
    expect(proto.handlePageClick).to.be.a("function");
    expect(proto.getVisiblePages).to.be.a("function");
  });

  it("should extend from LitElement", () => {
    // Check if the component extends LitElement by checking its source code
    const componentString = NeoPagination.toString();
    expect(componentString.includes("extends LitElement")).to.be.true;
  });
});
