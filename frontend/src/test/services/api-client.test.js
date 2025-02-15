import { expect } from "@esm-bundle/chai";
import { apiClient } from "../../services/api-client.js";
import { AppError, ErrorType } from "../../services/error-service.js";

describe("ApiClient", () => {
  let originalFetch;
  let originalLocalStorage;
  let mockResponse;

  beforeEach(() => {
    // Mock fetch
    originalFetch = window.fetch;
    window.fetch = vi.fn();

    // Mock localStorage
    originalLocalStorage = window.localStorage;
    window.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    // Default mock response
    mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ data: "test" }),
      headers: new Headers({
        "content-type": "application/json",
      }),
    };

    window.fetch.mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    window.fetch = originalFetch;
    window.localStorage = originalLocalStorage;
    vi.clearAllMocks();
  });

  describe("Error Handling", () => {
    it("handles 401 unauthorized errors", async () => {
      const authExpiredHandler = vi.fn();
      window.addEventListener("auth-expired", authExpiredHandler);

      mockResponse.ok = false;
      mockResponse.status = 401;
      mockResponse.json = async () => ({
        message: "Token expired",
      });

      try {
        await apiClient.get("/test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.type).to.equal(ErrorType.AUTH);
        expect(error.message).to.equal(
          "Your session has expired. Please log in again."
        );
        expect(localStorage.removeItem).to.have.been.calledWith(
          "neo-auth-token"
        );
        expect(authExpiredHandler).to.have.been.called;
      }

      window.removeEventListener("auth-expired", authExpiredHandler);
    });

    it("handles network errors", async () => {
      window.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      try {
        await apiClient.get("/test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.type).to.equal(ErrorType.NETWORK);
        expect(error.message).to.equal(
          "Network error. Please check your connection."
        );
      }
    });

    it("handles API errors with JSON response", async () => {
      mockResponse.ok = false;
      mockResponse.status = 404;
      mockResponse.json = async () => ({
        message: "Resource not found",
        details: { id: 123 },
      });

      try {
        await apiClient.get("/test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.type).to.equal(ErrorType.API);
        expect(error.message).to.equal("Resource not found");
        expect(error.details).to.deep.include({
          status: 404,
          data: { message: "Resource not found", details: { id: 123 } },
        });
      }
    });

    it("handles API errors with text response", async () => {
      mockResponse.ok = false;
      mockResponse.status = 500;
      mockResponse.headers = new Headers({
        "content-type": "text/plain",
      });
      mockResponse.text = async () => "Internal Server Error";

      try {
        await apiClient.get("/test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.type).to.equal(ErrorType.API);
        expect(error.message).to.equal("API request failed");
        expect(error.details.data).to.equal("Internal Server Error");
      }
    });

    it("handles malformed JSON responses", async () => {
      mockResponse.ok = false;
      mockResponse.status = 400;
      mockResponse.json = async () => {
        throw new SyntaxError("Unexpected token");
      };

      try {
        await apiClient.get("/test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.type).to.equal(ErrorType.API);
        expect(error.message).to.equal("API request failed");
      }
    });
  });

  describe("Request Headers", () => {
    it("includes auth token when available", async () => {
      localStorage.getItem.mockReturnValue("test-token");

      await apiClient.get("/test");

      expect(fetch).to.have.been.calledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("omits auth token when not available", async () => {
      localStorage.getItem.mockReturnValue(null);

      await apiClient.get("/test");

      const call = fetch.mock.calls[0][1];
      expect(call.headers.Authorization).to.be.undefined;
    });

    it("includes correct content type for JSON requests", async () => {
      await apiClient.post("/test", { data: "test" });

      expect(fetch).to.have.been.calledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Accept: "application/json",
          }),
        })
      );
    });

    it("handles file uploads correctly", async () => {
      const file = new File(["test"], "test.txt");
      await apiClient.uploadFile("/upload", file);

      const call = fetch.mock.calls[0][1];
      expect(call.headers["Content-Type"]).to.be.undefined;
      expect(call.body).to.be.instanceOf(FormData);
    });
  });

  describe("HTTP Methods", () => {
    it("handles GET requests", async () => {
      await apiClient.get("/test");

      expect(fetch).to.have.been.calledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("handles POST requests with JSON body", async () => {
      const data = { test: "data" };
      await apiClient.post("/test", data);

      expect(fetch).to.have.been.calledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(data),
        })
      );
    });

    it("handles PUT requests with JSON body", async () => {
      const data = { test: "data" };
      await apiClient.put("/test", data);

      expect(fetch).to.have.been.calledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(data),
        })
      );
    });

    it("handles PATCH requests with JSON body", async () => {
      const data = { test: "data" };
      await apiClient.patch("/test", data);

      expect(fetch).to.have.been.calledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(data),
        })
      );
    });

    it("handles DELETE requests", async () => {
      await apiClient.delete("/test");

      expect(fetch).to.have.been.calledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });
});
