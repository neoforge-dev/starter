import { Logger } from './logger.js';

/**
 * Keyboard shortcut manager
 */
class KeyboardManager {
  constructor() {
    this.shortcuts = new Map();
    this.enabled = true;
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._setup();
  }

  /**
   * Set up keyboard event listeners
   */
  _setup() {
    window.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event 
   */
  _handleKeyDown(event) {
    if (!this.enabled) return;

    // Don't handle shortcuts when typing in input elements
    if (this._isTypingTarget(event.target)) return;

    const key = this._getEventKey(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      event.preventDefault();
      try {
        shortcut.callback(event);
      } catch (error) {
        Logger.error('Error executing keyboard shortcut:', error);
      }
    }
  }

  /**
   * Check if the event target is a typing element
   * @param {EventTarget} target 
   * @returns {boolean}
   */
  _isTypingTarget(target) {
    if (!(target instanceof HTMLElement)) return false;

    const tagName = target.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      target.isContentEditable
    );
  }

  /**
   * Get a standardized key string from a keyboard event
   * @param {KeyboardEvent} event 
   * @returns {string}
   */
  _getEventKey(event) {
    const modifiers = [];

    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');

    const key = event.key.toLowerCase();
    if (!modifiers.length) return key;

    return [...modifiers, key].join('+');
  }

  /**
   * Register a keyboard shortcut
   * @param {string} key - Key combination (e.g., 'ctrl+s', 'shift+/')
   * @param {Function} callback - Callback function
   * @param {Object} [options] - Options
   * @param {string} [options.description] - Shortcut description
   * @param {string} [options.category] - Shortcut category
   */
  register(key, callback, { description = '', category = 'general' } = {}) {
    const normalizedKey = key.toLowerCase();
    
    if (this.shortcuts.has(normalizedKey)) {
      Logger.warn(`Keyboard shortcut '${normalizedKey}' is already registered`);
      return;
    }

    this.shortcuts.set(normalizedKey, {
      callback,
      description,
      category
    });

    Logger.debug(`Registered keyboard shortcut: ${normalizedKey}`, {
      description,
      category
    });
  }

  /**
   * Unregister a keyboard shortcut
   * @param {string} key 
   */
  unregister(key) {
    const normalizedKey = key.toLowerCase();
    if (this.shortcuts.delete(normalizedKey)) {
      Logger.debug(`Unregistered keyboard shortcut: ${normalizedKey}`);
    }
  }

  /**
   * Enable keyboard shortcuts
   */
  enable() {
    this.enabled = true;
    Logger.debug('Keyboard shortcuts enabled');
  }

  /**
   * Disable keyboard shortcuts
   */
  disable() {
    this.enabled = false;
    Logger.debug('Keyboard shortcuts disabled');
  }

  /**
   * Get all registered shortcuts
   * @returns {Object} Shortcuts grouped by category
   */
  getShortcuts() {
    const shortcuts = {};

    for (const [key, { description, category }] of this.shortcuts) {
      if (!shortcuts[category]) {
        shortcuts[category] = [];
      }

      shortcuts[category].push({
        key,
        description
      });
    }

    return shortcuts;
  }

  /**
   * Check if a shortcut is registered
   * @param {string} key 
   * @returns {boolean}
   */
  hasShortcut(key) {
    return this.shortcuts.has(key.toLowerCase());
  }

  /**
   * Clear all registered shortcuts
   */
  clear() {
    this.shortcuts.clear();
    Logger.debug('Cleared all keyboard shortcuts');
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    window.removeEventListener('keydown', this._handleKeyDown);
    this.shortcuts.clear();
    Logger.debug('Keyboard manager destroyed');
  }
}

export const keyboard = new KeyboardManager(); 