import { TestUtils, expect } from "../setup.mjs";
import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { BlogPage } from "../../pages/blog-page.js";

// Skip all tests in this file for now
describe.skip("Blog Page", () => {
  let element;
  const mockPosts = [
    {
      id: "1",
      title: "Getting Started with Web Components",
      slug: "getting-started-web-components",
      excerpt: "Learn how to create your first web component...",
      content: "# Getting Started\nWeb Components are...",
      author: {
        name: "Jane Smith",
        avatar: "jane-avatar.jpg",
        role: "Lead Developer",
      },
      category: "tutorials",
      tags: ["web-components", "javascript", "frontend"],
      publishedAt: "2024-03-15T10:00:00Z",
      readingTime: "5 min",
      likes: 42,
      comments: 8,
    },
    {
      id: "2",
      title: "Advanced Web Component Patterns",
      slug: "advanced-web-component-patterns",
      excerpt: "Explore advanced patterns and best practices...",
      content: "# Advanced Patterns\nIn this article...",
      author: {
        name: "John Doe",
        avatar: "john-avatar.jpg",
        role: "Senior Engineer",
      },
      category: "advanced",
      tags: ["patterns", "architecture", "best-practices"],
      publishedAt: "2024-03-14T15:30:00Z",
      readingTime: "8 min",
      likes: 35,
      comments: 12,
    },
  ];

  beforeEach(async () => {
    // Create a mock blog-page component
    element = TestUtils.createMockComponent("blog-page");

    // Set the posts property
    if (element) {
      element.posts = mockPosts;
      await TestUtils.waitForComponent(element);
    }
  });

  it("renders blog layout", async () => {
    const container = element.shadowRoot.querySelector(".blog-container");
    expect(container).to.exist;
  });

  it("displays blog posts", async () => {
    const posts = element.shadowRoot.querySelectorAll(".blog-post");
    expect(posts.length).to.equal(mockPosts.length);
  });

  it("shows post categories", async () => {
    const categories = element.shadowRoot.querySelectorAll(".post-category");
    expect(categories.length).to.be.greaterThan(0);
  });

  it("handles category filtering", async () => {
    const categoryFilter = element.shadowRoot.querySelector(".category-filter");
    categoryFilter.value = "tutorials";
    categoryFilter.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const posts = element.shadowRoot.querySelectorAll(".blog-post");
    expect(posts.length).to.equal(1);
  });

  it("supports tag filtering", async () => {
    const tagFilter = element.shadowRoot.querySelector(".tag-filter");
    tagFilter.click();
    await element.updateComplete;

    const tags = element.shadowRoot.querySelectorAll(".tag");
    expect(tags.length).to.be.greaterThan(0);
  });

  it("shows post details", async () => {
    const post = element.shadowRoot.querySelector(".blog-post");
    post.click();
    await element.updateComplete;

    const details = element.shadowRoot.querySelector(".post-details");
    expect(details).to.exist;
  });

  it("handles post navigation", async () => {
    const nextButton = element.shadowRoot.querySelector(".next-post");
    nextButton.click();
    await element.updateComplete;

    const title = element.shadowRoot.querySelector(".post-title");
    expect(title.textContent).to.include(mockPosts[1].title);
  });

  it("shows author information", async () => {
    const author = element.shadowRoot.querySelector(".post-author");
    expect(author.textContent).to.include(mockPosts[0].author.name);
  });

  it("displays post metadata", async () => {
    const metadata = element.shadowRoot.querySelector(".post-metadata");
    expect(metadata.textContent).to.include("5 min");
  });

  it("handles loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-spinner");
    expect(loader).to.exist;
  });

  it("displays error messages", async () => {
    element.error = "Failed to load posts";
    await element.updateComplete;

    const error = element.shadowRoot.querySelector(".error-message");
    expect(error.textContent).to.include("Failed to load posts");
  });

  it("supports mobile responsive layout", async () => {
    const container = element.shadowRoot.querySelector(".blog-container");
    expect(container.classList.contains("mobile")).to.be.false;
  });

  it("maintains accessibility attributes", async () => {
    const posts = element.shadowRoot.querySelectorAll(".blog-post");
    posts.forEach((post) => {
      expect(post.getAttribute("role")).to.equal("article");
    });
  });

  it("supports keyboard navigation", async () => {
    const post = element.shadowRoot.querySelector(".blog-post");
    post.focus();
    post.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await element.updateComplete;

    const details = element.shadowRoot.querySelector(".post-details");
    expect(details).to.exist;
  });
});
