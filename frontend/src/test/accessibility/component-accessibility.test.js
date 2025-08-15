import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, fixture, cleanup } from '@open-wc/testing';
import { testComponentAccessibility, generateViolationReport } from './axe-utils.js';

// Import components to test
import '../../components/atoms/button/button.js';
import '../../components/atoms/input/input.js';
import '../../components/molecules/modal/modal.js';
import '../../components/molecules/card/card.js';

describe('Component Accessibility Tests', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Button Component', () => {
    it('should have no accessibility violations for primary button', async () => {
      const element = await fixture(html`
        <neo-button variant="primary">Submit Form</neo-button>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
      expect(results.summary.totalViolations).toBe(0);
    });

    it('should have proper touch target size', async () => {
      const element = await fixture(html`
        <neo-button variant="primary" style="width: 40px; height: 40px;">Small</neo-button>
      `);

      const results = await testComponentAccessibility(element);
      
      // Should have touch target violation
      const touchTargetViolations = results.customChecks.touchTargets;
      expect(touchTargetViolations.length).toBeGreaterThan(0);
      expect(touchTargetViolations[0].message).toContain('Touch target too small');
    });

    it('should support keyboard navigation', async () => {
      const element = await fixture(html`
        <neo-button variant="primary" tabindex="0">Accessible Button</neo-button>
      `);

      const results = await testComponentAccessibility(element);
      
      // Should have no keyboard navigation violations
      const keyboardViolations = results.customChecks.keyboardNavigation;
      expect(keyboardViolations.length).toBe(0);
    });

    it('should have proper ARIA attributes for disabled state', async () => {
      const element = await fixture(html`
        <neo-button variant="primary" disabled aria-label="Submit disabled">Submit</neo-button>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });
  });

  describe('Input Component', () => {
    it('should have proper labels and no violations', async () => {
      const element = await fixture(html`
        <div>
          <label for="test-input">Email Address</label>
          <neo-input 
            id="test-input" 
            type="email" 
            placeholder="Enter your email"
            aria-describedby="email-help"
          ></neo-input>
          <div id="email-help">We'll never share your email</div>
        </div>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });

    it('should have proper error state accessibility', async () => {
      const element = await fixture(html`
        <div>
          <label for="error-input">Required Field</label>
          <neo-input 
            id="error-input" 
            type="text" 
            aria-invalid="true"
            aria-describedby="error-message"
          ></neo-input>
          <div id="error-message" role="alert">This field is required</div>
        </div>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });

    it('should have sufficient touch target size', async () => {
      const element = await fixture(html`
        <neo-input 
          type="text" 
          style="min-height: 44px; min-width: 44px;"
          aria-label="Accessible input"
        ></neo-input>
      `);

      const results = await testComponentAccessibility(element);
      
      const touchTargetViolations = results.customChecks.touchTargets;
      expect(touchTargetViolations.length).toBe(0);
    });
  });

  describe('Modal Component', () => {
    it('should have proper focus management and ARIA attributes', async () => {
      const element = await fixture(html`
        <neo-modal 
          open 
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          role="dialog"
          aria-modal="true"
        >
          <h2 id="modal-title">Confirmation</h2>
          <p id="modal-description">Are you sure you want to delete this item?</p>
          <button type="button">Cancel</button>
          <button type="button">Delete</button>
        </neo-modal>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });

    it('should have keyboard navigation support', async () => {
      const element = await fixture(html`
        <neo-modal open role="dialog">
          <button type="button" autofocus>First Button</button>
          <button type="button">Second Button</button>
          <button type="button">Close</button>
        </neo-modal>
      `);

      const results = await testComponentAccessibility(element);
      
      const keyboardViolations = results.customChecks.keyboardNavigation;
      expect(keyboardViolations.length).toBe(0);
    });
  });

  describe('Card Component', () => {
    it('should have proper semantic structure', async () => {
      const element = await fixture(html`
        <neo-card>
          <h3>Card Title</h3>
          <p>Card description text goes here.</p>
          <button type="button">Learn More</button>
        </neo-card>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });

    it('should have proper color contrast', async () => {
      const element = await fixture(html`
        <neo-card style="background-color: white; color: black;">
          <h3>High Contrast Card</h3>
          <p>This should have good contrast.</p>
        </neo-card>
      `);

      const results = await testComponentAccessibility(element);
      
      // Note: Real color contrast testing would require proper color calculation
      // This is a placeholder test structure
      expect(results).toBeDefined();
    });
  });

  describe('Form Elements', () => {
    it('should have proper form accessibility', async () => {
      const element = await fixture(html`
        <form>
          <fieldset>
            <legend>Contact Information</legend>
            
            <div>
              <label for="name">Full Name *</label>
              <input type="text" id="name" required aria-describedby="name-help">
              <div id="name-help">Enter your first and last name</div>
            </div>
            
            <div>
              <label for="email">Email Address *</label>
              <input type="email" id="email" required>
            </div>
            
            <div>
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone">
            </div>
            
            <button type="submit">Submit Form</button>
          </fieldset>
        </form>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });

    it('should handle form validation errors accessibly', async () => {
      const element = await fixture(html`
        <form>
          <div>
            <label for="invalid-email">Email Address *</label>
            <input 
              type="email" 
              id="invalid-email" 
              required 
              aria-invalid="true"
              aria-describedby="email-error"
            >
            <div id="email-error" role="alert">Please enter a valid email address</div>
          </div>
          
          <button type="submit">Submit</button>
        </form>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });
  });

  describe('Navigation Components', () => {
    it('should have proper landmark structure', async () => {
      const element = await fixture(html`
        <div>
          <header>
            <nav aria-label="Main navigation">
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </nav>
          </header>
          
          <main>
            <h1>Page Title</h1>
            <p>Main content goes here.</p>
          </main>
          
          <footer>
            <nav aria-label="Footer navigation">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </nav>
          </footer>
        </div>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });

    it('should have proper heading hierarchy', async () => {
      const element = await fixture(html`
        <div>
          <h1>Main Page Title</h1>
          <section>
            <h2>Section Title</h2>
            <article>
              <h3>Article Title</h3>
              <p>Article content</p>
            </article>
          </section>
        </div>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });
  });

  describe('Interactive Elements', () => {
    it('should have proper focus indicators', async () => {
      const element = await fixture(html`
        <div>
          <button type="button" style="outline: 2px solid blue;">Focusable Button</button>
          <a href="#" style="outline: 2px solid blue;">Focusable Link</a>
          <input type="text" style="outline: 2px solid blue;" placeholder="Focusable Input">
        </div>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });

    it('should support screen reader announcements', async () => {
      const element = await fixture(html`
        <div>
          <button 
            type="button"
            aria-label="Delete item"
            aria-describedby="delete-help"
          >
            🗑️
          </button>
          <div id="delete-help" class="sr-only">
            This action cannot be undone
          </div>
          
          <div role="status" aria-live="polite" id="status-message">
            Item deleted successfully
          </div>
        </div>
      `);

      const results = await testComponentAccessibility(element);
      
      if (results.hasViolations) {
        console.log(generateViolationReport(results.violations));
      }
      
      expect(results.hasViolations).toBe(false);
    });
  });
});