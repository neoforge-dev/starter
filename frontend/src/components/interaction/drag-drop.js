import { 
  LitElement,
  html,
  css,
 } from 'lit';

export class DragDrop extends LitElement {
  static properties = {
    items: { type: Object },
    layout: { type: String },
    variant: { type: String },
    columns: { type: Number },
    gap: { type: String },
    sortable: { type: Boolean },
    groupable: { type: Boolean },
    copyable: { type: Boolean },
    _draggedItem: { type: Object, state: true },
    _draggedGroup: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
    }

    .drag-drop-container {
      width: 100%;
    }

    /* Grid Layout */
    .layout-grid {
      display: grid;
      gap: var(--drag-drop-gap, 1rem);
      grid-template-columns: repeat(var(--drag-drop-columns, 3), 1fr);
    }

    /* List Layout */
    .layout-list {
      display: flex;
      flex-direction: column;
      gap: var(--drag-drop-gap, 1rem);
    }

    /* Kanban Layout */
    .layout-kanban {
      display: grid;
      gap: var(--drag-drop-gap, 1rem);
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .kanban-column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background-color: #f9fafb;
      border-radius: 0.5rem;
    }

    .kanban-title {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    /* Gallery Layout */
    .layout-gallery {
      display: grid;
      gap: var(--drag-drop-gap, 0.5rem);
      grid-template-columns: repeat(var(--drag-drop-columns, 4), 1fr);
    }

    /* Item Variants */
    .drag-item {
      position: relative;
      cursor: move;
      transition: all 0.2s;
    }

    .drag-item.dragging {
      opacity: 0.5;
    }

    .drag-item.drag-over {
      transform: scale(1.02);
    }

    /* Default Variant */
    .variant-default {
      padding: 1rem;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow:
        0 1px 3px 0 rgb(0 0 0 / 0.1),
        0 1px 2px -1px rgb(0 0 0 / 0.1);
    }

    /* Card Variant */
    .variant-card {
      padding: 1.5rem;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow:
        0 4px 6px -1px rgb(0 0 0 / 0.1),
        0 2px 4px -2px rgb(0 0 0 / 0.1);
    }

    /* Minimal Variant */
    .variant-minimal {
      padding: 1rem;
      background-color: #f9fafb;
      border-radius: 0.5rem;
    }

    /* Bordered Variant */
    .variant-bordered {
      padding: 1rem;
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    }

    /* Item Content */
    .item-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .item-title {
      font-size: 1rem;
      font-weight: 500;
      color: #111827;
      margin: 0;
    }

    .item-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    .item-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 0.375rem;
    }

    .item-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .item-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      padding: 0.25rem 0.5rem;
      background-color: #f3f4f6;
      border-radius: 9999px;
      font-size: 0.75rem;
      color: #374151;
    }

    /* Priority Badges */
    .priority {
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .priority-high {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .priority-medium {
      background-color: #fef3c7;
      color: #92400e;
    }

    .priority-low {
      background-color: #ecfdf5;
      color: #065f46;
    }

    /* Copy Handle */
    .copy-handle {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.25rem;
      background-color: #f3f4f6;
      border-radius: 0.25rem;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .drag-item:hover .copy-handle {
      opacity: 1;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .layout-grid,
      .layout-gallery {
        grid-template-columns: repeat(2, 1fr);
      }

      .layout-kanban {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .layout-grid,
      .layout-gallery {
        grid-template-columns: 1fr;
      }
    }
  `;

  constructor() {
    super();
    this.items = {};
    this.layout = "grid";
    this.variant = "default";
    this.columns = 3;
    this.gap = "1rem";
    this.sortable = true;
    this.groupable = false;
    this.copyable = false;
    this._draggedItem = null;
    this._draggedGroup = null;
  }

  _handleDragStart(item, group, event) {
    this._draggedItem = item;
    this._draggedGroup = group;
    event.currentTarget.classList.add("dragging");

    if (this.copyable && event.altKey) {
      event.dataTransfer.effectAllowed = "copy";
    } else {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  _handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
    event.dataTransfer.dropEffect =
      event.altKey && this.copyable ? "copy" : "move";
  }

  _handleDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
  }

  _handleDrop(targetItem, targetGroup, event) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    if (!this._draggedItem) return;

    const isCopy = event.altKey && this.copyable;
    const isSameGroup = this._draggedGroup === targetGroup;
    const isGroupChange = this.groupable && !isSameGroup;

    if (isCopy) {
      this.dispatchEvent(
        new CustomEvent("item-copy", {
          detail: {
            item: this._draggedItem,
            targetItem,
            group: targetGroup,
          },
          bubbles: true,
          composed: true,
        })
      );
    } else if (isGroupChange) {
      this.dispatchEvent(
        new CustomEvent("group-change", {
          detail: {
            item: this._draggedItem,
            fromGroup: this._draggedGroup,
            toGroup: targetGroup,
          },
          bubbles: true,
          composed: true,
        })
      );
    } else if (this.sortable && isSameGroup) {
      this.dispatchEvent(
        new CustomEvent("item-move", {
          detail: {
            item: this._draggedItem,
            targetItem,
            group: targetGroup,
          },
          bubbles: true,
          composed: true,
        })
      );
    }

    this._draggedItem = null;
    this._draggedGroup = null;
  }

  _handleDragEnd(event) {
    event.currentTarget.classList.remove("dragging");
    this._draggedItem = null;
    this._draggedGroup = null;
  }

  _renderItemContent(item) {
    return html`
      <div class="item-content">
        ${item.image
          ? html`
              <img class="item-image" src=${item.image} alt=${item.title} />
            `
          : ""}
        <div class="item-header">
          <h3 class="item-title">${item.title}</h3>
          ${item.priority
            ? html`
                <span class="priority priority-${item.priority}"
                  >${item.priority}</span
                >
              `
            : ""}
        </div>
        ${item.description
          ? html` <p class="item-description">${item.description}</p> `
          : ""}
        ${item.tags?.length
          ? html`
              <div class="item-tags">
                ${item.tags.map((tag) => html`<span class="tag">${tag}</span>`)}
              </div>
            `
          : ""}
        ${item.assignee || item.type || item.size
          ? html`
              <div class="item-meta">
                ${item.assignee ? html`<span>${item.assignee}</span>` : ""}
                ${item.type ? html`<span>${item.type}</span>` : ""}
                ${item.size ? html`<span>${item.size}</span>` : ""}
              </div>
            `
          : ""}
      </div>
      ${this.copyable
        ? html` <div class="copy-handle" title="Hold Alt to copy">⎘</div> `
        : ""}
    `;
  }

  _renderItem(item, group = null) {
    return html`
      <div
        class="drag-item variant-${this.variant}"
        draggable="true"
        @dragstart=${(e) => this._handleDragStart(item, group, e)}
        @dragover=${this._handleDragOver}
        @dragleave=${this._handleDragLeave}
        @drop=${(e) => this._handleDrop(item, group, e)}
        @dragend=${this._handleDragEnd}
      >
        ${this._renderItemContent(item)}
      </div>
    `;
  }

  _renderGrid() {
    return html`
      <div
        class="layout-grid"
        style="--drag-drop-columns: ${this.columns}; --drag-drop-gap: ${this
          .gap}"
      >
        ${this.items.map((item) => this._renderItem(item))}
      </div>
    `;
  }

  _renderList() {
    return html`
      <div class="layout-list" style="--drag-drop-gap: ${this.gap}">
        ${this.items.map((item) => this._renderItem(item))}
      </div>
    `;
  }

  _renderKanban() {
    return html`
      <div class="layout-kanban" style="--drag-drop-gap: ${this.gap}">
        ${Object.entries(this.items).map(
          ([group, { title, items }]) => html`
            <div class="kanban-column">
              <h2 class="kanban-title">${title}</h2>
              ${items.map((item) => this._renderItem(item, group))}
            </div>
          `
        )}
      </div>
    `;
  }

  _renderGallery() {
    return html`
      <div
        class="layout-gallery"
        style="--drag-drop-columns: ${this.columns}; --drag-drop-gap: ${this
          .gap}"
      >
        ${this.items.map((item) => this._renderItem(item))}
      </div>
    `;
  }

  render() {
    return html`
      <div class="drag-drop-container">
        ${this.layout === "grid"
          ? this._renderGrid()
          : this.layout === "list"
            ? this._renderList()
            : this.layout === "kanban"
              ? this._renderKanban()
              : this._renderGallery()}
      </div>
    `;
  }
}

customElements.define("ui-drag-drop", DragDrop);
