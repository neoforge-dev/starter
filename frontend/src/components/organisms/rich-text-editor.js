import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

export class RichTextEditor extends LitElement {
  static properties = {
    value: { type: String },
    placeholder: { type: String },
    disabled: { type: Boolean },
    toolbarItems: { type: Array },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
      }

      .toolbar {
        display: flex;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm);
        border-bottom: 1px solid var(--border-color);
        background: var(--surface-color);
      }

      .toolbar-button {
        padding: var(--spacing-xs);
        border: none;
        background: none;
        color: var(--text-color);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .toolbar-button:hover {
        background: var(--surface-2);
      }

      .toolbar-button.active {
        background: var(--primary-color);
        color: white;
      }

      .editor-content {
        padding: var(--spacing-md);
        min-height: 200px;
        outline: none;
      }

      .editor-content[contenteditable="false"] {
        background: var(--surface-2);
        cursor: not-allowed;
      }

      /* Placeholder styling */
      .editor-content:empty:before {
        content: attr(data-placeholder);
        color: var(--text-tertiary);
      }
    `,
  ];

  constructor() {
    super();
    this.value = "";
    this.placeholder = "Start typing...";
    this.disabled = false;
    this.toolbarItems = [
      { command: "bold", icon: "format_bold" },
      { command: "italic", icon: "format_italic" },
      { command: "underline", icon: "format_underlined" },
      { command: "strikeThrough", icon: "strikethrough_s" },
      { type: "separator" },
      { command: "justifyLeft", icon: "format_align_left" },
      { command: "justifyCenter", icon: "format_align_center" },
      { command: "justifyRight", icon: "format_align_right" },
      { type: "separator" },
      { command: "insertUnorderedList", icon: "format_list_bulleted" },
      { command: "insertOrderedList", icon: "format_list_numbered" },
      { type: "separator" },
      { command: "createLink", icon: "link" },
      { command: "removeFormat", icon: "format_clear" },
    ];
  }

  firstUpdated() {
    this._setupEditor();
  }

  _setupEditor() {
    const editor = this.shadowRoot.querySelector(".editor-content");
    editor.innerHTML = this.value;

    editor.addEventListener("input", () => {
      this.value = editor.innerHTML;
      this._dispatchChangeEvent();
    });

    editor.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    });
  }

  _execCommand(command, value = null) {
    if (this.disabled) return;
    document.execCommand(command, false, value);
    this.shadowRoot.querySelector(".editor-content").focus();
  }

  _handleLinkClick() {
    if (this.disabled) return;
    const url = prompt("Enter URL:");
    if (url) {
      this._execCommand("createLink", url);
    }
  }

  _dispatchChangeEvent() {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="toolbar">
        ${this.toolbarItems.map((item) => {
          if (item.type === "separator") {
            return html`<div class="toolbar-separator"></div>`;
          }
          return html`
            <button
              class="toolbar-button"
              ?disabled=${this.disabled}
              @click=${() =>
                item.command === "createLink"
                  ? this._handleLinkClick()
                  : this._execCommand(item.command)}
            >
              <span class="material-icons">${item.icon}</span>
            </button>
          `;
        })}
      </div>
      <div
        class="editor-content"
        contenteditable=${!this.disabled}
        data-placeholder=${this.placeholder}
        @blur=${this._dispatchChangeEvent}
      ></div>
    `;
  }
}

customElements.define("rich-text-editor", RichTextEditor);
