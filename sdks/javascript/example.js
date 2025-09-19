const { NeoForgeClient } = require('@neoforge/sdk');

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
