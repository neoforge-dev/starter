import { expect } from "@esm-bundle/chai";
import { fixture, html } from "@open-wc/testing";
import "../../src/components/ui/language-selector.js";

describe("Language Selector Component", () => {
  let element;
  const defaultLanguages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
  ];

  beforeEach(async () => {
    element = await fixture(html`
      <neo-language-selector
        .languages=${defaultLanguages}
        current-language="en"
      >
      </neo-language-selector>
    `);
  });

  afterEach(() => {
    document.querySelectorAll("neo-language-selector").forEach((selector) => {
      selector.remove();
    });
    // Remove any event listeners
    document.removeEventListener("keydown", element._handleKeyDown);
  });

  it("should be defined", () => {
    expect(element).to.be.instanceOf(
      customElements.get("neo-language-selector")
    );
  });

  it("should render language options", async () => {
    const options = element.shadowRoot.querySelectorAll(".language-option");
    expect(options.length).to.equal(defaultLanguages.length);

    options.forEach((option, index) => {
      expect(option.textContent).to.include(defaultLanguages[index].name);
    });
  });

  it("should highlight current language", async () => {
    const currentOption = element.shadowRoot.querySelector(
      ".language-option.active"
    );
    expect(currentOption).to.exist;
    expect(currentOption.getAttribute("data-lang")).to.equal("en");
  });

  it("should emit event on language change", async () => {
    let selectedLang = null;
    const handler = (e) => {
      selectedLang = e.detail.language;
    };
    element.addEventListener("language-change", handler);

    const spanishOption = element.shadowRoot.querySelector('[data-lang="es"]');
    spanishOption.click();

    expect(selectedLang).to.equal("es");
    element.removeEventListener("language-change", handler);
  });

  it("should update current language property", async () => {
    element.currentLanguage = "fr";
    await element.updateComplete;

    const activeOption = element.shadowRoot.querySelector(
      ".language-option.active"
    );
    expect(activeOption.getAttribute("data-lang")).to.equal("fr");
  });

  it("should handle keyboard navigation", async () => {
    const select = element.shadowRoot.querySelector("select");

    // Simulate keyboard navigation
    select.focus();
    const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
    select.dispatchEvent(event);
    await element.updateComplete;

    expect(document.activeElement).to.equal(select);
  });

  it("should persist language preference", async () => {
    element.setAttribute("current-language", "es");
    await element.updateComplete;

    // Check if language is stored in localStorage
    expect(localStorage.getItem("preferred-language")).to.equal("es");
  });

  it("should handle missing language gracefully", async () => {
    element.currentLanguage = "invalid";
    await element.updateComplete;

    // Should fallback to default language
    expect(element.currentLanguage).to.equal("en");
  });

  it("should update language display format", async () => {
    element.displayFormat = "code";
    await element.updateComplete;

    const options = element.shadowRoot.querySelectorAll(".language-option");
    expect(options[0].textContent).to.include("EN");

    element.displayFormat = "full";
    await element.updateComplete;
    expect(options[0].textContent).to.include("English");
  });

  it("should handle dynamic language list updates", async () => {
    const newLanguages = [...defaultLanguages, { code: "de", name: "Deutsch" }];

    element.languages = newLanguages;
    await element.updateComplete;

    const options = element.shadowRoot.querySelectorAll(".language-option");
    expect(options.length).to.equal(newLanguages.length);
  });

  it("should be accessible", async () => {
    const select = element.shadowRoot.querySelector("select");
    expect(select.hasAttribute("aria-label")).to.be.true;
    expect(select.hasAttribute("role")).to.be.true;
  });
});
