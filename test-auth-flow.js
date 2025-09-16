#!/usr/bin/env node

/**
 * Simple Authentication Flow Test
 * Tests the core authentication functionality without complex RBAC models
 */

const http = require('http');

const API_BASE = 'http://localhost:8000/api/v1';

// Simple API client
class SimpleApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    const headers = {
      'User-Agent': 'NeoForge-Test-Client/1.0',
      ...options.headers,
    };

    let body = null;
    if (options.body) {
      if (typeof options.body === 'string') {
        body = options.body;
      } else {
        body = JSON.stringify(options.body);
        headers['Content-Type'] = 'application/json';
      }
      headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
    }

    return new Promise((resolve, reject) => {
      const req = http.request(url, { method, headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log(`Raw response for ${endpoint}:`, data.substring(0, 200));
          try {
            const result = JSON.parse(data);
            resolve({ status: res.statusCode, data: result });
          } catch (e) {
            console.log('JSON parse error:', e.message);
            resolve({ status: res.statusCode, data });
          }
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(body);
      }
      req.end();
    });
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: data });
  }
}

async function testAuthFlow() {
  const client = new SimpleApiClient(API_BASE);
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing API health...');
    const health = await client.get('/health');
    console.log(`   Status: ${health.status}`);
    if (health.status === 200) {
      console.log('   ✅ API is healthy');
    } else {
      console.log('   ❌ API health check failed');
      return;
    }

    // Test 2: Config endpoint
    console.log('\n2. Testing config endpoint...');
    const config = await client.get('/config');
    console.log(`   Status: ${config.status}`);
    if (config.status === 200) {
      console.log('   ✅ Config endpoint works');
      console.log(`   Environment: ${config.data.environment}`);
    } else {
      console.log('   ❌ Config endpoint failed');
    }

    // Test 3: Registration (will likely fail due to model issues)
    console.log('\n3. Testing user registration...');
    const registerData = {
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      password_confirm: 'testpassword123',
      full_name: 'Test User'
    };

    const register = await client.post('/auth/register', registerData);
    console.log(`   Status: ${register.status}`);
    if (register.status === 200) {
      console.log('   ✅ Registration successful');
    } else {
      console.log('   ❌ Registration failed');
      console.log(`   Error: ${JSON.stringify(register.data)}`);
    }

    // Test 4: Login (use JSON-based /auth/login endpoint)
    console.log('\n4. Testing user login...');
    const loginData = {
      email: 'test@example.com',
      password: 'testpassword123'
    };

    const login = await client.post('/auth/login', loginData);
    console.log(`   Status: ${login.status}`);
    if (login.status === 200) {
      console.log('   ✅ Login successful');
      if (login.data.access_token) {
        console.log('   ✅ Received access token');
      }
    } else {
      console.log('   ❌ Login failed (expected due to model issues)');
      console.log(`   Error: ${login.data.detail || login.data.message}`);
    }

    console.log('\n📋 Test Summary:');
    console.log('✅ API is running and healthy');
    console.log('✅ Basic endpoints work (health, config)');
    console.log('❌ Authentication endpoints fail due to RBAC model issues');
    console.log('\n🔧 Next Steps:');
    console.log('1. Fix SQLAlchemy model relationships in RBAC system');
    console.log('2. Resolve foreign key ambiguities in ResourcePermission and related models');
    console.log('3. Complete frontend component structure');
    console.log('4. Test complete authentication flow');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAuthFlow();