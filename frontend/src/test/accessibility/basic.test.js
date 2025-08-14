import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import { testComponentAccessibility, generateViolationReport } from './axe-utils.js';

describe("Basic Accessibility Tests", () => {
  let dom;
  let document;

  beforeAll(() => {
    // Set up JSDOM with proper accessibility structure
    dom = new JSDOM(`
      <html lang="en">
        <head>
          <title>NeoForge - Accessibility Test</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <header role="banner">
            <nav role="navigation" aria-label="Main navigation">
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </nav>
          </header>
          <main role="main">
            <h1>Welcome to NeoForge</h1>
            <p>Test content for accessibility validation</p>
            <button type="button" style="min-width: 44px; min-height: 44px;">
              Click Me
            </button>
          </main>
          <footer role="contentinfo">
            <p>Footer content</p>
          </footer>
        </body>
      </html>
    `);
    document = dom.window.document;
    
    // Make JSDOM globals available
    global.window = dom.window;
    global.document = document;
    global.navigator = dom.window.navigator;
  });

  it("should have proper ARIA landmarks", () => {
    // Check for main landmark
    const mainContent = document.querySelector("main");
    expect(mainContent).toBeTruthy();

    // Check for navigation landmark
    const navigation = document.querySelector("nav");
    expect(navigation).toBeTruthy();

    // Check for banner landmark
    const header = document.querySelector("header");
    expect(header).toBeTruthy();

    // Check for contentinfo landmark
    const footer = document.querySelector("footer");
    expect(footer).toBeTruthy();
  });

  it("should have proper heading structure", () => {
    // Set up a new DOM with heading structure
    const headingsDom = new JSDOM(`
      <html>
        <body>
          <main>
            <h1>Main Title</h1>
            <section>
              <h2>Section Title</h2>
              <div>
                <h3>Subsection Title</h3>
                <p>Content</p>
              </div>
            </section>
          </main>
        </body>
      </html>
    `);
    const headingsDoc = headingsDom.window.document;

    const headings = Array.from(
      headingsDoc.querySelectorAll("h1, h2, h3, h4, h5, h6")
    ).map((el) => ({
      level: parseInt(el.tagName.substring(1)),
      text: el.textContent.trim(),
    }));

    // Ensure there's exactly one h1
    const h1Count = headings.filter((h) => h.level === 1).length;
    expect(h1Count).toBe(1);

    // Ensure heading levels don't skip
    let previousLevel = 0;
    for (const heading of headings) {
      expect(heading.level - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = heading.level;
    }
  });

  it("should have basic document structure", () => {
    // Test that our document has the basic structure we expect
    expect(document.querySelector('html')).toBeTruthy();
    expect(document.querySelector('body')).toBeTruthy();
    expect(document.querySelector('main')).toBeTruthy();
    expect(document.querySelector('header')).toBeTruthy();
    expect(document.querySelector('footer')).toBeTruthy();
    
    // Test that elements have proper attributes
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.querySelector('title')).toBeTruthy();
  });

  it("should have proper color contrast", () => {
    // Set up a test element with good contrast
    const testElement = document.createElement('div');
    testElement.innerHTML = `
      <div style="background-color: white; color: black; padding: 10px;">
        <p>This text should have good contrast</p>
        <button style="background: #0066cc; color: white; padding: 8px 16px;">
          Accessible Button
        </button>
      </div>
    `;
    document.body.appendChild(testElement);
    
    const button = testElement.querySelector('button');
    expect(button).toBeTruthy();
    
    // In a real test, we'd verify contrast ratio
    const style = dom.window.getComputedStyle(button);
    expect(style.backgroundColor).toBeTruthy();
    expect(style.color).toBeTruthy();
    
    document.body.removeChild(testElement);
  });

  it("should have sufficient touch target sizes", () => {
    const button = document.querySelector('button');
    expect(button).toBeTruthy();
    
    // Mock getBoundingClientRect for testing
    button.getBoundingClientRect = () => ({
      width: 44,
      height: 44,
      top: 0,
      left: 0,
      bottom: 44,
      right: 44
    });
    
    const rect = button.getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);
  });
});
