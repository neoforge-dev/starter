/**
 * Feature detection utility for modern CSS features
 * @module utils/feature-detection
 */

/**
 * Detects support for modern CSS features and adds appropriate classes to the document
 */
export function detectFeatures() {
  const features = {
    containerQueries: CSS.supports("(container-type: inline-size)"),
    subgrid: CSS.supports("(grid-template-columns: subgrid)"),
    viewTransitions: "startViewTransition" in document,
    hasSelector: CSS.supports("selector(:has(*))"),
  };

  // Add feature support classes to document root
  const html = document.documentElement;

  Object.entries(features).forEach(([feature, supported]) => {
    const className = `supports-${feature.toLowerCase()}`;
    if (supported) {
      html.classList.add(className);
    } else {
      html.classList.remove(className);
      applyFallback(feature);
    }
  });

  return features;
}

/**
 * Applies fallback behavior for unsupported features
 * @param {string} feature - The unsupported feature
 */
function applyFallback(feature) {
  switch (feature) {
    case "containerQueries":
      applyContainerQueriesFallback();
      break;
    case "subgrid":
      applySubgridFallback();
      break;
    case "viewTransitions":
      applyViewTransitionsFallback();
      break;
    case "hasSelector":
      applyHasSelectorFallback();
      break;
  }
}

/**
 * Applies fallback for container queries using ResizeObserver
 */
function applyContainerQueriesFallback() {
  const containers = document.querySelectorAll(".container");
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const container = entry.target;
      const width = entry.contentRect.width;
      const responsiveElements = container.querySelectorAll(
        ".responsive-element"
      );

      responsiveElements.forEach((element) => {
        // Remove existing size classes
        element.classList.remove("size-small", "size-medium", "size-large");

        // Apply appropriate size class
        if (width < 480) {
          element.classList.add("size-small");
        } else if (width < 800) {
          element.classList.add("size-medium");
        } else {
          element.classList.add("size-large");
        }
      });
    });
  });

  containers.forEach((container) => resizeObserver.observe(container));
}

/**
 * Applies fallback for subgrid using JavaScript-based grid alignment
 */
function applySubgridFallback() {
  const nestedGrids = document.querySelectorAll(".nested-grid");

  nestedGrids.forEach((grid) => {
    const parent = grid.closest(".grid-container");
    if (parent) {
      const parentStyle = window.getComputedStyle(parent);
      const parentGap = parentStyle.gap;
      const parentColumns = parentStyle.gridTemplateColumns.split(" ").length;

      grid.style.gap = parentGap;
      grid.style.gridTemplateColumns = `repeat(${parentColumns}, 1fr)`;
    }
  });
}

/**
 * Applies fallback for view transitions using CSS transitions
 */
function applyViewTransitionsFallback() {
  // Add transition classes to elements
  document.querySelectorAll(".page, .header, .footer").forEach((element) => {
    element.classList.add("page-transition");
  });

  // Handle navigation
  window.addEventListener("navigate", () => {
    const elements = document.querySelectorAll(".page-transition");

    // Exit transition
    elements.forEach((element) => element.classList.remove("active"));

    // Enter transition
    setTimeout(() => {
      elements.forEach((element) => element.classList.add("active"));
    }, 50);
  });
}

/**
 * Applies fallback for :has() selector using mutation observers and event listeners
 */
function applyHasSelectorFallback() {
  // Form validation fallback
  document.querySelectorAll(".form-group").forEach((group) => {
    const input = group.querySelector("input");
    if (input) {
      input.addEventListener("invalid", () => {
        group.classList.add("has-invalid");
      });
      input.addEventListener("input", () => {
        group.classList.remove("has-invalid");
      });
      input.addEventListener("focus", () => {
        group.classList.add("has-focus");
      });
      input.addEventListener("blur", () => {
        group.classList.remove("has-focus");
      });
    }
  });

  // Card with image fallback
  document.querySelectorAll(".card").forEach((card) => {
    if (card.querySelector("img")) {
      card.classList.add("has-image");
    }
  });

  // Empty state fallback
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const container = mutation.target.closest(".container");
      if (container) {
        container.classList.toggle("is-empty", container.children.length === 0);
      }
    });
  });

  document.querySelectorAll(".container").forEach((container) => {
    observer.observe(container, { childList: true, subtree: true });
    container.classList.toggle("is-empty", container.children.length === 0);
  });

  // Navigation hover fallback
  document.querySelectorAll(".nav-item").forEach((item) => {
    const dropdown = item.querySelector(".dropdown");
    if (dropdown) {
      dropdown.addEventListener("mouseenter", () => {
        item.classList.add("has-dropdown-hover");
      });
      dropdown.addEventListener("mouseleave", () => {
        item.classList.remove("has-dropdown-hover");
      });
    }
  });
}

// Initialize feature detection
detectFeatures();

// Re-run detection on dynamic imports
document.addEventListener("DOMContentLoaded", detectFeatures);
window.addEventListener("load", detectFeatures);
