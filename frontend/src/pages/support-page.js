import { 
  html,
  css,
 } from 'lit';
import {
  BaseComponent,
} from "../components/base-component.js";

export class SupportPage extends BaseComponent {
  static properties = {
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    tickets: { type: Array, state: true },
    selectedStatus: { type: String, state: true },
    searchQuery: { type: String, state: true },
  };

  static styles = [
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .support-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      .ticket-list {
        margin-bottom: var(--spacing-xl);
      }

      .ticket-item {
        padding: var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-md);
      }

      .ticket-title {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-sm);
      }

      .ticket-status {
        display: inline-block;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-sm);
        font-size: var(--font-size-sm);
        margin-right: var(--spacing-sm);
      }

      .status-open {
        background: var(--color-success-light);
        color: var(--color-success);
      }

      .status-closed {
        background: var(--color-error-light);
        color: var(--color-error);
      }

      .faq-section {
        margin-bottom: var(--spacing-xl);
      }

      .faq-category {
        margin-bottom: var(--spacing-lg);
      }

      .faq-question {
        margin-bottom: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--surface-color);
        border-radius: var(--border-radius);
        cursor: pointer;
      }

      .contact-form {
        display: grid;
        gap: var(--spacing-md);
      }

      .form-group {
        display: grid;
        gap: var(--spacing-sm);
      }

      .loading-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      .error-message {
        color: var(--color-error);
        text-align: center;
        padding: var(--spacing-lg);
      }

      @media (max-width: 768px) {
        .page-container {
          padding: var(--spacing-md);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.loading = false;
    this.error = null;
    this.tickets = [];
    this.selectedStatus = "all";
    this.searchQuery = "";
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadTickets();
  }

  async _loadTickets() {
    try {
      this.loading = true;
      this.tickets = await window.api.getSupportTickets();
    } catch (error) {
      this.error = "Failed to load support tickets";
      console.error("Error loading tickets:", error);
    } finally {
      this.loading = false;
    }
  }

  _handleStatusChange(e) {
    this.selectedStatus = e.target.value;
  }

  _handleSearch(e) {
    this.searchQuery = e.target.value;
  }

  _handleNewTicket() {
    this.dispatchEvent(
      new CustomEvent("show-modal", {
        detail: { type: "new-ticket" },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-indicator">
          <neo-spinner></neo-spinner>
        </div>
      `;
    }

    if (this.error) {
      return html`<div class="error-message">${this.error}</div>`;
    }

    return html`
      <div class="support-container">
        <div class="ticket-list">
          <h2>Support Tickets</h2>
          <div class="filters">
            <select
              class="status-filter"
              .value=${this.selectedStatus}
              @change=${this._handleStatusChange}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <input
              type="search"
              class="search-input"
              placeholder="Search tickets..."
              .value=${this.searchQuery}
              @input=${this._handleSearch}
            />
            <button class="new-ticket-button" @click=${this._handleNewTicket}>
              New Ticket
            </button>
          </div>
          ${this.tickets.map(
            (ticket) => html`
              <div
                class="ticket-item"
                role="article"
                aria-labelledby="ticket-${ticket.id}"
              >
                <div class="ticket-title" id="ticket-${ticket.id}">
                  ${ticket.title}
                </div>
                <div class="ticket-status status-${ticket.status}">
                  ${ticket.status}
                </div>
                <div class="ticket-priority">${ticket.priority}</div>
                <button
                  class="details-button"
                  aria-label="View ticket details"
                  @click=${() =>
                    this.dispatchEvent(
                      new CustomEvent("show-modal", {
                        detail: {
                          type: "ticket-details",
                          ticketId: ticket.id,
                        },
                        bubbles: true,
                        composed: true,
                      })
                    )}
                >
                  View Details
                </button>
                <button
                  class="status-toggle"
                  aria-label="Toggle ticket status"
                  @click=${() => this._toggleStatus(ticket)}
                >
                  ${ticket.status === "open" ? "Close" : "Reopen"}
                </button>
              </div>
            `
          )}
        </div>

        <div class="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div class="faq-category">
            <h3>Getting Started</h3>
            <div class="faq-question">How do I create an account?</div>
            <div class="faq-question">What are the system requirements?</div>
          </div>
          <div class="faq-category">
            <h3>Billing</h3>
            <div class="faq-question">How do I update my payment method?</div>
            <div class="faq-question">What payment methods do you accept?</div>
          </div>
        </div>

        <div class="contact-form">
          <h2>Contact Support</h2>
          <form @submit=${this._handleSubmit}>
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" name="message" required></textarea>
            </div>
            <button type="submit">Send Message</button>
          </form>
        </div>
      </div>
    `;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value,
      email: form.email.value,
      message: form.message.value,
    };

    this.dispatchEvent(
      new CustomEvent("contact-submit", {
        detail: data,
        bubbles: true,
        composed: true,
      })
    );
  }

  async _toggleStatus(ticket) {
    const newStatus = ticket.status === "open" ? "closed" : "open";
    await window.api.updateTicket({
      ...ticket,
      status: newStatus,
    });
    await this._loadTickets();
  }
}
