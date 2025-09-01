import { Logger } from "../utils/logger.js";
import { authService } from "./auth.ts";
import { pwaService } from "./pwa.js";
import { dynamicConfig } from "../config/dynamic-config.js";
import type {
  ApiResponse,
  PaginatedResponse,
  CursorPaginatedResponse,
  PaginationInfo,
  CursorPaginationParams,
  ApiErrorResponse,
  RequestConfig,
  BulkRequest,
  BulkRequestResult,
  BulkProgressUpdate,
  DocumentationResponse,
  Project,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectQueryParams,
  User,
  ProfileUpdateRequest,
  SupportTicket,
  SupportTicketCreateRequest,
  SupportTicketQueryParams,
  CommunityPost,
  CommunityPostCreateRequest,
  CommunityPostQueryParams,
  SystemStatus,
  ServiceStatusDetail,
  AnalyticsData,
  AnalyticsQueryParams,
  TrackingEvent,
  HealthCheck,
  ErrorReport,
  StatusSubscriptionRequest
} from "../types/api.d.ts";

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryMethods: string[];
}

interface ApiServiceConfig {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
  retryConfig: RetryConfig;
}

class ApiService {
  private baseUrl: string;
  private _initialized: boolean;
  private defaultHeaders: Record<string, string>;
  private retryConfig: RetryConfig;

  constructor() {
    // Lazy-initialized from backend config; fallback kept for resilience
    this.baseUrl = "/api/v1";
    this._initialized = false;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      retryMethods: ['GET', 'PUT', 'DELETE']
    };
  }

  async request<T = any>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    // Lazy initialize configuration once
    if (!this._initialized) {
      try {
        const apiBase = await dynamicConfig.getApiBaseUrl();
        if (apiBase) {
          this.baseUrl = apiBase;
        }
      } catch (e) {
        Logger.warn("Falling back to default API base URL", (e as Error)?.message || e);
      } finally {
        this._initialized = true;
      }
    }

    const { retryCount = 0, params, ...requestOptions } = options;
    const method = requestOptions.method || 'GET';

    // Build URL with query parameters if provided
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = `${url}${queryString ? `?${queryString}` : ""}`;
    }

    try {
      const token = authService.getToken();
      const headers: Record<string, string> = {
        ...this.defaultHeaders,
        Accept: "application/json", // Add Accept header from api-client
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...requestOptions.headers,
      };

      // Add idempotency key for non-GET requests to make offline replays safe
      if (method !== 'GET' && !headers['Idempotency-Key']) {
        const key = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
        headers['Idempotency-Key'] = key;
      }

      const response = await fetch(url, {
        ...requestOptions,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        Logger.warn("Unauthorized request, logging out");
        await authService.logout();
        throw new Error("Unauthorized");
      }

      // Handle rate limiting with retry
      if (response.status === 429 && retryCount < this.retryConfig.maxRetries) {
        const retryAfter = response.headers.get('Retry-After') || String(this.retryConfig.retryDelay);
        Logger.warn(`Rate limited, retrying after ${retryAfter}ms`);
        // Retry-After may be seconds per RFC; support ms fallback
        const delayMs = String(retryAfter).match(/^\\d+$/) ? Number(retryAfter) * 1000 : Number(retryAfter);
        await this._delay(Number.isFinite(delayMs) ? delayMs : this.retryConfig.retryDelay);
        return this.request<T>(endpoint, { ...options, retryCount: retryCount + 1 });
      }

      // Handle server errors with retry for certain methods
      if (response.status >= 500 &&
          this.retryConfig.retryMethods.includes(method) &&
          retryCount < this.retryConfig.maxRetries) {
        Logger.warn(`Server error ${response.status}, retrying (${retryCount + 1}/${this.retryConfig.maxRetries})`);
        await this._delay(this.retryConfig.retryDelay * Math.pow(2, retryCount));
        return this.request<T>(endpoint, { ...options, retryCount: retryCount + 1 });
      }

      // Handle other error responses
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "API request failed");
      }

      return await response.json();
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError || (error as Error).message.includes('fetch')) {
        Logger.warn(`Network error for ${method} ${endpoint}:`, (error as Error).message);

        // Try to get cached data for GET requests
        if (method === 'GET') {
          try {
            const cachedData = await pwaService.getOfflineData(`api:${endpoint}`);
            if (cachedData) {
              Logger.info(`Serving cached data for ${endpoint}`);
              return cachedData;
            }
          } catch (cacheError) {
            Logger.debug('No cached data available', cacheError);
          }
        }

        // Queue non-GET requests for later
        if (method !== 'GET' && !navigator.onLine) {
          Logger.info(`Queueing offline action: ${method} ${endpoint}`);
          await pwaService.queueOfflineAction({
            url: `${this.baseUrl}${endpoint}`,
            method,
            headers: requestOptions.headers,
            body: requestOptions.body
          });
          throw new Error('Request queued for when online');
        }
      }

      Logger.error(`API request failed: ${(error as Error).message}`, error);
      throw error;
    }
  }

  // Health check endpoint
  async healthCheck(): Promise<HealthCheck> {
    return this.request<HealthCheck>("/health");
  }

  // Documentation endpoints
  async getDocumentation(type: "frontend" | "backend" | "api" = "frontend"): Promise<DocumentationResponse> {
    return this.request<DocumentationResponse>(`/docs/${type}`);
  }

  // Project endpoints with cursor pagination support
  async getProjects(params: ProjectQueryParams = {}): Promise<PaginatedResponse<Project> | CursorPaginatedResponse<Project>> {
    // Build query parameters, filtering out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
    );

    const queryString = new URLSearchParams(cleanParams as Record<string, string>).toString();

    // Return type is determined by the backend based on parameter presence
    // If cursor params are used, backend returns CursorPaginatedResponse
    // If offset params are used, backend returns PaginatedResponse
    return this.request<PaginatedResponse<Project> | CursorPaginatedResponse<Project>>(`/projects?${queryString}`);
  }

  async getProject(id: string | number): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: ProjectCreateRequest): Promise<Project> {
    return this.request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string | number, data: ProjectUpdateRequest): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string | number): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  // User profile endpoints
  async getUserProfile(): Promise<User> {
    return this.request<User>("/users/profile");
  }

  async updateUserProfile(data: ProfileUpdateRequest): Promise<User> {
    return this.request<User>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Support endpoints with cursor pagination support
  async submitSupportTicket(data: SupportTicketCreateRequest): Promise<SupportTicket> {
    return this.request<SupportTicket>("/support/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSupportTickets(params: SupportTicketQueryParams = {}): Promise<PaginatedResponse<SupportTicket> | CursorPaginatedResponse<SupportTicket>> {
    // Build query parameters, filtering out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
    );

    const queryString = new URLSearchParams(cleanParams as Record<string, string>).toString();

    // Return type is determined by the backend based on parameter presence
    return this.request<PaginatedResponse<SupportTicket> | CursorPaginatedResponse<SupportTicket>>(`/support/tickets?${queryString}`);
  }

  // Community endpoints with cursor pagination support
  async getCommunityPosts(params: CommunityPostQueryParams = {}): Promise<PaginatedResponse<CommunityPost> | CursorPaginatedResponse<CommunityPost>> {
    // Build query parameters, filtering out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
    );

    const queryString = new URLSearchParams(cleanParams as Record<string, string>).toString();

    // Return type is determined by the backend based on parameter presence
    return this.request<PaginatedResponse<CommunityPost> | CursorPaginatedResponse<CommunityPost>>(`/community/posts?${queryString}`);
  }

  async createCommunityPost(data: CommunityPostCreateRequest): Promise<CommunityPost> {
    return this.request<CommunityPost>("/community/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Error reporting
  async reportError(error: ErrorReport): Promise<void> {
    return this.request<void>("/errors", {
      method: "POST",
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        timestamp: error.timestamp || new Date().toISOString(),
        user_id: error.user_id,
        session_id: error.session_id,
        url: error.url,
        user_agent: error.user_agent,
        additional_context: error.additional_context,
      }),
    });
  }

  // Status endpoints for the status page
  async getSystemStatus(): Promise<SystemStatus> {
    return this.request<SystemStatus>("/status");
  }

  async getServiceStatus(serviceId: string): Promise<ServiceStatusDetail> {
    return this.request<ServiceStatusDetail>(`/status/services/${serviceId}`);
  }

  async subscribeToStatusUpdates(request: StatusSubscriptionRequest): Promise<void> {
    return this.request<void>("/status/subscribe", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Analytics endpoints
  async getAnalytics(params: AnalyticsQueryParams = {}): Promise<AnalyticsData> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<AnalyticsData>(`/analytics?${queryString}`);
  }

  async trackEvent(event: TrackingEvent): Promise<void> {
    return this.request<void>("/analytics/events", {
      method: "POST",
      body: JSON.stringify(event),
    });
  }

  // Utility methods
  private async _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Request with caching for GET requests
  async requestWithCache<T = any>(
    endpoint: string,
    options: RequestConfig = {},
    ttl: number = 300000
  ): Promise<T> { // 5 minutes default
    const method = options.method || 'GET';

    if (method === 'GET') {
      const cacheKey = `api:${endpoint}`;

      try {
        const cached = await pwaService.getOfflineData(cacheKey);
        if (cached) {
          Logger.debug(`Cache hit for ${endpoint}`);
          return cached;
        }
      } catch (error) {
        Logger.debug(`Cache miss for ${endpoint}`);
      }
    }

    const data = await this.request<T>(endpoint, options);

    // Cache successful GET responses
    if (method === 'GET' && data) {
      try {
        await pwaService.storeOfflineData(`api:${endpoint}`, data, ttl);
        Logger.debug(`Cached response for ${endpoint}`);
      } catch (error) {
        Logger.warn(`Failed to cache response for ${endpoint}:`, error);
      }
    }

    return data;
  }

  // Bulk operations with progress tracking
  async bulkRequest<T = any>(
    requests: BulkRequest[],
    onProgress?: (progress: BulkProgressUpdate) => void
  ): Promise<BulkRequestResult<T>[]> {
    const results: BulkRequestResult<T>[] = [];
    const total = requests.length;

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (!request) continue;

      try {
        const result = await this.request<T>(request.endpoint, request.options || {});
        results.push({ success: true, data: result, index: i });
      } catch (error) {
        results.push({
          success: false,
          error: (error as Error).message,
          index: i
        });
      }

      if (onProgress) {
        onProgress({
          completed: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100)
        });
      }
    }

    return results;
  }

  // Request timeout handling
  async requestWithTimeout<T = any>(
    endpoint: string,
    options: RequestConfig = {},
    timeout: number = 30000
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await this.request<T>(endpoint, {
        ...options,
        signal: controller.signal
      });
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Cursor pagination utility methods

  /**
   * Create cursor pagination parameters for first page
   */
  createCursorParams(
    limit: number = 20,
    sortBy: string = 'created_at',
    sortDirection: 'asc' | 'desc' = 'desc',
    includeTotal: boolean = false,
    filters: Record<string, any> = {}
  ): CursorPaginationParams & Record<string, any> {
    return {
      limit,
      sort_by: sortBy,
      sort_direction: sortDirection,
      include_total: includeTotal,
      ...filters
    };
  }

  /**
   * Create pagination parameters for next page using cursor
   */
  createNextPageParams(
    currentResponse: CursorPaginatedResponse<any>,
    additionalFilters: Record<string, any> = {}
  ): CursorPaginationParams & Record<string, any> | null {
    if (!currentResponse.pagination.has_next || !currentResponse.pagination.next_cursor) {
      return null;
    }

    return {
      cursor: currentResponse.pagination.next_cursor,
      limit: 20, // Default limit
      sort_by: currentResponse.pagination.current_sort || 'created_at',
      sort_direction: currentResponse.pagination.current_direction || 'desc',
      include_total: false, // Usually don't need total on subsequent pages
      ...additionalFilters
    };
  }

  /**
   * Create pagination parameters for previous page using cursor
   */
  createPreviousPageParams(
    currentResponse: CursorPaginatedResponse<any>,
    additionalFilters: Record<string, any> = {}
  ): CursorPaginationParams & Record<string, any> | null {
    if (!currentResponse.pagination.has_previous || !currentResponse.pagination.previous_cursor) {
      return null;
    }

    return {
      cursor: currentResponse.pagination.previous_cursor,
      limit: 20, // Default limit
      sort_by: currentResponse.pagination.current_sort || 'created_at',
      sort_direction: currentResponse.pagination.current_direction || 'desc',
      include_total: false,
      ...additionalFilters
    };
  }

  /**
   * Check if response uses cursor pagination
   */
  isCursorPaginated<T>(response: PaginatedResponse<T> | CursorPaginatedResponse<T>): response is CursorPaginatedResponse<T> {
    return 'pagination' in response &&
           'next_cursor' in response.pagination &&
           'has_next' in response.pagination;
  }

  /**
   * Extract data array from either pagination response type
   */
  extractPaginatedData<T>(response: PaginatedResponse<T> | CursorPaginatedResponse<T>): T[] {
    return response.data;
  }

  /**
   * Get pagination info in a normalized format
   */
  getPaginationInfo<T>(response: PaginatedResponse<T> | CursorPaginatedResponse<T>): {
    hasNext: boolean;
    hasPrevious: boolean;
    total?: number;
    currentPage?: number;
    totalPages?: number;
  } {
    if (this.isCursorPaginated(response)) {
      return {
        hasNext: response.pagination.has_next,
        hasPrevious: response.pagination.has_previous,
        ...(response.pagination.total_count !== undefined && { total: response.pagination.total_count })
      };
    } else {
      return {
        hasNext: response.pagination.has_next,
        hasPrevious: response.pagination.has_prev,
        total: response.pagination.total,
        currentPage: response.pagination.page,
        totalPages: response.pagination.total_pages
      };
    }
  }
}

// Export a singleton instance
export const apiService = new ApiService();
