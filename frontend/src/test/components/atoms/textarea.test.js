import { expect } from '@open-wc/testing';
import { html, fixture } from '@open-wc/testing';
import '../../../components/atoms/textarea/textarea.js';

describe('NeoTextArea', () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-textarea></neo-textarea>`);
  });

  describe('Basic rendering', () => {
    it('should render successfully', () => {
      expect(element).to.exist;
      expect(element.tagName).to.equal('NEO-TEXTAREA');
    });

    it('should have default properties', () => {
      expect(element.value).to.equal('');
      expect(element.placeholder).to.equal('');
      expect(element.rows).to.equal(4);
      expect(element.disabled).to.be.false;
      expect(element.readonly).to.be.false;
      expect(element.required).to.be.false;
      expect(element.autoResize).to.be.false;
      expect(element.size).to.equal('md');
      expect(element.variant).to.equal('default');
      expect(element.resize).to.equal('vertical');
    });

    it('should render textarea element', () => {
      const textarea = element.shadowRoot.querySelector('textarea');
      expect(textarea).to.exist;
    });
  });

  describe('Properties and attributes', () => {
    it('should reflect boolean properties as attributes', async () => {
      element.disabled = true;
      element.readonly = true;
      element.required = true;
      await element.updateComplete;

      expect(element.hasAttribute('disabled')).to.be.true;
      expect(element.hasAttribute('readonly')).to.be.true;
      expect(element.hasAttribute('required')).to.be.true;
    });

    it('should update textarea attributes when properties change', async () => {
      element.placeholder = 'Test placeholder';
      element.name = 'test-name';
      element.maxlength = 100;
      element.minlength = 5;
      await element.updateComplete;

      const textarea = element.shadowRoot.querySelector('textarea');
      expect(textarea.placeholder).to.equal('Test placeholder');
      expect(textarea.name).to.equal('test-name');
      expect(textarea.maxLength).to.equal(100);
      expect(textarea.minLength).to.equal(5);
    });

    it('should handle value property changes', async () => {
      element.value = 'Test value';
      await element.updateComplete;

      const textarea = element.shadowRoot.querySelector('textarea');
      expect(textarea.value).to.equal('Test value');
    });
  });

  describe('Label rendering', () => {
    it('should render label when provided', async () => {
      element.label = 'Test Label';
      await element.updateComplete;

      const label = element.shadowRoot.querySelector('.label');
      expect(label).to.exist;
      expect(label.textContent.trim()).to.equal('Test Label');
    });

    it('should show required indicator when required', async () => {
      element.label = 'Required Field';
      element.required = true;
      await element.updateComplete;

      const label = element.shadowRoot.querySelector('.label');
      expect(label.classList.contains('required')).to.be.true;
    });

    it('should properly associate label with textarea', async () => {
      element.label = 'Associated Label';
      await element.updateComplete;

      const label = element.shadowRoot.querySelector('label');
      const textarea = element.shadowRoot.querySelector('textarea');
      expect(label.getAttribute('for')).to.equal(textarea.id);
    });
  });

  describe('Size variants', () => {
    ['sm', 'md', 'lg'].forEach(size => {
      it(`should apply ${size} size class`, async () => {
        element.size = size;
        await element.updateComplete;

        const container = element.shadowRoot.querySelector('.textarea-container');
        expect(container.classList.contains(`size-${size}`)).to.be.true;
      });
    });
  });

  describe('Visual variants', () => {
    ['default', 'success', 'error', 'warning'].forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        element.variant = variant;
        await element.updateComplete;

        const container = element.shadowRoot.querySelector('.textarea-container');
        expect(container.classList.contains(`variant-${variant}`)).to.be.true;
      });
    });
  });

  describe('Character counter', () => {
    it('should show character counter when enabled with maxlength', async () => {
      element.showCounter = true;
      element.maxlength = 100;
      await element.updateComplete;

      const counter = element.shadowRoot.querySelector('.counter');
      expect(counter).to.exist;
      expect(counter.textContent.trim()).to.equal('0/100');
    });

    it('should update counter when value changes', async () => {
      element.showCounter = true;
      element.maxlength = 50;
      element.value = 'Test';
      await element.updateComplete;

      const counter = element.shadowRoot.querySelector('.counter');
      expect(counter.textContent.trim()).to.equal('4/50');
    });

    it('should show over-limit styling when exceeded', async () => {
      element.showCounter = true;
      element.maxlength = 5;
      element.value = 'This is too long';
      await element.updateComplete;

      const counter = element.shadowRoot.querySelector('.counter');
      expect(counter.classList.contains('over-limit')).to.be.true;
    });

    it('should not show counter without maxlength', async () => {
      element.showCounter = true;
      await element.updateComplete;

      const counter = element.shadowRoot.querySelector('.counter');
      expect(counter).to.be.null;
    });
  });

  describe('Helper and error text', () => {
    it('should show helper text when provided', async () => {
      element.helperText = 'This is helper text';
      await element.updateComplete;

      const helperText = element.shadowRoot.querySelector('.helper-text');
      expect(helperText).to.exist;
      expect(helperText.textContent.trim()).to.equal('This is helper text');
    });

    it('should show error text when variant is error', async () => {
      element.variant = 'error';
      element.errorText = 'This is an error';
      await element.updateComplete;

      const errorText = element.shadowRoot.querySelector('.error-text');
      expect(errorText).to.exist;
      expect(errorText.textContent.trim()).to.equal('This is an error');
    });

    it('should hide helper text when error text is shown', async () => {
      element.variant = 'error';
      element.helperText = 'Helper text';
      element.errorText = 'Error text';
      await element.updateComplete;

      const helperText = element.shadowRoot.querySelector('.helper-text');
      const errorText = element.shadowRoot.querySelector('.error-text');
      
      expect(helperText).to.be.null;
      expect(errorText).to.exist;
    });
  });

  describe('Resize behavior', () => {
    ['none', 'both', 'horizontal', 'vertical'].forEach(resize => {
      it(`should apply ${resize} resize class`, async () => {
        element.resize = resize;
        await element.updateComplete;

        const container = element.shadowRoot.querySelector('.textarea-container');
        expect(container.classList.contains(`resize-${resize}`)).to.be.true;
      });
    });
  });

  describe('Auto-resize functionality', () => {
    it('should apply auto-resize class when enabled', async () => {
      element.autoResize = true;
      await element.updateComplete;

      const container = element.shadowRoot.querySelector('.textarea-container');
      expect(container.classList.contains('auto-resize')).to.be.true;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      element.helperText = 'Helper text';
      await element.updateComplete;

      const textarea = element.shadowRoot.querySelector('textarea');
      expect(textarea.getAttribute('aria-invalid')).to.equal('false');
      expect(textarea.hasAttribute('aria-describedby')).to.be.true;
    });

    it('should set aria-invalid to true for error variant', async () => {
      element.variant = 'error';
      await element.updateComplete;

      const textarea = element.shadowRoot.querySelector('textarea');
      expect(textarea.getAttribute('aria-invalid')).to.equal('true');
    });

    it('should have proper role for error text', async () => {
      element.variant = 'error';
      element.errorText = 'Error message';
      await element.updateComplete;

      const errorText = element.shadowRoot.querySelector('.error-text');
      expect(errorText.getAttribute('role')).to.equal('alert');
      expect(errorText.getAttribute('aria-live')).to.equal('polite');
    });
  });

  describe('Events', () => {
    it('should dispatch input event when value changes', async () => {
      let eventFired = false;
      let eventDetail = null;

      element.addEventListener('input', (e) => {
        eventFired = true;
        eventDetail = e.detail;
      });

      const textarea = element.shadowRoot.querySelector('textarea');
      textarea.value = 'new value';
      textarea.dispatchEvent(new Event('input'));

      expect(eventFired).to.be.true;
      expect(eventDetail.value).to.equal('new value');
    });

    it('should dispatch change event', async () => {
      let eventFired = false;
      let eventDetail = null;

      element.addEventListener('change', (e) => {
        eventFired = true;
        eventDetail = e.detail;
      });

      const textarea = element.shadowRoot.querySelector('textarea');
      textarea.value = 'changed value';
      element.value = 'changed value';
      textarea.dispatchEvent(new Event('change'));

      expect(eventFired).to.be.true;
      expect(eventDetail.value).to.equal('changed value');
    });

    it('should dispatch focus and blur events', async () => {
      let focusFired = false;
      let blurFired = false;

      element.addEventListener('focus', () => {
        focusFired = true;
      });

      element.addEventListener('blur', () => {
        blurFired = true;
      });

      const textarea = element.shadowRoot.querySelector('textarea');
      textarea.dispatchEvent(new Event('focus'));
      textarea.dispatchEvent(new Event('blur'));

      expect(focusFired).to.be.true;
      expect(blurFired).to.be.true;
    });
  });

  describe('Public methods', () => {
    it('should have focus method', () => {
      expect(element.focus).to.be.a('function');
    });

    it('should have blur method', () => {
      expect(element.blur).to.be.a('function');
    });

    it('should have selectAll method', () => {
      expect(element.selectAll).to.be.a('function');
    });
  });

  describe('Character count helpers', () => {
    it('should calculate character count correctly', () => {
      element.value = 'Hello world';
      expect(element.characterCount).to.equal(11);
    });

    it('should detect over limit correctly', () => {
      element.maxlength = 5;
      element.value = 'Too long';
      expect(element.isOverLimit).to.be.true;
    });

    it('should not be over limit when within bounds', () => {
      element.maxlength = 10;
      element.value = 'Short';
      expect(element.isOverLimit).to.be.false;
    });
  });

  describe('Disabled and readonly states', () => {
    it('should disable textarea when disabled property is set', async () => {
      element.disabled = true;
      await element.updateComplete;

      const textarea = element.shadowRoot.querySelector('textarea');
      expect(textarea.disabled).to.be.true;
    });

    it('should set readonly attribute when readonly property is set', async () => {
      element.readonly = true;
      await element.updateComplete;

      const textarea = element.shadowRoot.querySelector('textarea');
      expect(textarea.readOnly).to.be.true;
    });

    it('should have disabled attribute when disabled', async () => {
      element.disabled = true;
      await element.updateComplete;

      expect(element.hasAttribute('disabled')).to.be.true;
      
      const textarea = element.shadowRoot.querySelector('textarea');
      expect(textarea.disabled).to.be.true;
    });
  });
});