import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import sinon from "sinon";
import "../../components/marketing/testimonials.js";

describe("Testimonials", () => {
  const mockTestimonials = [
    {
      content: "Great product!",
      author: "John Doe",
      role: "Developer",
      company: "TechCorp",
      avatar: "https://example.com/avatar1.jpg",
      rating: 5,
    },
    {
      content: "Amazing service!",
      author: "Jane Smith",
      role: "Designer",
      company: "DesignCo",
      avatar: "https://example.com/avatar2.jpg",
      rating: 4,
    },
  ];

  let element;
  let clock;

  beforeEach(async () => {
    clock = sinon.useFakeTimers();
    element = await fixture(html`
      <ui-testimonials
        .items=${mockTestimonials}
        layout="grid"
        variant="default"
        .columns=${3}
      ></ui-testimonials>
    `);
  });

  afterEach(() => {
    clock.restore();
  });

  it("renders testimonials in grid layout", () => {
    const testimonials = element.shadowRoot.querySelectorAll(".testimonial");
    expect(testimonials.length).to.equal(mockTestimonials.length);

    const container = element.shadowRoot.querySelector(".testimonials-grid");
    expect(container).to.exist;
    expect(container.style.gridTemplateColumns).to.include("repeat(3,");
  });

  it("renders testimonial content correctly", () => {
    const firstTestimonial = element.shadowRoot.querySelector(".testimonial");

    expect(
      firstTestimonial.querySelector(".testimonial-content").textContent
    ).to.equal(mockTestimonials[0].content);
    expect(firstTestimonial.querySelector(".author-name").textContent).to.equal(
      mockTestimonials[0].author
    );
    expect(
      firstTestimonial.querySelector(".author-meta").textContent
    ).to.include(mockTestimonials[0].role);
    expect(
      firstTestimonial.querySelector(".author-meta").textContent
    ).to.include(mockTestimonials[0].company);
  });

  it("renders correct number of stars for rating", () => {
    const firstTestimonial = element.shadowRoot.querySelector(".testimonial");
    const stars = firstTestimonial.querySelectorAll(".star-filled");
    expect(stars.length).to.equal(mockTestimonials[0].rating);
  });

  it("switches layouts correctly", async () => {
    // Test carousel layout
    element.layout = "carousel";
    await element.updateComplete;

    expect(element.shadowRoot.querySelector(".testimonials-carousel")).to.exist;
    expect(element.shadowRoot.querySelector(".carousel-controls")).to.exist;

    // Test masonry layout
    element.layout = "masonry";
    await element.updateComplete;

    expect(element.shadowRoot.querySelector(".testimonials-masonry")).to.exist;
  });

  it("handles autoplay in carousel layout", async () => {
    element.layout = "carousel";
    element.autoplay = true;
    element.interval = 100;
    await element.updateComplete;

    const initialSlide = element._currentSlide;
    clock.tick(150);
    await element.updateComplete;

    expect(element._currentSlide).to.not.equal(initialSlide);
  });

  it("handles manual navigation in carousel layout", async () => {
    element.layout = "carousel";
    await element.updateComplete;

    const nextButton = element.shadowRoot.querySelector(".carousel-next");
    const prevButton = element.shadowRoot.querySelector(".carousel-prev");

    // Click next
    nextButton.click();
    await element.updateComplete;
    expect(element._currentSlide).to.equal(1);

    // Click prev
    prevButton.click();
    await element.updateComplete;
    expect(element._currentSlide).to.equal(0);
  });

  it("applies different variants correctly", async () => {
    // Test minimal variant
    element.variant = "minimal";
    await element.updateComplete;

    expect(element.shadowRoot.querySelector(".variant-minimal")).to.exist;

    // Test card variant
    element.variant = "card";
    await element.updateComplete;

    expect(element.shadowRoot.querySelector(".variant-card")).to.exist;
  });

  it("handles empty items array", async () => {
    element.items = [];
    await element.updateComplete;

    const testimonials = element.shadowRoot.querySelectorAll(".testimonial");
    expect(testimonials.length).to.equal(0);

    const emptyMessage = element.shadowRoot.querySelector(".empty-message");
    expect(emptyMessage).to.exist;
  });

  it("handles responsive columns", async () => {
    // Test different column counts
    element.columns = 2;
    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".testimonials-grid");
    expect(container.style.gridTemplateColumns).to.include("repeat(2,");

    element.columns = 4;
    await element.updateComplete;

    expect(container.style.gridTemplateColumns).to.include("repeat(4,");
  });

  it("cleans up autoplay on disconnect", async () => {
    element.layout = "carousel";
    element.autoplay = true;
    element.interval = 100;
    await element.updateComplete;

    const clearIntervalSpy = sinon.spy(window, "clearInterval");
    element.disconnectedCallback();

    expect(clearIntervalSpy.called).to.be.true;
    clearIntervalSpy.restore();
  });

  it("handles keyboard navigation in carousel layout", async () => {
    element.layout = "carousel";
    await element.updateComplete;

    const carousel = element.shadowRoot.querySelector(".testimonials-carousel");

    // Test right arrow
    carousel.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    await element.updateComplete;
    expect(element._currentSlide).to.equal(1);

    // Test left arrow
    carousel.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    await element.updateComplete;
    expect(element._currentSlide).to.equal(0);
  });

  it("maintains accessibility attributes", async () => {
    element.layout = "carousel";
    await element.updateComplete;

    const carousel = element.shadowRoot.querySelector(".testimonials-carousel");
    expect(carousel.getAttribute("role")).to.equal("region");
    expect(carousel.getAttribute("aria-label")).to.equal("Testimonials");

    const carouselContainer = element.shadowRoot.querySelector(
      ".carousel-container"
    );
    expect(carouselContainer.getAttribute("role")).to.equal("list");

    const carouselItems = element.shadowRoot.querySelectorAll(".carousel-item");
    expect(carouselItems[0].getAttribute("role")).to.equal("listitem");
    expect(carouselItems[0].getAttribute("aria-current")).to.equal("true");

    const controls = element.shadowRoot.querySelector(".carousel-controls");
    expect(controls.getAttribute("role")).to.equal("group");
    expect(controls.getAttribute("aria-label")).to.equal("Carousel Navigation");
  });
});
