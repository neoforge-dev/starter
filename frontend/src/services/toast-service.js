/**
 * Toast service for managing toast notifications
 */
class ToastService {
  constructor() {
    this.container = null;
    this.toasts = new Set();
    this.maxToasts = 5;
    this._init();
  }

  /**
   * Initialize toast container
   */
  _init() {
    this.container = document.createElement("div");
    this.container.className = "toast-container";
    document.body.appendChild(this.container);
  }

  /**
   * Show a toast notification
   * @param {Object} options Toast options
   * @param {string} options.message Toast message
   * @param {string} [options.title] Toast title
   * @param {string} [options.variant='info'] Toast variant (success, error, warning, info)
   * @param {number} [options.duration=5000] Duration in milliseconds
   * @param {boolean} [options.dismissible=true] Whether toast can be dismissed
   * @param {string} [options.position='top-right'] Toast position
   * @returns {HTMLElement} Toast element
   */
  show({
    message,
    title = "",
    variant = "info",
    duration = 5000,
    dismissible = true,
    position = "top-right",
  } = {}) {
    // Remove oldest toast if we're at max capacity
    if (this.toasts.size >= this.maxToasts) {
      const oldestToast = this.toasts.values().next().value;
      this._removeToast(oldestToast);
    }

    // Create toast element
    const toast = document.createElement("neo-toast");
    toast.message = message;
    toast.title = title;
    toast.variant = variant;
    toast.duration = duration;
    toast.dismissible = dismissible;
    toast.position = position;

    // Add to container and track
    this.container.appendChild(toast);
    this.toasts.add(toast);

    // Listen for dismiss event
    toast.addEventListener(
      "dismiss",
      () => {
        this._removeToast(toast);
      },
      { once: true }
    );

    return toast;
  }

  /**
   * Show a success toast
   * @param {string} message Toast message
   * @param {Object} [options] Additional options
   */
  success(message, options = {}) {
    return this.show({
      message,
      variant: "success",
      ...options,
    });
  }

  /**
   * Show an error toast
   * @param {string} message Toast message
   * @param {Object} [options] Additional options
   */
  error(message, options = {}) {
    return this.show({
      message,
      variant: "error",
      duration: 0, // Error toasts don't auto-dismiss by default
      ...options,
    });
  }

  /**
   * Show a warning toast
   * @param {string} message Toast message
   * @param {Object} [options] Additional options
   */
  warning(message, options = {}) {
    return this.show({
      message,
      variant: "warning",
      ...options,
    });
  }

  /**
   * Show an info toast
   * @param {string} message Toast message
   * @param {Object} [options] Additional options
   */
  info(message, options = {}) {
    return this.show({
      message,
      variant: "info",
      ...options,
    });
  }

  /**
   * Remove a toast element
   * @param {HTMLElement} toast Toast element to remove
   */
  _removeToast(toast) {
    this.toasts.delete(toast);
    // Wait for animation to complete
    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  /**
   * Clear all toasts
   */
  clear() {
    this.toasts.forEach((toast) => {
      this._removeToast(toast);
    });
  }

  /**
   * Set maximum number of toasts
   * @param {number} max Maximum number of toasts
   */
  setMaxToasts(max) {
    this.maxToasts = max;
    // Remove excess toasts if needed
    while (this.toasts.size > max) {
      const oldestToast = this.toasts.values().next().value;
      this._removeToast(oldestToast);
    }
  }
}

// Create singleton instance
const toast = new ToastService();
export default toast;
