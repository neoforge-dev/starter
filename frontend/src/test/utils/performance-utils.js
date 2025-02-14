/**
 * Performance testing utilities
 */

/**
 * Get layout metrics for an element
 * @param {HTMLElement} element - The element to measure
 * @returns {Promise<{duration: number}>}
 */
export async function getLayoutMetrics(element) {
  const start = performance.now();
  await element.updateComplete;
  element.style.width = "200px";
  await element.updateComplete;
  element.style.width = "100%";
  await element.updateComplete;
  const end = performance.now();

  return {
    duration: end - start,
  };
}

/**
 * Get style recalculation metrics
 * @param {HTMLElement} element - The element to measure
 * @returns {Promise<{recalcs: number}>}
 */
export async function getStyleMetrics(element) {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    styleRecalcs = entries.length;
  });

  observer.observe({ entryTypes: ["layout-shift"] });
  let styleRecalcs = 0;

  // Trigger style changes
  element.classList.add("test-class");
  await element.updateComplete;
  element.classList.remove("test-class");
  await element.updateComplete;

  observer.disconnect();
  return {
    recalcs: styleRecalcs,
  };
}

/**
 * Measure memory usage
 * @returns {Promise<{used: number, total: number}>}
 */
export async function getMemoryMetrics() {
  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
    };
  }
  return {
    used: 0,
    total: 0,
  };
}

/**
 * Get paint timing metrics
 * @returns {Promise<{firstPaint: number, firstContentfulPaint: number}>}
 */
export async function getPaintMetrics() {
  const paintEntries = performance.getEntriesByType("paint");
  const firstPaint = paintEntries.find((entry) => entry.name === "first-paint");
  const firstContentfulPaint = paintEntries.find(
    (entry) => entry.name === "first-contentful-paint"
  );

  return {
    firstPaint: firstPaint ? firstPaint.startTime : 0,
    firstContentfulPaint: firstContentfulPaint
      ? firstContentfulPaint.startTime
      : 0,
  };
}
