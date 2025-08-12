import { html, css } from 'lit';
import { BasePageComponent } from "../base-page-component.js";

export class ContactPage extends BasePageComponent {
  static styles = [
    ...BasePageComponent.styles,
    css`
      .contact-form {
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
      }
      
      .form-grid {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
      }
      
      input,
      textarea {
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: var(--text-base);
        transition: border-color 0.2s;
      }
      
      input:focus,
      textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px var(--primary-color, #3b82f6)40;
      }
      
      .submit-button {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: var(--spacing-sm) var(--spacing-lg);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: var(--text-base);
        transition: opacity 0.2s;
        align-self: center;
      }
      
      .submit-button:hover:not(:disabled) {
        opacity: 0.9;
      }
      
      .submit-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ];

  constructor() {
    super();
    this.pageTitle = "Contact Us";
    this.containerClass = "narrow";
  }

  renderContent() {
    return html`
      <div class="contact-form">
        <form class="form-container" @submit=${this._handleSubmit}>
          <div class="form-grid">
            <input 
              type="text" 
              name="name"
              placeholder="Your Name" 
              required 
              ?disabled=${this.loading}
            />
            <input 
              type="email" 
              name="email"
              placeholder="Your Email" 
              required 
              ?disabled=${this.loading}
            />
            <textarea 
              name="message"
              placeholder="Your Message" 
              rows="5" 
              required 
              ?disabled=${this.loading}
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            class="submit-button"
            ?disabled=${this.loading}
          >
            ${this.loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    `;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message")
    };

    // Validate required fields
    const errors = this.validateRequired(data);
    if (errors.length > 0) {
      this.setError(errors.join(", "));
      return;
    }

    // Validate email format
    if (!this.validateEmail(data.email)) {
      this.setError("Please enter a valid email address");
      return;
    }

    try {
      await this.handleAsync(async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, you would submit to your API here
        console.log("Contact form submitted:", data);
        
        this.showToast("Thank you for contacting us! We'll get back to you soon.", "success");
        
        // Reset form
        e.target.reset();
      });
    } catch (error) {
      // Error is already handled by handleAsync
      console.error("Failed to submit contact form:", error);
    }
  }
}

customElements.define("contact-page", ContactPage);
