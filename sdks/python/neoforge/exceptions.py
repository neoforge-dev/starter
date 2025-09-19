"""NeoForge SDK Exceptions"""


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
