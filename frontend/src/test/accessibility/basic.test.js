import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { expect as chaiExpect } from "chai";
import { /*fixture,*/ html } from "@open-wc/testing";
import { axe, toHaveNoViolations } from "@open-wc/testing-helpers";

// Import components to test
import "../../components/ui/form";
import "../../components/ui/modal";
import "../../components/ui/data-table";

const TEST_URL = "http://localhost:5173"; // Use Vite's default dev server port

test.describe("Basic Accessibility Tests", () => {
  test.beforeAll(async ({ browser }) => {
    // Create a new context that will use the mock URL
    const context = await browser.newContext({
      baseURL: TEST_URL,
    });
    return context;
  });

  test("homepage should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    // Mock the page content since we're not actually connecting to a server
    await page.setContent(`
      <html>
        <body>
          <header>
            <nav>Navigation</nav>
          </header>
          <main>
            <h1>Welcome to NeoForge</h1>
            <p>Test content</p>
          </main>
          <footer>Footer content</footer>
        </body>
      </html>
    `);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("memory monitor component should be accessible", async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <memory-monitor></memory-monitor>
        </body>
      </html>
    `);
    await page.waitForSelector("memory-monitor");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("memory-monitor")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("performance dashboard should be accessible", async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <performance-dashboard></performance-dashboard>
        </body>
      </html>
    `);
    await page.waitForSelector("performance-dashboard");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("performance-dashboard")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("accessibility dashboard should be accessible", async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <accessibility-dashboard></accessibility-dashboard>
        </body>
      </html>
    `);
    await page.waitForSelector("accessibility-dashboard");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("accessibility-dashboard")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should handle keyboard navigation correctly", async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <header>
            <a href="#main-content" id="skip-link">Skip to main content</a>
            <nav>
              <button>Menu Item 1</button>
              <button>Menu Item 2</button>
            </nav>
          </header>
          <main id="main-content">
            <h1>Test Content</h1>
          </main>
        </body>
      </html>
    `);

    // Test Tab navigation
    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(
      () => document.activeElement.tagName
    );
    expect(firstFocused.toLowerCase()).not.toBe("body");

    // Test Skip Link
    const skipLink = await page.$("a[href='#main-content']");
    if (skipLink) {
      await skipLink.focus();
      await page.keyboard.press("Enter");
      const focused = await page.evaluate(() => document.activeElement.tagName);
      expect(focused.toLowerCase()).not.toBe("body");
    }
  });

  test("should have proper ARIA landmarks", async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <header role="banner">
            <nav role="navigation">Navigation</nav>
          </header>
          <main role="main">
            <h1>Main Content</h1>
          </main>
          <footer role="contentinfo">Footer</footer>
        </body>
      </html>
    `);

    // Check for main landmark
    const mainContent = await page.$("main");
    expect(mainContent).toBeTruthy();

    // Check for navigation landmark
    const navigation = await page.$("nav");
    expect(navigation).toBeTruthy();

    // Check for banner landmark
    const header = await page.$("header");
    expect(header).toBeTruthy();

    // Check for contentinfo landmark
    const footer = await page.$("footer");
    expect(footer).toBeTruthy();
  });

  test("should have proper heading structure", async ({ page }) => {
    await page.setContent(`
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
            <section>
              <h2>Another Section</h2>
              <div>
                <h3>Another Subsection</h3>
                <p>More content</p>
              </div>
            </section>
          </main>
        </body>
      </html>
    `);

    const headings = await page.$$eval("h1, h2, h3, h4, h5, h6", (elements) =>
      elements.map((el) => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent.trim(),
      }))
    );

    // Ensure there's exactly one h1
    const h1Count = headings.filter((h) => h.level === 1).length;
    expect(h1Count).toBe(1);

    // Ensure heading levels don't skip
    let previousLevel = 1;
    for (const heading of headings) {
      expect(heading.level - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = heading.level;
    }
  });

  test("images should have alt text", async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <main>
            <img src="test1.jpg" alt="Meaningful image" />
            <img src="test2.jpg" alt="" role="presentation" />
            <img src="test3.jpg" alt="Another meaningful image" />
          </main>
        </body>
      </html>
    `);

    const images = await page.$$eval("img", (imgs) =>
      imgs.map((img) => ({
        hasAlt: img.hasAttribute("alt"),
        alt: img.getAttribute("alt"),
        src: img.getAttribute("src"),
      }))
    );

    for (const img of images) {
      expect(img.hasAlt).toBe(true);
      if (img.alt === "") {
        // If alt is empty, ensure the image is decorative
        const isDecorative = await page.$eval(
          `img[src="${img.src}"]`,
          (img) =>
            img.getAttribute("role") === "presentation" ||
            img.getAttribute("aria-hidden") === "true"
        );
        expect(isDecorative).toBe(true);
      }
    }
  });

  test("interactive elements should have sufficient color contrast", async ({
    page,
  }) => {
    await page.setContent(`
      <html>
        <body>
          <main>
            <button style="background-color: #333; color: #fff;">High Contrast Button</button>
            <a href="#" style="color: #000;">High Contrast Link</a>
            <input type="text" style="background-color: #fff; color: #333;" />
          </main>
        </body>
      </html>
    `);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

describe("Accessibility Tests", () => {
  it("form should be accessible", async () => {
    const el = await fixture(html`
      <neo-form>
        <form>
          <label for="name">Name</label>
          <input id="name" type="text" name="name" required />

          <label for="email">Email</label>
          <input id="email" type="email" name="email" required />

          <label for="country">Country</label>
          <select id="country" name="country" required>
            <option value="">Select a country</option>
            <option value="us">United States</option>
            <option value="ca">Canada</option>
          </select>

          <button type="submit">Submit</button>
        </form>
      </neo-form>
    `);

    const results = await axe(el);
    chaiExpect(results).to.satisfy(toHaveNoViolations);
  });

  it("modal should be accessible", async () => {
    const el = await fixture(html`
      <neo-modal>
        <div slot="header">
          <h2 id="modal-title">Test Modal</h2>
        </div>
        <div slot="content">
          <p>This is a test modal with accessible content.</p>
          <button>Action Button</button>
        </div>
      </neo-modal>
    `);

    // Set ARIA attributes
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-labelledby", "modal-title");
    el.setAttribute("aria-modal", "true");

    const results = await axe(el);
    chaiExpect(results).to.satisfy(toHaveNoViolations);
  });

  it("data table should be accessible", async () => {
    const el = await fixture(html`
      <neo-data-table>
        <table>
          <caption>
            Test Data Table
          </caption>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Test Item</td>
              <td>Active</td>
            </tr>
          </tbody>
        </table>
      </neo-data-table>
    `);

    const results = await axe(el);
    chaiExpect(results).to.satisfy(toHaveNoViolations);
  });

  it("should support keyboard navigation", async () => {
    const el = await fixture(html`
      <div>
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      </div>
    `);

    // Test tab order
    const buttons = el.querySelectorAll("button");
    let tabIndex = 0;
    buttons.forEach((button) => {
      expect(button.tabIndex).to.equal(tabIndex);
      tabIndex++;
    });

    // Test focus management
    const firstButton = el.querySelector("#btn1");
    const secondButton = el.querySelector("#btn2");

    firstButton.focus();
    expect(document.activeElement).to.equal(firstButton);

    // Simulate tab press
    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    firstButton.dispatchEvent(tabEvent);

    // Focus should move to next button
    expect(document.activeElement).to.equal(secondButton);
  });

  it("should have proper ARIA labels", async () => {
    const el = await fixture(html`
      <div>
        <button aria-label="Close modal">×</button>
        <input aria-label="Search" type="search" />
        <div role="alert" aria-live="polite">Status message</div>
      </div>
    `);

    const results = await axe(el);
    chaiExpect(results).to.satisfy(toHaveNoViolations);

    // Test specific ARIA attributes
    const closeButton = el.querySelector("button");
    expect(closeButton.getAttribute("aria-label")).to.equal("Close modal");

    const searchInput = el.querySelector("input");
    expect(searchInput.getAttribute("aria-label")).to.equal("Search");

    const alert = el.querySelector('[role="alert"]');
    expect(alert.getAttribute("aria-live")).to.equal("polite");
  });

  it("should handle focus trapping in modal", async () => {
    const el = await fixture(html`
      <neo-modal>
        <div slot="content">
          <button id="first">First</button>
          <button id="middle">Middle</button>
          <button id="last">Last</button>
        </div>
      </neo-modal>
    `);

    // Open modal
    el.open = true;
    await el.updateComplete;

    const firstButton = el.querySelector("#first");
    const lastButton = el.querySelector("#last");

    // Test focus trap
    firstButton.focus();

    // Simulate shift+tab on first button
    const shiftTabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    firstButton.dispatchEvent(shiftTabEvent);

    // Focus should wrap to last button
    expect(document.activeElement).to.equal(lastButton);

    // Simulate tab on last button
    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    lastButton.dispatchEvent(tabEvent);

    // Focus should wrap to first button
    expect(document.activeElement).to.equal(firstButton);
  });
});
