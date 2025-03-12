import { expect } from "@esm-bundle/chai";
import { fixture, html, waitUntil } from "@open-wc/testing";
import { AppError, ErrorType, errorService } from "./error-service.js";
import { showToast } from "../components/ui/toast/index.js";
import { apiClient } from "./api-client.js";

// Mock dependencies
vi.mock("../components/ui/toast/index.js", () => ({
  showToast: vi.fn(),
}));

vi.mock("./api-client.js", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe("ErrorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorService._errorListeners.clear();
  });

  describe("AppError", () => {
    it("should create an AppError with default values", () => {
      const error = new AppError("Test error");
      expect(error).to.be.instanceOf(AppError);
      expect(error.message).to.equal("Test error");
      expect(error.type).to.equal(ErrorType.UNKNOWN);
      expect(error.details).to.be.null;
      expect(error.timestamp).to.be.instanceOf(Date);
    });

    it("should create an AppError with custom values", () => {
      const details = { field: "test" };
      const error = new AppError("Test error", ErrorType.VALIDATION, details);
      expect(error.message).to.equal("Test error");
      expect(error.type).to.equal(ErrorType.VALIDATION);
      expect(error.details).to.equal(details);
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors", async () => {
      const error = new AppError("Invalid input", ErrorType.VALIDATION);
      await errorService.handleError(error);

      expect(showToast).to.have.been.calledWith(
        "Please check your input and try again",
        "warning"
      );
      expect(apiClient.post).not.to.have.been.called;
    });

    it("should handle network errors", async () => {
      const error = new AppError("Network failed", ErrorType.NETWORK);
      await errorService.handleError(error);

      expect(showToast).to.have.been.calledWith(
        "Network error. Please check your connection.",
        "error"
      );
      expect(apiClient.post).not.to.have.been.called;
    });

    it("should handle auth errors", async () => {
      const error = new AppError("Auth failed", ErrorType.AUTH);
      await errorService.handleError(error);

      expect(showToast).to.have.been.calledWith(
        "Authentication error. Please log in again.",
        "error"
      );
      expect(apiClient.post).not.to.have.been.called;
    });

    it("should handle API errors", async () => {
      const error = new AppError("API failed", ErrorType.API);
      await errorService.handleError(error);

      expect(showToast).to.have.been.calledWith("API failed", "error");
      expect(apiClient.post).to.have.been.calledWith("/errors", {
        type: ErrorType.API,
        message: "API failed",
        details: null,
        timestamp: error.timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });

    it("should handle unknown errors", async () => {
      const error = new Error("Unknown error");
      await errorService.handleError(error);

      expect(showToast).to.have.been.calledWith(
        "An unexpected error occurred.",
        "error"
      );
      expect(apiClient.post).to.have.been.called;
    });
  });

  describe("Error Listeners", () => {
    it("should notify error listeners", async () => {
      const listener = vi.fn();
      errorService.addListener(listener);

      const error = new AppError("Test error");
      await errorService.handleError(error);

      expect(listener).to.have.been.calledWith(error);
    });

    it("should handle errors in listeners", async () => {
      const listener = vi.fn().mockImplementation(() => {
        throw new Error("Listener error");
      });
      errorService.addListener(listener);

      const error = new AppError("Test error");
      await errorService.handleError(error);

      expect(listener).to.have.been.called;
      // Error in listener should not prevent other error handling
      expect(showToast).to.have.been.called;
    });

    it("should remove error listeners", async () => {
      const listener = vi.fn();
      errorService.addListener(listener);
      errorService.removeListener(listener);

      const error = new AppError("Test error");
      await errorService.handleError(error);

      expect(listener).not.to.have.been.called;
    });
  });

  describe("Global Error Handling", () => {
    it("should handle uncaught errors", async () => {
      const error = new Error("Uncaught error");
      window.dispatchEvent(new ErrorEvent("error", { error }));

      await waitUntil(() => showToast.mock.calls.length > 0);

      expect(showToast).to.have.been.calledWith(
        "An unexpected error occurred.",
        "error"
      );
    });

    it("should handle unhandled promise rejections", async () => {
      const error = new Error("Promise rejection");
      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          reason: error,
          promise: Promise.reject(error),
        })
      );

      await waitUntil(() => showToast.mock.calls.length > 0);

      expect(showToast).to.have.been.calledWith(
        "An unexpected error occurred.",
        "error"
      );
    });

    it("should handle API errors", async () => {
      const error = { message: "API error" };
      window.dispatchEvent(new CustomEvent("api-error", { detail: error }));

      await waitUntil(() => showToast.mock.calls.length > 0);

      expect(showToast).to.have.been.calledWith("API error", "error");
    });

    it("should handle auth expired events", async () => {
      window.dispatchEvent(new CustomEvent("auth-expired"));

      await waitUntil(() => showToast.mock.calls.length > 0);

      expect(showToast).to.have.been.calledWith(
        "Authentication error. Please log in again.",
        "error"
      );
    });
  });

  describe("Error Reporting", () => {
    it("should report unknown errors", async () => {
      const error = new AppError("Unknown error");
      await errorService.handleError(error);

      expect(apiClient.post).to.have.been.calledWith("/errors", {
        type: ErrorType.UNKNOWN,
        message: "Unknown error",
        details: null,
        timestamp: error.timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });

    it("should not report validation errors", async () => {
      const error = new AppError("Invalid input", ErrorType.VALIDATION);
      await errorService.handleError(error);

      expect(apiClient.post).not.to.have.been.called;
    });

    it("should handle error reporting failures", async () => {
      apiClient.post.mockRejectedValue(new Error("Reporting failed"));

      const error = new AppError("Test error");
      await errorService.handleError(error);

      expect(showToast).to.have.been.called;
      // Error reporting failure should not throw
      expect(apiClient.post).to.have.been.called;
    });
  });
});
