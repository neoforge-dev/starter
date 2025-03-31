/**
 * Logger utility for consistent logging across the application
 */
class LoggerService {
  constructor() {
    this.logLevel = this._getLogLevel();
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // Bind methods to preserve context
    this.error = this.error.bind(this);
    this.warn = this.warn.bind(this);
    this.info = this.info.bind(this);
    this.debug = this.debug.bind(this);
    this.group = this.group.bind(this);
    this.groupEnd = this.groupEnd.bind(this);
  }

  /**
   * Get the log level from environment or default to 'info'.
   * If a log level is stored in localStorage, use that value.
   * @returns {string}
   */
  _getLogLevel() {
    return localStorage.getItem('logLevel') || window.LOG_LEVEL || 'info';
  }

  /**
   * Check if the given level should be logged
   * @param {string} level 
   * @returns {boolean}
   */
  _shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  /**
   * Format the log message with timestamp and level
   * @param {string} level 
   * @param {string} message 
   * @returns {string}
   */
  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Log an error message
   * @param {string} message 
   * @param {Error|any} [error] 
   */
  error(message, error) {
    if (this._shouldLog('error')) {
      const formattedMessage = this._formatMessage('error', message);
      console.error(formattedMessage);
      if (error) {
        if (error instanceof Error) {
          console.error(error.stack);
        } else {
          console.error(error);
        }
      }
    }
  }

  /**
   * Log a warning message
   * @param {string} message 
   * @param {any} [data] 
   */
  warn(message, data) {
    if (this._shouldLog('warn')) {
      const formattedMessage = this._formatMessage('warn', message);
      console.warn(formattedMessage);
      if (data) {
        console.warn(data);
      }
    }
  }

  /**
   * Log an info message
   * @param {string} message 
   * @param {any} [data] 
   */
  info(message, data) {
    if (this._shouldLog('info')) {
      const formattedMessage = this._formatMessage('info', message);
      console.info(formattedMessage);
      if (data) {
        console.info(data);
      }
    }
  }

  /**
   * Log a debug message
   * @param {string} message 
   * @param {any} [data] 
   */
  debug(message, data) {
    if (this._shouldLog('debug')) {
      const formattedMessage = this._formatMessage('debug', message);
      console.debug(formattedMessage);
      if (data) {
        console.debug(data);
      }
    }
  }

  /**
   * Set the log level
   * @param {'error'|'warn'|'info'|'debug'} level 
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.logLevel = level;
      localStorage.setItem('logLevel', level); // Persist log level in localStorage
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Start a group of log messages
   * @param {string} groupName The name of the group
   */
  group(groupName) {
    console.group(groupName);
  }

  /**
   * End a group of log messages
   */
  groupEnd() {
    console.groupEnd();
  }
}

export const Logger = new LoggerService();
