/**
 * Performance API Polyfill Tests
 *
 * This file contains tests for the Performance API polyfill to ensure it works correctly
 * in all environments (Node.js, JSDOM, worker threads).
 */

import { describe, it, expect, beforeEach } from "vitest";
import applyPolyfill from "./optimized-performance-polyfill.js";

describe("Performance API Polyfill", () => {
  beforeEach(() => {
    // Apply the polyfill before each test
    applyPolyfill();
  });

  it("should provide performance.now()", () => {
    expect(performance).toBeDefined();
    expect(typeof performance.now).toBe("function");

    const time = performance.now();
    expect(typeof time).toBe("number");
    expect(time).toBeGreaterThanOrEqual(0);
  });

  it("should provide performance.mark() and performance.measure()", () => {
    expect(typeof performance.mark).toBe("function");
    expect(typeof performance.measure).toBe("function");

    // Create marks
    performance.mark("start");
    performance.mark("end");

    // Create measure
    performance.measure("test", "start", "end");

    // Get measures
    const measures = performance.getEntriesByType("measure");
    expect(measures.length).toBeGreaterThan(0);
    expect(measures[0].name).toBe("test");
    expect(typeof measures[0].duration).toBe("number");
  });

  it("should provide performance.getEntriesByType()", () => {
    expect(typeof performance.getEntriesByType).toBe("function");

    // Create mark
    performance.mark("test-mark");

    // Get marks
    const marks = performance.getEntriesByType("mark");
    expect(marks.length).toBeGreaterThan(0);
    expect(marks.some((mark) => mark.name === "test-mark")).toBe(true);
  });

  it("should provide performance.getEntriesByName()", () => {
    expect(typeof performance.getEntriesByName).toBe("function");

    // Create mark
    performance.mark("test-name");

    // Get mark by name
    const marks = performance.getEntriesByName("test-name", "mark");
    expect(marks.length).toBe(1);
    expect(marks[0].name).toBe("test-name");
  });

  it("should provide performance.clearMarks() and performance.clearMeasures()", () => {
    expect(typeof performance.clearMarks).toBe("function");
    expect(typeof performance.clearMeasures).toBe("function");

    // Create marks and measures
    performance.mark("clear-test-start");
    performance.mark("clear-test-end");
    performance.measure("clear-test", "clear-test-start", "clear-test-end");

    // Clear marks
    performance.clearMarks("clear-test-start");

    // Verify mark was cleared
    const marks = performance.getEntriesByName("clear-test-start", "mark");
    expect(marks.length).toBe(0);

    // Clear measures
    performance.clearMeasures("clear-test");

    // Verify measure was cleared
    const measures = performance.getEntriesByName("clear-test", "measure");
    expect(measures.length).toBe(0);
  });

  it("should provide performance.timing", () => {
    expect(performance.timing).toBeDefined();
    expect(typeof performance.timing).toBe("object");
    expect(performance.timing.navigationStart).toBeDefined();
    expect(typeof performance.timing.navigationStart).toBe("number");
  });

  it("should provide performance.memory", () => {
    expect(performance.memory).toBeDefined();
    expect(typeof performance.memory).toBe("object");
    expect(performance.memory.usedJSHeapSize).toBeDefined();
    expect(typeof performance.memory.usedJSHeapSize).toBe("number");
  });

  it("should handle multiple calls to applyPolyfill()", () => {
    // Call applyPolyfill() multiple times
    const result1 = applyPolyfill();
    const result2 = applyPolyfill();

    // Verify that the polyfill is only applied once
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();

    // Verify that performance.now() still works
    const time = performance.now();
    expect(typeof time).toBe("number");
    expect(time).toBeGreaterThanOrEqual(0);
  });
});
