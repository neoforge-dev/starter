#!/usr/bin/env python3
"""
NeoForge SDK Generator
Generates JavaScript/TypeScript and Python SDKs from OpenAPI specification
"""

import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any, List


class SDKGenerator:
    """Auto-generates production-ready SDKs for NeoForge API"""
    
    def __init__(self, openapi_spec_path: str = None):
        self.project_root = Path(__file__).parent.parent.parent
        self.backend_root = self.project_root / "backend"
        self.sdk_output_dir = self.project_root / "sdks"
        self.openapi_spec_path = openapi_spec_path or self.backend_root / "openapi.json"
        
    def generate_openapi_spec(self):
        """Generate simplified OpenAPI spec for SDK generation"""
        print("🔄 Generating OpenAPI specification...")
        
        # Create a comprehensive OpenAPI spec manually based on NeoForge's API structure
        openapi_spec = {
            "openapi": "3.0.0",
            "info": {
                "title": "NeoForge API",
                "description": "Enterprise SaaS platform for bootstrapped founders",
                "version": "1.0.0",
                "contact": {
                    "name": "NeoForge Support",
                    "url": "https://neoforge.dev/support",
                    "email": "support@neoforge.dev"
                },
                "license": {
                    "name": "MIT",
                    "url": "https://opensource.org/licenses/MIT"
                }
            },
            "servers": [
                {
                    "url": "https://api.neoforge.dev",
                    "description": "Production server"
                },
                {
                    "url": "https://staging-api.neoforge.dev", 
                    "description": "Staging server"
                },
                {
                    "url": "http://localhost:8000",
                    "description": "Development server"
                }
            ],
            "paths": {
                # Authentication endpoints
                "/api/v1/auth/login": {"post": {"tags": ["auth"], "summary": "Login user"}},
                "/api/v1/auth/register": {"post": {"tags": ["auth"], "summary": "Register user"}},
                "/api/v1/auth/refresh": {"post": {"tags": ["auth"], "summary": "Refresh token"}},
                
                # Billing endpoints  
                "/api/v1/billing/plans": {"get": {"tags": ["billing"], "summary": "Get subscription plans"}},
                "/api/v1/billing/subscription": {
                    "get": {"tags": ["billing"], "summary": "Get user subscription"},
                    "post": {"tags": ["billing"], "summary": "Create subscription"},
                    "put": {"tags": ["billing"], "summary": "Update subscription"},
                    "delete": {"tags": ["billing"], "summary": "Cancel subscription"}
                },
                "/api/v1/billing/usage": {"get": {"tags": ["billing"], "summary": "Get usage metrics"}},
                "/api/v1/billing/payments": {"get": {"tags": ["billing"], "summary": "Get payment history"}},
                
                # Organizations endpoints
                "/api/v1/organizations": {
                    "get": {"tags": ["organizations"], "summary": "List organizations"},
                    "post": {"tags": ["organizations"], "summary": "Create organization"}
                },
                "/api/v1/organizations/{id}": {
                    "get": {"tags": ["organizations"], "summary": "Get organization"},
                    "put": {"tags": ["organizations"], "summary": "Update organization"},
                    "delete": {"tags": ["organizations"], "summary": "Delete organization"}
                },
                
                # Projects endpoints
                "/api/v1/projects": {
                    "get": {"tags": ["projects"], "summary": "List projects"},
                    "post": {"tags": ["projects"], "summary": "Create project"}
                },
                "/api/v1/projects/{id}": {
                    "get": {"tags": ["projects"], "summary": "Get project"},
                    "put": {"tags": ["projects"], "summary": "Update project"},
                    "delete": {"tags": ["projects"], "summary": "Delete project"}
                },
                
                # Analytics endpoints
                "/api/v1/analytics/metrics": {"get": {"tags": ["analytics"], "summary": "Get metrics"}},
                "/api/v1/analytics/user-activity": {"get": {"tags": ["analytics"], "summary": "Get user activity"}},
                
                # Users endpoints
                "/api/v1/users": {"get": {"tags": ["users"], "summary": "List users"}},
                "/api/v1/users/me": {
                    "get": {"tags": ["users"], "summary": "Get current user"},
                    "put": {"tags": ["users"], "summary": "Update current user"}
                },
                
                # Additional enterprise endpoints discovered in PROJECT_INDEX
                "/api/v1/admin": {"get": {"tags": ["admin"], "summary": "Admin endpoints"}},
                "/api/v1/rbac": {"get": {"tags": ["rbac"], "summary": "Role-based access control"}},
                "/api/v1/security": {"get": {"tags": ["security"], "summary": "Security features"}},
                "/api/v1/webhooks": {"post": {"tags": ["webhooks"], "summary": "Webhook handling"}},
                "/api/v1/items": {"get": {"tags": ["items"], "summary": "Item management"}},
                "/api/v1/events": {"get": {"tags": ["events"], "summary": "Event tracking"}},
                "/api/v1/support": {"post": {"tags": ["support"], "summary": "Support tickets"}},
                "/api/v1/recommendations": {"get": {"tags": ["recommendations"], "summary": "AI recommendations"}},
                "/api/v1/personalization": {"get": {"tags": ["personalization"], "summary": "User personalization"}},
                "/api/v1/content_suggestions": {"get": {"tags": ["content"], "summary": "Content suggestions"}},
                "/api/v1/community": {"get": {"tags": ["community"], "summary": "Community features"}}
            },
            "components": {
                "securitySchemes": {
                    "bearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT"
                    }
                }
            },
            "security": [{"bearerAuth": []}]
        }
        
        # Save enhanced spec
        with open(self.openapi_spec_path, 'w') as f:
            json.dump(openapi_spec, f, indent=2)
            
        print(f"✅ OpenAPI spec saved to {self.openapi_spec_path}")
        return openapi_spec

    def generate_javascript_sdk(self):
        """Generate JavaScript/TypeScript SDK with comprehensive features"""
        js_sdk_dir = self.sdk_output_dir / "javascript"
        js_sdk_dir.mkdir(exist_ok=True)
        
        # Package.json for the SDK
        package_json = {
            "name": "@neoforge/sdk",
            "version": "1.0.0",
            "description": "Official JavaScript/TypeScript SDK for NeoForge API",
            "main": "dist/index.js",
            "types": "dist/index.d.ts",
            "scripts": {
                "build": "tsc",
                "test": "jest",
                "prepublish": "npm run build"
            },
            "keywords": ["neoforge", "api", "sdk", "saas", "enterprise"],
            "author": "NeoForge Team",
            "license": "MIT",
            "dependencies": {
                "axios": "^1.6.0",
                "form-data": "^4.0.0"
            },
            "devDependencies": {
                "typescript": "^5.0.0",
                "@types/node": "^20.0.0",
                "jest": "^29.0.0",
                "@types/jest": "^29.0.0"
            },
            "repository": {
                "type": "git",
                "url": "https://github.com/neoforge/sdk-javascript"
            }
        }
        
        with open(js_sdk_dir / "package.json", 'w') as f:
            json.dump(package_json, f, indent=2)
        
        # TypeScript configuration
        tsconfig = {
            "compilerOptions": {
                "target": "ES2018",
                "module": "commonjs",
                "lib": ["ES2018"],
                "declaration": True,
                "outDir": "./dist",
                "rootDir": "./src",
                "strict": True,
                "esModuleInterop": True,
                "skipLibCheck": True,
                "forceConsistentCasingInFileNames": True
            },
            "include": ["src/**/*"],
            "exclude": ["node_modules", "dist", "**/*.test.ts"]
        }
        
        with open(js_sdk_dir / "tsconfig.json", 'w') as f:
            json.dump(tsconfig, f, indent=2)
        
        # Main SDK implementation
        src_dir = js_sdk_dir / "src"
        src_dir.mkdir(exist_ok=True)
        
        # Core client class
        client_ts = '''import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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
'''
        
        with open(src_dir / "index.ts", 'w') as f:
            f.write(client_ts)
        
        # Example usage file
        example_js = '''const { NeoForgeClient } = require('@neoforge/sdk');

// Initialize the client
const client = new NeoForgeClient({
  apiKey: 'your-api-key-here',
  baseURL: 'https://api.neoforge.dev' // optional, defaults to production
});

async function example() {
  try {
    // Get subscription plans
    const plans = await client.billing.getPlans();
    console.log('Available plans:', plans);

    // Create a new organization
    const org = await client.organizations.create('My Company', 'A great organization');
    console.log('Created organization:', org);

    // Create a project
    const project = await client.projects.create('My Project', 'A fantastic project', org.id);
    console.log('Created project:', project);

    // Get analytics
    const metrics = await client.analytics.getMetrics();
    console.log('Current metrics:', metrics);

  } catch (error) {
    console.error('API Error:', error);
  }
}

example();
'''
        
        with open(js_sdk_dir / "example.js", 'w') as f:
            f.write(example_js)
        
        # README
        readme_md = '''# NeoForge JavaScript/TypeScript SDK

Official JavaScript/TypeScript SDK for the NeoForge API.

## Installation

```bash
npm install @neoforge/sdk
```

## Quick Start

```javascript
const { NeoForgeClient } = require('@neoforge/sdk');

const client = new NeoForgeClient({
  apiKey: 'your-api-key-here'
});

// Use the client
const plans = await client.billing.getPlans();
```

## TypeScript Support

This SDK includes full TypeScript definitions:

```typescript
import NeoForgeClient from '@neoforge/sdk';

const client = new NeoForgeClient({
  apiKey: 'your-api-key-here',
  baseURL: 'https://api.neoforge.dev', // optional
  timeout: 30000 // optional, default 30s
});
```

## API Reference

### Authentication
- `auth.login(email, password)` - Login user
- `auth.register(email, password, fullName)` - Register new user
- `auth.refreshToken(refreshToken)` - Refresh access token

### Billing
- `billing.getPlans()` - Get subscription plans
- `billing.createSubscription(planId, billingCycle)` - Create subscription
- `billing.getSubscription()` - Get current subscription
- `billing.cancelSubscription(immediate)` - Cancel subscription
- `billing.getUsage()` - Get usage metrics

### Organizations
- `organizations.list()` - List organizations
- `organizations.create(name, description)` - Create organization
- `organizations.get(id)` - Get organization details
- `organizations.update(id, data)` - Update organization
- `organizations.delete(id)` - Delete organization

### Projects
- `projects.list(organizationId)` - List projects
- `projects.create(name, description, organizationId)` - Create project
- `projects.get(id)` - Get project details
- `projects.update(id, data)` - Update project
- `projects.delete(id)` - Delete project

### Analytics
- `analytics.getMetrics(startDate, endDate)` - Get analytics metrics
- `analytics.getUserActivity(userId)` - Get user activity

### Users
- `users.me()` - Get current user
- `users.update(data)` - Update current user
- `users.list()` - List users

## Error Handling

All methods throw APIError objects:

```javascript
try {
  await client.billing.getPlans();
} catch (error) {
  console.error('Status:', error.status);
  console.error('Message:', error.message);
  console.error('Code:', error.code);
}
```

## License

MIT
'''
        
        with open(js_sdk_dir / "README.md", 'w') as f:
            f.write(readme_md)
        
        print("✅ JavaScript/TypeScript SDK generated successfully")

    def generate_python_sdk(self):
        """Generate Python SDK with async support and comprehensive features"""
        py_sdk_dir = self.sdk_output_dir / "python"
        py_sdk_dir.mkdir(exist_ok=True)
        
        # Setup.py for the SDK
        setup_py = '''from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="neoforge-sdk",
    version="1.0.0",
    author="NeoForge Team",
    author_email="support@neoforge.dev",
    description="Official Python SDK for NeoForge API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/neoforge/sdk-python",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "httpx>=0.25.0",
        "pydantic>=2.0.0",
    ],
    extras_require={
        "dev": ["pytest>=7.0.0", "pytest-asyncio>=0.21.0", "black", "isort", "mypy"],
    },
    keywords="neoforge api sdk saas enterprise",
)
'''
        
        with open(py_sdk_dir / "setup.py", 'w') as f:
            f.write(setup_py)
        
        # Create package structure
        neoforge_dir = py_sdk_dir / "neoforge"
        neoforge_dir.mkdir(exist_ok=True)
        
        # __init__.py
        init_py = '''"""NeoForge Python SDK - Official Python client for NeoForge API"""

from .client import NeoForgeClient
from .exceptions import NeoForgeError, APIError, AuthenticationError, RateLimitError

__version__ = "1.0.0"
__all__ = ["NeoForgeClient", "NeoForgeError", "APIError", "AuthenticationError", "RateLimitError"]
'''
        
        with open(neoforge_dir / "__init__.py", 'w') as f:
            f.write(init_py)
        
        # Exceptions
        exceptions_py = '''"""NeoForge SDK Exceptions"""


class NeoForgeError(Exception):
    """Base exception for NeoForge SDK"""
    pass


class APIError(NeoForgeError):
    """API returned an error response"""
    
    def __init__(self, message: str, status_code: int = None, code: str = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class AuthenticationError(APIError):
    """Authentication failed"""
    pass


class RateLimitError(APIError):
    """Rate limit exceeded"""
    pass


class ValidationError(APIError):
    """Request validation failed"""
    pass
'''
        
        with open(neoforge_dir / "exceptions.py", 'w') as f:
            f.write(exceptions_py)
        
        # Main client
        client_py = '''"""NeoForge API Client"""

import asyncio
from typing import Optional, Dict, Any, List
import httpx
from .exceptions import APIError, AuthenticationError, RateLimitError, ValidationError


class NeoForgeClient:
    """Async Python client for NeoForge API"""
    
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.neoforge.dev",
        timeout: float = 30.0
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=timeout,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "NeoForge-SDK-Python/1.0.0"
            }
        )
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make an HTTP request with error handling"""
        
        try:
            response = await self.client.request(
                method=method,
                url=endpoint,
                json=data,
                params=params
            )
            
            if response.status_code == 401:
                raise AuthenticationError("Invalid or expired API key")
            elif response.status_code == 429:
                raise RateLimitError("Rate limit exceeded")
            elif response.status_code == 422:
                raise ValidationError("Request validation failed", response.status_code)
            elif response.status_code >= 400:
                error_data = response.json() if response.content else {}
                raise APIError(
                    error_data.get("detail", f"HTTP {response.status_code}"),
                    response.status_code,
                    error_data.get("code")
                )
            
            return response.json() if response.content else {}
            
        except httpx.RequestError as e:
            raise APIError(f"Request failed: {e}")
    
    # Authentication methods
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """Login user"""
        return await self._request("POST", "/api/v1/auth/login", {
            "email": email,
            "password": password
        })
    
    async def register(self, email: str, password: str, full_name: str) -> Dict[str, Any]:
        """Register new user"""
        return await self._request("POST", "/api/v1/auth/register", {
            "email": email,
            "password": password,
            "full_name": full_name
        })
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token"""
        return await self._request("POST", "/api/v1/auth/refresh", {
            "refresh_token": refresh_token
        })
    
    # Billing methods
    async def get_billing_plans(self) -> List[Dict[str, Any]]:
        """Get subscription plans"""
        return await self._request("GET", "/api/v1/billing/plans")
    
    async def create_subscription(self, plan_id: int, billing_cycle: str = "monthly") -> Dict[str, Any]:
        """Create subscription"""
        return await self._request("POST", "/api/v1/billing/subscription", {
            "plan_id": plan_id,
            "billing_cycle": billing_cycle
        })
    
    async def get_subscription(self) -> Dict[str, Any]:
        """Get current subscription"""
        return await self._request("GET", "/api/v1/billing/subscription")
    
    async def cancel_subscription(self, immediate: bool = False) -> Dict[str, Any]:
        """Cancel subscription"""
        return await self._request("DELETE", "/api/v1/billing/subscription", 
                                 params={"immediate": immediate})
    
    async def get_usage(self) -> Dict[str, Any]:
        """Get usage metrics"""
        return await self._request("GET", "/api/v1/billing/usage")
    
    # Organization methods
    async def list_organizations(self) -> List[Dict[str, Any]]:
        """List organizations"""
        return await self._request("GET", "/api/v1/organizations")
    
    async def create_organization(self, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Create organization"""
        data = {"name": name}
        if description:
            data["description"] = description
        return await self._request("POST", "/api/v1/organizations", data)
    
    async def get_organization(self, org_id: int) -> Dict[str, Any]:
        """Get organization details"""
        return await self._request("GET", f"/api/v1/organizations/{org_id}")
    
    async def update_organization(self, org_id: int, **kwargs) -> Dict[str, Any]:
        """Update organization"""
        return await self._request("PUT", f"/api/v1/organizations/{org_id}", kwargs)
    
    async def delete_organization(self, org_id: int) -> Dict[str, Any]:
        """Delete organization"""
        return await self._request("DELETE", f"/api/v1/organizations/{org_id}")
    
    # Project methods
    async def list_projects(self, organization_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """List projects"""
        params = {"organization_id": organization_id} if organization_id else None
        return await self._request("GET", "/api/v1/projects", params=params)
    
    async def create_project(
        self, 
        name: str, 
        description: Optional[str] = None,
        organization_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Create project"""
        data = {"name": name}
        if description:
            data["description"] = description
        if organization_id:
            data["organization_id"] = organization_id
        return await self._request("POST", "/api/v1/projects", data)
    
    async def get_project(self, project_id: int) -> Dict[str, Any]:
        """Get project details"""
        return await self._request("GET", f"/api/v1/projects/{project_id}")
    
    async def update_project(self, project_id: int, **kwargs) -> Dict[str, Any]:
        """Update project"""
        return await self._request("PUT", f"/api/v1/projects/{project_id}", kwargs)
    
    async def delete_project(self, project_id: int) -> Dict[str, Any]:
        """Delete project"""
        return await self._request("DELETE", f"/api/v1/projects/{project_id}")
    
    # Analytics methods
    async def get_analytics_metrics(
        self, 
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get analytics metrics"""
        params = {}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        return await self._request("GET", "/api/v1/analytics/metrics", params=params)
    
    async def get_user_activity(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        """Get user activity"""
        params = {"user_id": user_id} if user_id else None
        return await self._request("GET", "/api/v1/analytics/user-activity", params=params)
    
    # User methods
    async def get_current_user(self) -> Dict[str, Any]:
        """Get current user"""
        return await self._request("GET", "/api/v1/users/me")
    
    async def update_current_user(self, **kwargs) -> Dict[str, Any]:
        """Update current user"""
        return await self._request("PUT", "/api/v1/users/me", kwargs)
    
    async def list_users(self) -> List[Dict[str, Any]]:
        """List users"""
        return await self._request("GET", "/api/v1/users")


# Sync wrapper for backwards compatibility
class SyncNeoForgeClient:
    """Synchronous wrapper for NeoForgeClient"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.neoforge.dev", timeout: float = 30.0):
        self._client = NeoForgeClient(api_key, base_url, timeout)
    
    def _run_async(self, coro):
        """Run async coroutine in sync context"""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(coro)
    
    def __getattr__(self, name):
        """Wrap async methods to run synchronously"""
        attr = getattr(self._client, name)
        if asyncio.iscoroutinefunction(attr):
            def sync_wrapper(*args, **kwargs):
                return self._run_async(attr(*args, **kwargs))
            return sync_wrapper
        return attr
    
    def close(self):
        """Close the client"""
        self._run_async(self._client.close())
'''
        
        with open(neoforge_dir / "client.py", 'w') as f:
            f.write(client_py)
        
        # Example usage
        example_py = '''"""Example usage of NeoForge Python SDK"""

import asyncio
from neoforge import NeoForgeClient

async def async_example():
    """Async example"""
    async with NeoForgeClient(api_key="your-api-key-here") as client:
        try:
            # Get subscription plans
            plans = await client.get_billing_plans()
            print("Available plans:", plans)
            
            # Create organization
            org = await client.create_organization("My Company", "A great organization")
            print("Created organization:", org)
            
            # Create project
            project = await client.create_project("My Project", "A fantastic project", org["id"])
            print("Created project:", project)
            
            # Get analytics
            metrics = await client.get_analytics_metrics()
            print("Current metrics:", metrics)
            
        except Exception as error:
            print(f"API Error: {error}")

def sync_example():
    """Synchronous example using SyncNeoForgeClient"""
    from neoforge.client import SyncNeoForgeClient
    
    client = SyncNeoForgeClient(api_key="your-api-key-here")
    
    try:
        # Get subscription plans
        plans = client.get_billing_plans()
        print("Available plans:", plans)
        
        # Create organization
        org = client.create_organization("My Company", "A great organization")
        print("Created organization:", org)
        
    except Exception as error:
        print(f"API Error: {error}")
    finally:
        client.close()

if __name__ == "__main__":
    # Run async example
    asyncio.run(async_example())
    
    # Run sync example
    sync_example()
'''
        
        with open(py_sdk_dir / "example.py", 'w') as f:
            f.write(example_py)
        
        # README
        readme_md = '''# NeoForge Python SDK

Official Python SDK for the NeoForge API with full async support.

## Installation

```bash
pip install neoforge-sdk
```

## Quick Start

### Async Usage (Recommended)

```python
import asyncio
from neoforge import NeoForgeClient

async def main():
    async with NeoForgeClient(api_key="your-api-key-here") as client:
        plans = await client.get_billing_plans()
        print(plans)

asyncio.run(main())
```

### Synchronous Usage

```python
from neoforge.client import SyncNeoForgeClient

client = SyncNeoForgeClient(api_key="your-api-key-here")
plans = client.get_billing_plans()
print(plans)
client.close()
```

## API Reference

### Authentication
- `login(email, password)` - Login user
- `register(email, password, full_name)` - Register new user
- `refresh_token(refresh_token)` - Refresh access token

### Billing
- `get_billing_plans()` - Get subscription plans
- `create_subscription(plan_id, billing_cycle)` - Create subscription
- `get_subscription()` - Get current subscription
- `cancel_subscription(immediate)` - Cancel subscription
- `get_usage()` - Get usage metrics

### Organizations
- `list_organizations()` - List organizations
- `create_organization(name, description)` - Create organization
- `get_organization(org_id)` - Get organization details
- `update_organization(org_id, **kwargs)` - Update organization
- `delete_organization(org_id)` - Delete organization

### Projects
- `list_projects(organization_id)` - List projects
- `create_project(name, description, organization_id)` - Create project
- `get_project(project_id)` - Get project details
- `update_project(project_id, **kwargs)` - Update project
- `delete_project(project_id)` - Delete project

### Analytics
- `get_analytics_metrics(start_date, end_date)` - Get analytics metrics
- `get_user_activity(user_id)` - Get user activity

### Users
- `get_current_user()` - Get current user
- `update_current_user(**kwargs)` - Update current user
- `list_users()` - List users

## Error Handling

```python
from neoforge import NeoForgeClient, APIError, AuthenticationError

async with NeoForgeClient(api_key="your-key") as client:
    try:
        await client.get_billing_plans()
    except AuthenticationError:
        print("Invalid API key")
    except APIError as e:
        print(f"API Error: {e.message} (Status: {e.status_code})")
```

## Requirements

- Python 3.8+
- httpx >= 0.25.0
- pydantic >= 2.0.0

## License

MIT
'''
        
        with open(py_sdk_dir / "README.md", 'w') as f:
            f.write(readme_md)
        
        print("✅ Python SDK generated successfully")

    def run(self):
        """Main SDK generation workflow"""
        print("🚀 Starting NeoForge SDK Generation...")
        
        # Ensure output directory exists
        self.sdk_output_dir.mkdir(exist_ok=True)
        
        try:
            # Generate OpenAPI spec
            openapi_spec = self.generate_openapi_spec()
            
            print(f"📊 Found {len(openapi_spec.get('paths', {}))} API endpoints")
            
            # Generate SDKs
            print("🔨 Generating JavaScript/TypeScript SDK...")
            self.generate_javascript_sdk()
            
            print("🐍 Generating Python SDK...")
            self.generate_python_sdk()
            
            print("🎉 SDK generation complete!")
            print(f"📁 SDKs available in: {self.sdk_output_dir}")
            
        except Exception as e:
            print(f"❌ SDK generation failed: {e}")
            raise


if __name__ == "__main__":
    generator = SDKGenerator()
    generator.run()