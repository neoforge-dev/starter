import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Import form validation components
import { NeoForm } from '../../components/organisms/form-validation.js';
import { NeoAutoform } from '../../components/form/autoform.js';

describe('Form Validation Integration Tests', () => {
  let container;

  beforeEach(async () => {
    // Register custom elements if not already registered
    if (!customElements.get('neo-form')) {
      customElements.define('neo-form', NeoForm);
    }
    if (!customElements.get('neo-autoform')) {
      customElements.define('neo-autoform', NeoAutoform);
    }

    // Create container for tests
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('NeoForm Basic Validation', () => {
    let form;

    beforeEach(async () => {
      form = document.createElement('neo-form');
      container.appendChild(form);
      await form.updateComplete;
    });

    it('should validate required fields correctly', async () => {
      // Add a required input field
      const input = document.createElement('input');
      input.setAttribute('data-validate', '');
      input.setAttribute('required', '');
      input.name = 'username';
      input.type = 'text';
      form.appendChild(input);

      await form.updateComplete;

      // Test empty field validation
      const result = form.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.username).toBe('This field is required');

      // Test valid input
      input.value = 'testuser';
      const result2 = form.validate();
      expect(result2.valid).toBe(true);
      expect(result2.errors.username).toBeUndefined();
    });

    it('should validate email fields correctly', async () => {
      const emailInput = document.createElement('input');
      emailInput.setAttribute('data-validate', '');
      emailInput.name = 'email';
      emailInput.type = 'email';
      form.appendChild(emailInput);

      await form.updateComplete;

      // Test invalid email
      emailInput.value = 'invalid-email';
      const result1 = form.validate();
      expect(result1.valid).toBe(false);
      expect(result1.errors.email).toBe('Please enter a valid email address');

      // Test valid email
      emailInput.value = 'test@example.com';
      const result2 = form.validate();
      expect(result2.valid).toBe(true);
      expect(result2.errors.email).toBeUndefined();
    });

    it('should validate field length constraints', async () => {
      const input = document.createElement('input');
      input.setAttribute('data-validate', '');
      input.name = 'password';
      input.type = 'password';
      input.setAttribute('minlength', '8');
      input.setAttribute('maxlength', '20');
      form.appendChild(input);

      await form.updateComplete;

      // Test too short
      input.value = '123';
      const result1 = form.validate();
      expect(result1.valid).toBe(false);
      expect(result1.errors.password).toBe('Minimum length is 8 characters');

      // Test too long
      input.value = '123456789012345678901';
      const result2 = form.validate();
      expect(result2.valid).toBe(false);
      expect(result2.errors.password).toBe('Maximum length is 20 characters');

      // Test valid length
      input.value = 'validpassword';
      const result3 = form.validate();
      expect(result3.valid).toBe(true);
      expect(result3.errors.password).toBeUndefined();
    });

    it('should handle custom validation rules', async () => {
      const input = document.createElement('input');
      input.setAttribute('data-validate', '');
      input.name = 'customField';
      input.type = 'text';
      form.appendChild(input);

      // Add custom validation rule
      form.addValidationRule('customField', (value) => {
        if (value && !value.startsWith('test_')) {
          return 'Value must start with "test_"';
        }
        return null;
      });

      await form.updateComplete;

      // Test invalid custom rule
      input.value = 'invalid';
      const result1 = form.validate();
      expect(result1.valid).toBe(false);
      expect(result1.errors.customField).toBe('Value must start with "test_"');

      // Test valid custom rule
      input.value = 'test_valid';
      const result2 = form.validate();
      expect(result2.valid).toBe(true);
      expect(result2.errors.customField).toBeUndefined();
    });

    it('should prevent form submission when validation fails', async () => {
      const input = document.createElement('input');
      input.setAttribute('data-validate', '');
      input.setAttribute('required', '');
      input.name = 'required_field';
      form.appendChild(input);

      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.textContent = 'Submit';
      form.appendChild(submitButton);

      await form.updateComplete;

      // Mock preventDefault
      const mockPreventDefault = vi.fn();
      const submitEvent = new Event('submit');
      submitEvent.preventDefault = mockPreventDefault;

      // Trigger form submission with empty required field
      form.shadowRoot.querySelector('form').dispatchEvent(submitEvent);

      expect(mockPreventDefault).toHaveBeenCalled();
    });

    it('should provide real-time validation feedback', async () => {
      const input = document.createElement('input');
      input.setAttribute('data-validate', '');
      input.name = 'email';
      input.type = 'email';
      form.appendChild(input);

      await form.updateComplete;

      // Listen for validation-change events
      let validationChangeEvent = null;
      form.addEventListener('validation-change', (e) => {
        validationChangeEvent = e;
      });

      // Trigger input event
      input.value = 'invalid-email';
      input.dispatchEvent(new Event('input'));

      await form.updateComplete;

      // Check that validation event was fired
      expect(validationChangeEvent).toBeTruthy();
      expect(form.errors.email).toBe('Please enter a valid email address');
    });
  });

  describe('NeoAutoform Schema-Based Validation', () => {
    let autoform;

    beforeEach(async () => {
      autoform = document.createElement('neo-autoform');
      container.appendChild(autoform);
      await autoform.updateComplete;
    });

    it('should render form fields based on schema', async () => {
      const schema = {
        title: 'User Registration',
        type: 'object',
        properties: {
          username: {
            type: 'string',
            title: 'Username',
            minLength: 3,
            maxLength: 20
          },
          email: {
            type: 'string',
            title: 'Email Address',
            format: 'email'
          },
          age: {
            type: 'number',
            title: 'Age',
            minimum: 18,
            maximum: 100
          },
          newsletter: {
            type: 'boolean',
            title: 'Subscribe to Newsletter'
          }
        },
        required: ['username', 'email']
      };

      autoform.schema = schema;
      await autoform.updateComplete;

      // Check that form elements are rendered
      const form = autoform.shadowRoot.querySelector('form');
      expect(form).toBeTruthy();

      const usernameInput = autoform.shadowRoot.querySelector('input[name="username"]');
      expect(usernameInput).toBeTruthy();
      expect(usernameInput.type).toBe('text');

      const emailInput = autoform.shadowRoot.querySelector('input[name="email"]');
      expect(emailInput).toBeTruthy();
      expect(emailInput.type).toBe('email');

      const ageInput = autoform.shadowRoot.querySelector('input[name="age"]');
      expect(ageInput).toBeTruthy();
      expect(ageInput.type).toBe('number');

      const newsletterInput = autoform.shadowRoot.querySelector('input[name="newsletter"]');
      expect(newsletterInput).toBeTruthy();
      expect(newsletterInput.type).toBe('checkbox');
    });

    it('should validate required fields according to schema', async () => {
      const schema = {
        type: 'object',
        properties: {
          username: { type: 'string', title: 'Username' },
          email: { type: 'string', title: 'Email', format: 'email' }
        },
        required: ['username', 'email']
      };

      autoform.schema = schema;
      await autoform.updateComplete;

      // Test validation with empty required fields
      const errors = autoform.validateForm();
      expect(errors.username).toBe('Username is required');
      expect(errors.email).toBe('Email is required');

      // Set values and re-validate
      autoform.value = { username: 'testuser', email: 'test@example.com' };
      const errors2 = autoform.validateForm();
      expect(errors2.username).toBeUndefined();
      expect(errors2.email).toBeUndefined();
    });

    it('should validate string length constraints from schema', async () => {
      const schema = {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            title: 'Username',
            minLength: 3,
            maxLength: 10
          }
        }
      };

      autoform.schema = schema;
      await autoform.updateComplete;

      // Test too short
      autoform.value = { username: 'ab' };
      const errors1 = autoform.validateForm();
      expect(errors1.username).toBe('Username must be at least 3 characters');

      // Test too long
      autoform.value = { username: 'verylongusername' };
      const errors2 = autoform.validateForm();
      expect(errors2.username).toBe('Username must be at most 10 characters');

      // Test valid length
      autoform.value = { username: 'validuser' };
      const errors3 = autoform.validateForm();
      expect(errors3.username).toBeUndefined();
    });

    it('should validate number ranges from schema', async () => {
      const schema = {
        type: 'object',
        properties: {
          age: {
            type: 'number',
            title: 'Age',
            minimum: 18,
            maximum: 65
          }
        }
      };

      autoform.schema = schema;
      await autoform.updateComplete;

      // Test too low
      autoform.value = { age: '15' };
      const errors1 = autoform.validateForm();
      expect(errors1.age).toBe('Age must be at least 18');

      // Test too high
      autoform.value = { age: '70' };
      const errors2 = autoform.validateForm();
      expect(errors2.age).toBe('Age must be at most 65');

      // Test valid range
      autoform.value = { age: '25' };
      const errors3 = autoform.validateForm();
      expect(errors3.age).toBeUndefined();
    });

    it('should handle form input changes and emit events', async () => {
      const schema = {
        type: 'object',
        properties: {
          username: { type: 'string', title: 'Username' }
        }
      };

      autoform.schema = schema;
      await autoform.updateComplete;

      // Listen for change events
      let changeEvent = null;
      autoform.addEventListener('neo-change', (e) => {
        changeEvent = e;
      });

      // Simulate input by calling handleInput directly
      const usernameInput = autoform.shadowRoot.querySelector('input[name="username"]');
      usernameInput.value = 'newuser';
      
      // Create mock input event and call handleInput directly
      const mockInputEvent = {
        target: usernameInput
      };
      autoform.handleInput(mockInputEvent);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 10));
      await autoform.updateComplete;

      // Check event was fired and value updated
      expect(changeEvent).toBeTruthy();
      expect(changeEvent.detail.name).toBe('username');
      expect(changeEvent.detail.value).toBe('newuser');
      expect(autoform.value.username).toBe('newuser');
    });

    it('should handle form submission with validation', async () => {
      const schema = {
        type: 'object',
        properties: {
          username: { type: 'string', title: 'Username' },
          email: { type: 'string', title: 'Email', format: 'email' }
        },
        required: ['username', 'email']
      };

      autoform.schema = schema;
      await autoform.updateComplete;

      // Listen for form events
      let submitEvent = null;
      let invalidEvent = null;

      autoform.addEventListener('neo-submit', (e) => {
        submitEvent = e;
      });

      autoform.addEventListener('neo-invalid', (e) => {
        invalidEvent = e;
      });

      // Test invalid submission - call handleSubmit directly
      const mockEvent = new Event('submit');
      mockEvent.preventDefault = vi.fn();
      autoform.handleSubmit(mockEvent);

      await autoform.updateComplete;

      // Should trigger invalid event
      expect(invalidEvent).toBeTruthy();
      expect(invalidEvent.detail.errors.username).toBe('Username is required');
      expect(invalidEvent.detail.errors.email).toBe('Email is required');
      expect(submitEvent).toBeNull();

      // Reset events
      submitEvent = null;
      invalidEvent = null;

      // Test valid submission
      autoform.value = { username: 'testuser', email: 'test@example.com' };
      const mockEvent2 = new Event('submit');
      mockEvent2.preventDefault = vi.fn();
      autoform.handleSubmit(mockEvent2);

      await autoform.updateComplete;

      // Should trigger submit event
      expect(submitEvent).toBeTruthy();
      expect(submitEvent.detail.formData.username).toBe('testuser');
      expect(submitEvent.detail.formData.email).toBe('test@example.com');
      expect(invalidEvent).toBeNull();
    });

    it('should display error messages in the UI', async () => {
      const schema = {
        type: 'object',
        properties: {
          email: { type: 'string', title: 'Email', format: 'email' }
        },
        required: ['email']
      };

      autoform.schema = schema;
      await autoform.updateComplete;

      // Set invalid email
      autoform.value = { email: 'invalid-email' };
      
      // Trigger validation by calling handleSubmit directly
      const mockEvent = new Event('submit');
      mockEvent.preventDefault = vi.fn();
      autoform.handleSubmit(mockEvent);

      await autoform.updateComplete;
      
      // Wait for errors to be applied to the internal state
      await new Promise(resolve => setTimeout(resolve, 10));
      await autoform.updateComplete;

      // Check error message is displayed
      const errorMessage = autoform.shadowRoot.querySelector('.error-message');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toBe('Email must be a valid email');
    });
  });

  describe('Form Layout and Variants', () => {
    let autoform;

    beforeEach(async () => {
      autoform = document.createElement('neo-autoform');
      container.appendChild(autoform);

      const schema = {
        type: 'object',
        properties: {
          field1: { type: 'string', title: 'Field 1' },
          field2: { type: 'string', title: 'Field 2' }
        }
      };

      autoform.schema = schema;
      await autoform.updateComplete;
    });

    it('should apply different layouts correctly', async () => {
      // Test vertical layout (default)
      expect(autoform.layout).toBe('vertical');
      let form = autoform.shadowRoot.querySelector('form');
      expect(form.classList.contains('layout-vertical')).toBe(true);

      // Test horizontal layout
      autoform.layout = 'horizontal';
      await autoform.updateComplete;
      form = autoform.shadowRoot.querySelector('form');
      expect(form.classList.contains('layout-horizontal')).toBe(true);

      // Test grid layout
      autoform.layout = 'grid';
      await autoform.updateComplete;
      form = autoform.shadowRoot.querySelector('form');
      expect(form.classList.contains('layout-grid')).toBe(true);
    });

    it('should apply different variants correctly', async () => {
      // Test default variant
      expect(autoform.variant).toBe('default');
      let form = autoform.shadowRoot.querySelector('form');
      expect(form.classList.contains('variant-default')).toBe(true);

      // Test compact variant
      autoform.variant = 'compact';
      await autoform.updateComplete;
      form = autoform.shadowRoot.querySelector('form');
      expect(form.classList.contains('variant-compact')).toBe(true);

      // Test floating variant
      autoform.variant = 'floating';
      await autoform.updateComplete;
      form = autoform.shadowRoot.querySelector('form');
      expect(form.classList.contains('variant-floating')).toBe(true);
    });

    it('should handle disabled and readonly states', async () => {
      // Test disabled state
      autoform.disabled = true;
      await autoform.updateComplete;

      const form = autoform.shadowRoot.querySelector('form');
      expect(form.hasAttribute('disabled')).toBe(true);

      const inputs = autoform.shadowRoot.querySelectorAll('input');
      inputs.forEach(input => {
        expect(input.hasAttribute('disabled')).toBe(true);
      });

      // Test readonly state
      autoform.disabled = false;
      autoform.readonly = true;
      await autoform.updateComplete;

      const form2 = autoform.shadowRoot.querySelector('form');
      expect(form2.hasAttribute('readonly')).toBe(true);

      const inputs2 = autoform.shadowRoot.querySelectorAll('input');
      inputs2.forEach(input => {
        expect(input.hasAttribute('readonly')).toBe(true);
      });
    });
  });

  describe('Complex Form Scenarios', () => {
    it('should handle multi-step form validation', async () => {
      const step1Schema = {
        type: 'object',
        properties: {
          firstName: { type: 'string', title: 'First Name' },
          lastName: { type: 'string', title: 'Last Name' }
        },
        required: ['firstName', 'lastName']
      };

      const step2Schema = {
        type: 'object',
        properties: {
          email: { type: 'string', title: 'Email', format: 'email' },
          phone: { type: 'string', title: 'Phone Number' }
        },
        required: ['email']
      };

      // Create step 1 form
      const step1Form = document.createElement('neo-autoform');
      step1Form.schema = step1Schema;
      container.appendChild(step1Form);
      await step1Form.updateComplete;

      // Validate step 1
      const step1Errors = step1Form.validateForm();
      expect(step1Errors.firstName).toBe('First Name is required');
      expect(step1Errors.lastName).toBe('Last Name is required');

      // Fill step 1
      step1Form.value = { firstName: 'John', lastName: 'Doe' };
      const step1Errors2 = step1Form.validateForm();
      expect(Object.keys(step1Errors2).filter(key => step1Errors2[key]).length).toBe(0);

      // Create step 2 form
      const step2Form = document.createElement('neo-autoform');
      step2Form.schema = step2Schema;
      container.appendChild(step2Form);
      await step2Form.updateComplete;

      // Validate step 2
      const step2Errors = step2Form.validateForm();
      expect(step2Errors.email).toBe('Email is required');

      // Fill step 2
      step2Form.value = { email: 'john@example.com', phone: '123-456-7890' };
      const step2Errors2 = step2Form.validateForm();
      expect(Object.keys(step2Errors2).filter(key => step2Errors2[key]).length).toBe(0);
    });

    it('should handle nested form validation with mixed components', async () => {
      // Create a container with both form types
      const neoForm = document.createElement('neo-form');
      container.appendChild(neoForm);

      // Add a custom validation input to neo-form
      const customInput = document.createElement('input');
      customInput.setAttribute('data-validate', '');
      customInput.name = 'customField';
      customInput.type = 'text';
      neoForm.appendChild(customInput);

      // Add custom rule
      neoForm.addValidationRule('customField', (value) => {
        if (value && !value.includes('@')) {
          return 'Value must contain @ symbol';
        }
        return null;
      });

      // Create autoform within the same container
      const autoForm = document.createElement('neo-autoform');
      autoForm.schema = {
        type: 'object',
        properties: {
          username: { type: 'string', title: 'Username' }
        },
        required: ['username']
      };
      container.appendChild(autoForm);

      await Promise.all([neoForm.updateComplete, autoForm.updateComplete]);

      // Test validation of both forms
      const neoFormResult = neoForm.validate();
      const autoFormErrors = autoForm.validateForm();

      // Both should have validation errors initially
      expect(neoFormResult.valid).toBe(true); // No required fields in neo-form
      expect(autoFormErrors.username).toBe('Username is required');

      // Set valid values
      customInput.value = 'test@value';
      autoForm.value = { username: 'testuser' };

      const neoFormResult2 = neoForm.validate();
      const autoFormErrors2 = autoForm.validateForm();

      expect(neoFormResult2.valid).toBe(true);
      expect(Object.keys(autoFormErrors2).filter(key => autoFormErrors2[key]).length).toBe(0);
    });
  });
});