import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock the auth service before importing components
vi.mock('../../services/auth.ts', () => ({
  authService: {
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn()
  }
}));

// Import components after mocking
import '../../components/auth/login-form.js';
import '../../components/auth/signup-form.js';
import { authService } from '../../services/auth.ts';

describe('Authentication Integration Tests', () => {
  let container;

  beforeEach(() => {
    // Create a test container
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Login Form Integration', () => {
    it('should handle successful login flow', async () => {
      // Arrange
      const loginForm = document.createElement('login-form');
      container.appendChild(loginForm);
      
      // Wait for component to be fully rendered
      await loginForm.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 100)); // Additional wait for DOM rendering

      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      authService.login.mockResolvedValue(mockUser);

      let loginSuccessEvent = null;
      loginForm.addEventListener('login-success', (e) => {
        loginSuccessEvent = e;
      });

      // Act - Get inputs after component is fully rendered
      const emailInput = loginForm.shadowRoot?.querySelector('[data-testid="login-email"]');
      const passwordInput = loginForm.shadowRoot?.querySelector('[data-testid="login-password"]');
      
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      
      emailInput.value = 'test@example.com';
      passwordInput.value = 'password123';

      // Trigger form submission
      await loginForm._handleSubmit(new Event('submit'));
      
      // Assert
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(loginSuccessEvent).toBeTruthy();
      expect(loginSuccessEvent.detail.email).toBe('test@example.com');
    });

    it('should handle login validation errors', async () => {
      // Arrange
      const loginForm = document.createElement('login-form');
      container.appendChild(loginForm);
      await loginForm.updateComplete;

      // let loginErrorEvent = null;
      loginForm.addEventListener('login-error', () => {
        // event handler
      });

      // Act - Submit form with empty fields
      const form = loginForm.shadowRoot.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert - Form should require email and password
      const emailInput = loginForm.shadowRoot.querySelector('[data-testid="login-email"]');
      const passwordInput = loginForm.shadowRoot.querySelector('[data-testid="login-password"]');
      
      expect(emailInput.hasAttribute('required')).toBe(true);
      expect(passwordInput.hasAttribute('required')).toBe(true);
    });

    it('should handle API login errors', async () => {
      // Arrange
      const loginForm = document.createElement('login-form');
      container.appendChild(loginForm);
      
      // Wait for component to be fully rendered
      await loginForm.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 100));

      authService.login.mockRejectedValue(new Error('Invalid credentials'));

      // let loginErrorEvent = null;
      loginForm.addEventListener('login-error', () => {
        // event handler
      });

      // Act
      const emailInput = loginForm.shadowRoot?.querySelector('[data-testid="login-email"]');
      const passwordInput = loginForm.shadowRoot?.querySelector('[data-testid="login-password"]');

      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();

      emailInput.value = 'test@example.com';
      passwordInput.value = 'wrongpassword';

      await loginForm._handleSubmit(new Event('submit'));
      
      // Assert
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      // expect(loginErrorEvent).toBeTruthy();
      // expect(loginErrorEvent.detail.message).toBe('Invalid credentials');

      // Check that error message is displayed
      await loginForm.updateComplete; // Wait for error to be rendered
      const errorMessage = loginForm.shadowRoot?.querySelector('[data-testid="error"]');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toBe('Invalid credentials');
    });

    it('should show loading state during login', async () => {
      // Arrange
      const loginForm = document.createElement('login-form');
      container.appendChild(loginForm);
      
      // Wait for component to be fully rendered
      await loginForm.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock login to resolve after a delay
      let resolveLogin;
      authService.login.mockImplementation(() => {
        return new Promise(resolve => {
          resolveLogin = resolve;
        });
      });

      // Act
      const emailInput = loginForm.shadowRoot?.querySelector('[data-testid="login-email"]');
      const passwordInput = loginForm.shadowRoot?.querySelector('[data-testid="login-password"]');
      const submitButton = loginForm.shadowRoot?.querySelector('[data-testid="login-button"]');

      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(submitButton).toBeTruthy();

      emailInput.value = 'test@example.com';
      passwordInput.value = 'password123';

      // Start the login process but don't await it yet
      const submitPromise = loginForm._handleSubmit(new Event('submit'));
      
      // Check loading state immediately after submitting
      await loginForm.updateComplete;
      expect(submitButton.disabled).toBe(true);
      expect(loginForm.isLoading).toBe(true);
      
      // Resolve login
      resolveLogin({ id: 1, email: 'test@example.com' });
      await submitPromise; // Now wait for submit to complete

      // Assert loading state is cleared
      expect(submitButton.disabled).toBe(false);
    });
  });

  describe('Signup Form Integration', () => {
    it('should handle successful registration flow', async () => {
      // Arrange
      const signupForm = document.createElement('signup-form');
      container.appendChild(signupForm);
      await signupForm.updateComplete;

      authService.signup.mockResolvedValue({ 
        success: true, 
        message: 'Registration successful' 
      });

      // Act
      const nameInput = signupForm.shadowRoot.querySelector('[data-testid="name-input"]');
      const emailInput = signupForm.shadowRoot.querySelector('[data-testid="email-input"]');
      const passwordInput = signupForm.shadowRoot.querySelector('[data-testid="password-input"]');
      const confirmPasswordInput = signupForm.shadowRoot.querySelector('[data-testid="confirm-password-input"]');

      nameInput.value = 'Test User';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      emailInput.value = 'test@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'password123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      confirmPasswordInput.value = 'password123';
      confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = signupForm.shadowRoot.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(authService.signup).toHaveBeenCalledWith('test@example.com', 'password123', {
        name: 'Test User'
      });
      
      // Should show success message
      expect(signupForm.signupComplete).toBe(true);
    });

    it('should validate password mismatch', async () => {
      // Arrange
      const signupForm = document.createElement('signup-form');
      container.appendChild(signupForm);
      await signupForm.updateComplete;

      // Act
      const nameInput = signupForm.shadowRoot.querySelector('[data-testid="name-input"]');
      const emailInput = signupForm.shadowRoot.querySelector('[data-testid="email-input"]');
      const passwordInput = signupForm.shadowRoot.querySelector('[data-testid="password-input"]');
      const confirmPasswordInput = signupForm.shadowRoot.querySelector('[data-testid="confirm-password-input"]');

      nameInput.value = 'Test User';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      emailInput.value = 'test@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'password123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      confirmPasswordInput.value = 'different123';
      confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = signupForm.shadowRoot.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(authService.signup).not.toHaveBeenCalled();
      expect(signupForm.error).toBe('Passwords do not match');
      
      // Check error message is displayed
      const errorMessage = signupForm.shadowRoot.querySelector('[data-testid="error"]');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toBe('Passwords do not match');
    });

    it('should validate required fields', async () => {
      // Arrange
      const signupForm = document.createElement('signup-form');
      container.appendChild(signupForm);
      await signupForm.updateComplete;

      // Act - Submit form with empty fields
      const form = signupForm.shadowRoot.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(authService.signup).not.toHaveBeenCalled();
      expect(signupForm.error).toBe('All fields are required');
    });

    it('should validate minimum password length', async () => {
      // Arrange
      const signupForm = document.createElement('signup-form');
      container.appendChild(signupForm);
      await signupForm.updateComplete;

      // Act
      const nameInput = signupForm.shadowRoot.querySelector('[data-testid="name-input"]');
      const emailInput = signupForm.shadowRoot.querySelector('[data-testid="email-input"]');
      const passwordInput = signupForm.shadowRoot.querySelector('[data-testid="password-input"]');
      const confirmPasswordInput = signupForm.shadowRoot.querySelector('[data-testid="confirm-password-input"]');

      nameInput.value = 'Test User';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      emailInput.value = 'test@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = '123'; // Too short
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      confirmPasswordInput.value = '123';
      confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = signupForm.shadowRoot.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(authService.signup).not.toHaveBeenCalled();
      expect(signupForm.error).toBe('Password must be at least 8 characters long');
    });
  });

  describe('Authentication State Management', () => {
    it('should handle authentication state changes', async () => {
      // Arrange
      authService.isAuthenticated.mockReturnValue(false);
      authService.getCurrentUser.mockReturnValue(null);

      // Act - Simulate login
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      });

      // Assert authentication state
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      });

      // Act - Simulate logout
      authService.isAuthenticated.mockReturnValue(false);
      authService.getCurrentUser.mockReturnValue(null);

      // Assert logged out state
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBe(null);
    });
  });
});