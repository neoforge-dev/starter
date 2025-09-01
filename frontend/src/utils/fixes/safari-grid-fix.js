/**
 * Safari-specific fixes for CSS Grid implementation issues
 * @module utils/fixes/safari-grid-fix
 */

/**
 * Fixes Safari's handling of grid-auto-flow: dense
 * Addresses known issues with grid item placement
 */
export function fixGridAutoFlow() {
  // Add Safari-specific grid layout rules
  const style = document.createElement("style");
  style.textContent = `
    .grid {
      display: grid;
      /* Force GPU acceleration for grid layout */
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
    }

    /* Fix for dense grid layout */
    .grid[data-auto-flow="dense"] {
      grid-auto-flow: dense;
      /* Ensure proper item placement in Safari */
      position: relative;
      z-index: 1;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Fixes Safari's grid gap inheritance issues
 */
export function fixGridGapInheritance() {
  // Add fix for grid gap inheritance
  const style = document.createElement("style");
  style.textContent = `
    /* Ensure grid gaps are properly inherited in nested grids */
    .grid > .grid {
      gap: inherit;
      grid-gap: inherit;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Fixes Safari's grid alignment issues
 */
export function fixGridAlignment() {
  // Add fix for grid alignment
  const style = document.createElement("style");
  style.textContent = `
    /* Fix alignment issues in Safari */
    .grid {
      /* Force proper alignment calculation */
      min-height: 0;
      min-width: 0;
    }

    /* Fix for align-content: stretch */
    .grid[data-align-content="stretch"] {
      height: 100%;
    }

    /* Fix for justify-content: stretch */
    .grid[data-justify-content="stretch"] {
      width: 100%;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Fixes Safari's grid item sizing issues
 */
export function fixGridItemSizing() {
  // Add fix for grid item sizing
  const style = document.createElement("style");
  style.textContent = `
    /* Fix for grid item minimum size */
    .grid > * {
      min-width: 0;
      min-height: 0;
    }

    /* Fix for grid item overflow */
    .grid > *[data-overflow] {
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Observes grid containers and applies necessary fixes
 */
export function observeGridContainers() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const grids = node.querySelectorAll(".grid");
          grids.forEach((grid) => {
            // Apply data attributes based on computed styles
            const style = window.getComputedStyle(grid);
            if (style.gridAutoFlow.includes("dense")) {
              grid.setAttribute("data-auto-flow", "dense");
            }
            if (style.alignContent === "stretch") {
              grid.setAttribute("data-align-content", "stretch");
            }
            if (style.justifyContent === "stretch") {
              grid.setAttribute("data-justify-content", "stretch");
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Initialize all Safari grid fixes
 */
export function initSafariGridFixes() {
  fixGridAutoFlow();
  fixGridGapInheritance();
  fixGridAlignment();
  fixGridItemSizing();
  observeGridContainers();
}

// Auto-initialize fixes
initSafariGridFixes();
