"""
NeoForge Backend API.

A modern, cost-efficient starter kit for bootstrapped founders.
"""

from app.bootstrap.factory import factory

# Create the FastAPI application using the factory
app = factory.create_application()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
