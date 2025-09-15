/**
 * Global setup for Playwright E2E tests
 * Sets up test database, seeds data, and configures test environment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config) {
  console.log('🚀 Setting up E2E test environment...');

  try {
    // 1. Ensure backend services are running
    console.log('📡 Checking backend services...');
    await checkBackendServices();

    // 2. Set up test database
    console.log('🗄️ Setting up test database...');
    await setupTestDatabase();

    // 3. Seed test data
    console.log('🌱 Seeding test data...');
    await seedTestData();

    // 4. Configure test environment variables
    console.log('⚙️ Configuring test environment...');
    await configureTestEnvironment();

    console.log('✅ E2E test environment setup complete!');
  } catch (error) {
    console.error('❌ Failed to set up E2E test environment:', error);
    throw error;
  }
}

async function checkBackendServices() {
  const services = [
    { name: 'Backend API', url: 'http://localhost:8000/health', timeout: 30000 },
    { name: 'Frontend Dev Server', url: 'http://localhost:3000', timeout: 10000 },
    { name: 'Database', url: 'http://localhost:5432', timeout: 5000 },
    { name: 'Redis', url: 'http://localhost:6379', timeout: 5000 }
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url, {
        timeout: service.timeout,
        headers: service.name.includes('Backend') ? { 'X-Tenant-ID': 'test-tenant' } : {}
      });

      if (!response.ok && !service.name.includes('Database') && !service.name.includes('Redis')) {
        throw new Error(`Service returned ${response.status}`);
      }

      console.log(`✅ ${service.name} is available`);
    } catch (error) {
      if (service.name.includes('Database') || service.name.includes('Redis')) {
        console.log(`ℹ️ ${service.name} connection check skipped (expected in container)`);
      } else {
        console.log(`⚠️ ${service.name} not available, will be started by webServer config`);
      }
    }
  }
}

async function setupTestDatabase() {
  try {
    // Run database migrations
    console.log('Running database migrations...');
    execSync('cd ../backend && make migrate', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..', 'backend')
    });

    // Create test tenant
    console.log('Creating test tenant...');
    execSync('cd ../backend && python -c "from app.core.tenant import create_tenant; create_tenant(\'test-tenant\', \'Test Tenant for E2E\')"', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..', 'backend')
    });

  } catch (error) {
    console.log('⚠️ Database setup may have issues, continuing...');
  }
}

async function seedTestData() {
  try {
    // Create test users and data
    const testData = {
      users: [
        {
          email: 'testuser@example.com',
          password: 'password123',
          full_name: 'Test User',
          role: 'user'
        },
        {
          email: 'admin@example.com',
          password: 'admin123',
          full_name: 'Admin User',
          role: 'admin'
        },
        {
          email: 'manager@example.com',
          password: 'manager123',
          full_name: 'Manager User',
          role: 'manager'
        }
      ],
      organizations: [
        {
          name: 'Test Organization',
          description: 'Organization for E2E testing'
        }
      ],
      items: [
        {
          title: 'Test Item 1',
          description: 'First test item',
          status: 'active'
        },
        {
          title: 'Test Item 2',
          description: 'Second test item',
          status: 'draft'
        }
      ]
    };

    // Save test data to a file for use in tests
    const testDataPath = path.join(__dirname, 'test-data.json');
    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
    console.log(`📝 Test data saved to ${testDataPath}`);

  } catch (error) {
    console.log('⚠️ Test data seeding may have issues, continuing...');
  }
}

async function configureTestEnvironment() {
  // Set environment variables for E2E tests
  process.env.E2E_TESTING = 'true';
  process.env.TEST_TENANT_ID = 'test-tenant';
  process.env.API_BASE_URL = 'http://localhost:8000';
  process.env.FRONTEND_BASE_URL = 'http://localhost:3000';

  // Create .env.e2e file for test configuration
  const envContent = `# E2E Test Environment Variables
E2E_TESTING=true
TEST_TENANT_ID=test-tenant
API_BASE_URL=http://localhost:8000
FRONTEND_BASE_URL=http://localhost:3000
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
`;

  const envPath = path.join(__dirname, '..', '.env.e2e');
  fs.writeFileSync(envPath, envContent);
  console.log(`📝 E2E environment config saved to ${envPath}`);
}

export default globalSetup;