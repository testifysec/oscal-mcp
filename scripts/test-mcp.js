/**
 * Test MCP Server
 * 
 * This script tests the MCP server by sending requests and validating responses.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// MCP request counter
let requestId = 1;

/**
 * Create an MCP request object
 */
function createMcpRequest(method, params = {}) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id: requestId++
  };
}

/**
 * Run the MCP server process and send test requests
 */
async function runTests() {
  console.log('🧪 Starting MCP Server Tests');
  
  // 1. Start the MCP server
  const serverProcess = spawn('node', [path.join(PROJECT_ROOT, 'src/index.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Error handling
  serverProcess.on('error', (error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
  
  // Set up logging of server output
  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server stdout]: ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server stderr]: ${data.toString().trim()}`);
  });
  
  // Give the server a moment to start up
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 2. Send MCP requests and validate responses
  try {
    const tests = [
      // Test getControlFamilies
      async () => {
        console.log('\n🔍 Testing getControlFamilies');
        const request = createMcpRequest('getControlFamilies');
        const response = await sendRequest(serverProcess, request);
        validateResponse(response);
        
        if (!Array.isArray(response.result)) {
          throw new Error('Expected array result');
        }
        
        console.log(`   ✅ Got ${response.result.length} control families`);
        return true;
      },
      
      // Test getControl
      async () => {
        console.log('\n🔍 Testing getControl');
        const request = createMcpRequest('getControl', { controlId: 'AC-1' });
        const response = await sendRequest(serverProcess, request);
        validateResponse(response);
        
        if (response.result.id !== 'AC-1') {
          throw new Error(`Expected control ID AC-1, got ${response.result.id}`);
        }
        
        console.log(`   ✅ Got control ${response.result.id}: ${response.result.title}`);
        return true;
      },
      
      // Test searchControls
      async () => {
        console.log('\n🔍 Testing searchControls');
        const request = createMcpRequest('searchControls', { family: 'AC', limit: 10 });
        const response = await sendRequest(serverProcess, request);
        validateResponse(response);
        
        if (!Array.isArray(response.result)) {
          throw new Error('Expected array result');
        }
        
        console.log(`   ✅ Found ${response.result.length} controls in family AC`);
        return true;
      },
      
      // Test createSSP
      async () => {
        console.log('\n🔍 Testing createSSP');
        const request = createMcpRequest('createSSP', {
          title: 'Test SSP from MCP',
          description: 'This is a test SSP created via MCP',
          securityLevel: 'MODERATE'
        });
        
        const response = await sendRequest(serverProcess, request);
        validateResponse(response);
        
        if (!response.result.id) {
          throw new Error('Expected SSP ID in response');
        }
        
        if (response.result.metadata.title !== 'Test SSP from MCP') {
          throw new Error(`Expected title 'Test SSP from MCP', got '${response.result.metadata.title}'`);
        }
        
        console.log(`   ✅ Created SSP with ID ${response.result.id}`);
        
        // Save the SSP ID for the next test
        return response.result.id;
      },
      
      // Test getSSP
      async (sspId) => {
        console.log('\n🔍 Testing getSSP');
        const request = createMcpRequest('getSSP', { sspId });
        const response = await sendRequest(serverProcess, request);
        validateResponse(response);
        
        if (response.result.id !== sspId) {
          throw new Error(`Expected SSP ID ${sspId}, got ${response.result.id}`);
        }
        
        console.log(`   ✅ Retrieved SSP with ID ${response.result.id}`);
        return sspId;
      },
      
      // Test addControlImplementation
      async (sspId) => {
        console.log('\n🔍 Testing addControlImplementation');
        const request = createMcpRequest('addControlImplementation', {
          sspId,
          controlId: 'AC-1',
          implementationStatus: 'IMPLEMENTED',
          description: 'This is a test implementation',
          responsibleRoles: ['test-team']
        });
        
        const response = await sendRequest(serverProcess, request);
        validateResponse(response);
        
        if (response.result.controlId !== 'AC-1') {
          throw new Error(`Expected control ID AC-1, got ${response.result.controlId}`);
        }
        
        console.log(`   ✅ Added implementation for control ${response.result.controlId}`);
        return sspId;
      },
      
      // Test validateSSP
      async (sspId) => {
        console.log('\n🔍 Testing validateSSP');
        const request = createMcpRequest('validateSSP', { sspId });
        const response = await sendRequest(serverProcess, request);
        validateResponse(response);
        
        if (typeof response.result.implementationPercentage !== 'number') {
          throw new Error('Expected implementationPercentage to be a number');
        }
        
        console.log(`   ✅ Validated SSP with implementation percentage: ${response.result.implementationPercentage}%`);
        return true;
      }
    ];
    
    // Run the tests in sequence, passing results between them
    let result = null;
    for (const test of tests) {
      result = await test(result);
    }
    
    console.log('\n🎉 All MCP tests passed!');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up: kill the server process
    serverProcess.kill();
  }
}

/**
 * Send an MCP request to the server
 */
function sendRequest(serverProcess, request) {
  return new Promise((resolve, reject) => {
    let responseData = '';
    
    // Set up a listener for the response
    const dataHandler = (data) => {
      responseData += data.toString();
      
      try {
        // Check if we've received a complete JSON response
        const response = JSON.parse(responseData);
        
        // Clean up the event listener
        serverProcess.stdout.removeListener('data', dataHandler);
        
        resolve(response);
      } catch (error) {
        // If not valid JSON yet, wait for more data
      }
    };
    
    // Listen for responses
    serverProcess.stdout.on('data', dataHandler);
    
    // Send the request
    const requestStr = JSON.stringify(request) + '\n';
    serverProcess.stdin.write(requestStr);
  });
}

/**
 * Validate an MCP response
 */
function validateResponse(response) {
  if (!response) {
    throw new Error('No response received');
  }
  
  if (response.error) {
    throw new Error(`MCP error: ${response.error.message}`);
  }
  
  if (response.result === undefined) {
    throw new Error('Response missing result property');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});