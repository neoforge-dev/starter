import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock the auth service before importing components
vi.mock('../../../services/auth.ts', () => ({
  authService: {
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    checkEmailVerification: vi.fn()
  }
}));

// Mock window.location methods
Object.defineProperty(window, 'location', {
  value: {
    search: '',
    href: '',
    host: 'localhost:3000',
    hostname: 'localhost'
  },
  writable: true
});

// Mock history API
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn()
  },
  writable: true
});

// Import components after mocking
import '../../../components/auth/verify-email.js';
import { authService } from '../../../services/auth.ts';

describe('VerifyEmail Component Tests', () => {
  let container;

  beforeEach(() => {
    // Create a test container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Reset mocks
    vi.clearAllMocks();

    // Reset window.location.search
    window.location.search = '';
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Token Verification Flow', () => {
    it('should automatically verify email when token is present in URL', async () => {
      // Arrange
      window.location.search = '?token=abc123&email=test@example.com';
      authService.verifyEmail.mockResolvedValue({ success: true });

      const verifyEmail = document.createElement('verify-email');
      container.appendChild(verifyEmail);

      // Wait for component to be fully rendered and connectedCallback to run
      await verifyEmail.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      expect(authService.verifyEmail).toHaveBeenCalledWith('abc123');
      expect(verifyEmail.verificationSuccess).toBe(true);
      expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/verify-email');
    });

    it('should handle token verification failure', async () => {
      // Arrange
      window.location.search = '?token=invalid123';
      authService.verifyEmail.mockRejectedValue(new Error('Invalid or expired token'));

      const verifyEmail = document.createElement('verify-email');
      container.appendChild(verifyEmail);

      // Wait for component to be fully rendered and connectedCallback to run
      await verifyEmail.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      expect(authService.verifyEmail).toHaveBeenCalledWith('invalid123');
      expect(verifyEmail.error).toBe('Invalid or expired token');
      expect(verifyEmail.verificationSuccess).toBe(false);
    });

    it('should show loading state during verification', async () => {
      // Arrange
      window.location.search = '?token=loading123';

      let resolveVerify;
      authService.verifyEmail.mockImplementation(() => {
        return new Promise(resolve => {
          resolveVerify = resolve;
        });
      });

      const verifyEmail = document.createElement('verify-email');
      container.appendChild(verifyEmail);

      // Wait for component to be rendered and verification to start
      await verifyEmail.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert loading state
      expect(verifyEmail.loading).toBe(true);

      // Check loading UI is shown
      const loadingIcon = verifyEmail.shadowRoot.querySelector('.material-icons');
      expect(loadingIcon.textContent).toBe('hourglass_empty');

      // Resolve verification
      resolveVerify({ success: true });
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert loading state is cleared
      expect(verifyEmail.loading).toBe(false);
    });
  });

  describe('Email Verification Success State', () => {
    it('should show success message when verification is complete', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      verifyEmail.verificationSuccess = true;
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      // Assert
      const successIcon = verifyEmail.shadowRoot.querySelector('.material-icons');
      expect(successIcon.textContent).toBe('check_circle');

      const title = verifyEmail.shadowRoot.querySelector('.title');
      expect(title.textContent).toBe('Email Verified!');

      const loginButton = verifyEmail.shadowRoot.querySelector('button');
      expect(loginButton.textContent.trim()).toBe('Log In');
    });

    it('should redirect to login when login button is clicked', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      verifyEmail.verificationSuccess = true;
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      // Mock window.location.href setter
      let redirectUrl = null;
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          set href(url) {
            redirectUrl = url;
          },
          get href() {
            return redirectUrl || window.location.href;
          }
        },
        writable: true
      });

      // Act
      const loginButton = verifyEmail.shadowRoot.querySelector('button');
      loginButton.click();

      // Assert
      expect(redirectUrl).toBe('/login');
    });
  });

  describe('Resend Verification Flow', () => {
    it('should resend verification email successfully', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      verifyEmail.email = 'test@example.com';
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      authService.resendVerification.mockResolvedValue({ success: true });

      // Act
      await verifyEmail.resendVerification();
      await verifyEmail.updateComplete;

      // Assert
      expect(authService.resendVerification).toHaveBeenCalledWith('test@example.com');
      expect(verifyEmail.verificationSent).toBe(true);
      expect(verifyEmail.error).toBe('');
    });

    it('should handle resend verification failure', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      verifyEmail.email = 'test@example.com';
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      authService.resendVerification.mockRejectedValue(new Error('Failed to send email'));

      // Act
      await verifyEmail.resendVerification();
      await verifyEmail.updateComplete;

      // Assert
      expect(authService.resendVerification).toHaveBeenCalledWith('test@example.com');
      expect(verifyEmail.verificationSent).toBe(false);
      expect(verifyEmail.error).toBe('Failed to send email');
    });

    it('should validate email field before resending', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      verifyEmail.email = ''; // Empty email
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      // Act
      await verifyEmail.resendVerification();

      // Assert
      expect(authService.resendVerification).not.toHaveBeenCalled();
      expect(verifyEmail.error).toBe('Please enter your email address');
    });
  });

  describe('Verification Sent State', () => {
    it('should show confirmation message when verification email is sent', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      verifyEmail.email = 'test@example.com';
      verifyEmail.verificationSent = true;
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      // Assert
      const icon = verifyEmail.shadowRoot.querySelector('.material-icons');
      expect(icon.textContent).toBe('mark_email_read');

      const title = verifyEmail.shadowRoot.querySelector('.title');
      expect(title.textContent).toBe('Verification Email Sent');

      const message = verifyEmail.shadowRoot.querySelector('.message');
      expect(message.textContent).toContain('test@example.com');
    });

    it('should allow user to try another email', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      verifyEmail.verificationSent = true;
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      // Act
      const tryAnotherButton = verifyEmail.shadowRoot.querySelector('button');
      tryAnotherButton.click();
      await verifyEmail.updateComplete;

      // Assert
      expect(verifyEmail.verificationSent).toBe(false);
    });
  });

  describe('Default State - Manual Email Entry', () => {
    it('should show email input form when no token is present', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      // Assert
      const emailInput = verifyEmail.shadowRoot.querySelector('input[type="email"]');
      expect(emailInput).toBeTruthy();
      expect(emailInput.placeholder).toBe('Enter your email address');

      const sendButton = verifyEmail.shadowRoot.querySelector('button');
      expect(sendButton.textContent.trim()).toBe('Send Verification Link');

      const backButton = verifyEmail.shadowRoot.querySelectorAll('button')[1];
      expect(backButton.textContent.trim()).toBe('Back to Login');
    });

    it('should update email value when user types', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      // Act
      const emailInput = verifyEmail.shadowRoot.querySelector('input[type="email"]');
      emailInput.value = 'newuser@example.com';
      emailInput.dispatchEvent(new Event('input'));

      // Assert
      expect(verifyEmail.email).toBe('newuser@example.com');
    });

    it('should call resendVerification when send button is clicked', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      verifyEmail.email = 'test@example.com';
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      authService.resendVerification.mockResolvedValue({ success: true });

      // Act
      const sendButton = verifyEmail.shadowRoot.querySelector('button');
      sendButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert
      expect(authService.resendVerification).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle back to login button click', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      // Mock window.location.href setter
      let redirectUrl = null;
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          set href(url) {
            redirectUrl = url;
          },
          get href() {
            return redirectUrl || window.location.href;
          }
        },
        writable: true
      });

      // Act
      const backButton = verifyEmail.shadowRoot.querySelectorAll('button')[1];
      backButton.click();

      // Assert
      expect(redirectUrl).toBe('/login');
    });
  });

  describe('Invalid Token State', () => {
    it('should show invalid token message when token is present but verification fails', async () => {
      // Arrange
      window.location.search = '?token=invalid123';
      authService.verifyEmail.mockRejectedValue(new Error('Invalid or expired token'));

      const verifyEmail = document.createElement('verify-email');
      container.appendChild(verifyEmail);

      // Wait for component to be fully rendered and verification to complete
      await verifyEmail.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - After verification fails, should show the form with the invalid token message
      const message = verifyEmail.shadowRoot.querySelector('.message');
      expect(message.textContent).toContain('The verification link appears to be invalid or has expired');
    });
  });

  describe('Error Display', () => {
    it('should display error messages when present', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      verifyEmail.error = 'Something went wrong';
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      // Assert
      const errorMessage = verifyEmail.shadowRoot.querySelector('.error-message');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toBe('Something went wrong');
    });

    it('should not display error messages when error is empty', async () => {
      // Arrange
      const verifyEmail = document.createElement('verify-email');
      verifyEmail.error = '';
      container.appendChild(verifyEmail);

      await verifyEmail.updateComplete;

      // Assert
      const errorMessage = verifyEmail.shadowRoot.querySelector('.error-message');
      expect(errorMessage).toBeFalsy();
    });
  });

  describe('URL Parameter Extraction', () => {
    it('should extract token and email from URL parameters', () => {
      // Arrange
      window.location.search = '?token=abc123&email=test@example.com';

      // Act
      const verifyEmail = document.createElement('verify-email');

      // Assert
      expect(verifyEmail.token).toBe('abc123');
      expect(verifyEmail.email).toBe('test@example.com');
    });

    it('should handle missing URL parameters gracefully', () => {
      // Arrange
      window.location.search = '';

      // Act
      const verifyEmail = document.createElement('verify-email');

      // Assert
      expect(verifyEmail.token).toBeNull();
      expect(verifyEmail.email).toBe('');
    });

    it('should handle partial URL parameters', () => {
      // Arrange
      window.location.search = '?token=abc123';

      // Act
      const verifyEmail = document.createElement('verify-email');

      // Assert
      expect(verifyEmail.token).toBe('abc123');
      expect(verifyEmail.email).toBe('');
    });
  });
});
