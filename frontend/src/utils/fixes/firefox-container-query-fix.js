/**
 * Firefox-specific fixes for Container Query implementation issues
 * @module utils/fixes/firefox-container-query-fix
 */

/**
 * Fixes Firefox's container query size calculation issues
 */
export function fixContainerSizeCalculation() {
  // Add Firefox-specific container query rules
  const style = document.createElement("style");
  style.textContent = `
    /* Force proper size calculation for container queries */
    .container {
      contain: layout inline-size style;
      /* Force proper containment in Firefox */
      display: block;
      position: relative;
      width: 100%;
    }
    
    /* Fix for nested containers */
    .container .container {
      contain: layout inline-size style;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Fixes Firefox's container query inheritance issues
 */
export function fixContainerInheritance() {
  // Add fix for container inheritance
  const style = document.createElement("style");
  style.textContent = `
    /* Ensure proper inheritance in container queries */
    .container {
      /* Reset container context */
      container-type: inline-size;
      /* Force new containing block */
      transform: translateZ(0);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Fixes Firefox's container query resize observation
 */
export function fixContainerResizeObservation() {
  // Create a ResizeObserver to handle container size changes
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const container = entry.target;
      // Force container query recalculation
      container.style.display = "none";
      container.offsetHeight; // Force reflow
      container.style.display = "";
    });
  });

  // Observe all container elements
  function observeContainers() {
    document.querySelectorAll(".container").forEach((container) => {
      resizeObserver.observe(container);
    });
  }

  // Observe DOM changes for new containers
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.classList.contains("container")) {
            resizeObserver.observe(node);
          }
          node.querySelectorAll(".container").forEach((container) => {
            resizeObserver.observe(container);
          });
        }
      });
    });
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial observation
  observeContainers();
}

/**
 * Fixes Firefox's container query style application
 */
export function fixContainerStyleApplication() {
  // Add fix for style application timing
  const style = document.createElement("style");
  style.textContent = `
    /* Force immediate style application */
    .container {
      will-change: transform;
    }
    
    /* Fix for container query transitions */
    .container[data-animating] {
      transition: none !important;
    }
  `;
  document.head.appendChild(style);

  // Handle transitions
  document.addEventListener("transitionstart", (event) => {
    let target = event.target;
    while (target && !target.classList.contains("container")) {
      target = target.parentElement;
    }
    if (target) {
      target.setAttribute("data-animating", "");
    }
  });

  document.addEventListener("transitionend", (event) => {
    let target = event.target;
    while (target && !target.classList.contains("container")) {
      target = target.parentElement;
    }
    if (target) {
      target.removeAttribute("data-animating");
    }
  });
}

/**
 * Initialize all Firefox container query fixes
 */
export function initFirefoxContainerQueryFixes() {
  fixContainerSizeCalculation();
  fixContainerInheritance();
  fixContainerResizeObservation();
  fixContainerStyleApplication();
}

// Auto-initialize fixes
initFirefoxContainerQueryFixes();
