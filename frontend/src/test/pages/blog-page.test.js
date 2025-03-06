import { expect, describe, it, beforeEach, vi } from "vitest";

// Define mockPosts at the top level so it's accessible to both the MockBlogPage class and the tests
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

/**
 * Mock for the BlogPage component
 */
class MockBlogPage {
  constructor() {
    // Properties
    this.posts = [];
    this.categories = [];
    this.selectedCategory = null;
    this.loading = false;

    // Event listeners
    this._eventListeners = new Map();
  }

  // Event handling
  addEventListener(event, callback) {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (!this._eventListeners.has(event)) return;
    const listeners = this._eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  dispatchEvent(event) {
    const listeners = this._eventListeners.get(event.type) || [];
    listeners.forEach((callback) => callback(event));
    return !event.defaultPrevented;
  }

  // Mock shadow DOM
  get shadowRoot() {
    return {
      querySelector: (selector) => {
        if (selector === "h1") {
          return { textContent: "Blog" };
        }
        if (selector === ".blog-post") {
          return this.posts.length > 0 ? {} : null;
        }
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".blog-post") {
          return this.posts.map(() => ({}));
        }
        if (selector === ".category") {
          return this.categories.map(() => ({}));
        }
        return [];
      },
    };
  }

  // Component methods
  async loadPosts(category = null) {
    this.loading = true;
    try {
      // Simulate API call
      this.posts = category
        ? mockPosts.filter((post) => post.category === category)
        : mockPosts;
      this.selectedCategory = category;
    } catch (error) {
      console.error("Failed to load posts:", error);
      this.posts = [];
    } finally {
      this.loading = false;
    }
    this.requestUpdate();
  }

  async loadCategories() {
    try {
      // Extract unique categories from posts
      const categorySet = new Set(mockPosts.map((post) => post.category));
      this.categories = Array.from(categorySet);
    } catch (error) {
      console.error("Failed to load categories:", error);
      this.categories = [];
    }
    this.requestUpdate();
  }

  selectCategory(category) {
    this.loadPosts(category);
    this.dispatchEvent(
      new CustomEvent("category-selected", {
        detail: { category },
        bubbles: true,
        composed: true,
      })
    );
  }

  // Mock update lifecycle
  requestUpdate() {
    // This would trigger a re-render in the actual component
    return Promise.resolve();
  }

  // For testing
  get updateComplete() {
    return Promise.resolve(true);
  }
}

/**
 * Mock CustomEvent for testing
 */
class MockCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail || {};
    this.bubbles = options.bubbles || false;
    this.composed = options.composed || false;
    this.defaultPrevented = false;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }
}

describe("Blog Page", () => {
  let element;

  beforeEach(() => {
    element = new MockBlogPage();
  });

  it("should initialize with empty posts and categories", () => {
    expect(element.posts).toEqual([]);
    expect(element.categories).toEqual([]);
    expect(element.selectedCategory).toBeNull();
    expect(element.loading).toBe(false);
  });

  it("should load all posts when no category is specified", async () => {
    await element.loadPosts();
    expect(element.posts).toEqual(mockPosts);
    expect(element.selectedCategory).toBeNull();
  });

  it("should filter posts by category when specified", async () => {
    await element.loadPosts("tutorials");
    expect(element.posts).toHaveLength(1);
    expect(element.posts[0].id).toBe("1");
    expect(element.selectedCategory).toBe("tutorials");
  });

  it("should extract unique categories from posts", async () => {
    await element.loadCategories();
    expect(element.categories).toContain("tutorials");
    expect(element.categories).toContain("advanced");
    expect(element.categories).toHaveLength(2);
  });

  it("should dispatch event when category is selected", () => {
    const dispatchEventSpy = vi.spyOn(element, "dispatchEvent");
    element.selectCategory("tutorials");

    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    const event = dispatchEventSpy.mock.calls[0][0];
    expect(event.type).toBe("category-selected");
    expect(event.detail).toEqual({ category: "tutorials" });
  });

  it("should load posts when category is selected", async () => {
    const loadPostsSpy = vi.spyOn(element, "loadPosts");
    element.selectCategory("tutorials");

    expect(loadPostsSpy).toHaveBeenCalledWith("tutorials");
  });
});
