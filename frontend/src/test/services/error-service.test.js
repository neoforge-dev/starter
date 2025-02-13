import { expect } from "@esm-bundle/chai";
import {
  ErrorService,
  AppError,
  ErrorType,
} from "../../services/error-service.js";

describe("ErrorService", () => {
  let errorService;
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

    errorService = new ErrorService({ logger: mockLogger });
  });

  afterEach(() => {
    console.error = consoleError;
    vi.clearAllMocks();
    errorService.removeAllListeners();
  });

  describe("AppError", () => {
    it("creates an error with correct properties", () => {
      const error = new AppError({
        message: "Test error",
        type: ErrorType.API,
        details: { status: 404 },
        originalError: new Error("Original"),
      });

      expect(error).to.be.instanceOf(Error);
      expect(error).to.be.instanceOf(AppError);
      expect(error.message).to.equal("Test error");
      expect(error.type).to.equal(ErrorType.API);
      expect(error.details).to.deep.equal({ status: 404 });
      expect(error.originalError).to.be.instanceOf(Error);
      expect(error.timestamp).to.be.a("number");
    });

    it("defaults to UNKNOWN type if not specified", () => {
      const error = new AppError({ message: "Test error" });
      expect(error.type).to.equal(ErrorType.UNKNOWN);
    });
  });

  describe("Error Listeners", () => {
    it("notifies listeners when an error occurs", () => {
      const listener = vi.fn();
      errorService.addListener(listener);

      const error = new AppError({ message: "Test error" });
      errorService.handleError(error);

      expect(listener).to.have.been.calledWith(error);
    });

    it("allows removing specific listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      errorService.addListener(listener1);
      errorService.addListener(listener2);
      errorService.removeListener(listener1);

      const error = new AppError({ message: "Test error" });
      errorService.handleError(error);

      expect(listener1).not.to.have.been.called;
      expect(listener2).to.have.been.calledWith(error);
    });

    it("allows removing all listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      errorService.addListener(listener1);
      errorService.addListener(listener2);
      errorService.removeAllListeners();

      const error = new AppError({ message: "Test error" });
      errorService.handleError(error);

      expect(listener1).not.to.have.been.called;
      expect(listener2).not.to.have.been.called;
    });
  });

  describe("Error Handling", () => {
    it("handles AppError instances directly", () => {
      const error = new AppError({ message: "Test error" });
      errorService.handleError(error);

      expect(mockLogger.error).to.have.been.calledWith(
        expect.stringContaining("Test error"),
        error
      );
    });

    it("converts regular errors to AppError", () => {
      const originalError = new Error("Original error");
      errorService.handleError(originalError);

      expect(mockLogger.error).to.have.been.calledWith(
        expect.any(String),
        expect.objectContaining({
          message: "Original error",
          type: ErrorType.UNKNOWN,
          originalError,
        })
      );
    });

    it("handles promise rejection errors", () => {
      const handler = vi.fn();
      window.addEventListener("unhandledrejection", handler);

      const event = new PromiseRejectionEvent("unhandledrejection", {
        reason: new Error("Promise rejected"),
        promise: Promise.reject(new Error("Promise rejected")),
      });

      window.dispatchEvent(event);

      expect(handler).to.have.been.called;
      expect(mockLogger.error).to.have.been.called;

      window.removeEventListener("unhandledrejection", handler);
    });
  });

  describe("Error Reporting", () => {
    it("determines if an error should be reported", () => {
      const validationError = new AppError({
        type: ErrorType.VALIDATION,
        message: "Invalid input",
      });
      expect(errorService.shouldReportError(validationError)).to.be.false;

      const apiError = new AppError({
        type: ErrorType.API,
        message: "Server error",
      });
      expect(errorService.shouldReportError(apiError)).to.be.true;
    });

    it("generates user-friendly messages", () => {
      const validationError = new AppError({
        type: ErrorType.VALIDATION,
        message: "Invalid email format",
      });
      expect(errorService.getUserMessage(validationError)).to.equal(
        "Invalid email format"
      );

      const networkError = new AppError({
        type: ErrorType.NETWORK,
        message: "Failed to fetch",
      });
      expect(errorService.getUserMessage(networkError)).to.equal(
        "Network error. Please check your connection."
      );
    });

    it("normalizes errors for reporting", () => {
      const error = new AppError({
        message: "Test error",
        type: ErrorType.API,
        details: { sensitive: "data" },
      });

      const normalized = errorService.normalizeErrorForReporting(error);
      expect(normalized).to.have.property("message");
      expect(normalized).to.have.property("type");
      expect(normalized).to.have.property("timestamp");
      expect(normalized).not.to.have.property("sensitive");
    });
  });

  describe("Global Error Handling", () => {
    it("sets up global error handlers", () => {
      const error = new Error("Global error");
      const event = new ErrorEvent("error", { error });

      window.dispatchEvent(event);

      expect(mockLogger.error).to.have.been.called;
    });

    it("handles errors in async code", async () => {
      const asyncError = new Error("Async error");
      const promise = Promise.reject(asyncError);

      try {
        await promise;
      } catch (error) {
        errorService.handleError(error);
      }

      expect(mockLogger.error).to.have.been.called;
    });
  });
});
