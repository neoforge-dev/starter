import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/blog-page.js";

describe("Blog Page", () => {
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
      publishedAt: "2024-03-01T10:00:00Z",
      readTime: "5 min read",
      likes: 42,
      comments: 15,
    },
    {
      id: "2",
      title: "Advanced State Management",
      slug: "advanced-state-management",
      excerpt: "Deep dive into state management patterns...",
      content: "# State Management\nManaging state in...",
      author: {
        name: "John Doe",
        avatar: "john-avatar.jpg",
        role: "Senior Developer",
      },
      category: "advanced",
      tags: ["state", "architecture", "patterns"],
      publishedAt: "2024-03-10T14:30:00Z",
      readTime: "8 min read",
      likes: 38,
      comments: 23,
    },
  ];

  const mockCategories = [
    { id: "tutorials", name: "Tutorials", count: 15 },
    { id: "advanced", name: "Advanced", count: 10 },
    { id: "news", name: "News", count: 8 },
  ];

  beforeEach(async () => {
    // Mock API client
    window.api = {
      getBlogPosts: async (params) => ({
        posts: mockPosts,
        total: mockPosts.length,
        page: 1,
        perPage: 10,
      }),
      getBlogPost: async (slug) => mockPosts.find((p) => p.slug === slug),
      getCategories: async () => mockCategories,
      likePost: async (id) => ({ success: true }),
      addComment: async (postId, comment) => ({
        id: "new-comment",
        ...comment,
      }),
    };

    element = await fixture(html`<blog-page></blog-page>`);
    await element.updateComplete;
  });

  it("renders blog layout", () => {
    const postList = element.shadowRoot.querySelector(".post-list");
    const sidebar = element.shadowRoot.querySelector(".blog-sidebar");
    const searchBar = element.shadowRoot.querySelector(".search-bar");

    expect(postList).to.exist;
    expect(sidebar).to.exist;
    expect(searchBar).to.exist;
  });

  it("displays blog posts", () => {
    const posts = element.shadowRoot.querySelectorAll(".blog-post");
    expect(posts.length).to.equal(mockPosts.length);

    const firstPost = posts[0];
    expect(firstPost.querySelector(".post-title").textContent).to.equal(
      mockPosts[0].title
    );
    expect(firstPost.querySelector(".post-excerpt").textContent).to.equal(
      mockPosts[0].excerpt
    );
  });

  it("shows post metadata", () => {
    const firstPost = element.shadowRoot.querySelector(".blog-post");
    const author = firstPost.querySelector(".post-author");
    const date = firstPost.querySelector(".post-date");
    const readTime = firstPost.querySelector(".read-time");

    expect(author.textContent).to.include(mockPosts[0].author.name);
    expect(date.getAttribute("datetime")).to.equal(mockPosts[0].publishedAt);
    expect(readTime.textContent).to.equal(mockPosts[0].readTime);
  });

  it("displays categories sidebar", () => {
    const categories = element.shadowRoot.querySelectorAll(".category-item");
    expect(categories.length).to.equal(mockCategories.length);

    categories.forEach((category, index) => {
      expect(category.textContent).to.include(mockCategories[index].name);
      expect(category.textContent).to.include(
        mockCategories[index].count.toString()
      );
    });
  });

  it("handles post filtering by category", async () => {
    const categoryLinks = element.shadowRoot.querySelectorAll(".category-link");
    const tutorialsLink = Array.from(categoryLinks).find((link) =>
      link.textContent.includes("Tutorials")
    );

    tutorialsLink.click();
    await element.updateComplete;

    expect(element.activeCategory).to.equal("tutorials");
  });

  it("supports post search", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "components";

    setTimeout(() => searchInput.dispatchEvent(new Event("input")));
    await element.updateComplete;

    const posts = element.shadowRoot.querySelectorAll(
      ".blog-post:not(.hidden)"
    );
    expect(posts.length).to.equal(1);
    expect(posts[0].querySelector(".post-title").textContent).to.include(
      "Components"
    );
  });

  it("handles post navigation", async () => {
    const firstPost = element.shadowRoot.querySelector(".blog-post");
    const readMoreLink = firstPost.querySelector(".read-more");

    setTimeout(() => readMoreLink.click());
    const { detail } = await oneEvent(element, "navigate");

    expect(detail.path).to.include(mockPosts[0].slug);
  });

  it("shows post interactions", () => {
    const firstPost = element.shadowRoot.querySelector(".blog-post");
    const likes = firstPost.querySelector(".post-likes");
    const comments = firstPost.querySelector(".post-comments");

    expect(likes.textContent).to.include(mockPosts[0].likes.toString());
    expect(comments.textContent).to.include(mockPosts[0].comments.toString());
  });

  it("handles post liking", async () => {
    const firstPost = element.shadowRoot.querySelector(".blog-post");
    const likeButton = firstPost.querySelector(".like-button");

    likeButton.click();
    await element.updateComplete;

    const likes = firstPost.querySelector(".post-likes");
    expect(likes.textContent).to.include((mockPosts[0].likes + 1).toString());
  });

  it("displays post tags", () => {
    const firstPost = element.shadowRoot.querySelector(".blog-post");
    const tags = firstPost.querySelectorAll(".post-tag");

    expect(tags.length).to.equal(mockPosts[0].tags.length);
    tags.forEach((tag, index) => {
      expect(tag.textContent).to.include(mockPosts[0].tags[index]);
    });
  });

  it("handles loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".post-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("displays error messages", async () => {
    const error = "Failed to load blog posts";
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
    const articles = element.shadowRoot.querySelectorAll("article");
    articles.forEach((article) => {
      expect(article.getAttribute("aria-labelledby")).to.exist;
    });

    const images = element.shadowRoot.querySelectorAll("img");
    images.forEach((img) => {
      expect(img.getAttribute("alt")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const posts = element.shadowRoot.querySelectorAll(".blog-post");
    const firstPost = posts[0];

    firstPost.focus();
    firstPost.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    await element.updateComplete;

    expect(document.activeElement).to.equal(posts[1]);
  });

  it("handles pagination", async () => {
    const pagination = element.shadowRoot.querySelector(".pagination");
    const nextButton = pagination.querySelector(".next-page");

    nextButton.click();
    await element.updateComplete;

    expect(element.currentPage).to.equal(2);
  });

  it("supports sharing posts", async () => {
    const firstPost = element.shadowRoot.querySelector(".blog-post");
    const shareButton = firstPost.querySelector(".share-button");

    // Mock navigator.share
    const originalShare = navigator.share;
    navigator.share = () => Promise.resolve();

    setTimeout(() => shareButton.click());
    const { detail } = await oneEvent(element, "share");

    expect(detail.title).to.equal(mockPosts[0].title);

    // Restore navigator.share
    navigator.share = originalShare;
  });

  it("handles comment submission", async () => {
    const firstPost = element.shadowRoot.querySelector(".blog-post");
    const commentForm = firstPost.querySelector(".comment-form");
    const commentInput = commentForm.querySelector("textarea");

    commentInput.value = "Great article!";
    setTimeout(() => commentForm.submit());
    const { detail } = await oneEvent(element, "comment-submit");

    expect(detail.postId).to.equal(mockPosts[0].id);
    expect(detail.content).to.equal("Great article!");
  });
});
