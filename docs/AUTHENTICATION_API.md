# Authentication API Reference

This document provides comprehensive documentation for the NeoForge authentication endpoints.

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication Endpoints

### 1. User Registration
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "refresh_token": "refresh_token_here"
}
```

**Error Responses:**
- `400`: Email already registered
- `422`: Validation error
- `500`: Registration failed

### 2. User Login (OAuth2 Form)
**POST** `/auth/token`

OAuth2 compatible token login using form data.

**Request (Form Data):**
```
username: user@example.com
password: securepassword123
grant_type: password
```

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "refresh_token": "refresh_token_here"
}
```

### 3. User Login (JSON)
**POST** `/auth/login`

JSON-based login for frontend compatibility.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):** Same as OAuth2 token response.

### 4. Token Refresh
**POST** `/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "your_refresh_token_here"
}
```

**Response (200):**
```json
{
  "access_token": "new_access_token_here",
  "token_type": "bearer",
  "refresh_token": "new_refresh_token_here"
}
```

### 5. Get Current User Profile
**GET** `/auth/me`

Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### 6. Validate Token
**POST** `/auth/validate`

Validate current access token.

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Response (200):**
```json
{
  "valid": true,
  "user_id": 1,
  "email": "user@example.com"
}
```

### 7. List User Sessions
**GET** `/auth/sessions`

Get all active sessions for current user.

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "user_agent": "Mozilla/5.0...",
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-01T00:00:00",
      "expires_at": "2024-01-08T00:00:00",
      "revoked_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10,
  "pages": 1
}
```

### 8. Revoke Specific Session
**POST** `/auth/sessions/{session_id}/revoke`

Revoke a specific user session.

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Response (200):**
```json
{
  "id": 1,
  "user_agent": "Mozilla/5.0...",
  "ip_address": "192.168.1.1",
  "created_at": "2024-01-01T00:00:00",
  "expires_at": "2024-01-08T00:00:00",
  "revoked_at": "2024-01-01T12:00:00"
}
```

### 9. Revoke Other Sessions
**POST** `/auth/sessions/revoke-others`

Revoke all sessions except the current one.

**Request Body:**
```json
{
  "keep_session_id": 1
}
```

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Response (200):**
```json
{
  "revoked_count": 3
}
```

### 10. Logout
**POST** `/auth/logout`

Logout from current session.

**Request Body:**
```json
{
  "refresh_token": "your_refresh_token_here"
}
```

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

### 11. Logout All Sessions
**POST** `/auth/logout-all`

Logout from all sessions.

**Headers:**
```
Authorization: Bearer your_access_token_here
```

**Response (200):**
```json
{
  "message": "Successfully logged out from all sessions",
  "revoked_tokens": 5
}
```

### 12. Password Reset Request
**POST** `/auth/reset-password-request`

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email address is registered, you will receive a password reset link shortly."
}
```

### 13. Password Reset Confirm
**POST** `/auth/reset-password-confirm`

Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "new_password": "new_secure_password123"
}
```

**Response (200):**
```json
{
  "message": "Password has been successfully reset. You can now log in with your new password."
}
```

### 14. Email Verification
**POST** `/auth/verify-email`

Verify email address using verification token.

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

**Response (200):**
```json
{
  "message": "Email address has been successfully verified. Welcome to our platform!"
}
```

### 15. Resend Verification Email
**POST** `/auth/resend-verification`

Resend email verification link.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email address is registered and not yet verified, you will receive a verification link shortly."
}
```

## Authentication Flow

### Registration Flow
1. **POST** `/auth/register` - Register new account
2. **Check email** - User receives welcome email with verification link
3. **POST** `/auth/verify-email` - Verify email address
4. **POST** `/auth/login` - Login with credentials

### Login Flow
1. **POST** `/auth/login` - Authenticate user
2. **Receive tokens** - Access token (short-lived) + Refresh token (long-lived)
3. **Use access token** - Include in Authorization header for API calls
4. **POST** `/auth/refresh` - Refresh tokens when access token expires

### Password Reset Flow
1. **POST** `/auth/reset-password-request` - Request reset email
2. **Check email** - User receives password reset link
3. **POST** `/auth/reset-password-confirm` - Reset password with token

## Security Features

- **JWT Tokens**: Access tokens with configurable expiration
- **Refresh Tokens**: Secure token rotation for session management
- **Session Management**: Track and revoke user sessions
- **Rate Limiting**: Protection against brute force attacks
- **Audit Logging**: All authentication events are logged
- **Password Security**: Strong password requirements and hashing
- **Email Verification**: Account verification via email
- **Token Blacklisting**: Revoked tokens are invalidated

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Invalid or missing credentials
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Unprocessable Entity - Validation errors
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side errors

## Frontend Integration

### API Client Setup
```javascript
// frontend/src/services/api-client.js
class ApiClient {
  constructor() {
    this.baseURL = 'http://localhost:8000/api/v1';
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.accessToken) {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async handleResponse(response) {
    if (response.ok) {
      return await response.json();
    }

    if (response.status === 401) {
      // Try to refresh token
      await this.refreshAccessToken();
      // Retry the original request
      return this.request(response.url, response.config);
    }

    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        localStorage.setItem('access_token', this.accessToken);
        localStorage.setItem('refresh_token', this.refreshToken);
      } else {
        // Refresh failed, redirect to login
        this.logout();
      }
    } catch (error) {
      this.logout();
    }
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Redirect to login page
  }
}

export default new ApiClient();
```

### Usage Examples
```javascript
// Login
const loginResponse = await apiClient.request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

// Get user profile
const userProfile = await apiClient.request('/auth/me');

// Refresh token (handled automatically by ApiClient)
await apiClient.refreshAccessToken();
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Login attempts**: 5 per minute per IP
- **Password reset requests**: 3 per 5 minutes per user
- **Email verification resend**: 3 per 5 minutes per user
- **Token refresh**: 10 per minute per user

Rate limits are enforced using Redis and return `429 Too Many Requests` status.