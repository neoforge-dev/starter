"""Example usage of NeoForge Python SDK"""

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
