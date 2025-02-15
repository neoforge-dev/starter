import { expect, vi } from "vitest";
import {
  errorService,
  AppError,
  ErrorType,
} from "../../services/error-service.js";

describe("ErrorService", () => {
  let consoleError;
  let mockLogger;

  beforeEach(() => {
    // Mock console.error
    consoleError = console.error;
    console.error = vi.fn();

    // Mock logger
    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    };
  });

  afterEach(() => {
    console.error = consoleError;
    vi.clearAllMocks();
  });

  describe("AppError", () => {
    it("creates an error with correct properties", () => {
      const error = new AppError("Test error", ErrorType.API, { status: 404 });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Test error");
      expect(error.type).toBe(ErrorType.API);
      expect(error.details).toEqual({ status: 404 });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("defaults to UNKNOWN type if not specified", () => {
      const error = new AppError("Test error");
      expect(error.type).toBe(ErrorType.UNKNOWN);
    });
  });

  describe("Error Handling", () => {
    it("handles errors", () => {
      const listener = vi.fn();
      errorService.addListener(listener);

      const error = new AppError("Test error");
      errorService.handleError(error);

      expect(listener).toHaveBeenCalledWith(error);
      errorService.removeListener(listener);
    });

    it("converts regular errors to AppError", () => {
      const listener = vi.fn();
      errorService.addListener(listener);

      const originalError = new Error("Original error");
      errorService.handleError(originalError);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Original error",
          type: ErrorType.UNKNOWN,
        })
      );
      errorService.removeListener(listener);
    });
  });

  describe("Error Reporting", () => {
    it("determines if an error should be reported", () => {
      const validationError = new AppError(
        "Invalid input",
        ErrorType.VALIDATION
      );
      expect(errorService._shouldReportError(validationError)).toBe(false);

      const apiError = new AppError("Server error", ErrorType.API);
      expect(errorService._shouldReportError(apiError)).toBe(true);
    });

    it("normalizes errors", () => {
      const error = new Error("Test error");
      const normalized = errorService._normalizeError(error);

      expect(normalized).toBeInstanceOf(AppError);
      expect(normalized.message).toBe("Test error");
      expect(normalized.type).toBe(ErrorType.UNKNOWN);
    });
  });
});
