import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/contact-page.js";

describe("Contact Page", () => {
  let element;
  const mockOffices = [
    {
      id: "sf",
      city: "San Francisco",
      address: "123 Market St, CA 94105",
      phone: "+1 (415) 555-0123",
      email: "sf@neoforge.com",
      timezone: "PST",
      hours: "9:00 AM - 6:00 PM",
    },
    {
      id: "ldn",
      city: "London",
      address: "456 Oxford St, London W1C 1AP",
      phone: "+44 20 7123 4567",
      email: "london@neoforge.com",
      timezone: "GMT",
      hours: "9:00 AM - 6:00 PM",
    },
  ];

  const mockDepartments = [
    {
      id: "sales",
      name: "Sales",
      email: "sales@neoforge.com",
      description: "For pricing and licensing inquiries",
    },
    {
      id: "support",
      name: "Technical Support",
      email: "support@neoforge.com",
      description: "For technical issues and bug reports",
    },
    {
      id: "partnerships",
      name: "Partnerships",
      email: "partners@neoforge.com",
      description: "For partnership opportunities",
    },
  ];

  beforeEach(async () => {
    // Mock API client
    window.api = {
      getOffices: async () => mockOffices,
      getDepartments: async () => mockDepartments,
      submitContactForm: async (data) => ({
        success: true,
        ticketId: "TKT-123",
      }),
      subscribeNewsletter: async (email) => ({ success: true }),
    };

    element = await fixture(html`<contact-page></contact-page>`);
    await element.updateComplete;
  });

  it("renders contact sections", () => {
    const form = element.shadowRoot.querySelector(".contact-form");
    const offices = element.shadowRoot.querySelector(".office-locations");
    const departments = element.shadowRoot.querySelector(".departments");
    const faq = element.shadowRoot.querySelector(".contact-faq");

    expect(form).to.exist;
    expect(offices).to.exist;
    expect(departments).to.exist;
    expect(faq).to.exist;
  });

  it("displays office locations", () => {
    const offices = element.shadowRoot.querySelectorAll(".office-card");
    expect(offices.length).to.equal(mockOffices.length);

    const firstOffice = offices[0];
    expect(firstOffice.querySelector(".office-city").textContent).to.equal(
      mockOffices[0].city
    );
    expect(firstOffice.querySelector(".office-address").textContent).to.include(
      mockOffices[0].address
    );
  });

  it("shows department contacts", () => {
    const departments = element.shadowRoot.querySelectorAll(".department-card");
    expect(departments.length).to.equal(mockDepartments.length);

    const firstDepartment = departments[0];
    expect(
      firstDepartment.querySelector(".department-name").textContent
    ).to.equal(mockDepartments[0].name);
    expect(
      firstDepartment.querySelector(".department-email").textContent
    ).to.equal(mockDepartments[0].email);
  });

  it("handles contact form submission", async () => {
    const form = element.shadowRoot.querySelector(".contact-form");
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const departmentSelect = form.querySelector('select[name="department"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    nameInput.value = "Test User";
    emailInput.value = "test@example.com";
    departmentSelect.value = "support";
    messageInput.value = "Test message";

    setTimeout(() => form.submit());
    const { detail } = await oneEvent(element, "contact-submit");

    expect(detail.name).to.equal("Test User");
    expect(detail.email).to.equal("test@example.com");
    expect(detail.department).to.equal("support");
    expect(detail.message).to.equal("Test message");
  });

  it("validates form inputs", async () => {
    const form = element.shadowRoot.querySelector(".contact-form");
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.click();
    await element.updateComplete;

    const errorMessages = form.querySelectorAll(".error-message");
    expect(errorMessages.length).to.be.greaterThan(0);
  });

  it("shows success message after form submission", async () => {
    const form = element.shadowRoot.querySelector(".contact-form");
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    nameInput.value = "Test User";
    emailInput.value = "test@example.com";
    messageInput.value = "Test message";

    form.submit();
    await element.updateComplete;

    const successMessage = element.shadowRoot.querySelector(".success-message");
    expect(successMessage).to.exist;
    expect(successMessage.textContent).to.include("TKT-123");
  });

  it("handles newsletter subscription", async () => {
    const newsletterForm = element.shadowRoot.querySelector(".newsletter-form");
    const emailInput = newsletterForm.querySelector('input[type="email"]');

    emailInput.value = "test@example.com";
    setTimeout(() => newsletterForm.submit());
    const { detail } = await oneEvent(element, "newsletter-subscribe");

    expect(detail.email).to.equal("test@example.com");
  });

  it("displays office hours in local timezone", () => {
    const offices = element.shadowRoot.querySelectorAll(".office-card");
    offices.forEach((office, index) => {
      const hours = office.querySelector(".office-hours");
      expect(hours.textContent).to.include(mockOffices[index].hours);
      expect(hours.textContent).to.include(mockOffices[index].timezone);
    });
  });

  it("supports map integration", () => {
    const map = element.shadowRoot.querySelector(".office-map");
    const markers = map.querySelectorAll(".map-marker");

    expect(markers.length).to.equal(mockOffices.length);
  });

  it("handles loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".content-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("displays error messages", async () => {
    const error = "Failed to load contact information";
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
    const sections = element.shadowRoot.querySelectorAll("section");
    sections.forEach((section) => {
      expect(section.getAttribute("aria-labelledby")).to.exist;
    });

    const inputs = element.shadowRoot.querySelectorAll(
      "input, select, textarea"
    );
    inputs.forEach((input) => {
      expect(input.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const form = element.shadowRoot.querySelector(".contact-form");
    const inputs = form.querySelectorAll("input, select, textarea");
    const firstInput = inputs[0];

    firstInput.focus();
    firstInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    await element.updateComplete;

    expect(document.activeElement).to.equal(inputs[1]);
  });

  it("handles file attachments", async () => {
    const form = element.shadowRoot.querySelector(".contact-form");
    const fileInput = form.querySelector('input[type="file"]');
    const file = new File([""], "test.pdf", { type: "application/pdf" });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    fileInput.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const filePreview = form.querySelector(".file-preview");
    expect(filePreview.textContent).to.include("test.pdf");
  });

  it("validates file types", async () => {
    const form = element.shadowRoot.querySelector(".contact-form");
    const fileInput = form.querySelector('input[type="file"]');
    const file = new File([""], "test.exe", {
      type: "application/x-msdownload",
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    fileInput.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const errorMessage = form.querySelector(".file-error");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include("file type not allowed");
  });

  it("supports live chat widget", async () => {
    const chatButton = element.shadowRoot.querySelector(".chat-button");

    setTimeout(() => chatButton.click());
    const { detail } = await oneEvent(element, "chat-open");

    expect(detail.type).to.equal("support-chat");
  });
});
