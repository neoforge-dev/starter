import { html, css } from 'lit';
import { BaseComponent } from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element items-page
 * @description Items management page
 */
export class ItemsPage extends BaseComponent {
  static properties = {
    items: { type: Array, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .items-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
      }

      .items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-md);
      }

      .item-card {
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-md);
        background: var(--surface-color);
      }

      .item-title {
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
      }

      .item-description {
        color: var(--text-color-light);
        margin-bottom: var(--spacing-md);
      }

      .create-item-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius);
        cursor: pointer;
      }

      .create-item-btn:hover {
        background: var(--primary-color-dark);
      }
    `,
  ];

  constructor() {
    super();
    this.items = [];
    this.loading = false;
    this.error = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadItems();
  }

  async loadItems() {
    this.loading = true;
    try {
      // Mock data for E2E testing
      this.items = [
        { id: 1, title: "Sample Item 1", description: "Description for item 1" },
        { id: 2, title: "Sample Item 2", description: "Description for item 2" },
      ];
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="items-page">
        <div class="items-header">
          <h1>Items</h1>
          <button
            class="create-item-btn"
            data-testid="create-item-button"
            @click=${this.createItem}
          >
            Create Item
          </button>
        </div>

        ${this.error ? html`<div class="error">${this.error}</div>` : ""}

        <div class="items-grid">
          ${this.items.map(item => html`
             <div class="item-card" data-testid="item-card">
               <div class="item-title" data-testid="item-title">${item.title}</div>
               <div class="item-description" data-testid="item-description">${item.description}</div>
               <button data-testid="edit-item-button" @click=${() => this.editItem(item)}>Edit</button>
               <button data-testid="delete-item-button" @click=${() => this.deleteItem(item)}>Delete</button>
             </div>
          `)}
        </div>
      </div>
    `;
  }

  createItem() {
    // Mock create item functionality
    console.log("Create item clicked");
  }

  editItem(item) {
    // Mock edit item functionality
    console.log("Edit item:", item);
  }

  deleteItem(item) {
    // Mock delete item functionality
    console.log("Delete item:", item);
  }
}

customElements.define("items-page", ItemsPage);