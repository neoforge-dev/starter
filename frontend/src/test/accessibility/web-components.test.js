import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "axe-playwright";

test.describe("Web Components Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await injectAxe(page);
  });

  test("Custom elements should have proper ARIA roles", async ({ page }) => {
    await page.evaluate(() => {
      // Add test component to the page
      const template = `
        <custom-button role="button" tabindex="0">
          <span>Click me</span>
        </custom-button>
      `;
      document.body.insertAdjacentHTML("beforeend", template);
    });

    // Run accessibility checks
    await checkA11y(page, "custom-button", {
      axeOptions: {
        rules: {
          "button-name": { enabled: true },
          "aria-allowed-role": { enabled: true },
        },
      },
    });
  });

  test("Shadow DOM content should be accessible", async ({ page }) => {
    await page.evaluate(() => {
      class AccessibleComponent extends HTMLElement {
        constructor() {
          super();
          const shadow = this.attachShadow({ mode: "open" });
          shadow.innerHTML = `
            <div role="region" aria-label="Accessible region">
              <slot></slot>
            </div>
          `;
        }
      }
      customElements.define("accessible-component", AccessibleComponent);

      document.body.innerHTML = `
        <accessible-component>
          <p>This content should be accessible through the shadow DOM</p>
        </accessible-component>
      `;
    });

    await checkA11y(page, "accessible-component", {
      axeOptions: {
        rules: {
          region: { enabled: true },
          "aria-hidden-focus": { enabled: true },
        },
      },
    });
  });

  test("Custom elements should handle keyboard navigation", async ({
    page,
  }) => {
    await page.evaluate(() => {
      class KeyboardNavComponent extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: "open" });
          this.shadowRoot.innerHTML = `
            <div role="toolbar" aria-label="Tools">
              <button tabindex="0">Tool 1</button>
              <button tabindex="0">Tool 2</button>
              <button tabindex="0">Tool 3</button>
            </div>
          `;

          this.shadowRoot.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              const buttons = Array.from(
                this.shadowRoot.querySelectorAll("button")
              );
              const currentIndex = buttons.indexOf(
                this.shadowRoot.activeElement
              );
              const nextIndex =
                e.key === "ArrowRight"
                  ? (currentIndex + 1) % buttons.length
                  : (currentIndex - 1 + buttons.length) % buttons.length;
              buttons[nextIndex].focus();
            }
          });
        }
      }
      customElements.define("keyboard-nav", KeyboardNavComponent);

      document.body.innerHTML = "<keyboard-nav></keyboard-nav>";
    });

    // Test keyboard navigation
    await page.focus("keyboard-nav button:first-child");
    await page.keyboard.press("ArrowRight");

    const secondButtonFocused = await page.evaluate(() => {
      const component = document.querySelector("keyboard-nav");
      return (
        component.shadowRoot.activeElement ===
        component.shadowRoot.querySelectorAll("button")[1]
      );
    });

    expect(secondButtonFocused).toBe(true);
  });

  test("Custom elements should support form association", async ({ page }) => {
    await page.evaluate(() => {
      class CustomInput extends HTMLElement {
        static formAssociated = true;

        constructor() {
          super();
          this.internals = this.attachInternals();
          this.attachShadow({ mode: "open" });
          this.shadowRoot.innerHTML = `
            <div role="textbox" aria-label="Custom input">
              <input type="text">
            </div>
          `;

          const input = this.shadowRoot.querySelector("input");
          input.addEventListener("input", () => {
            this.internals.setFormValue(input.value);
          });
        }
      }
      customElements.define("custom-input", CustomInput);

      document.body.innerHTML = `
        <form>
          <custom-input name="test-input"></custom-input>
          <button type="submit">Submit</button>
        </form>
      `;
    });

    // Test form association
    await page.fill("custom-input input", "test value");

    const formValue = await page.evaluate(() => {
      const input = document.querySelector("custom-input");
      return input.internals.form.elements["test-input"].value;
    });

    expect(formValue).toBe("test value");
  });
});
