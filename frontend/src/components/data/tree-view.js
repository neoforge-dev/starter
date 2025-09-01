import {
  LitElement,
  html,
  css,
 } from 'lit';

export class TreeView extends LitElement {
  static properties = {
    items: { type: Array },
    variant: { type: String },
    selectable: { type: Boolean },
    multiSelect: { type: Boolean },
    defaultExpanded: { type: Boolean },
    searchable: { type: Boolean },
    dragAndDrop: { type: Boolean },
    _expandedNodes: { type: Set, state: true },
    _selectedNodes: { type: Set, state: true },
    _searchTerm: { type: String, state: true },
    _draggedNode: { type: Object, state: true },
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
    }

    .tree-container {
      width: 100%;
    }

    /* Search Bar */
    .search-container {
      margin-bottom: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    /* Tree Node */
    .tree-node {
      position: relative;
      display: flex;
      align-items: center;
      padding: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .tree-node:hover {
      background-color: #f9fafb;
    }

    .tree-node.selected {
      background-color: #e5e7eb;
    }

    .tree-node.dragging {
      opacity: 0.5;
    }

    .tree-node.drag-over {
      border-top: 2px solid #2563eb;
    }

    /* Node Content */
    .node-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    .node-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
    }

    .node-label {
      font-size: 0.875rem;
      color: #1f2937;
    }

    .node-meta {
      font-size: 0.75rem;
      color: #6b7280;
      margin-left: auto;
    }

    /* Toggle Button */
    .toggle-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      margin-right: 0.25rem;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .toggle-button.expanded {
      transform: rotate(90deg);
    }

    /* Variants */
    /* Default */
    .variant-default .tree-node {
      margin: 0.125rem 0;
    }

    /* Lines */
    .variant-lines .tree-node {
      position: relative;
    }

    .variant-lines .tree-node::before {
      content: "";
      position: absolute;
      left: 0.75rem;
      top: 50%;
      width: 1rem;
      height: 1px;
      background-color: #d1d5db;
    }

    .variant-lines .children {
      position: relative;
      margin-left: 2.5rem;
    }

    .variant-lines .children::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: #d1d5db;
    }

    /* Folder */
    .variant-folder .node-icon {
      color: #fbbf24;
    }

    .variant-folder .tree-node {
      border-radius: 0.375rem;
    }

    /* Custom */
    .variant-custom .tree-node {
      border-radius: 0.375rem;
      border: 1px solid #e5e7eb;
      margin: 0.25rem 0;
    }

    .variant-custom .node-content {
      gap: 1rem;
    }

    .progress-bar {
      flex: 1;
      height: 0.5rem;
      background-color: #e5e7eb;
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-value {
      height: 100%;
      background-color: #2563eb;
      transition: width 0.3s;
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-active {
      background-color: #dcfce7;
      color: #166534;
    }

    .status-completed {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .status-in-progress {
      background-color: #fef9c3;
      color: #854d0e;
    }

    .status-planned {
      background-color: #f3f4f6;
      color: #374151;
    }

    /* Children Container */
    .children {
      margin-left: 2rem;
      overflow: hidden;
      height: 0;
      opacity: 0;
      transition: all 0.3s;
    }

    .children.expanded {
      height: auto;
      opacity: 1;
    }
  `;

  constructor() {
    super();
    this.items = [];
    this.variant = "default";
    this.selectable = false;
    this.multiSelect = false;
    this.defaultExpanded = false;
    this.searchable = false;
    this.dragAndDrop = false;
    this._expandedNodes = new Set();
    this._selectedNodes = new Set();
    this._searchTerm = "";
    this._draggedNode = null;
  }

  firstUpdated() {
    if (this.defaultExpanded) {
      this._expandAll(this.items);
    }
  }

  _expandAll(items) {
    items.forEach((item) => {
      this._expandedNodes.add(item.id);
      if (item.children) {
        this._expandAll(item.children);
      }
    });
  }

  _handleSearch(e) {
    this._searchTerm = e.target.value.toLowerCase();
    if (this._searchTerm) {
      this._expandAll(this.items);
    }
    this.requestUpdate();
  }

  _toggleNode(nodeId) {
    if (this._expandedNodes.has(nodeId)) {
      this._expandedNodes.delete(nodeId);
    } else {
      this._expandedNodes.add(nodeId);
    }
    this.dispatchEvent(
      new CustomEvent("node-toggle", {
        detail: { nodeId, expanded: this._expandedNodes.has(nodeId) },
        bubbles: true,
        composed: true,
      })
    );
    this.requestUpdate();
  }

  _selectNode(node, event) {
    event.stopPropagation();
    if (!this.selectable) return;

    if (this.multiSelect) {
      if (this._selectedNodes.has(node.id)) {
        this._selectedNodes.delete(node.id);
      } else {
        this._selectedNodes.add(node.id);
      }
    } else {
      this._selectedNodes.clear();
      this._selectedNodes.add(node.id);
    }

    this.dispatchEvent(
      new CustomEvent("node-select", {
        detail: { node, selected: this._selectedNodes.has(node.id) },
        bubbles: true,
        composed: true,
      })
    );
    this.requestUpdate();
  }

  _handleDragStart(node, event) {
    if (!this.dragAndDrop) return;
    this._draggedNode = node;
    event.currentTarget.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  }

  _handleDragOver(event) {
    if (!this.dragAndDrop || !this._draggedNode) return;
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  }

  _handleDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
  }

  _handleDrop(targetNode, event) {
    if (!this.dragAndDrop || !this._draggedNode) return;
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    if (this._draggedNode.id !== targetNode.id) {
      this.dispatchEvent(
        new CustomEvent("node-drop", {
          detail: {
            sourceNode: this._draggedNode,
            targetNode,
          },
          bubbles: true,
          composed: true,
        })
      );
    }

    this._draggedNode = null;
    this.requestUpdate();
  }

  _handleDragEnd(event) {
    event.currentTarget.classList.remove("dragging");
    this._draggedNode = null;
  }

  _renderToggleButton(node) {
    if (!node.children?.length) return "";

    return html`
      <span
        class="toggle-button ${this._expandedNodes.has(node.id)
          ? "expanded"
          : ""}"
        @click=${(e) => {
          e.stopPropagation();
          this._toggleNode(node.id);
        }}
      >
        ▶
      </span>
    `;
  }

  _renderCustomNode(node) {
    return html`
      <div class="node-content">
        <span class="node-icon">${node.icon}</span>
        <span class="node-label">${node.label}</span>
        ${node.status
          ? html`
              <span class="status-badge status-${node.status}"
                >${node.status}</span
              >
            `
          : ""}
        ${node.progress !== undefined
          ? html`
              <div class="progress-bar">
                <div
                  class="progress-value"
                  style="width: ${node.progress}%"
                ></div>
              </div>
            `
          : ""}
      </div>
    `;
  }

  _renderNode(node) {
    if (!node.label.toLowerCase().includes(this._searchTerm)) {
      return "";
    }

    return html`
      <div
        class="tree-node ${this._selectedNodes.has(node.id) ? "selected" : ""}"
        draggable=${this.dragAndDrop}
        @click=${(e) => this._selectNode(node, e)}
        @dragstart=${(e) => this._handleDragStart(node, e)}
        @dragover=${this._handleDragOver}
        @dragleave=${this._handleDragLeave}
        @drop=${(e) => this._handleDrop(node, e)}
        @dragend=${this._handleDragEnd}
      >
        ${this._renderToggleButton(node)}
        ${this.variant === "custom"
          ? this._renderCustomNode(node)
          : html`
              <div class="node-content">
                ${node.icon
                  ? html`<span class="node-icon">${node.icon}</span>`
                  : ""}
                <span class="node-label">${node.label}</span>
                ${node.meta
                  ? html`<span class="node-meta">${node.meta}</span>`
                  : ""}
              </div>
            `}
      </div>
      ${node.children?.length
        ? html`
            <div
              class="children ${this._expandedNodes.has(node.id)
                ? "expanded"
                : ""}"
            >
              ${node.children.map((child) => this._renderNode(child))}
            </div>
          `
        : ""}
    `;
  }

  render() {
    return html`
      <div class="tree-container variant-${this.variant}">
        ${this.searchable
          ? html`
              <div class="search-container">
                <input
                  type="text"
                  class="search-input"
                  placeholder="Search..."
                  @input=${this._handleSearch}
                />
              </div>
            `
          : ""}
        ${this.items.map((item) => this._renderNode(item))}
      </div>
    `;
  }
}

customElements.define("ui-tree-view", TreeView);
