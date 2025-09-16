"""Money value object for domain layer."""

from __future__ import annotations

from decimal import Decimal
from typing import Self

from pydantic import BaseModel, field_validator


class Money(BaseModel):
    """Money value object with currency support."""

    amount: Decimal
    currency: str = "USD"

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        """Validate and convert amount to Decimal."""
        if isinstance(v, str):
            v = Decimal(v)
        elif isinstance(v, (int, float)):
            v = Decimal(str(v))  # Avoid floating point precision issues

        if v < 0:
            raise ValueError("Amount cannot be negative")

        # Round to 2 decimal places for currency
        return v.quantize(Decimal("0.01"))

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Validate currency code."""
        if not v or len(v) != 3:
            raise ValueError("Currency must be a 3-letter code")

        # Could add more comprehensive currency validation
        supported_currencies = {"USD", "EUR", "GBP", "CAD", "AUD"}
        if v.upper() not in supported_currencies:
            raise ValueError(f"Unsupported currency: {v}")

        return v.upper()

    @classmethod
    def create(cls, amount, currency: str = "USD"):
        """Factory method to create Money value object."""
        return cls(amount=amount, currency=currency)

    @classmethod
    def zero(cls, currency: str = "USD"):
        """Create zero amount money."""
        return cls(amount=Decimal("0.00"), currency=currency)

    def add(self, other):
        """Add two money amounts."""
        if self.currency != other.currency:
            raise ValueError("Cannot add money with different currencies")

        return Money(amount=self.amount + other.amount, currency=self.currency)

    def subtract(self, other):
        """Subtract money amounts."""
        if self.currency != other.currency:
            raise ValueError("Cannot subtract money with different currencies")

        result = self.amount - other.amount
        if result < 0:
            raise ValueError("Cannot subtract to negative amount")

        return Money(amount=result, currency=self.currency)

    def multiply(self, factor):
        """Multiply money by a factor."""
        factor_decimal = Decimal(str(factor))
        return Money(amount=self.amount * factor_decimal, currency=self.currency)

    def is_zero(self) -> bool:
        """Check if amount is zero."""
        return self.amount == 0

    def is_positive(self) -> bool:
        """Check if amount is positive."""
        return self.amount > 0

    def __str__(self) -> str:
        """String representation of money."""
        return f"{self.currency} {self.amount}"

    def __eq__(self, other: object) -> bool:
        """Equality comparison."""
        if not isinstance(other, Money):
            return NotImplemented
        return self.amount == other.amount and self.currency == other.currency

    def __lt__(self, other) -> bool:
        """Less than comparison."""
        if self.currency != other.currency:
            raise ValueError("Cannot compare money with different currencies")
        return self.amount < other.amount

    def __le__(self, other) -> bool:
        """Less than or equal comparison."""
        if self.currency != other.currency:
            raise ValueError("Cannot compare money with different currencies")
        return self.amount <= other.amount

    def __gt__(self, other) -> bool:
        """Greater than comparison."""
        if self.currency != other.currency:
            raise ValueError("Cannot compare money with different currencies")
        return self.amount > other.amount

    def __ge__(self, other) -> bool:
        """Greater than or equal comparison."""
        if self.currency != other.currency:
            raise ValueError("Cannot compare money with different currencies")
        return self.amount >= other.amount

    def __hash__(self) -> int:
        """Hash for use in sets and dictionaries."""
        return hash((self.amount, self.currency))