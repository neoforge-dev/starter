from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    # ... existing settings ...
    jwt_secret: str = Field(
        default="development-secret",  # Default for development
        env="JWT_SECRET",
        description="Secret key for JWT token encoding/decoding"
    )
    jwt_algorithm: str = Field(
        default="HS256",
        env="JWT_ALGORITHM",
        description="Algorithm used for JWT tokens"
    )
    # ... rest of settings ... 