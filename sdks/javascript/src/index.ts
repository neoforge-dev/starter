import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface NeoForgeConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface APIError {
  message: string;
  code: string;
  status: number;
}

export class NeoForgeClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: NeoForgeConfig) {
    this.apiKey = config.apiKey;
    
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.neoforge.dev',
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NeoForge-SDK-JS/1.0.0'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const apiError: APIError = {
          message: error.response?.data?.detail || error.message,
          code: error.response?.data?.code || 'UNKNOWN_ERROR',
          status: error.response?.status || 500
        };
        throw apiError;
      }
    );
  }

  // Authentication endpoints
  auth = {
    login: async (email: string, password: string) => {
      const response = await this.client.post('/api/v1/auth/login', {
        email,
        password
      });
      return response.data;
    },

    register: async (email: string, password: string, fullName: string) => {
      const response = await this.client.post('/api/v1/auth/register', {
        email,
        password,
        full_name: fullName
      });
      return response.data;
    },

    refreshToken: async (refreshToken: string) => {
      const response = await this.client.post('/api/v1/auth/refresh', {
        refresh_token: refreshToken
      });
      return response.data;
    }
  };

  // Billing endpoints
  billing = {
    getPlans: async () => {
      const response = await this.client.get('/api/v1/billing/plans');
      return response.data;
    },

    createSubscription: async (planId: number, billingCycle: string = 'monthly') => {
      const response = await this.client.post('/api/v1/billing/subscription', {
        plan_id: planId,
        billing_cycle: billingCycle
      });
      return response.data;
    },

    getSubscription: async () => {
      const response = await this.client.get('/api/v1/billing/subscription');
      return response.data;
    },

    cancelSubscription: async (immediate: boolean = false) => {
      const response = await this.client.delete('/api/v1/billing/subscription', {
        params: { immediate }
      });
      return response.data;
    },

    getUsage: async () => {
      const response = await this.client.get('/api/v1/billing/usage');
      return response.data;
    }
  };

  // Organizations endpoints
  organizations = {
    list: async () => {
      const response = await this.client.get('/api/v1/organizations');
      return response.data;
    },

    create: async (name: string, description?: string) => {
      const response = await this.client.post('/api/v1/organizations', {
        name,
        description
      });
      return response.data;
    },

    get: async (id: number) => {
      const response = await this.client.get(`/api/v1/organizations/${id}`);
      return response.data;
    },

    update: async (id: number, data: any) => {
      const response = await this.client.put(`/api/v1/organizations/${id}`, data);
      return response.data;
    },

    delete: async (id: number) => {
      const response = await this.client.delete(`/api/v1/organizations/${id}`);
      return response.data;
    }
  };

  // Projects endpoints
  projects = {
    list: async (organizationId?: number) => {
      const params = organizationId ? { organization_id: organizationId } : {};
      const response = await this.client.get('/api/v1/projects', { params });
      return response.data;
    },

    create: async (name: string, description?: string, organizationId?: number) => {
      const response = await this.client.post('/api/v1/projects', {
        name,
        description,
        organization_id: organizationId
      });
      return response.data;
    },

    get: async (id: number) => {
      const response = await this.client.get(`/api/v1/projects/${id}`);
      return response.data;
    },

    update: async (id: number, data: any) => {
      const response = await this.client.put(`/api/v1/projects/${id}`, data);
      return response.data;
    },

    delete: async (id: number) => {
      const response = await this.client.delete(`/api/v1/projects/${id}`);
      return response.data;
    }
  };

  // Analytics endpoints
  analytics = {
    getMetrics: async (startDate?: string, endDate?: string) => {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await this.client.get('/api/v1/analytics/metrics', { params });
      return response.data;
    },

    getUserActivity: async (userId?: number) => {
      const params = userId ? { user_id: userId } : {};
      const response = await this.client.get('/api/v1/analytics/user-activity', { params });
      return response.data;
    }
  };

  // Users endpoints  
  users = {
    me: async () => {
      const response = await this.client.get('/api/v1/users/me');
      return response.data;
    },

    update: async (data: any) => {
      const response = await this.client.put('/api/v1/users/me', data);
      return response.data;
    },

    list: async () => {
      const response = await this.client.get('/api/v1/users');
      return response.data;
    }
  };
}

export default NeoForgeClient;
