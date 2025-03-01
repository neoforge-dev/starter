/**
 * Safari-specific fixes for Shadow DOM issues
 * @module utils/fixes/safari-shadow-dom-fix
 */

/**
 * Fixes Safari's handling of slotted content in shadow DOM
 * Addresses known issues with slot assignment and style leakage
 */
export function fixSlotBehavior() {
  // Patch slotchange event behavior
  const originalSlotChange = HTMLSlotElement.prototype.assignedNodes;
  HTMLSlotElement.prototype.assignedNodes = function (options) {
    const nodes = originalSlotChange.call(this, options);
    // Ensure proper style scoping for slotted content
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.setAttribute("data-safari-slotted", "");
      }
    });
    return nodes;
  };
}

/**
 * Fixes Safari's CSS containment in shadow DOM
 * Ensures proper style isolation
 */
export function fixStyleContainment() {
  // Add Safari-specific CSS containment rules
  const style = document.createElement("style");
  style.textContent = `
    :host {
      contain: style layout;
      -webkit-contain: style layout;
    }
    [data-safari-slotted] {
      contain: style;
      -webkit-contain: style;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Fixes event retargeting issues in Safari's shadow DOM
 */
export function fixEventRetargeting() {
  const originalComposedPath = Event.prototype.composedPath;
  Event.prototype.composedPath = function () {
    const path = originalComposedPath.call(this);
    // Ensure proper event target in shadow DOM
    if (path[0]?.shadowRoot) {
      Object.defineProperty(this, "target", {
        get() {
          return path[0];
        },
      });
    }
    return path;
  };
}

/**
 * Initialize all Safari shadow DOM fixes
 */
export function initSafariShadowDOMFixes() {
  fixSlotBehavior();
  fixStyleContainment();
  fixEventRetargeting();
}

// Auto-initialize fixes
initSafariShadowDOMFixes();
