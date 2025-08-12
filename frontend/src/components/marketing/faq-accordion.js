import { 
  LitElement,
  html,
  css,
 } from 'lit';

export class NeoFaqAccordion extends LitElement {
  static get properties() {
    return {
      items: { type: Array },
      variant: { type: String },
      layout: { type: String },
      columns: { type: Number },
      defaultOpen: { type: Boolean },
      allowMultiple: { type: Boolean },
      _openItems: { type: Set, state: true },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        font-family: system-ui, sans-serif;
      }

      .faq-container {
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
      }

      /* Stack Layout */
      .layout-stack {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      /* Grid Layout */
      .layout-grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(var(--faq-columns, 2), 1fr);
      }

      /* Sections Layout */
      .layout-sections {
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }

      .section-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 1.5rem 0;
      }

      .section-items {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      /* Accordion Item */
      .accordion-item {
        width: 100%;
      }

      /* Default Variant */
      .variant-default {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow:
          0 1px 3px 0 rgb(0 0 0 / 0.1),
          0 1px 2px -1px rgb(0 0 0 / 0.1);
        overflow: hidden;
      }

      /* Minimal Variant */
      .variant-minimal {
        border-bottom: 1px solid #e5e7eb;
      }

      /* Bordered Variant */
      .variant-bordered {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
      }

      /* Card Variant */
      .variant-card {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow:
          0 4px 6px -1px rgb(0 0 0 / 0.1),
          0 2px 4px -2px rgb(0 0 0 / 0.1);
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      .variant-card:hover {
        transform: translateY(-2px);
        box-shadow:
          0 10px 15px -3px rgb(0 0 0 / 0.1),
          0 4px 6px -4px rgb(0 0 0 / 0.1);
      }

      /* Question Button */
      .question-button {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
        color: #111827;
        font-size: 1rem;
        font-weight: 500;
        transition: background-color 0.2s;
      }

      .variant-default .question-button,
      .variant-card .question-button {
        padding: 1.25rem;
      }

      .variant-minimal .question-button {
        padding: 1rem 0;
      }

      .variant-bordered .question-button {
        padding: 1rem 1.25rem;
      }

      .question-button:hover {
        background-color: #f9fafb;
      }

      .variant-minimal .question-button:hover {
        background-color: transparent;
      }

      /* Icon */
      .icon {
        width: 1.25rem;
        height: 1.25rem;
        margin-left: 1rem;
        transform: rotate(0deg);
        transition: transform 0.2s;
        opacity: 0.5;
      }

      .icon.open {
        transform: rotate(180deg);
      }

      /* Answer */
      .answer {
        padding: 0;
        height: 0;
        overflow: hidden;
        opacity: 0;
        transition: all 0.3s;
      }

      .answer.open {
        padding: 0 1rem 1rem 1rem;
        height: auto;
        opacity: 1;
      }

      .variant-default .answer.open,
      .variant-card .answer.open {
        padding: 0 1.25rem 1.25rem 1.25rem;
      }

      .variant-minimal .answer.open {
        padding: 0 0 1rem 0;
      }

      .variant-bordered .answer.open {
        padding: 0 1.25rem 1.25rem 1.25rem;
      }

      .answer-content {
        color: #4b5563;
        line-height: 1.625;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .layout-grid {
          grid-template-columns: 1fr;
        }

        .question-button {
          font-size: 0.875rem;
        }

        .answer-content {
          font-size: 0.875rem;
        }
      }
    `;
  }

  constructor() {
    super();
    this.items = [];
    this.variant = "default";
    this.layout = "stack";
    this.columns = 2;
    this.defaultOpen = false;
    this.allowMultiple = true;
    this._openItems = new Set();
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.defaultOpen) {
      this.items.forEach((_, index) => this._openItems.add(index));
      this.requestUpdate();
    }
  }

  _handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const button = event.target;
      const index = button.dataset.index;
      if (index !== undefined) {
        const isOpen = this._openItems.has(index);
        if (isOpen) {
          this._openItems.delete(index);
        } else {
          if (!this.allowMultiple) {
            this._openItems.clear();
          }
          this._openItems.add(index);
        }
        this.requestUpdate();
        // Force synchronous update
        this.performUpdate();
        // Ensure the update is complete
        this.updateComplete.then(() => {
          const answer = this.shadowRoot.querySelector(`#answer-${index}`);
          if (answer) {
            answer.classList.toggle("open", this._openItems.has(index));
          }
        });
      }
    }
  }

  _toggleItem(index) {
    const isOpen = this._openItems.has(index);
    if (isOpen) {
      this._openItems.delete(index);
    } else {
      if (!this.allowMultiple) {
        this._openItems.clear();
      }
      this._openItems.add(index);
    }
    this.requestUpdate();
  }

  _renderIcon(isOpen) {
    return html`
      <svg
        class="icon ${isOpen ? "open" : ""}"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    `;
  }

  _renderAccordionItem(item, index) {
    const isOpen = this._openItems.has(index);

    return html`
      <div class="accordion-item variant-${this.variant}">
        <button
          class="question-button"
          @click=${() => this._toggleItem(index)}
          @keydown=${this._handleKeyDown}
          data-index=${index}
          aria-expanded=${isOpen}
          aria-controls="answer-${index}"
        >
          <span>${item.question}</span>
          ${this._renderIcon(isOpen)}
        </button>
        <div
          id="answer-${index}"
          class="answer ${isOpen ? "open" : ""}"
          role="region"
          aria-labelledby="question-${index}"
        >
          <div class="answer-content">${item.answer}</div>
        </div>
      </div>
    `;
  }

  _renderStack() {
    return html`
      <div class="layout-stack">
        ${this.items.map((item, index) =>
          this._renderAccordionItem(item, index)
        )}
      </div>
    `;
  }

  _renderGrid() {
    return html`
      <div class="layout-grid" style="--faq-columns: ${this.columns}">
        ${this.items.map((item, index) =>
          this._renderAccordionItem(item, index)
        )}
      </div>
    `;
  }

  _renderSections() {
    if (!this.items || !this.items.length) {
      return html`<div class="layout-sections"></div>`;
    }

    // If items don't have categories or items[0] is a direct FAQ item
    if (!this.items[0].category || !this.items[0].items) {
      return html`
        <div class="layout-sections">
          <div class="faq-section">
            <div class="section-items">
              ${this.items.map((item, index) =>
                this._renderAccordionItem(item, index)
              )}
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="layout-sections">
        ${this.items.map(
          (section, sectionIndex) => html`
            <div class="faq-section">
              <h2 class="section-title">${section.category}</h2>
              <div class="section-items">
                ${section.items.map((item, itemIndex) =>
                  this._renderAccordionItem(
                    item,
                    `${sectionIndex}-${itemIndex}`
                  )
                )}
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  render() {
    return html`
      <div class="faq-container">
        ${this.layout === "grid"
          ? this._renderGrid()
          : this.layout === "sections"
            ? this._renderSections()
            : this._renderStack()}
      </div>
    `;
  }
}

customElements.define("neo-faq-accordion", NeoFaqAccordion);
