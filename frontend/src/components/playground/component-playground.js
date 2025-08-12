import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../../styles/base.js";

/**
 * Component playground for live previewing and editing components
 * @customElement component-playground
 */
export class ComponentPlayground extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        height: 100%;
      }

      .playground {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-lg);
        height: 100%;
      }

      .preview {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        display: flex;
        flex-direction: column;
      }

      .preview-header {
        margin-bottom: var(--spacing-md);
      }

      .preview-title {
        font-size: 1.2rem;
        margin: 0 0 var(--spacing-sm);
      }

      .preview-frame {
        flex: 1;
        border: none;
        border-radius: var(--radius-md);
        background: var(--color-background);
      }

      .editor {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .code-editor {
        flex: 1;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        font-family: monospace;
        font-size: 14px;
        line-height: 1.5;
        color: var(--color-text);
        resize: none;
        border: none;
      }

      .code-editor:focus {
        outline: 2px solid var(--color-primary);
        outline-offset: -2px;
      }

      .properties {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
      }

      .properties-title {
        font-size: 1.2rem;
        margin: 0 0 var(--spacing-md);
      }

      .property-list {
        display: grid;
        gap: var(--spacing-sm);
      }

      .property-item {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: var(--spacing-md);
        align-items: center;
      }

      .property-label {
        font-weight: 500;
      }

      .property-input {
        padding: var(--spacing-sm);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-background);
        color: var(--color-text);
      }

      .property-input[type="checkbox"] {
        width: 20px;
        height: 20px;
      }
    `,
  ];

  static properties = {
    component: { type: String },
    code: { type: String },
    properties: { type: Object },
    _editedCode: { type: String, state: true },
    _propertyValues: { type: Object, state: true },
  };

  constructor() {
    super();
    this.component = "";
    this.code = "";
    this.properties = {};
    this._editedCode = "";
    this._propertyValues = {};
  }

  firstUpdated() {
    this._editedCode = this.code;
    this._propertyValues = Object.fromEntries(
      Object.entries(this.properties).map(([key, config]) => [
        key,
        config.value,
      ])
    );
    this._updatePreview();
  }

  render() {
    return html`
      <div class="playground">
        <div class="preview">
          <div class="preview-header">
            <h3 class="preview-title">Preview</h3>
          </div>
          <iframe
            class="preview-frame"
            src="/playground-frame.html"
            @load=${this._handleFrameLoad}
          ></iframe>
        </div>
        <div class="editor">
          <textarea
            class="code-editor"
            .value=${this._editedCode}
            @input=${this._handleCodeInput}
            spellcheck="false"
          ></textarea>
          <div class="properties">
            <h3 class="properties-title">Properties</h3>
            <div class="property-list">
              ${Object.entries(this.properties).map(
                ([name, config]) => html`
                  <div class="property-item">
                    <label class="property-label" for=${name}>${name}</label>
                    ${this._renderPropertyInput(name, config)}
                  </div>
                `
              )}
            </div>
          </div>
          <slot name="docs"></slot>
        </div>
      </div>
    `;
  }

  _renderPropertyInput(name, config) {
    if (config.type === "boolean") {
      return html`
        <input
          type="checkbox"
          id=${name}
          class="property-input"
          .checked=${this._propertyValues[name]}
          @change=${(e) => this._handlePropertyChange(name, e.target.checked)}
        />
      `;
    }
    return html`
      <input
        type=${config.type === "number" ? "number" : "text"}
        id=${name}
        class="property-input"
        .value=${this._propertyValues[name]}
        @input=${(e) => this._handlePropertyChange(name, e.target.value)}
      />
    `;
  }

  _handleCodeInput(e) {
    this._editedCode = e.target.value;
    this._updatePreview();
  }

  _handlePropertyChange(name, value) {
    this._propertyValues = {
      ...this._propertyValues,
      [name]: value,
    };
    this._updatePreview();
  }

  _handleFrameLoad() {
    this._updatePreview();
  }

  _updatePreview() {
    const frame = this.shadowRoot.querySelector("iframe");
    if (!frame.contentWindow) return;

    frame.contentWindow.postMessage(
      {
        type: "update",
        code: this._editedCode,
        properties: this._propertyValues,
      },
      "*"
    );
  }
}

customElements.define("component-playground", ComponentPlayground);
