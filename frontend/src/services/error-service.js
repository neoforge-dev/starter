import { showToast } from "../components/ui/toast/index.js";
import { Logger } from "../utils/logger.js";
import { apiService } from "./api.ts";

/**
 * Error types enum
 * @readonly
 * @enum {string}
 */
export const ErrorType = {
  VALIDATION: "validation",
  NETWORK: "network",
  AUTH: "auth",
  API: "api",
  UNKNOWN: "unknown",
};

/**
 * Custom error class with additional metadata
 */
export class AppError extends Error {
  constructor(message, type = ErrorType.UNKNOWN, details = null) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.details = details;
    this.timestamp = new Date();
  }
}

/**
 * Global error handling service
 */
class ErrorService {
  constructor() {
    this._errorListeners = new Set();
    this._setupGlobalHandlers();
  }

  /**
   * Set up global error handlers
   * @private
   */
  _setupGlobalHandlers() {
    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      this.handleError(event.error);
    });

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError(event.reason);
    });

    // Handle API errors
    window.addEventListener("api-error", (event) => {
      this.handleError(
        new AppError(event.detail.message, ErrorType.API, event.detail)
      );
    });

    // Handle auth errors
    window.addEventListener("auth-expired", () => {
      this.handleError(
        new AppError(
          "Your session has expired. Please log in again.",
          ErrorType.AUTH
        )
      );
    });
  }

  /**
   * Add error listener
   * @param {Function} listener
   */
  addListener(listener) {
    this._errorListeners.add(listener);
  }

  /**
   * Remove error listener
   * @param {Function} listener
   */
  removeListener(listener) {
    this._errorListeners.delete(listener);
  }

  /**
   * Handle an error
   * @param {Error} error
   */
  async handleError(error) {
    // Convert to AppError if needed
    const appError =
      error instanceof AppError ? error : this._normalizeError(error);

    // Log the error
    Logger.error("Error occurred:", appError);

    // Notify listeners
    this._errorListeners.forEach((listener) => {
      try {
        listener(appError);
      } catch (err) {
        Logger.error("Error in error listener:", err);
      }
    });

    // Show user-friendly message
    this._showErrorMessage(appError);

    // Report error if needed
    if (this._shouldReportError(appError)) {
      await this._reportError(appError);
    }
  }

  /**
   * Show user-friendly error message
   * @param {AppError} error
   * @private
   */
  _showErrorMessage(error) {
    let message = error.message;
    let type = "error";

    switch (error.type) {
      case ErrorType.VALIDATION:
        type = "warning";
        break;
      case ErrorType.NETWORK:
        message = "Network error. Please check your connection.";
        break;
      case ErrorType.AUTH:
        message = "Authentication error. Please log in again.";
        break;
      case ErrorType.API:
        message = error.message || "API error occurred.";
        break;
      default:
        message = "An unexpected error occurred.";
    }

    showToast(message, type);
  }

  /**
   * Normalize an error to AppError
   * @param {Error} error
   * @returns {AppError}
   * @private
   */
  _normalizeError(error) {
    if (error instanceof AppError) {
      return error;
    }

    // Check for network errors (Failed to fetch is a common network error message)
    if (
      error instanceof TypeError &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("Network error"))
    ) {
      return new AppError(
        "Network error. Please check your connection.",
        ErrorType.NETWORK,
        {
          originalError: error,
        }
      );
    }

    if (error instanceof TypeError || error instanceof ReferenceError) {
      return new AppError(error.message, ErrorType.UNKNOWN, {
        originalError: error,
      });
    }

    if (error.name === "NetworkError") {
      return new AppError("Network error occurred", ErrorType.NETWORK, {
        originalError: error,
      });
    }

    if (error.name === "ValidationError") {
      return new AppError(error.message, ErrorType.VALIDATION, {
        originalError: error,
      });
    }

    return new AppError(error.message || "An unknown error occurred");
  }

  /**
   * Check if error should be reported
   * @param {AppError} error
   * @returns {boolean}
   * @private
   */
  _shouldReportError(error) {
    // Don't report validation errors
    if (error.type === ErrorType.VALIDATION) {
      return false;
    }

    // Don't report auth errors
    if (error.type === ErrorType.AUTH) {
      return false;
    }

    // Don't report network errors
    if (error.type === ErrorType.NETWORK) {
      return false;
    }

    return true;
  }

  /**
   * Report error to backend
   * @param {AppError} error
   * @private
   */
  async _reportError(error) {
    try {
      // Create the payload
      const payload = {
        type: error.type,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "test",
        url: typeof window !== "undefined" ? window.location.href : "test",
      };

      // Send the error to the backend
      await apiService.request("/errors", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (err) {
      Logger.error("Failed to report error:", err);
    }
  }
}

export const errorService = new ErrorService();
