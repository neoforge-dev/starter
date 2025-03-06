/**
 * Logger utility for consistent logging across the application
 */
export class Logger {
  /**
   * Log an informational message
   * @param {string} message The message to log
   * @param {any} data Additional data to log
   */
  static info(message, data) {
    console.info(`[INFO] ${message}`, data || "");
  }

  /**
   * Log a warning message
   * @param {string} message The message to log
   * @param {any} data Additional data to log
   */
  static warn(message, data) {
    console.warn(`[WARN] ${message}`, data || "");
  }

  /**
   * Log an error message
   * @param {string} message The message to log
   * @param {any} error The error object or message
   */
  static error(message, error) {
    console.error(`[ERROR] ${message}`, error || "");
  }

  /**
   * Log a debug message (only in development)
   * @param {string} message The message to log
   * @param {any} data Additional data to log
   */
  static debug(message, data) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] ${message}`, data || "");
    }
  }

  /**
   * Log a performance measurement
   * @param {string} label The label for the measurement
   * @param {number} time The time in milliseconds
   */
  static performance(label, time) {
    console.log(`[PERF] ${label}: ${time}ms`);
  }
}
