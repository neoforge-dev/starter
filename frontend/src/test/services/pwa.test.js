import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { pwaService } from '../../services/pwa.js';

describe('PWA Service', () => {
  let mockServiceWorker;
  let mockRegistration;

  beforeEach(() => {
    // Mock service worker API
    mockRegistration = {
      addEventListener: vi.fn(),
      installing: null,
      waiting: null,
      update: vi.fn(),
      postMessage: vi.fn()
    };

    mockServiceWorker = {
      register: vi.fn().mockResolvedValue(mockRegistration),
      ready: Promise.resolve(mockRegistration),
      controller: null
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true
    });

    // Mock other APIs
    Object.defineProperty(navigator, 'getInstalledRelatedApps', {
      value: vi.fn().mockResolvedValue([]),
      writable: true
    });

    // Reset PWA service state
    pwaService.deferredInstallPrompt = null;
    pwaService.isInstalled = false;
    pwaService.updateAvailable = false;

    // Clear event listeners
    window.removeEventListener = vi.fn();
    window.addEventListener = vi.fn();
    window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should register service worker successfully', async () => {
      await pwaService.initialize();

      expect(mockServiceWorker.register).toHaveBeenCalledWith(
        '/service-worker.js',
        { scope: '/' }
      );
    });

    it('should handle service worker registration failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'));

      await pwaService.initialize();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Service Worker registration failed:',
        expect.any(Error)
      );
    });

    it('should detect if app is already installed', async () => {
      navigator.getInstalledRelatedApps = vi.fn().mockResolvedValue([
        { id: 'com.neoforge.app' }
      ]);

      await pwaService.initialize();

      expect(pwaService.isInstalled).toBe(true);
    });
  });

  describe('installation', () => {
    it('should prompt for installation when available', async () => {
      const mockPrompt = {
        prompt: vi.fn().mockResolvedValue({ outcome: 'accepted' }),
        preventDefault: vi.fn()
      };

      pwaService.deferredInstallPrompt = mockPrompt;
      const result = await pwaService.promptInstall();

      expect(mockPrompt.prompt).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(pwaService.deferredInstallPrompt).toBe(null);
    });

    it('should handle installation rejection', async () => {
      const mockPrompt = {
        prompt: vi.fn().mockResolvedValue({ outcome: 'dismissed' }),
        preventDefault: vi.fn()
      };

      pwaService.deferredInstallPrompt = mockPrompt;
      const result = await pwaService.promptInstall();

      expect(result).toBe(false);
    });

    it('should return false when no prompt available', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      pwaService.deferredInstallPrompt = null;

      const result = await pwaService.promptInstall();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Installation prompt not available');
    });
  });

  describe('updates', () => {
    it('should apply service worker update', async () => {
      pwaService.updateAvailable = true;
      mockRegistration.waiting = { postMessage: vi.fn() };
      
      // Mock window.location.reload
      Object.defineProperty(window, 'location', {
        value: { reload: vi.fn() },
        writable: true
      });

      await pwaService.applyUpdate();

      expect(mockRegistration.waiting.postMessage).toHaveBeenCalledWith('skipWaiting');
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('should check for updates', async () => {
      await pwaService.checkForUpdates();

      expect(mockRegistration.update).toHaveBeenCalled();
    });

    it('should handle update check failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRegistration.update.mockRejectedValue(new Error('Update failed'));

      await pwaService.checkForUpdates();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking for updates:',
        expect.any(Error)
      );
    });
  });

  describe('standalone detection', () => {
    it('should detect standalone mode from display-mode', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({ matches: true })),
        writable: true
      });

      expect(pwaService.isStandalone()).toBe(true);
    });

    it('should detect standalone mode from navigator.standalone', () => {
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
        writable: true
      });

      expect(pwaService.isStandalone()).toBe(true);
    });

    it('should detect standalone mode from android referrer', () => {
      Object.defineProperty(document, 'referrer', {
        value: 'android-app://com.example.app',
        writable: true
      });

      expect(pwaService.isStandalone()).toBe(true);
    });
  });

  describe('periodic updates', () => {
    it('should enable periodic update checks', () => {
      vi.useFakeTimers();
      const updateSpy = vi.spyOn(pwaService, 'checkForUpdates').mockImplementation(() => {});

      pwaService.enablePeriodicUpdates(1); // 1 minute for testing
      vi.advanceTimersByTime(60000); // Advance 1 minute

      expect(updateSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});