import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../pages/support-page.js";
import { waitForComponents } from "../setup.mjs";

describe("Support Page", () => {
  let element;
  const mockTickets = [
    {
      id: "1",
      title: "Installation Issue",
      description: "Having trouble with setup",
      status: "open",
      priority: "high",
      category: "installation",
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-01-02T15:30:00Z",
    },
    {
      id: "2",
      title: "API Question",
      description: "Need help with endpoints",
      status: "closed",
      priority: "medium",
      category: "api",
      createdAt: "2024-01-03T09:00:00Z",
      updatedAt: "2024-01-04T14:20:00Z",
    },
  ];

  beforeEach(async () => {
    // Mock API client
    window.api = {
      getSupportTickets: async () => mockTickets,
      createTicket: async (ticket) => ({ ...ticket, id: "3" }),
      updateTicket: async (ticket) => ticket,
      deleteTicket: async (id) => ({ success: true }),
    };

    // Wait for components to be registered
    await waitForComponents();

    element = await fixture(html`<neo-support-page></neo-support-page>`);
    await element.updateComplete;
  });

  it("renders support sections", () => {
    const ticketList = element.shadowRoot.querySelector(".ticket-list");
    const faqSection = element.shadowRoot.querySelector(".faq-section");
    const contactForm = element.shadowRoot.querySelector(".contact-form");

    expect(ticketList).to.exist;
    expect(faqSection).to.exist;
    expect(contactForm).to.exist;
  });

  it("displays support tickets", () => {
    const tickets = element.shadowRoot.querySelectorAll(".ticket-item");
    expect(tickets.length).to.equal(mockTickets.length);

    const firstTicket = tickets[0];
    expect(firstTicket.querySelector(".ticket-title").textContent).to.equal(
      mockTickets[0].title
    );
    expect(firstTicket.querySelector(".ticket-status").textContent).to.include(
      mockTickets[0].status
    );
  });

  it("handles ticket creation", async () => {
    const newTicketButton =
      element.shadowRoot.querySelector(".new-ticket-button");

    setTimeout(() => newTicketButton.click());
    const { detail } = await oneEvent(element, "show-modal");

    expect(detail.type).to.equal("new-ticket");
  });

  it("filters tickets by status", async () => {
    const statusFilter = element.shadowRoot.querySelector(".status-filter");
    statusFilter.value = "closed";
    statusFilter.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const visibleTickets = element.shadowRoot.querySelectorAll(
      ".ticket-item:not(.hidden)"
    );
    expect(visibleTickets.length).to.equal(1);
    expect(
      visibleTickets[0].querySelector(".ticket-status").textContent
    ).to.include("closed");
  });

  it("sorts tickets by priority", async () => {
    const prioritySort = element.shadowRoot.querySelector(".priority-sort");
    prioritySort.click();
    await element.updateComplete;

    const tickets = element.shadowRoot.querySelectorAll(".ticket-item");
    expect(tickets[0].querySelector(".ticket-priority").textContent).to.include(
      "high"
    );
  });

  it("displays FAQ section with categories", () => {
    const categories = element.shadowRoot.querySelectorAll(".faq-category");
    const questions = element.shadowRoot.querySelectorAll(".faq-question");

    expect(categories.length).to.be.greaterThan(0);
    expect(questions.length).to.be.greaterThan(0);
  });

  it("handles contact form submission", async () => {
    const form = element.shadowRoot.querySelector(".contact-form");
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    nameInput.value = "Test User";
    emailInput.value = "test@example.com";
    messageInput.value = "Test message";

    setTimeout(() => form.submit());
    const { detail } = await oneEvent(element, "contact-submit");

    expect(detail.name).to.equal("Test User");
    expect(detail.email).to.equal("test@example.com");
    expect(detail.message).to.equal("Test message");
  });

  it("shows ticket details", async () => {
    const firstTicket = element.shadowRoot.querySelector(".ticket-item");
    const detailsButton = firstTicket.querySelector(".details-button");

    setTimeout(() => detailsButton.click());
    const { detail } = await oneEvent(element, "show-modal");

    expect(detail.type).to.equal("ticket-details");
    expect(detail.ticketId).to.equal(mockTickets[0].id);
  });

  it("updates ticket status", async () => {
    const firstTicket = element.shadowRoot.querySelector(".ticket-item");
    const statusButton = firstTicket.querySelector(".status-toggle");

    statusButton.click();
    await element.updateComplete;

    expect(firstTicket.querySelector(".ticket-status").textContent).to.include(
      "closed"
    );
  });

  it("handles search functionality", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "API";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const visibleTickets = element.shadowRoot.querySelectorAll(
      ".ticket-item:not(.hidden)"
    );
    expect(visibleTickets.length).to.equal(1);
    expect(
      visibleTickets[0].querySelector(".ticket-title").textContent
    ).to.include("API");
  });

  it("shows loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    expect(loader).to.exist;
    expect(loader.hasAttribute("hidden")).to.be.false;
  });

  it("handles error state", async () => {
    const error = "Failed to load support tickets";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
  });

  it("supports mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = (query) => ({
      matches: query.includes("max-width"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".page-container");
    expect(container.classList.contains("mobile")).to.be.true;
  });

  it("maintains accessibility attributes", () => {
    const tickets = element.shadowRoot.querySelectorAll(".ticket-item");
    tickets.forEach((ticket) => {
      expect(ticket.getAttribute("role")).to.equal("article");
      expect(ticket.getAttribute("aria-labelledby")).to.exist;
    });

    const buttons = element.shadowRoot.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const tickets = element.shadowRoot.querySelectorAll(".ticket-item");
    const firstTicket = tickets[0];

    firstTicket.focus();
    firstTicket.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown" })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(tickets[1]);
  });

  it("validates contact form inputs", async () => {
    const form = element.shadowRoot.querySelector(".contact-form");
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.click();
    await element.updateComplete;

    const errorMessages = form.querySelectorAll(".error-message");
    expect(errorMessages.length).to.be.greaterThan(0);
  });
});
