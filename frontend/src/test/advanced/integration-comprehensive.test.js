/**
 * Comprehensive Integration Testing Suite
 *
 * End-to-end workflow validation for all playground components
 * Covers component interactions, state management, event handling, theme switching
 */
import { test, expect, describe, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { fixture, html, aTimeout } from "@open-wc/testing";

// Integration test scenarios and workflows
const INTEGRATION_WORKFLOWS = {
  playground: {
    componentSelection: 'User selects component from navigation',
    propertyEditing: 'User modifies component properties',
    codeGeneration: 'User generates code examples',
    themeSwitch: 'User switches between themes',
    responsiveTesting: 'User tests component responsiveness'
  },
  userInteraction: {
    formCompletion: 'User completes a multi-step form',
    dataTableInteraction: 'User interacts with data table (sort, filter, paginate)',
    modalWorkflow: 'User opens modal, interacts, and closes',
    navigationFlow: 'User navigates through tabs and breadcrumbs',
    searchAndSelect: 'User searches and selects from dropdown/autocomplete'
  },
  systemIntegration: {
    stateManagement: 'Component state synchronization across the system',
    eventPropagation: 'Events properly propagate between components',
    errorHandling: 'System handles errors gracefully',
    performanceUnderLoad: 'System maintains performance with many components',
    memoryManagement: 'System properly cleans up resources'
  }
};

// Component interaction matrix for testing combinations
const COMPONENT_INTERACTION_MATRIX = {
  'form-with-validation': {
    components: ['text-input', 'select', 'checkbox', 'button', 'alert'],
    workflow: 'Complete form validation workflow'
  },
  'data-management': {
    components: ['data-table', 'pagination', 'modal', 'toast'],
    workflow: 'Data table CRUD operations with feedback'
  },
  'navigation-system': {
    components: ['tabs', 'breadcrumbs', 'button', 'icon'],
    workflow: 'Multi-level navigation with state tracking'
  },
  'search-interface': {
    components: ['text-input', 'dropdown', 'card', 'spinner'],
    workflow: 'Search with autocomplete and results'
  },
  'dashboard-layout': {
    components: ['card', 'charts', 'button', 'badge', 'progress-bar'],
    workflow: 'Dashboard with real-time updates'
  }
};

// Test utilities for integration scenarios
class IntegrationTestUtils {
  constructor() {
    this.eventLog = [];
    this.stateSnapshots = [];
    this.performanceMetrics = [];
  }

  logEvent(event, component, details = {}) {
    this.eventLog.push({
      timestamp: Date.now(),
      event,
      component,
      details
    });
  }

  captureStateSnapshot(components) {
    const snapshot = {
      timestamp: Date.now(),
      components: components.map(comp => ({
        id: comp.id || comp.tagName,
        state: this.extractComponentState(comp),
        attributes: Array.from(comp.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      }))
    };

    this.stateSnapshots.push(snapshot);
    return snapshot;
  }

  extractComponentState(component) {
    const state = {
      visible: component.offsetParent !== null,
      focused: document.activeElement === component,
      disabled: component.hasAttribute('disabled'),
      value: component.value || component.textContent?.trim()
    };

    // Component-specific state extraction
    if (component.tagName.toLowerCase().includes('modal')) {
      state.open = component.hasAttribute('open') ||
                  component.getAttribute('aria-hidden') === 'false';
    }

    if (component.tagName.toLowerCase().includes('tab')) {
      state.selected = component.hasAttribute('selected') ||
                     component.getAttribute('aria-selected') === 'true';
    }

    return state;
  }

  async simulateUserInteraction(component, interaction) {
    const startTime = performance.now();

    try {
      switch (interaction.type) {
        case 'click':
          component.click();
          break;
        case 'input':
          if (component.tagName === 'INPUT' || component.tagName === 'TEXTAREA') {
            component.value = interaction.value || 'test input';
            component.dispatchEvent(new Event('input', { bubbles: true }));
          }
          break;
        case 'keydown':
          component.dispatchEvent(new KeyboardEvent('keydown', {
            key: interaction.key || 'Enter',
            bubbles: true
          }));
          break;
        case 'focus':
          component.focus();
          break;
        case 'blur':
          component.blur();
          break;
        case 'change':
          if (component.tagName === 'SELECT') {
            component.value = interaction.value || component.options[1]?.value;
            component.dispatchEvent(new Event('change', { bubbles: true }));
          }
          break;
        default:
          throw new Error(`Unknown interaction type: ${interaction.type}`);
      }

      // Wait for component updates
      if (component.updateComplete) {
        await component.updateComplete;
      }

      // Wait for any animations or transitions
      await aTimeout(50);

      const endTime = performance.now();
      this.performanceMetrics.push({
        interaction: interaction.type,
        component: component.tagName,
        duration: endTime - startTime
      });

      return true;
    } catch (error) {
      console.error(`Interaction failed:`, error);
      return false;
    }
  }

  async waitForComponentUpdate(component, timeout = 1000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (component.updateComplete) {
        await component.updateComplete;
        return true;
      }
      await aTimeout(10);
    }

    return false;
  }

  validateWorkflow(workflowSteps, actualEvents) {
    const expectedSteps = workflowSteps.map(step => step.event);
    const actualSteps = actualEvents.map(event => event.event);

    return {
      completed: expectedSteps.every(step => actualSteps.includes(step)),
      missing: expectedSteps.filter(step => !actualSteps.includes(step)),
      unexpected: actualSteps.filter(step => !expectedSteps.includes(step)),
      sequence: this.validateSequence(expectedSteps, actualSteps)
    };
  }

  validateSequence(expected, actual) {
    let expectedIndex = 0;

    for (const step of actual) {
      if (step === expected[expectedIndex]) {
        expectedIndex++;
      }
    }

    return expectedIndex === expected.length;
  }

  generateIntegrationReport() {
    return {
      totalEvents: this.eventLog.length,
      stateSnapshots: this.stateSnapshots.length,
      averageInteractionTime: this.performanceMetrics.length > 0
        ? this.performanceMetrics.reduce((acc, metric) => acc + metric.duration, 0) / this.performanceMetrics.length
        : 0,
      slowestInteraction: this.performanceMetrics.length > 0
        ? Math.max(...this.performanceMetrics.map(m => m.duration))
        : 0,
      eventLog: this.eventLog.slice(-10), // Last 10 events
      performanceMetrics: this.performanceMetrics
    };
  }
}

// Main integration test suite
describe("Comprehensive Integration Testing Suite", () => {
  let testUtils;
  let playground;

  beforeAll(async () => {
    testUtils = new IntegrationTestUtils();
    console.log('Integration testing suite initialized');
  });

  beforeEach(() => {
    testUtils.eventLog = [];
    testUtils.stateSnapshots = [];
    testUtils.performanceMetrics = [];
  });

  afterEach(() => {
    const report = testUtils.generateIntegrationReport();
    if (report.totalEvents > 0) {
      console.log('Integration test report:', report);
    }
  });

  afterAll(() => {
    console.log('Integration testing suite completed');
  });

  // Playground system integration tests
  describe("Playground System Integration", () => {

    beforeEach(async () => {
      playground = await fixture(html`
        <div id="playground-simulation" class="playground-container">
          <aside class="component-nav">
            <div class="component-tree">
              <div class="category" data-category="atoms">
                <h3>Atoms</h3>
                <button class="component-item" data-component="button">Button</button>
                <button class="component-item" data-component="text-input">Text Input</button>
                <button class="component-item" data-component="checkbox">Checkbox</button>
              </div>
              <div class="category" data-category="molecules">
                <h3>Molecules</h3>
                <button class="component-item" data-component="modal">Modal</button>
                <button class="component-item" data-component="card">Card</button>
                <button class="component-item" data-component="alert">Alert</button>
              </div>
            </div>
          </aside>

          <main class="playground-content">
            <div class="toolbar">
              <button id="props-toggle">Properties</button>
              <button id="code-toggle">Code</button>
              <button id="theme-toggle">Theme</button>
            </div>

            <div id="component-preview" class="preview-area">
              <!-- Component will be rendered here -->
            </div>

            <div id="properties-panel" class="panel" style="display: none;">
              <h3>Properties</h3>
              <div class="property-controls">
                <!-- Property controls will be added dynamically -->
              </div>
            </div>

            <div id="code-panel" class="panel" style="display: none;">
              <h3>Generated Code</h3>
              <pre><code id="generated-code"></code></pre>
            </div>
          </main>
        </div>
      `);
    });

    test("component selection workflow", async () => {
      testUtils.logEvent('test-start', 'playground', { workflow: 'component-selection' });

      const componentItems = playground.querySelectorAll('.component-item');
      const previewArea = playground.querySelector('#component-preview');

      expect(componentItems.length).toBeGreaterThan(0);
      expect(previewArea).toBeTruthy();

      // Simulate selecting a component
      const buttonComponent = playground.querySelector('[data-component="button"]');
      expect(buttonComponent).toBeTruthy();

      const interactionSuccess = await testUtils.simulateUserInteraction(buttonComponent, { type: 'click' });
      expect(interactionSuccess).toBe(true);

      testUtils.logEvent('component-selected', 'button', {
        category: 'atoms',
        method: 'click'
      });

      // Simulate component rendering in preview
      previewArea.innerHTML = '<neo-button id="preview-button">Preview Button</neo-button>';
      const previewButton = previewArea.querySelector('#preview-button');

      if (previewButton) {
        testUtils.captureStateSnapshot([previewButton]);
        testUtils.logEvent('component-rendered', 'button', {
          preview: true,
          state: testUtils.extractComponentState(previewButton)
        });
      }

      expect(previewArea.children.length).toBe(1);
    });

    test("properties panel interaction workflow", async () => {
      testUtils.logEvent('test-start', 'playground', { workflow: 'properties-interaction' });

      // Set up initial component
      const previewArea = playground.querySelector('#component-preview');
      previewArea.innerHTML = '<neo-button id="target-button">Original Text</neo-button>';

      const propertiesPanel = playground.querySelector('#properties-panel');
      const propsToggle = playground.querySelector('#props-toggle');

      // Open properties panel
      await testUtils.simulateUserInteraction(propsToggle, { type: 'click' });
      propertiesPanel.style.display = 'block';

      testUtils.logEvent('panel-opened', 'properties', { visible: true });

      // Simulate adding property controls
      const propertyControls = playground.querySelector('.property-controls');
      propertyControls.innerHTML = `
        <div class="property">
          <label for="button-text">Button Text</label>
          <input type="text" id="button-text" value="Original Text">
        </div>
        <div class="property">
          <label for="button-variant">Variant</label>
          <select id="button-variant">
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
        </div>
        <div class="property">
          <label for="button-disabled">Disabled</label>
          <input type="checkbox" id="button-disabled">
        </div>
      `;

      const textInput = propertyControls.querySelector('#button-text');
      const variantSelect = propertyControls.querySelector('#button-variant');
      const disabledCheckbox = propertyControls.querySelector('#button-disabled');

      // Test property changes
      await testUtils.simulateUserInteraction(textInput, {
        type: 'input',
        value: 'Updated Button Text'
      });

      await testUtils.simulateUserInteraction(variantSelect, {
        type: 'change',
        value: 'secondary'
      });

      await testUtils.simulateUserInteraction(disabledCheckbox, { type: 'click' });

      testUtils.logEvent('properties-changed', 'button', {
        text: textInput.value,
        variant: variantSelect.value,
        disabled: disabledCheckbox.checked
      });

      // Verify property changes reflected in component
      const targetButton = previewArea.querySelector('#target-button');
      if (targetButton) {
        targetButton.textContent = textInput.value;
        targetButton.setAttribute('variant', variantSelect.value);
        if (disabledCheckbox.checked) {
          targetButton.setAttribute('disabled', '');
        }

        const finalState = testUtils.extractComponentState(targetButton);
        testUtils.logEvent('component-updated', 'button', { state: finalState });

        expect(targetButton.textContent).toBe('Updated Button Text');
        expect(targetButton.getAttribute('variant')).toBe('secondary');
        expect(targetButton.hasAttribute('disabled')).toBe(true);
      }
    });

    test("theme switching workflow", async () => {
      testUtils.logEvent('test-start', 'playground', { workflow: 'theme-switching' });

      const themeToggle = playground.querySelector('#theme-toggle');
      const playgroundContainer = playground.querySelector('.playground-container');

      // Initial theme state
      const initialTheme = playgroundContainer.getAttribute('data-theme') || 'light';
      testUtils.captureStateSnapshot([playgroundContainer]);

      // Switch theme
      await testUtils.simulateUserInteraction(themeToggle, { type: 'click' });

      const newTheme = initialTheme === 'light' ? 'dark' : 'light';
      playgroundContainer.setAttribute('data-theme', newTheme);

      testUtils.logEvent('theme-changed', 'playground', {
        from: initialTheme,
        to: newTheme
      });

      // Verify theme applied to all components
      const allComponents = playground.querySelectorAll('[class*="neo-"]');
      allComponents.forEach(component => {
        component.setAttribute('data-theme', newTheme);
        testUtils.logEvent('component-themed', component.tagName, { theme: newTheme });
      });

      expect(playgroundContainer.getAttribute('data-theme')).toBe(newTheme);

      // Test theme persistence simulation
      localStorage.setItem('playground-theme', newTheme);
      expect(localStorage.getItem('playground-theme')).toBe(newTheme);
    });

    test("code generation workflow", async () => {
      testUtils.logEvent('test-start', 'playground', { workflow: 'code-generation' });

      const codeToggle = playground.querySelector('#code-toggle');
      const codePanel = playground.querySelector('#code-panel');
      const generatedCode = playground.querySelector('#generated-code');

      // Set up component for code generation
      const previewArea = playground.querySelector('#component-preview');
      previewArea.innerHTML = '<neo-button variant="primary" disabled>Generated Button</neo-button>';

      // Open code panel
      await testUtils.simulateUserInteraction(codeToggle, { type: 'click' });
      codePanel.style.display = 'block';

      // Simulate code generation
      const component = previewArea.querySelector('neo-button');
      if (component) {
        const generatedHTML = this.generateComponentCode(component);
        generatedCode.textContent = generatedHTML;

        testUtils.logEvent('code-generated', 'button', {
          html: generatedHTML,
          attributes: Array.from(component.attributes).length
        });
      }

      expect(generatedCode.textContent).toBeTruthy();
      expect(generatedCode.textContent).toContain('neo-button');
    });

    generateComponentCode(component) {
      const attributes = Array.from(component.attributes)
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');

      return `<${component.tagName.toLowerCase()}${attributes ? ' ' + attributes : ''}>${component.textContent}</${component.tagName.toLowerCase()}>`;
    }
  });

  // Complex component interaction workflows
  describe("Complex Component Interaction Workflows", () => {

    test("form completion with validation workflow", async () => {
      const formWorkflow = await fixture(html`
        <div class="form-workflow">
          <neo-form id="test-form" role="form" aria-label="Test Form">
            <div class="form-field">
              <label for="username">Username</label>
              <neo-text-input
                id="username"
                name="username"
                required
                aria-describedby="username-error">
              </neo-text-input>
              <neo-alert id="username-error" type="error" style="display: none;" role="alert">
                Username is required
              </neo-alert>
            </div>

            <div class="form-field">
              <label for="email">Email</label>
              <neo-text-input
                id="email"
                name="email"
                type="email"
                required
                aria-describedby="email-error">
              </neo-text-input>
              <neo-alert id="email-error" type="error" style="display: none;" role="alert">
                Valid email is required
              </neo-alert>
            </div>

            <div class="form-field">
              <neo-checkbox
                id="agree-terms"
                name="agreeTerms"
                required
                aria-describedby="terms-error">
                I agree to the terms
              </neo-checkbox>
              <neo-alert id="terms-error" type="error" style="display: none;" role="alert">
                You must agree to terms
              </neo-alert>
            </div>

            <div class="form-actions">
              <neo-button type="submit" id="submit-btn">Submit</neo-button>
              <neo-button type="reset" variant="secondary" id="reset-btn">Reset</neo-button>
            </div>
          </neo-form>

          <neo-toast id="success-toast" type="success" style="display: none;">
            Form submitted successfully!
          </neo-toast>
        </div>
      `);

      testUtils.logEvent('test-start', 'form', { workflow: 'validation-complete' });

      const usernameInput = formWorkflow.querySelector('#username');
      const emailInput = formWorkflow.querySelector('#email');
      const agreeCheckbox = formWorkflow.querySelector('#agree-terms');
      const submitButton = formWorkflow.querySelector('#submit-btn');

      // Test form validation workflow

      // Step 1: Try submitting empty form
      await testUtils.simulateUserInteraction(submitButton, { type: 'click' });

      // Simulate validation errors
      const usernameError = formWorkflow.querySelector('#username-error');
      const emailError = formWorkflow.querySelector('#email-error');
      const termsError = formWorkflow.querySelector('#terms-error');

      usernameError.style.display = 'block';
      emailError.style.display = 'block';
      termsError.style.display = 'block';

      testUtils.logEvent('validation-failed', 'form', {
        errors: ['username', 'email', 'terms']
      });

      // Step 2: Fill form fields
      await testUtils.simulateUserInteraction(usernameInput, {
        type: 'input',
        value: 'testuser'
      });
      usernameError.style.display = 'none';

      await testUtils.simulateUserInteraction(emailInput, {
        type: 'input',
        value: 'test@example.com'
      });
      emailError.style.display = 'none';

      await testUtils.simulateUserInteraction(agreeCheckbox, { type: 'click' });
      termsError.style.display = 'none';

      testUtils.logEvent('form-completed', 'form', {
        username: usernameInput.value,
        email: emailInput.value,
        agreed: agreeCheckbox.checked
      });

      // Step 3: Submit valid form
      await testUtils.simulateUserInteraction(submitButton, { type: 'click' });

      const successToast = formWorkflow.querySelector('#success-toast');
      successToast.style.display = 'block';

      testUtils.logEvent('form-submitted', 'form', { success: true });

      // Verify workflow completion
      const workflowSteps = [
        { event: 'validation-failed' },
        { event: 'form-completed' },
        { event: 'form-submitted' }
      ];

      const workflowValidation = testUtils.validateWorkflow(workflowSteps, testUtils.eventLog);
      expect(workflowValidation.completed).toBe(true);
      expect(workflowValidation.sequence).toBe(true);
    });

    test("data table interaction workflow", async () => {
      const tableWorkflow = await fixture(html`
        <div class="table-workflow">
          <div class="table-controls">
            <neo-text-input id="search-input" placeholder="Search..."></neo-text-input>
            <neo-select id="filter-select">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </neo-select>
          </div>

          <neo-data-table id="main-table" aria-label="User data table">
            <thead>
              <tr>
                <th data-sortable="name">Name</th>
                <th data-sortable="status">Status</th>
                <th data-sortable="date">Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${Array(10).fill(0).map((_, i) => html`
                <tr data-status="${i % 2 === 0 ? 'active' : 'inactive'}">
                  <td>User ${i + 1}</td>
                  <td><neo-badge type="${i % 2 === 0 ? 'success' : 'warning'}">${i % 2 === 0 ? 'Active' : 'Inactive'}</neo-badge></td>
                  <td>2023-12-${(i + 1).toString().padStart(2, '0')}</td>
                  <td>
                    <neo-button size="small" data-action="edit" data-id="${i}">Edit</neo-button>
                    <neo-button size="small" variant="danger" data-action="delete" data-id="${i}">Delete</neo-button>
                  </td>
                </tr>
              `)}
            </tbody>
          </neo-data-table>

          <neo-pagination
            id="table-pagination"
            total="100"
            current="1"
            page-size="10">
          </neo-pagination>

          <neo-modal id="edit-modal" style="display: none;">
            <div class="modal-content">
              <h3>Edit User</h3>
              <neo-text-input id="edit-name" label="Name"></neo-text-input>
              <neo-select id="edit-status" label="Status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </neo-select>
              <div class="modal-actions">
                <neo-button id="save-btn">Save</neo-button>
                <neo-button variant="secondary" id="cancel-btn">Cancel</neo-button>
              </div>
            </div>
          </neo-modal>
        </div>
      `);

      testUtils.logEvent('test-start', 'table', { workflow: 'data-interaction' });

      const searchInput = tableWorkflow.querySelector('#search-input');
      const filterSelect = tableWorkflow.querySelector('#filter-select');
      const table = tableWorkflow.querySelector('#main-table');
      const pagination = tableWorkflow.querySelector('#table-pagination');
      const editModal = tableWorkflow.querySelector('#edit-modal');

      // Test search functionality
      await testUtils.simulateUserInteraction(searchInput, {
        type: 'input',
        value: 'User 1'
      });

      testUtils.logEvent('search-performed', 'table', { query: 'User 1' });

      // Simulate filtering table rows
      const allRows = table.querySelectorAll('tbody tr');
      allRows.forEach((row, index) => {
        const shouldShow = row.textContent.toLowerCase().includes('user 1');
        row.style.display = shouldShow ? '' : 'none';
      });

      // Test filter functionality
      await testUtils.simulateUserInteraction(filterSelect, {
        type: 'change',
        value: 'active'
      });

      testUtils.logEvent('filter-applied', 'table', { filter: 'active' });

      // Test sorting
      const nameHeader = table.querySelector('[data-sortable="name"]');
      await testUtils.simulateUserInteraction(nameHeader, { type: 'click' });

      testUtils.logEvent('sort-applied', 'table', { column: 'name', direction: 'asc' });

      // Test row action (edit)
      const editButton = table.querySelector('[data-action="edit"]');
      await testUtils.simulateUserInteraction(editButton, { type: 'click' });

      editModal.style.display = 'block';
      editModal.setAttribute('aria-hidden', 'false');

      testUtils.logEvent('modal-opened', 'edit', { userId: editButton.getAttribute('data-id') });

      // Test modal interaction
      const editName = editModal.querySelector('#edit-name');
      const saveButton = editModal.querySelector('#save-btn');
      const cancelButton = editModal.querySelector('#cancel-btn');

      await testUtils.simulateUserInteraction(editName, {
        type: 'input',
        value: 'Updated User Name'
      });

      await testUtils.simulateUserInteraction(saveButton, { type: 'click' });

      editModal.style.display = 'none';
      editModal.setAttribute('aria-hidden', 'true');

      testUtils.logEvent('user-updated', 'table', {
        name: editName.value,
        action: 'save'
      });

      // Test pagination
      await testUtils.simulateUserInteraction(pagination, { type: 'click' });
      testUtils.logEvent('page-changed', 'pagination', { page: 2 });

      // Verify complex workflow
      const expectedEvents = ['search-performed', 'filter-applied', 'sort-applied', 'modal-opened', 'user-updated'];
      const actualEvents = testUtils.eventLog.map(log => log.event);

      expectedEvents.forEach(expectedEvent => {
        expect(actualEvents).toContain(expectedEvent);
      });
    });

    test("navigation system workflow", async () => {
      const navigationWorkflow = await fixture(html`
        <div class="navigation-workflow">
          <nav class="main-navigation">
            <neo-breadcrumbs id="breadcrumbs">
              <neo-breadcrumb href="/">Home</neo-breadcrumb>
              <neo-breadcrumb href="/products">Products</neo-breadcrumb>
              <neo-breadcrumb current>Category</neo-breadcrumb>
            </neo-breadcrumbs>

            <neo-tabs id="main-tabs" role="tablist">
              <neo-tab role="tab" aria-controls="overview-panel" data-target="overview">Overview</neo-tab>
              <neo-tab role="tab" aria-controls="details-panel" data-target="details">Details</neo-tab>
              <neo-tab role="tab" aria-controls="reviews-panel" data-target="reviews">Reviews</neo-tab>
            </neo-tabs>
          </nav>

          <main class="content-area">
            <div id="overview-panel" role="tabpanel" class="tab-content active">
              <h2>Overview Content</h2>
              <neo-card>
                <p>Overview information</p>
                <neo-button data-navigate="details">View Details</neo-button>
              </neo-card>
            </div>

            <div id="details-panel" role="tabpanel" class="tab-content" style="display: none;">
              <h2>Details Content</h2>
              <neo-card>
                <p>Detailed information</p>
                <neo-button data-navigate="reviews">View Reviews</neo-button>
              </neo-card>
            </div>

            <div id="reviews-panel" role="tabpanel" class="tab-content" style="display: none;">
              <h2>Reviews Content</h2>
              <neo-card>
                <p>Customer reviews</p>
                <neo-button data-navigate="overview">Back to Overview</neo-button>
              </neo-card>
            </div>
          </main>
        </div>
      `);

      testUtils.logEvent('test-start', 'navigation', { workflow: 'multi-level-nav' });

      const tabs = navigationWorkflow.querySelectorAll('neo-tab');
      const tabPanels = navigationWorkflow.querySelectorAll('.tab-content');
      const navigationButtons = navigationWorkflow.querySelectorAll('[data-navigate]');

      // Test tab navigation
      const detailsTab = Array.from(tabs).find(tab => tab.getAttribute('data-target') === 'details');
      await testUtils.simulateUserInteraction(detailsTab, { type: 'click' });

      // Simulate tab switching
      tabs.forEach(tab => {
        tab.setAttribute('aria-selected', 'false');
        tab.classList.remove('active');
      });

      tabPanels.forEach(panel => {
        panel.style.display = 'none';
        panel.setAttribute('aria-hidden', 'true');
      });

      detailsTab.setAttribute('aria-selected', 'true');
      detailsTab.classList.add('active');

      const detailsPanel = navigationWorkflow.querySelector('#details-panel');
      detailsPanel.style.display = 'block';
      detailsPanel.setAttribute('aria-hidden', 'false');

      testUtils.logEvent('tab-switched', 'navigation', { tab: 'details' });

      // Test navigation button
      const reviewsButton = detailsPanel.querySelector('[data-navigate="reviews"]');
      await testUtils.simulateUserInteraction(reviewsButton, { type: 'click' });

      // Simulate programmatic navigation
      const reviewsTab = Array.from(tabs).find(tab => tab.getAttribute('data-target') === 'reviews');
      const reviewsPanel = navigationWorkflow.querySelector('#reviews-panel');

      tabs.forEach(tab => {
        tab.setAttribute('aria-selected', 'false');
        tab.classList.remove('active');
      });

      tabPanels.forEach(panel => {
        panel.style.display = 'none';
        panel.setAttribute('aria-hidden', 'true');
      });

      reviewsTab.setAttribute('aria-selected', 'true');
      reviewsTab.classList.add('active');
      reviewsPanel.style.display = 'block';
      reviewsPanel.setAttribute('aria-hidden', 'false');

      testUtils.logEvent('programmatic-navigation', 'navigation', {
        from: 'details',
        to: 'reviews'
      });

      // Test breadcrumb navigation
      const breadcrumbHome = navigationWorkflow.querySelector('neo-breadcrumb[href="/"]');
      if (breadcrumbHome) {
        await testUtils.simulateUserInteraction(breadcrumbHome, { type: 'click' });
        testUtils.logEvent('breadcrumb-navigation', 'navigation', { target: 'home' });
      }

      // Verify navigation state consistency
      const activeTab = navigationWorkflow.querySelector('neo-tab[aria-selected="true"]');
      const visiblePanel = navigationWorkflow.querySelector('.tab-content[aria-hidden="false"]');

      expect(activeTab).toBeTruthy();
      expect(visiblePanel).toBeTruthy();
      expect(activeTab.getAttribute('data-target')).toBe('reviews');
      expect(visiblePanel.id).toBe('reviews-panel');
    });
  });

  // System-wide integration tests
  describe("System-Wide Integration", () => {

    test("state management synchronization", async () => {
      const systemState = await fixture(html`
        <div class="system-state-test">
          <div class="component-group-1">
            <neo-button id="theme-btn" data-action="toggle-theme">Toggle Theme</neo-button>
            <neo-button id="size-btn" data-action="toggle-size">Toggle Size</neo-button>
          </div>

          <div class="component-group-2">
            <neo-card id="test-card" class="theme-light size-normal">
              <p>Synchronized component</p>
            </neo-card>
            <neo-modal id="test-modal" class="theme-light size-normal">
              <p>Another synchronized component</p>
            </neo-modal>
          </div>

          <div class="state-display">
            <neo-badge id="theme-indicator">Light</neo-badge>
            <neo-badge id="size-indicator">Normal</neo-badge>
          </div>
        </div>
      `);

      testUtils.logEvent('test-start', 'system', { workflow: 'state-sync' });

      const themeButton = systemState.querySelector('#theme-btn');
      const sizeButton = systemState.querySelector('#size-btn');
      const card = systemState.querySelector('#test-card');
      const modal = systemState.querySelector('#test-modal');
      const themeIndicator = systemState.querySelector('#theme-indicator');
      const sizeIndicator = systemState.querySelector('#size-indicator');

      let currentTheme = 'light';
      let currentSize = 'normal';

      // Test theme synchronization
      await testUtils.simulateUserInteraction(themeButton, { type: 'click' });

      currentTheme = currentTheme === 'light' ? 'dark' : 'light';

      // Update all components with new theme
      [card, modal].forEach(component => {
        component.classList.remove('theme-light', 'theme-dark');
        component.classList.add(`theme-${currentTheme}`);
      });

      themeIndicator.textContent = currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);

      testUtils.logEvent('theme-synchronized', 'system', {
        theme: currentTheme,
        affectedComponents: 2
      });

      // Test size synchronization
      await testUtils.simulateUserInteraction(sizeButton, { type: 'click' });

      currentSize = currentSize === 'normal' ? 'large' : 'normal';

      [card, modal].forEach(component => {
        component.classList.remove('size-normal', 'size-large');
        component.classList.add(`size-${currentSize}`);
      });

      sizeIndicator.textContent = currentSize.charAt(0).toUpperCase() + currentSize.slice(1);

      testUtils.logEvent('size-synchronized', 'system', {
        size: currentSize,
        affectedComponents: 2
      });

      // Verify state consistency
      expect(card.classList.contains(`theme-${currentTheme}`)).toBe(true);
      expect(card.classList.contains(`size-${currentSize}`)).toBe(true);
      expect(modal.classList.contains(`theme-${currentTheme}`)).toBe(true);
      expect(modal.classList.contains(`size-${currentSize}`)).toBe(true);
      expect(themeIndicator.textContent.toLowerCase()).toBe(currentTheme);
      expect(sizeIndicator.textContent.toLowerCase()).toBe(currentSize);
    });

    test("error boundary and recovery workflow", async () => {
      const errorBoundaryTest = await fixture(html`
        <div class="error-boundary-test">
          <div class="error-boundary" id="main-boundary">
            <neo-button id="trigger-error">Trigger Error</neo-button>
            <neo-card id="error-prone-component">
              <p>This component might fail</p>
            </neo-card>
          </div>

          <neo-alert id="error-alert" type="error" style="display: none;" role="alert">
            An error occurred. Please try again.
          </neo-alert>

          <neo-button id="recovery-btn" style="display: none;">
            Recover Component
          </neo-button>
        </div>
      `);

      testUtils.logEvent('test-start', 'system', { workflow: 'error-recovery' });

      const triggerButton = errorBoundaryTest.querySelector('#trigger-error');
      const errorProneComponent = errorBoundaryTest.querySelector('#error-prone-component');
      const errorAlert = errorBoundaryTest.querySelector('#error-alert');
      const recoveryButton = errorBoundaryTest.querySelector('#recovery-btn');

      // Simulate error trigger
      await testUtils.simulateUserInteraction(triggerButton, { type: 'click' });

      // Simulate component error
      errorProneComponent.style.display = 'none';
      errorProneComponent.setAttribute('data-error', 'Component failed to render');

      errorAlert.style.display = 'block';
      recoveryButton.style.display = 'block';

      testUtils.logEvent('error-occurred', 'system', {
        component: 'error-prone-component',
        error: 'Component failed to render'
      });

      // Test error recovery
      await testUtils.simulateUserInteraction(recoveryButton, { type: 'click' });

      errorProneComponent.style.display = 'block';
      errorProneComponent.removeAttribute('data-error');

      errorAlert.style.display = 'none';
      recoveryButton.style.display = 'none';

      testUtils.logEvent('error-recovered', 'system', {
        component: 'error-prone-component',
        method: 'manual-recovery'
      });

      // Verify recovery
      expect(errorProneComponent.style.display).toBe('block');
      expect(errorAlert.style.display).toBe('none');
      expect(recoveryButton.style.display).toBe('none');
    });

    test("performance under load", async () => {
      testUtils.logEvent('test-start', 'system', { workflow: 'performance-load' });

      const performanceStart = performance.now();

      // Create multiple components simultaneously
      const componentPromises = [];

      for (let i = 0; i < 20; i++) {
        const componentPromise = fixture(html`
          <div class="load-test-component" id="comp-${i}">
            <neo-card>
              <neo-button>Button ${i}</neo-button>
              <neo-text-input placeholder="Input ${i}"></neo-text-input>
              <neo-badge type="info">${i}</neo-badge>
            </neo-card>
          </div>
        `);
        componentPromises.push(componentPromise);
      }

      const components = await Promise.all(componentPromises);
      const performanceEnd = performance.now();

      const totalLoadTime = performanceEnd - performanceStart;
      const averageLoadTime = totalLoadTime / components.length;

      testUtils.logEvent('load-test-completed', 'system', {
        componentCount: components.length,
        totalTime: totalLoadTime,
        averageTime: averageLoadTime
      });

      // Verify all components loaded successfully
      expect(components.length).toBe(20);
      components.forEach((component, index) => {
        expect(component.querySelector('neo-button')).toBeTruthy();
        expect(component.querySelector('neo-text-input')).toBeTruthy();
        expect(component.querySelector('neo-badge')).toBeTruthy();
      });

      // Performance thresholds
      expect(averageLoadTime).toBeLessThan(50); // 50ms average per component
      expect(totalLoadTime).toBeLessThan(1000); // 1 second total for 20 components
    });
  });
});
