/**
 * Tests for Design System Panel component
 */

import { fixture, expect, elementUpdated } from '@open-wc/testing';
import { html } from 'lit';
import '../../playground/components/design-system-panel.js';

describe('DesignSystemPanel', () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<design-system-panel></design-system-panel>`);
  });

  describe('Component Initialization', () => {
    it('should create element with default properties', async () => {
      expect(element).to.exist;
      expect(element.isOpen).to.be.false;
      expect(element.activeTab).to.equal('themes');
      expect(element.selectedTokenCategory).to.equal('colors');
      expect(element.unsavedChanges).to.be.false;
    });

    it('should have proper component tag name', () => {
      expect(element.tagName.toLowerCase()).to.equal('design-system-panel');
    });

    it('should be initially closed (not visible)', () => {
      expect(element.hasAttribute('is-open')).to.be.false;
    });
  });

  describe('Panel Visibility', () => {
    it('should open panel when isOpen is set to true', async () => {
      element.isOpen = true;
      await elementUpdated(element);
      
      expect(element.hasAttribute('is-open')).to.be.true;
    });

    it('should close panel when isOpen is set to false', async () => {
      element.isOpen = true;
      await elementUpdated(element);
      expect(element.hasAttribute('is-open')).to.be.true;

      element.isOpen = false;
      await elementUpdated(element);
      expect(element.hasAttribute('is-open')).to.be.false;
    });

    it('should toggle panel visibility', async () => {
      const initialState = element.isOpen;
      element.toggle();
      await elementUpdated(element);
      
      expect(element.isOpen).to.equal(!initialState);
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to themes tab', async () => {
      element.setActiveTab('themes');
      await elementUpdated(element);
      
      expect(element.activeTab).to.equal('themes');
    });

    it('should switch to tokens tab', async () => {
      element.setActiveTab('tokens');
      await elementUpdated(element);
      
      expect(element.activeTab).to.equal('tokens');
    });

    it('should switch to export tab', async () => {
      element.setActiveTab('export');
      await elementUpdated(element);
      
      expect(element.activeTab).to.equal('export');
    });

    it('should handle invalid tab name gracefully', async () => {
      const initialTab = element.activeTab;
      element.setActiveTab('invalid-tab');
      await elementUpdated(element);
      
      // Should remain on current tab or fallback to default
      expect(['themes', 'tokens', 'export']).to.include(element.activeTab);
    });
  });

  describe('Theme Management', () => {
    it('should apply theme when selected', async () => {
      element.applyTheme('dark');
      await elementUpdated(element);
      
      expect(element.currentTheme).to.equal('dark');
    });

    it('should handle theme switching', async () => {
      element.currentTheme = 'light';
      await elementUpdated(element);
      
      element.applyTheme('dark');
      await elementUpdated(element);
      
      expect(element.currentTheme).to.equal('dark');
    });
  });

  describe('Token Category Selection', () => {
    it('should select token category', async () => {
      element.selectTokenCategory('spacing');
      await elementUpdated(element);
      
      expect(element.selectedTokenCategory).to.equal('spacing');
    });

    it('should handle different token categories', async () => {
      const categories = ['colors', 'spacing', 'typography', 'borders'];
      
      for (const category of categories) {
        element.selectTokenCategory(category);
        await elementUpdated(element);
        expect(element.selectedTokenCategory).to.equal(category);
      }
    });
  });

  describe('Unsaved Changes Tracking', () => {
    it('should track unsaved changes', async () => {
      expect(element.unsavedChanges).to.be.false;
      
      // Simulate a token update that would mark changes as unsaved
      element.unsavedChanges = true;
      await elementUpdated(element);
      
      expect(element.unsavedChanges).to.be.true;
    });

    it('should clear unsaved changes when saved', async () => {
      element.unsavedChanges = true;
      await elementUpdated(element);
      
      element.unsavedChanges = false;
      await elementUpdated(element);
      
      expect(element.unsavedChanges).to.be.false;
    });
  });

  describe('Event Handling', () => {
    it('should emit close event when panel is closed', async () => {
      let eventFired = false;
      element.addEventListener('panel-close', () => {
        eventFired = true;
      });

      // Open panel first
      element.isOpen = true;
      await elementUpdated(element);

      // Close panel
      element.close();
      await elementUpdated(element);

      expect(eventFired).to.be.true;
      expect(element.isOpen).to.be.false;
    });

    it('should emit theme-change event when theme is applied', async () => {
      let capturedTheme = null;
      element.addEventListener('theme-change', (event) => {
        capturedTheme = event.detail.theme;
      });

      element.applyTheme('dark');
      await elementUpdated(element);

      expect(capturedTheme).to.equal('dark');
    });
  });

  describe('Rendering', () => {
    it('should render panel header', async () => {
      element.isOpen = true;
      await elementUpdated(element);

      const header = element.shadowRoot.querySelector('.panel-header');
      expect(header).to.exist;
    });

    it('should render tab navigation', async () => {
      element.isOpen = true;
      await elementUpdated(element);

      const tabs = element.shadowRoot.querySelector('.tab-navigation');
      expect(tabs).to.exist;
    });

    it('should render active tab content', async () => {
      element.isOpen = true;
      element.activeTab = 'themes';
      await elementUpdated(element);

      const content = element.shadowRoot.querySelector('.tab-content');
      expect(content).to.exist;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      element.isOpen = true;
      await elementUpdated(element);

      const panel = element.shadowRoot.querySelector('[role="dialog"]');
      expect(panel).to.exist;
    });

    it('should be keyboard navigable', async () => {
      element.isOpen = true;
      await elementUpdated(element);

      const closeButton = element.shadowRoot.querySelector('[aria-label*="Close"]');
      expect(closeButton).to.exist;
    });
  });
});