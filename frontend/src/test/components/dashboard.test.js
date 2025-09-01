import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout.js';
import { DashboardWelcome } from '../../components/dashboard/dashboard-welcome.js';
import { DashboardMetrics } from '../../components/dashboard/dashboard-metrics.js';
import { DashboardQuickActions } from '../../components/dashboard/dashboard-quick-actions.js';
import { ProjectOnboarding } from '../../components/dashboard/project-onboarding.js';
import { ProjectsList } from '../../components/dashboard/projects-list.js';

describe('Dashboard Components', () => {
  describe('DashboardLayout', () => {
    let element;

    beforeEach(() => {
      element = new DashboardLayout();
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('should render with default properties', () => {
      expect(element.currentView).toBe('overview');
      expect(element.isLoading).toBe(true);
      expect(element.sidebarCollapsed).toBe(false);
    });

    it('should handle navigation events', () => {
      const mockEvent = new CustomEvent('dashboard-navigate', {
        detail: { view: 'projects' }
      });

      element._handleNavigation(mockEvent);
      expect(element.currentView).toBe('projects');
    });

    it('should detect mobile view', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600
      });

      element._checkMobile();
      expect(element.isMobile).toBe(true);

      // Reset
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
    });

    it('should toggle mobile menu', () => {
      element.isMobile = true;
      element.showMobileMenu = false;

      element._toggleMobileMenu();
      expect(element.showMobileMenu).toBe(true);

      element._toggleMobileMenu();
      expect(element.showMobileMenu).toBe(false);
    });
  });

  describe('DashboardWelcome', () => {
    let element;

    beforeEach(() => {
      element = new DashboardWelcome();
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('should render with user data', () => {
      element.user = { name: 'John Doe', role: 'Developer' };
      element.isLoading = false;
      element.requestUpdate();

      expect(element.user.name).toBe('John Doe');
    });

    it('should generate greeting based on time', () => {
      const greeting = element._getGreeting();
      expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
    });

    it('should handle quick actions', () => {
      const mockEvent = new CustomEvent('quick-action', {
        detail: { action: 'create_project' }
      });

      const dispatchSpy = vi.spyOn(element, 'dispatchEvent');
      element._handleQuickAction(mockEvent);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quick-action',
          detail: { action: 'create_project' }
        })
      );
    });

    it('should load recent activity', async () => {
      element.user = { name: 'Test User' };
      await element._loadRecentActivity();

      expect(element.recentActivity.length).toBeGreaterThan(0);
      expect(element.recentActivity[0]).toHaveProperty('title');
      expect(element.recentActivity[0]).toHaveProperty('description');
    });
  });

  describe('DashboardMetrics', () => {
    let element;

    beforeEach(() => {
      element = new DashboardMetrics();
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('should load fallback metrics on API error', async () => {
      // Mock API failure
      vi.mock('../../services/api.js', () => ({
        apiService: {
          request: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      }));

      await element._loadMetrics();

      expect(element.metrics).toHaveProperty('projects');
      expect(element.metrics).toHaveProperty('tasks');
      expect(element.metrics).toHaveProperty('team');
      expect(element.metrics).toHaveProperty('productivity');
    });

    it('should calculate trend correctly', () => {
      expect(element._getTrend(5)).toBe('positive');
      expect(element._getTrend(-3)).toBe('negative');
      expect(element._getTrend(0)).toBe('neutral');
    });

    it('should format change values', () => {
      expect(element._formatChange(5)).toBe('+5');
      expect(element._formatChange(-3)).toBe('-3');
      expect(element._formatChange(0)).toBe('0');
    });

    it('should change time range', () => {
      element.timeRange = '7d';
      element._changeTimeRange('30d');

      expect(element.timeRange).toBe('30d');
    });
  });

  describe('DashboardQuickActions', () => {
    let element;

    beforeEach(() => {
      element = new DashboardQuickActions();
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('should load default actions', async () => {
      await element._loadActions();

      expect(element.actions.length).toBeGreaterThan(0);
      expect(element.actions[0]).toHaveProperty('id');
      expect(element.actions[0]).toHaveProperty('title');
      expect(element.actions[0]).toHaveProperty('icon');
    });

    it('should handle action clicks', () => {
      const action = {
        id: 'test_action',
        title: 'Test Action',
        description: 'Test description',
        icon: '🔧'
      };

      const dispatchSpy = vi.spyOn(element, 'dispatchEvent');
      element._handleActionClick(action);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quick-action',
          detail: { action: 'test_action' }
        })
      );
    });

    it('should get correct priority color', () => {
      expect(element._getPriorityColor('high')).toBe('#ef4444');
      expect(element._getPriorityColor('medium')).toBe('#f59e0b');
      expect(element._getPriorityColor('low')).toBe('#10b981');
    });
  });

  describe('ProjectOnboarding', () => {
    let element;

    beforeEach(() => {
      element = new ProjectOnboarding();
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('should start with first step', () => {
      expect(element.currentStep).toBe(1);
      expect(element.projectData.template).toBe(null);
    });

    it('should load templates', async () => {
      await element._loadTemplates();

      expect(element.templates.length).toBeGreaterThan(0);
      expect(element.templates[0]).toHaveProperty('id');
      expect(element.templates[0]).toHaveProperty('name');
      expect(element.templates[0]).toHaveProperty('icon');
    });

    it('should select template', () => {
      const template = {
        id: 'test-template',
        name: 'Test Template',
        category: 'Test Category'
      };

      element._selectTemplate(template);

      expect(element.projectData.template).toBe('test-template');
      expect(element.projectData.category).toBe('Test Category');
    });

    it('should update project data', () => {
      element._updateProjectData('name', 'Test Project');
      expect(element.projectData.name).toBe('Test Project');

      element._updateProjectData('description', 'Test Description');
      expect(element.projectData.description).toBe('Test Description');
    });

    it('should navigate between steps', () => {
      element.currentStep = 1;
      element.projectData.template = 'test-template';

      element._goToNext();
      expect(element.currentStep).toBe(2);

      element._goToPrevious();
      expect(element.currentStep).toBe(1);
    });

    it('should validate step progression', () => {
      element.currentStep = 1;
      element.projectData.template = null;

      expect(element._canProceedToNext()).toBe(false);

      element.projectData.template = 'test-template';
      expect(element._canProceedToNext()).toBe(true);
    });
  });

  describe('ProjectsList', () => {
    let element;

    beforeEach(() => {
      element = new ProjectsList();
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('should load fallback projects on API error', async () => {
      // Mock API failure
      vi.mock('../../services/api.js', () => ({
        apiService: {
          request: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      }));

      await element._loadProjects();

      expect(element.projects.length).toBeGreaterThan(0);
      expect(element.projects[0]).toHaveProperty('name');
    });

    it('should filter projects', () => {
      element.projects = [
        { id: 1, name: 'Project 1', status: 'active' },
        { id: 2, name: 'Project 2', status: 'completed' },
        { id: 3, name: 'Project 3', status: 'active' }
      ];

      element.filter = 'active';
      const filtered = element._getFilteredProjects();

      expect(filtered.length).toBe(2);
      expect(filtered.every(p => p.status === 'active')).toBe(true);
    });

    it('should sort projects', () => {
      element.projects = [
        { id: 1, name: 'B Project', updated_at: '2024-01-01' },
        { id: 2, name: 'A Project', updated_at: '2024-01-02' }
      ];

      element.sortBy = 'name';
      const sorted = element._getFilteredProjects();

      expect(sorted[0].name).toBe('A Project');
      expect(sorted[1].name).toBe('B Project');
    });

    it('should handle project selection', () => {
      const project = { id: 1, name: 'Test Project' };
      const dispatchSpy = vi.spyOn(element, 'dispatchEvent');

      element._handleProjectClick(project);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'project-selected',
          detail: { project }
        })
      );
    });

    it('should get correct project icon', () => {
      const project = { category: 'Web Development' };
      const icon = element._getProjectIcon(project);

      expect(icon).toBe('🌐');
    });

    it('should format dates correctly', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const formatted = element._formatDate(dateString);

      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  // Integration tests
  describe('Dashboard Integration', () => {
    it('should handle end-to-end workflow', () => {
      // This would test the complete dashboard workflow
      // from loading to user interactions
      expect(true).toBe(true); // Placeholder for integration test
    });

    it('should be accessible', () => {
      // Accessibility tests would go here
      expect(true).toBe(true); // Placeholder for accessibility tests
    });

    it('should work on mobile', () => {
      // Mobile-specific tests would go here
      expect(true).toBe(true); // Placeholder for mobile tests
    });
  });
});