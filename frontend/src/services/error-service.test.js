import { expect } from "@esm-bundle/chai";
import { waitUntil } from "@open-wc/testing";
import { AppError, ErrorType, errorService } from "./error-service.js";
import { showToast } from "../components/ui/toast/index.js";
import { apiService } from "./api.ts";
import { describe, it, beforeEach, vi, expect as viExpect } from "vitest";

// Mock dependencies
vi.mock("../components/ui/toast/index.js", () => ({
  showToast: vi.fn(),
}));

vi.mock("./api.ts", () => ({
  apiService: {
    request: vi.fn(),
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

      viExpect(showToast).toHaveBeenCalledWith("Invalid input", "warning");
      viExpect(apiService.request).not.toHaveBeenCalled();
    });

    it("should handle network errors", async () => {
      const error = new AppError("Network failed", ErrorType.NETWORK);
      await errorService.handleError(error);

      viExpect(showToast).toHaveBeenCalledWith(
        "Network error. Please check your connection.",
        "error"
      );
      viExpect(apiService.request).not.toHaveBeenCalled();
    });

    it("should handle auth errors", async () => {
      const error = new AppError("Auth failed", ErrorType.AUTH);
      await errorService.handleError(error);

      viExpect(showToast).toHaveBeenCalledWith(
        "Authentication error. Please log in again.",
        "error"
      );
      viExpect(apiService.request).not.toHaveBeenCalled();
    });

    it("should handle API errors", async () => {
      const error = new AppError("API failed", ErrorType.API);
      await errorService.handleError(error);

      viExpect(showToast).toHaveBeenCalledWith("API failed", "error");
      viExpect(apiService.request).toHaveBeenCalledWith("/errors", {
        method: "POST",
        body: JSON.stringify({
          type: ErrorType.API,
          message: "API failed",
          details: null,
          timestamp: error.timestamp,
          userAgent: navigator.userAgent,
          url: window.location.href,
        })
      });
    });

    it("should handle unknown errors", async () => {
      const error = new Error("Unknown error");
      await errorService.handleError(error);

      viExpect(showToast).toHaveBeenCalledWith(
        "An unexpected error occurred.",
        "error"
      );
      viExpect(apiService.request).toHaveBeenCalled();
    });
  });

  describe("Error Listeners", () => {
    it("should notify error listeners", async () => {
      const listener = vi.fn();
      errorService.addListener(listener);

      const error = new AppError("Test error");
      await errorService.handleError(error);

      viExpect(listener).toHaveBeenCalledWith(error);
    });

    it("should handle errors in listeners", async () => {
      const listener = vi.fn().mockImplementation(() => {
        throw new Error("Listener error");
      });
      errorService.addListener(listener);

      const error = new AppError("Test error");
      await errorService.handleError(error);

      viExpect(listener).toHaveBeenCalled();
      // Error in listener should not prevent other error handling
      viExpect(showToast).toHaveBeenCalled();
    });

    it("should remove error listeners", async () => {
      const listener = vi.fn();
      errorService.addListener(listener);
      errorService.removeListener(listener);

      const error = new AppError("Test error");
      await errorService.handleError(error);

      viExpect(listener).not.toHaveBeenCalled();
    });
  });

  describe("Global Error Handling", () => {
    it("should handle uncaught errors", async () => {
      const error = new Error("Uncaught error");
      window.dispatchEvent(new ErrorEvent("error", { error }));

      await waitUntil(() => showToast.mock.calls.length > 0);

      viExpect(showToast).toHaveBeenCalledWith(
        "An unexpected error occurred.",
        "error"
      );
    });

    it("should handle unhandled promise rejections", async () => {
      const error = new Error("Promise rejection");
      // Create a custom event since PromiseRejectionEvent may not be available in JSDOM
      const event = new CustomEvent("unhandledrejection", {
        detail: {
          reason: error,
          promise: Promise.reject(error).catch(() => {}),
        },
      });
      event.reason = error;
      event.promise = Promise.reject(error).catch(() => {});
      window.dispatchEvent(event);

      await waitUntil(() => showToast.mock.calls.length > 0);

      viExpect(showToast).toHaveBeenCalledWith(
        "An unexpected error occurred.",
        "error"
      );
    });

    it("should handle API errors", async () => {
      const error = { message: "API error" };
      window.dispatchEvent(new CustomEvent("api-error", { detail: error }));

      await waitUntil(() => showToast.mock.calls.length > 0);

      viExpect(showToast).toHaveBeenCalledWith("API error", "error");
    });

    it("should handle auth expired events", async () => {
      window.dispatchEvent(new CustomEvent("auth-expired"));

      await waitUntil(() => showToast.mock.calls.length > 0);

      viExpect(showToast).toHaveBeenCalledWith(
        "Authentication error. Please log in again.",
        "error"
      );
    });
  });

  describe("Error Reporting", () => {
    it("should report unknown errors", async () => {
      const error = new AppError("Unknown error");
      await errorService.handleError(error);

      viExpect(apiService.request).toHaveBeenCalledWith("/errors", {
        method: "POST",
        body: JSON.stringify({
          type: ErrorType.UNKNOWN,
          message: "Unknown error",
          details: null,
          timestamp: error.timestamp,
          userAgent: navigator.userAgent,
          url: window.location.href,
        })
      });
    });

    it("should not report validation errors", async () => {
      const error = new AppError("Invalid input", ErrorType.VALIDATION);
      await errorService.handleError(error);

      viExpect(apiService.request).not.toHaveBeenCalled();
    });

    it("should handle error reporting failures", async () => {
      apiService.request.mockRejectedValue(new Error("Reporting failed"));

      const error = new AppError("Test error");
      await errorService.handleError(error);

      viExpect(showToast).toHaveBeenCalled();
      // Error reporting failure should not throw
      viExpect(apiService.request).toHaveBeenCalled();
    });
  });
});
