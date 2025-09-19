"""NeoForge API Client"""

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
