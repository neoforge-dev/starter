"""Password policy and validation utilities."""
import re
from typing import List, Tuple
from app.core.config import Settings, get_settings


class PasswordValidator:
    """Password validation based on security policy."""
    
    def __init__(self, settings: Settings = None):
        """Initialize password validator with settings."""
        self.settings = settings or get_settings()
    
    def validate_password(self, password: str) -> Tuple[bool, List[str]]:
        """
        Validate password against security policy.
        
        Args:
            password: Password to validate
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Check minimum length
        if len(password) < self.settings.password_min_length:
            errors.append(f"Password must be at least {self.settings.password_min_length} characters long")
        
        # Check for uppercase letters
        if self.settings.password_require_uppercase and not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        # Check for lowercase letters
        if self.settings.password_require_lowercase and not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        # Check for numbers
        if self.settings.password_require_numbers and not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        
        # Check for special characters
        if self.settings.password_require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)")
        
        # Check for common weak patterns
        weak_patterns = [
            (r'^(.)\1{2,}', "Password cannot be composed of repeating characters"),
            (r'123', "Password cannot contain sequential numbers"),
            (r'abc', "Password cannot contain sequential letters"),
            (r'password', "Password cannot contain the word 'password'"),
            (r'admin', "Password cannot contain the word 'admin'"),
            (r'user', "Password cannot contain the word 'user'"),
        ]
        
        for pattern, message in weak_patterns:
            if re.search(pattern, password.lower()):
                errors.append(message)
        
        # Check for common dictionary words (basic check)
        common_words = [
            'password', 'admin', 'user', 'login', 'welcome', 'hello',
            'qwerty', 'asdf', 'zxcv', 'test', 'demo', 'sample'
        ]
        
        for word in common_words:
            if word in password.lower():
                errors.append(f"Password cannot contain common word: {word}")
        
        return len(errors) == 0, errors
    
    def get_password_requirements(self) -> dict:
        """Get password requirements for display to users."""
        requirements = {
            "min_length": self.settings.password_min_length,
            "require_uppercase": self.settings.password_require_uppercase,
            "require_lowercase": self.settings.password_require_lowercase,
            "require_numbers": self.settings.password_require_numbers,
            "require_special": self.settings.password_require_special,
            "special_characters": "!@#$%^&*(),.?\":{}|<>",
            "forbidden_words": ["password", "admin", "user", "login", "welcome"],
            "forbidden_patterns": ["sequential numbers", "sequential letters", "repeating characters"]
        }
        return requirements
    
    def generate_password_strength_score(self, password: str) -> Tuple[int, str]:
        """
        Generate password strength score from 0-100.
        
        Args:
            password: Password to score
            
        Returns:
            Tuple of (score, strength_level)
        """
        score = 0
        
        # Length scoring (up to 25 points)
        if len(password) >= 8:
            score += 10
        if len(password) >= 12:
            score += 10
        if len(password) >= 16:
            score += 5
        
        # Character variety scoring (up to 40 points)
        if re.search(r'[a-z]', password):
            score += 10
        if re.search(r'[A-Z]', password):
            score += 10
        if re.search(r'\d', password):
            score += 10
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            score += 10
        
        # Complexity scoring (up to 35 points)
        unique_chars = len(set(password))
        if unique_chars >= 8:
            score += 15
        elif unique_chars >= 6:
            score += 10
        elif unique_chars >= 4:
            score += 5
        
        # No common patterns (up to 20 points)
        has_no_repeating = not re.search(r'(.)\1{2,}', password)
        has_no_sequential = not (re.search(r'123|abc', password.lower()))
        has_no_common_words = not any(word in password.lower() for word in ['password', 'admin', 'user'])
        
        if has_no_repeating:
            score += 7
        if has_no_sequential:
            score += 7
        if has_no_common_words:
            score += 6
        
        # Determine strength level
        if score >= 80:
            level = "Very Strong"
        elif score >= 60:
            level = "Strong"
        elif score >= 40:
            level = "Moderate"
        elif score >= 20:
            level = "Weak"
        else:
            level = "Very Weak"
        
        return min(score, 100), level


# Global password validator instance
password_validator = PasswordValidator()


def validate_password_strength(password: str) -> Tuple[bool, List[str], int, str]:
    """
    Comprehensive password validation with strength scoring.
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, errors, strength_score, strength_level)
    """
    validator = password_validator
    
    # Check policy compliance
    is_valid, errors = validator.validate_password(password)
    
    # Get strength score
    strength_score, strength_level = validator.generate_password_strength_score(password)
    
    return is_valid, errors, strength_score, strength_level