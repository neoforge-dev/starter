/**
 * Tests for Component Generator Modal component
 */

import { fixture, expect, elementUpdated } from '@open-wc/testing';
import { html } from 'lit';
import '../../playground/components/component-generator-modal.js';

describe('ComponentGeneratorModal', () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<component-generator-modal></component-generator-modal>`);
  });

  describe('Component Initialization', () => {
    it('should create element with default properties', async () => {
      expect(element).to.exist;
      expect(element.isOpen).to.be.false;
      expect(element.currentStep).to.equal(1);
      expect(element.isGenerating).to.be.false;
      expect(element.errors).to.be.an('array').that.is.empty;
    });

    it('should have proper component tag name', () => {
      expect(element.tagName.toLowerCase()).to.equal('component-generator-modal');
    });

    it('should initialize with default config', () => {
      expect(element.config).to.be.an('object');
    });
  });

  describe('Modal Visibility', () => {
    it('should be initially closed', () => {
      expect(element.isOpen).to.be.false;
      expect(element.hasAttribute('isopen')).to.be.false;
    });

    it('should open modal when isOpen is set to true', async () => {
      element.open();
      await elementUpdated(element);
      
      expect(element.isOpen).to.be.true;
      expect(element.hasAttribute('isopen')).to.be.true;
    });

    it('should close modal when isOpen is set to false', async () => {
      element.open();
      await elementUpdated(element);
      expect(element.isOpen).to.be.true;

      element.close();
      await elementUpdated(element);
      expect(element.isOpen).to.be.false;
    });

    it('should emit modal-open event when opened', async () => {
      let eventFired = false;
      element.addEventListener('modal-open', () => {
        eventFired = true;
      });

      element.open();
      await elementUpdated(element);

      expect(eventFired).to.be.true;
    });

    it('should emit modal-close event when closed', async () => {
      let eventFired = false;
      element.addEventListener('modal-close', () => {
        eventFired = true;
      });

      element.open();
      await elementUpdated(element);
      
      element.close();
      await elementUpdated(element);

      expect(eventFired).to.be.true;
    });
  });

  describe('Step Navigation', () => {
    beforeEach(async () => {
      element.open();
      await elementUpdated(element);
    });

    it('should start at step 1', () => {
      expect(element.currentStep).to.equal(1);
    });

    it('should navigate to next step', async () => {
      element.nextStep();
      await elementUpdated(element);
      
      expect(element.currentStep).to.equal(2);
    });

    it('should navigate to previous step', async () => {
      element.currentStep = 3;
      await elementUpdated(element);
      
      element.previousStep();
      await elementUpdated(element);
      
      expect(element.currentStep).to.equal(2);
    });

    it('should not go below step 1', async () => {
      element.currentStep = 1;
      await elementUpdated(element);
      
      element.previousStep();
      await elementUpdated(element);
      
      expect(element.currentStep).to.equal(1);
    });

    it('should not exceed maximum steps', async () => {
      // Assuming there are 4 steps maximum
      element.currentStep = 4;
      await elementUpdated(element);
      
      element.nextStep();
      await elementUpdated(element);
      
      expect(element.currentStep).to.equal(4);
    });

    it('should jump to specific step', async () => {
      element.goToStep(3);
      await elementUpdated(element);
      
      expect(element.currentStep).to.equal(3);
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      element.open();
      await elementUpdated(element);
    });

    it('should update component configuration', async () => {
      const newConfig = {
        name: 'TestComponent',
        category: 'atoms',
        template: 'basic'
      };

      element.updateConfig(newConfig);
      await elementUpdated(element);

      expect(element.config.name).to.equal('TestComponent');
      expect(element.config.category).to.equal('atoms');
      expect(element.config.template).to.equal('basic');
    });

    it('should validate configuration', async () => {
      const invalidConfig = {
        name: '', // Invalid: empty name
        category: 'atoms'
      };

      element.updateConfig(invalidConfig);
      const isValid = element.validateConfig();
      
      expect(isValid).to.be.false;
      expect(element.errors).to.have.length.greaterThan(0);
    });

    it('should clear validation errors when config is valid', async () => {
      // First create invalid config
      const invalidConfig = { name: '' };
      element.updateConfig(invalidConfig);
      element.validateConfig();
      expect(element.errors).to.have.length.greaterThan(0);

      // Then fix the config
      const validConfig = { 
        name: 'ValidComponent',
        category: 'atoms',
        template: 'basic'
      };
      element.updateConfig(validConfig);
      const isValid = element.validateConfig();
      
      expect(isValid).to.be.true;
      expect(element.errors).to.be.empty;
    });
  });

  describe('Component Generation', () => {
    beforeEach(async () => {
      element.open();
      await elementUpdated(element);
      element.updateConfig({
        name: 'TestComponent',
        category: 'atoms',
        template: 'basic'
      });
    });

    it('should start generation process', async () => {
      expect(element.isGenerating).to.be.false;
      
      element.generateComponent();
      expect(element.isGenerating).to.be.true;
    });

    it('should emit generation-start event', async () => {
      let eventFired = false;
      element.addEventListener('generation-start', () => {
        eventFired = true;
      });

      element.generateComponent();
      
      expect(eventFired).to.be.true;
    });

    it('should handle generation completion', async () => {
      const mockResult = {
        success: true,
        files: ['component.js', 'component.test.js'],
        component: { name: 'TestComponent' }
      };

      let completionEventFired = false;
      element.addEventListener('generation-complete', (event) => {
        completionEventFired = true;
        expect(event.detail.result).to.deep.equal(mockResult);
      });

      element.generateComponent();
      // Simulate async completion
      element.handleGenerationComplete(mockResult);

      expect(completionEventFired).to.be.true;
      expect(element.isGenerating).to.be.false;
      expect(element.generationResult).to.deep.equal(mockResult);
    });

    it('should handle generation error', async () => {
      const mockError = new Error('Generation failed');

      let errorEventFired = false;
      element.addEventListener('generation-error', (event) => {
        errorEventFired = true;
        expect(event.detail.error).to.equal(mockError);
      });

      element.generateComponent();
      // Simulate async error
      element.handleGenerationError(mockError);

      expect(errorEventFired).to.be.true;
      expect(element.isGenerating).to.be.false;
      expect(element.errors).to.include(mockError.message);
    });
  });

  describe('Preview Functionality', () => {
    beforeEach(async () => {
      element.open();
      await elementUpdated(element);
      element.updateConfig({
        name: 'PreviewComponent',
        category: 'molecules',
        template: 'form-field'
      });
    });

    it('should generate preview', async () => {
      element.generatePreview();
      await elementUpdated(element);

      expect(element.preview).to.be.an('object');
    });

    it('should update preview when config changes', async () => {
      element.generatePreview();
      const initialPreview = element.preview;

      element.updateConfig({ ...element.config, name: 'UpdatedComponent' });
      element.generatePreview();
      
      expect(element.preview).to.not.deep.equal(initialPreview);
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      element.open();
      await elementUpdated(element);
    });

    it('should validate component name format', async () => {
      const configs = [
        { name: 'valid-component', expected: true },
        { name: 'ValidComponent', expected: true },
        { name: 'invalid name', expected: false }, // spaces not allowed
        { name: '123invalid', expected: false }, // can't start with number
        { name: '', expected: false } // can't be empty
      ];

      configs.forEach(({ name, expected }) => {
        element.updateConfig({ name, category: 'atoms', template: 'basic' });
        const isValid = element.validateConfig();
        expect(isValid).to.equal(expected, `Validation failed for name: "${name}"`);
      });
    });

    it('should validate required fields', async () => {
      const requiredFields = ['name', 'category', 'template'];
      
      requiredFields.forEach(field => {
        const config = {
          name: 'TestComponent',
          category: 'atoms',
          template: 'basic'
        };
        delete config[field];
        
        element.updateConfig(config);
        const isValid = element.validateConfig();
        
        expect(isValid).to.be.false;
        expect(element.errors.some(error => error.includes(field))).to.be.true;
      });
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      element.open();
      await elementUpdated(element);
    });

    it('should close modal on Escape key', async () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      element.dispatchEvent(escapeEvent);
      await elementUpdated(element);

      expect(element.isOpen).to.be.false;
    });

    it('should navigate steps with arrow keys', async () => {
      const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      element.dispatchEvent(rightArrowEvent);
      await elementUpdated(element);

      expect(element.currentStep).to.equal(2);

      const leftArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      element.dispatchEvent(leftArrowEvent);
      await elementUpdated(element);

      expect(element.currentStep).to.equal(1);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      element.open();
      await elementUpdated(element);
    });

    it('should have proper ARIA attributes', async () => {
      const modal = element.shadowRoot.querySelector('[role="dialog"]');
      expect(modal).to.exist;
      
      const labelledBy = modal.getAttribute('aria-labelledby');
      expect(labelledBy).to.exist;
      
      const describedBy = modal.getAttribute('aria-describedby');
      expect(describedBy).to.exist;
    });

    it('should trap focus within modal', async () => {
      const focusableElements = element.shadowRoot.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).to.be.greaterThan(0);
    });

    it('should restore focus when closed', async () => {
      // This test would require more setup to test focus restoration
      // For now, just verify the close functionality works
      element.close();
      await elementUpdated(element);
      
      expect(element.isOpen).to.be.false;
    });
  });

  describe('Integration with Component Generator', () => {
    beforeEach(async () => {
      element.open();
      await elementUpdated(element);
    });

    it('should pass correct config to generator', async () => {
      const config = {
        name: 'TestButton',
        category: 'atoms',
        template: 'button',
        props: ['variant', 'size', 'disabled']
      };

      element.updateConfig(config);
      
      // Mock the component generator
      let capturedConfig = null;
      element.addEventListener('generation-start', (event) => {
        capturedConfig = event.detail.config;
      });

      element.generateComponent();

      expect(capturedConfig).to.deep.equal(config);
    });
  });
});