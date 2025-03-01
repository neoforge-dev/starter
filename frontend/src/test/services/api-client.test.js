import { expect, beforeEach, afterEach, vi, describe, it } from "vitest";
import { ApiClient } from "../../services/api-client.js";
import { AppError, ErrorType } from "../../services/error-service.js";

describe("ApiClient", () => {
  let originalFetch;
  let mockResponse;
  let client;
  let originalLocalStorage;
  let mockStorage = {};

  beforeEach(() => {
    originalFetch = window.fetch;
    client = new ApiClient();

    // Default mock response
    mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ data: "test" }),
      headers: new Headers({
        "content-type": "application/json",
      }),
    };

    window.fetch = vi.fn().mockResolvedValue(mockResponse);

    // Setup localStorage mock
    originalLocalStorage = Object.getOwnPropertyDescriptor(
      window,
      "localStorage"
    );
    mockStorage = {};

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key) => mockStorage[key] || null),
        setItem: vi.fn((key, value) => {
          mockStorage[key] = String(value);
        }),
        removeItem: vi.fn((key) => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {
          mockStorage = {};
        }),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    window.fetch = originalFetch;

    // Restore original localStorage if it existed
    if (originalLocalStorage) {
      Object.defineProperty(window, "localStorage", originalLocalStorage);
    }

    vi.clearAllMocks();
  });

  describe("Basic Operations", () => {
    it("makes GET requests", async () => {
      const expectedResponse = { data: "test" };
      mockResponse.json = async () => expectedResponse;

      const response = await client.get("/test");
      expect(response).toEqual(expectedResponse);
      expect(window.fetch).toHaveBeenCalledWith("/api/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });

    it("makes POST requests", async () => {
      const mockData = { name: "test" };
      const expectedResponse = { id: 1, ...mockData };
      mockResponse.json = async () => expectedResponse;

      const response = await client.post("/test", mockData);
      expect(response).toEqual(expectedResponse);
      expect(window.fetch).toHaveBeenCalledWith("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(mockData),
      });
    });

    it("makes PUT requests", async () => {
      const mockData = { name: "updated" };
      const expectedResponse = { id: 1, ...mockData };
      mockResponse.json = async () => expectedResponse;

      const response = await client.put("/test/1", mockData);
      expect(response).toEqual(expectedResponse);
      expect(window.fetch).toHaveBeenCalledWith("/api/test/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(mockData),
      });
    });

    it("makes DELETE requests", async () => {
      const expectedResponse = {};
      mockResponse.json = async () => expectedResponse;

      const response = await client.delete("/test/1");
      expect(response).toEqual(expectedResponse);
      expect(window.fetch).toHaveBeenCalledWith("/api/test/1", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });
  });

  describe("Error Handling", () => {
    it("handles 404 not found errors", async () => {
      mockResponse.ok = false;
      mockResponse.status = 404;
      mockResponse.json = async () => ({ message: "Not found" });

      try {
        await client.get("/nonexistent");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toContain("Not found");
        expect(error.type).toBe(ErrorType.API);
        expect(error.details.status).toBe(404);
      }
    });

    it("handles 401 unauthorized errors", async () => {
      mockResponse.ok = false;
      mockResponse.status = 401;
      mockResponse.json = async () => ({ message: "Unauthorized" });

      // Set a token to verify it gets cleared
      window.localStorage.setItem("neo-auth-token", "test-token");

      // Mock the dispatchEvent to prevent actual event dispatch
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = vi.fn();

      try {
        await client.get("/protected");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe(
          "Your session has expired. Please log in again."
        );
        expect(error.type).toBe(ErrorType.AUTH);
        expect(window.dispatchEvent).toHaveBeenCalledWith(
          expect.any(CustomEvent)
        );
        expect(window.localStorage.getItem("neo-auth-token")).toBeNull();
      } finally {
        // Restore original dispatchEvent
        window.dispatchEvent = originalDispatchEvent;
      }
    });

    it("handles network errors", async () => {
      window.fetch = vi
        .fn()
        .mockRejectedValue(new TypeError("Failed to fetch"));

      try {
        await client.get("/test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toContain("Network error");
        expect(error.type).toBe(ErrorType.NETWORK);
      }
    });

    it("handles invalid JSON responses", async () => {
      mockResponse.ok = true;
      mockResponse.json = async () => {
        throw new Error("Invalid JSON");
      };

      try {
        await client.get("/test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toContain("API request failed");
        expect(error.type).toBe(ErrorType.API);
      }
    });
  });

  describe("Authentication", () => {
    it("includes auth token in requests when available", async () => {
      const token = "test-token";
      window.localStorage.setItem("neo-auth-token", token);

      const expectedResponse = { data: "test" };
      mockResponse.json = async () => expectedResponse;

      const response = await client.get("/test");
      expect(response).toEqual(expectedResponse);
      expect(window.fetch).toHaveBeenCalledWith("/api/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    });

    it("clears auth token on 401 response", async () => {
      const token = "test-token";
      window.localStorage.setItem("neo-auth-token", token);

      mockResponse.ok = false;
      mockResponse.status = 401;
      mockResponse.json = async () => ({ message: "Unauthorized" });

      // Mock the dispatchEvent to prevent actual event dispatch
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = vi.fn();

      try {
        await client.get("/protected");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe(
          "Your session has expired. Please log in again."
        );
        expect(error.type).toBe(ErrorType.AUTH);
        expect(window.localStorage.getItem("neo-auth-token")).toBeNull();
      } finally {
        // Restore original dispatchEvent
        window.dispatchEvent = originalDispatchEvent;
      }
    });
  });

  describe("Request Customization", () => {
    it("supports custom headers", async () => {
      const customHeaders = {
        "X-Custom-Header": "test-value",
      };

      const expectedResponse = { data: "test" };
      mockResponse.json = async () => expectedResponse;

      const response = await client.get("/test", { headers: customHeaders });
      expect(response).toEqual(expectedResponse);
      expect(window.fetch).toHaveBeenCalledWith("/api/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Custom-Header": "test-value",
        },
      });
    });

    it("supports query parameters", async () => {
      const queryParams = {
        page: 1,
        limit: 10,
        search: "test",
      };

      const expectedResponse = { data: "test" };
      mockResponse.json = async () => expectedResponse;

      const response = await client.get("/test", { params: queryParams });
      expect(response).toEqual(expectedResponse);
      expect(window.fetch).toHaveBeenCalledWith(
        "/api/test?page=1&limit=10&search=test",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    });
  });

  describe("Response Handling", () => {
    it("handles empty responses", async () => {
      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error("No content")),
        text: () => Promise.resolve(""),
        headers: new Headers({
          "content-type": "text/plain",
        }),
      });

      const response = await client.get("/test");
      expect(response).to.equal("");
    });

    it("handles non-JSON responses", async () => {
      const textResponse = "Hello, World!";
      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(textResponse),
        headers: new Headers({
          "content-type": "text/plain",
        }),
      });

      const response = await client.get("/test");
      expect(response).to.equal(textResponse);
    });
  });
});
