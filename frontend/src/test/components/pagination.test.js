import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/ui/pagination.js";

describe("PaginationComponent", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <neo-pagination
        .currentPage=${1}
        .totalPages=${10}
        .siblingCount=${1}
        .boundaryCount=${1}
      ></neo-pagination>
    `);
  });

  it("renders with default properties", () => {
    const nav = element.shadowRoot.querySelector("nav");
    const pageItems = element.shadowRoot.querySelectorAll(".page-item");

    expect(nav).to.exist;
    expect(pageItems.length).to.be.greaterThan(0);
    expect(pageItems[1].textContent.trim()).to.equal("1");
    expect(pageItems[1].classList.contains("active")).to.be.true;
  });

  it("generates correct page numbers", () => {
    const pageNumbers = element._getPageNumbers();
    expect(pageNumbers).to.deep.equal([1, "...", 9, 10]);

    // Update current page to middle
    element.currentPage = 5;
    const middlePageNumbers = element._getPageNumbers();
    expect(middlePageNumbers).to.deep.equal([1, "...", 4, 5, 6, "...", 10]);

    // Update current page to end
    element.currentPage = 10;
    const endPageNumbers = element._getPageNumbers();
    expect(endPageNumbers).to.deep.equal([1, "...", 9, 10]);
  });

  it("handles page changes", async () => {
    const pageItems = element.shadowRoot.querySelectorAll(".page-item");
    const page2 = Array.from(pageItems).find(
      (item) => item.textContent.trim() === "2"
    );

    const changePromise = oneEvent(element, "page-change");
    page2.click();
    const { detail } = await changePromise;

    expect(detail.page).to.equal(2);
    expect(element.currentPage).to.equal(2);
  });

  it("disables previous button on first page", () => {
    const prevButton = element.shadowRoot.querySelector(
      '.page-item[aria-label="Previous page"]'
    );
    expect(prevButton.classList.contains("disabled")).to.be.true;

    element.currentPage = 2;
    expect(prevButton.classList.contains("disabled")).to.be.false;
  });

  it("disables next button on last page", async () => {
    element.currentPage = element.totalPages;
    await element.updateComplete;

    const nextButton = element.shadowRoot.querySelector(
      '.page-item[aria-label="Next page"]'
    );
    expect(nextButton.classList.contains("disabled")).to.be.true;

    element.currentPage = element.totalPages - 1;
    await element.updateComplete;
    expect(nextButton.classList.contains("disabled")).to.be.false;
  });

  it("handles previous/next navigation", async () => {
    // Click next
    const nextButton = element.shadowRoot.querySelector(
      '.page-item[aria-label="Next page"]'
    );
    const nextPromise = oneEvent(element, "page-change");
    nextButton.click();
    const { detail: nextDetail } = await nextPromise;

    expect(nextDetail.page).to.equal(2);

    // Click previous
    const prevButton = element.shadowRoot.querySelector(
      '.page-item[aria-label="Previous page"]'
    );
    const prevPromise = oneEvent(element, "page-change");
    prevButton.click();
    const { detail: prevDetail } = await prevPromise;

    expect(prevDetail.page).to.equal(1);
  });

  it("adjusts for different sibling counts", async () => {
    element.siblingCount = 2;
    await element.updateComplete;

    element.currentPage = 5;
    await element.updateComplete;

    const pageNumbers = element._getPageNumbers();
    expect(pageNumbers).to.deep.equal([1, "...", 3, 4, 5, 6, 7, "...", 10]);
  });

  it("adjusts for different boundary counts", async () => {
    element.boundaryCount = 2;
    await element.updateComplete;

    const pageNumbers = element._getPageNumbers();
    expect(pageNumbers).to.deep.equal([1, 2, "...", 9, 10]);
  });

  it("shows all pages when total is small", async () => {
    element.totalPages = 5;
    await element.updateComplete;

    const pageNumbers = element._getPageNumbers();
    expect(pageNumbers).to.deep.equal([1, 2, 3, 4, 5]);
  });

  it("handles single page", async () => {
    element.totalPages = 1;
    await element.updateComplete;

    const pageItems = element.shadowRoot.querySelectorAll(".page-item");
    expect(pageItems.length).to.equal(3); // prev, 1, next
    expect(pageItems[0].classList.contains("disabled")).to.be.true; // prev
    expect(pageItems[2].classList.contains("disabled")).to.be.true; // next
  });

  it("updates aria attributes correctly", async () => {
    const pageItems = element.shadowRoot.querySelectorAll(".page-item");
    const activePage = Array.from(pageItems).find((item) =>
      item.classList.contains("active")
    );

    expect(activePage.getAttribute("aria-current")).to.equal("page");
    expect(activePage.getAttribute("aria-label")).to.equal("Page 1");

    // Change page
    element.currentPage = 2;
    await element.updateComplete;

    const newActivePage = element.shadowRoot.querySelector(
      '.page-item[aria-current="page"]'
    );
    expect(newActivePage.textContent.trim()).to.equal("2");
  });
});
