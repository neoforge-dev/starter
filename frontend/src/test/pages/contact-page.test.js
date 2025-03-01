import { html, expect, oneEvent, TestUtils } from "../setup.mjs";
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
    // Set test environment flag
    process.env.TEST = true;

    // Mock contact service
    window.contact = {
      submitForm: vi.fn().mockResolvedValue({ success: true }),
      subscribeNewsletter: vi.fn().mockResolvedValue({ success: true }),
      getOfficeLocations: vi.fn().mockResolvedValue([
        {
          id: "1",
          name: "San Francisco HQ",
          address: "123 Tech St",
          city: "San Francisco",
          country: "USA",
          phone: "+1 (555) 123-4567",
          email: "sf@neoforge.dev",
          hours: "9:00 AM - 6:00 PM PST",
          coordinates: {
            lat: 37.7749,
            lng: -122.4194,
          },
        },
        {
          id: "2",
          name: "London Office",
          address: "456 Dev Lane",
          city: "London",
          country: "UK",
          phone: "+44 20 7123 4567",
          email: "london@neoforge.dev",
          hours: "9:00 AM - 6:00 PM GMT",
          coordinates: {
            lat: 51.5074,
            lng: -0.1278,
          },
        },
      ]),
      getDepartments: vi.fn().mockResolvedValue([
        {
          id: "1",
          name: "Sales",
          email: "sales@neoforge.dev",
          phone: "+1 (555) 123-4568",
        },
        {
          id: "2",
          name: "Support",
          email: "support@neoforge.dev",
          phone: "+1 (555) 123-4569",
        },
      ]),
    };

    // Create and mount the element
    element = await TestUtils.fixture(html`<contact-page></contact-page>`);
    await TestUtils.waitForComponent(element);

    // Force another update after setting mock data
    await TestUtils.waitForComponent(element);
  });

  afterEach(() => {
    process.env.TEST = false;
  });

  it("renders contact sections", async () => {
    const form = await TestUtils.queryComponent(element, ".contact-form");
    const offices = await TestUtils.queryComponent(
      element,
      ".office-locations"
    );
    const departments = await TestUtils.queryComponent(element, ".departments");

    expect(form).to.exist;
    expect(offices).to.exist;
    expect(departments).to.exist;
  });

  it("displays office locations", async () => {
    const locations = await TestUtils.queryAllComponents(
      element,
      ".office-location"
    );
    expect(locations.length).to.equal(2);

    const firstLocation = locations[0];
    expect(firstLocation.querySelector(".office-name").textContent).to.equal(
      "San Francisco HQ"
    );
  });

  it("shows department contacts", async () => {
    const departments = await TestUtils.queryAllComponents(
      element,
      ".department"
    );
    expect(departments.length).to.equal(2);

    const firstDepartment = departments[0];
    expect(
      firstDepartment.querySelector(".department-name").textContent
    ).to.equal("Sales");
  });

  it("handles contact form submission", async () => {
    const form = await TestUtils.queryComponent(element, ".contact-form");
    const nameInput = form.querySelector("input[name='name']");
    const emailInput = form.querySelector("input[name='email']");
    const messageInput = form.querySelector("textarea[name='message']");
    const submitButton = form.querySelector("button[type='submit']");

    nameInput.value = "John Doe";
    emailInput.value = "john@example.com";
    messageInput.value = "Hello, I have a question.";

    nameInput.dispatchEvent(new Event("input"));
    emailInput.dispatchEvent(new Event("input"));
    messageInput.dispatchEvent(new Event("input"));
    submitButton.click();

    const { detail } = await oneEvent(element, "form-submit");
    expect(detail.name).to.equal("John Doe");
    expect(detail.email).to.equal("john@example.com");
    expect(detail.message).to.equal("Hello, I have a question.");
  });

  it("validates form inputs", async () => {
    const form = await TestUtils.queryComponent(element, ".contact-form");
    const emailInput = form.querySelector("input[name='email']");
    const submitButton = form.querySelector("button[type='submit']");

    emailInput.value = "invalid-email";
    emailInput.dispatchEvent(new Event("input"));
    submitButton.click();

    const error = await TestUtils.queryComponent(element, ".form-error");
    expect(error).to.exist;
    expect(error.textContent).to.include("valid email");
  });

  it("shows success message after form submission", async () => {
    const form = await TestUtils.queryComponent(element, ".contact-form");
    const nameInput = form.querySelector("input[name='name']");
    const emailInput = form.querySelector("input[name='email']");
    const messageInput = form.querySelector("textarea[name='message']");
    const submitButton = form.querySelector("button[type='submit']");

    nameInput.value = "John Doe";
    emailInput.value = "john@example.com";
    messageInput.value = "Hello";

    nameInput.dispatchEvent(new Event("input"));
    emailInput.dispatchEvent(new Event("input"));
    messageInput.dispatchEvent(new Event("input"));
    submitButton.click();

    await TestUtils.waitForComponent(element);

    const success = await TestUtils.queryComponent(element, ".success-message");
    expect(success).to.exist;
    expect(success.textContent).to.include("Thank you");
  });

  it("handles newsletter subscription", async () => {
    const form = await TestUtils.queryComponent(element, ".newsletter-form");
    const emailInput = form.querySelector("input[type='email']");
    const submitButton = form.querySelector("button[type='submit']");

    emailInput.value = "john@example.com";
    emailInput.dispatchEvent(new Event("input"));
    submitButton.click();

    const { detail } = await oneEvent(element, "newsletter-subscribe");
    expect(detail.email).to.equal("john@example.com");
  });

  it("displays office hours in local timezone", async () => {
    const locations = await TestUtils.queryAllComponents(
      element,
      ".office-location"
    );
    const firstLocation = locations[0];
    const hours = firstLocation.querySelector(".office-hours");

    expect(hours.textContent).to.include("PST");
  });

  it("supports map integration", async () => {
    const map = await TestUtils.queryComponent(element, ".office-map");
    expect(map).to.exist;

    const markers = map.querySelectorAll(".map-marker");
    expect(markers.length).to.equal(2);
  });

  it("handles loading state", async () => {
    window.contact.getOfficeLocations = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return [];
    });

    element = await TestUtils.fixture(html`<contact-page></contact-page>`);
    const loading = await TestUtils.queryComponent(
      element,
      ".loading-indicator"
    );
    expect(loading).to.exist;

    await TestUtils.waitForComponent(element);
    expect(loading.classList.contains("hidden")).to.be.true;
  });

  it("displays error messages", async () => {
    window.contact.getOfficeLocations = vi
      .fn()
      .mockRejectedValue(new Error("Failed to load"));

    element = await TestUtils.fixture(html`<contact-page></contact-page>`);
    await TestUtils.waitForComponent(element);

    const error = await TestUtils.queryComponent(element, ".error-message");
    expect(error).to.exist;
    expect(error.textContent).to.include("Failed to load");
  });

  it("supports mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("max-width: 768px"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    await TestUtils.waitForComponent(element);

    const container = await TestUtils.queryComponent(
      element,
      ".page-container"
    );
    expect(container.classList.contains("mobile")).to.be.true;
  });

  it("maintains accessibility attributes", async () => {
    const sections = await TestUtils.queryAllComponents(element, "section");
    sections.forEach((section) => {
      expect(section.getAttribute("role")).to.equal("region");
      expect(section.getAttribute("aria-labelledby")).to.exist;
    });

    const buttons = await TestUtils.queryAllComponents(element, "button");
    buttons.forEach((button) => {
      expect(button.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const form = await TestUtils.queryComponent(element, ".contact-form");
    const inputs = form.querySelectorAll("input, textarea");
    const firstInput = inputs[0];
    const lastInput = inputs[inputs.length - 1];

    firstInput.focus();
    firstInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(document.activeElement).to.equal(inputs[1]);

    lastInput.focus();
    lastInput.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: true })
    );
    expect(document.activeElement).to.equal(inputs[inputs.length - 2]);
  });

  it("handles file attachments", async () => {
    const form = await TestUtils.queryComponent(element, ".contact-form");
    const fileInput = form.querySelector("input[type='file']");
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });

    fileInput.dispatchEvent(
      new CustomEvent("change", {
        detail: { files: [file] },
      })
    );

    const attachmentPreview = await TestUtils.queryComponent(
      element,
      ".attachment-preview"
    );
    expect(attachmentPreview).to.exist;
    expect(attachmentPreview.textContent).to.include("test.pdf");
  });

  it("validates file types", async () => {
    const form = await TestUtils.queryComponent(element, ".contact-form");
    const fileInput = form.querySelector("input[type='file']");
    const file = new File(["test"], "test.exe", {
      type: "application/x-msdownload",
    });

    fileInput.dispatchEvent(
      new CustomEvent("change", {
        detail: { files: [file] },
      })
    );

    const error = await TestUtils.queryComponent(element, ".file-error");
    expect(error).to.exist;
    expect(error.textContent).to.include("file type not allowed");
  });

  it("supports live chat widget", async () => {
    const chatButton = await TestUtils.queryComponent(element, ".chat-button");
    chatButton.click();
    await TestUtils.waitForComponent(element);

    const chatWidget = await TestUtils.queryComponent(element, ".chat-widget");
    expect(chatWidget).to.exist;
    expect(chatWidget.classList.contains("open")).to.be.true;
  });
});
