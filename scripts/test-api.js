/**
 * Test API Script
 * 
 * This script tests the API endpoints of the NIST 800-53 OSCAL server.
 */

import fetch from 'node-fetch';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const LOG_REQUESTS = process.env.LOG_REQUESTS === 'true';

/**
 * Simple API client for testing
 */
const apiClient = {
  async get(endpoint) {
    const url = `${API_URL}${endpoint}`;
    if (LOG_REQUESTS) console.log(`GET ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      status: response.status,
      data
    };
  },
  
  async post(endpoint, body) {
    const url = `${API_URL}${endpoint}`;
    if (LOG_REQUESTS) console.log(`POST ${url}`, body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      data
    };
  }
};

/**
 * Run the tests
 */
const runTests = async () => {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  /**
   * Helper function to run a test
   */
  const runTest = async (name, testFn) => {
    try {
      console.log(`\n🧪 Running test: ${name}`);
      await testFn();
      console.log(`✅ Test passed: ${name}`);
      results.passed++;
      results.tests.push({ name, success: true });
    } catch (error) {
      console.error(`❌ Test failed: ${name}`);
      console.error(`   Error: ${error.message}`);
      results.failed++;
      results.tests.push({ name, success: false, error: error.message });
    }
  };
  
  // Test health endpoint
  await runTest('Health check', async () => {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (data.status !== 'ok') {
      throw new Error(`Expected status 'ok', got ${data.status}`);
    }
  });
  
  // Test control families
  await runTest('Get control families', async () => {
    const { status, data } = await apiClient.get('/controls/families');
    
    if (status !== 200) {
      throw new Error(`Expected status 200, got ${status}`);
    }
    
    if (!Array.isArray(data)) {
      throw new Error('Expected array of control families');
    }
    
    // Check for some expected families
    const expectedFamilies = ['AC', 'SI'];
    for (const family of expectedFamilies) {
      const found = data.some(f => f.id === family);
      if (!found) {
        throw new Error(`Expected to find family ${family}`);
      }
    }
  });
  
  // Test get control
  await runTest('Get specific control', async () => {
    const { status, data } = await apiClient.get('/controls/AC-1');
    
    if (status !== 200) {
      throw new Error(`Expected status 200, got ${status}`);
    }
    
    if (data.id !== 'AC-1') {
      throw new Error(`Expected control ID AC-1, got ${data.id}`);
    }
  });
  
  // Test search controls
  await runTest('Search controls', async () => {
    const { status, data } = await apiClient.get('/controls?family=AC');
    
    if (status !== 200) {
      throw new Error(`Expected status 200, got ${status}`);
    }
    
    if (!Array.isArray(data)) {
      throw new Error('Expected array of controls');
    }
    
    // Check all returned controls are from the AC family
    for (const control of data) {
      if (control.family !== 'AC') {
        throw new Error(`Expected control from AC family, got ${control.family}`);
      }
    }
  });
  
  // Test list SSPs
  await runTest('List SSPs', async () => {
    const { status, data } = await apiClient.get('/ssps');
    
    if (status !== 200) {
      throw new Error(`Expected status 200, got ${status}`);
    }
    
    if (!Array.isArray(data)) {
      throw new Error('Expected array of SSPs');
    }
  });
  
  // Test get specific SSP
  await runTest('Get specific SSP', async () => {
    const { status, data } = await apiClient.get('/ssps/sample-ssp');
    
    if (status !== 200) {
      throw new Error(`Expected status 200, got ${status}`);
    }
    
    if (data.id !== 'sample-ssp') {
      throw new Error(`Expected SSP ID sample-ssp, got ${data.id}`);
    }
  });
  
  // Test create SSP
  await runTest('Create SSP', async () => {
    const sspData = {
      title: 'Test SSP',
      description: 'This is a test SSP created by the API test script',
      securityLevel: 'MODERATE',
      systemId: 'test-ssp-' + Date.now()
    };
    
    const { status, data } = await apiClient.post('/ssps', sspData);
    
    if (status !== 201) {
      throw new Error(`Expected status 201, got ${status}`);
    }
    
    if (data.metadata.title !== sspData.title) {
      throw new Error(`Expected SSP title ${sspData.title}, got ${data.metadata.title}`);
    }
    
    if (data.systemCharacteristics.securityImpactLevel !== sspData.securityLevel) {
      throw new Error(`Expected security level ${sspData.securityLevel}, got ${data.systemCharacteristics.securityImpactLevel}`);
    }
    
    console.log(`   Created SSP with ID: ${data.id}`);
    
    // Test get the newly created SSP
    const { status: getStatus, data: getSSP } = await apiClient.get(`/ssps/${data.id}`);
    
    if (getStatus !== 200) {
      throw new Error(`Expected status 200, got ${getStatus}`);
    }
    
    if (getSSP.id !== data.id) {
      throw new Error(`Expected SSP ID ${data.id}, got ${getSSP.id}`);
    }
  });
  
  // Test add control implementation
  await runTest('Add control implementation', async () => {
    const implementationData = {
      controlId: 'AC-1',
      implementationStatus: 'IMPLEMENTED',
      description: 'Test implementation added by API test script',
      responsibleRoles: ['test-team']
    };
    
    const { status, data } = await apiClient.post('/ssps/sample-ssp/implementations', implementationData);
    
    if (status !== 201) {
      throw new Error(`Expected status 201, got ${status}`);
    }
    
    if (data.controlId !== implementationData.controlId) {
      throw new Error(`Expected control ID ${implementationData.controlId}, got ${data.controlId}`);
    }
    
    if (data.status !== implementationData.implementationStatus) {
      throw new Error(`Expected status ${implementationData.implementationStatus}, got ${data.status}`);
    }
  });
  
  // Test validate SSP
  await runTest('Validate SSP', async () => {
    const { status, data } = await apiClient.get('/ssps/sample-ssp/validate');
    
    if (status !== 200) {
      throw new Error(`Expected status 200, got ${status}`);
    }
    
    // Check validation properties
    if (typeof data.implementationPercentage !== 'number') {
      throw new Error('Expected implementationPercentage to be a number');
    }
    
    if (data.totalControls === undefined) {
      throw new Error('Expected totalControls property');
    }
  });
  
  // Print test results summary
  console.log('\n📊 Test Results Summary:');
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Total: ${results.passed + results.failed}`);
  
  if (results.failed > 0) {
    console.error('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
};

// Run the tests
console.log('📋 Starting API Tests...');
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});