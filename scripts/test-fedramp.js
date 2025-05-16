/**
 * Test FedRAMP Baselines
 * 
 * This script tests the FedRAMP baseline profiles by creating SSPs with different security levels.
 */

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
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
function createRequest(method, params = {}) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id: requestId++
  };
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
        
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
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
 * Run the FedRAMP baseline tests
 */
async function runTests() {
  console.log('🔍 Testing FedRAMP Baseline Profiles');
  console.log('====================================');
  
  // Start the MCP server
  console.log('\n📡 Starting MCP server...');
  const serverProcess = spawn('node', [path.join(PROJECT_ROOT, 'src/index.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Error handling
  serverProcess.on('error', (error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
  
  // Server logs
  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server]: ${data.toString().trim()}`);
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // 1. Test creating SSP with LOW security level
    console.log('\n🔍 Creating SSP with LOW security level (FedRAMP)');
    const lowId = randomUUID();
    const lowSSP = await sendRequest(serverProcess, createRequest('createSSP', {
      title: 'FedRAMP LOW Test SSP',
      description: 'Testing FedRAMP LOW baseline',
      securityLevel: 'LOW',
      systemId: lowId
    }));
    
    console.log(`✅ Created LOW SSP with ID ${lowSSP.id}`);
    console.log(`   Profile Type: ${lowSSP.systemCharacteristics.profileType}`);
    console.log(`   Control Implementations: ${lowSSP.controlImplementations.length}`);
    
    // 2. Test creating SSP with MODERATE security level
    console.log('\n🔍 Creating SSP with MODERATE security level (FedRAMP)');
    const moderateId = randomUUID();
    const moderateSSP = await sendRequest(serverProcess, createRequest('createSSP', {
      title: 'FedRAMP MODERATE Test SSP',
      description: 'Testing FedRAMP MODERATE baseline',
      securityLevel: 'MODERATE',
      systemId: moderateId
    }));
    
    console.log(`✅ Created MODERATE SSP with ID ${moderateSSP.id}`);
    console.log(`   Profile Type: ${moderateSSP.systemCharacteristics.profileType}`);
    console.log(`   Control Implementations: ${moderateSSP.controlImplementations.length}`);
    
    // 3. Test creating SSP with HIGH security level
    console.log('\n🔍 Creating SSP with HIGH security level (FedRAMP)');
    const highId = randomUUID();
    const highSSP = await sendRequest(serverProcess, createRequest('createSSP', {
      title: 'FedRAMP HIGH Test SSP',
      description: 'Testing FedRAMP HIGH baseline',
      securityLevel: 'HIGH',
      systemId: highId
    }));
    
    console.log(`✅ Created HIGH SSP with ID ${highSSP.id}`);
    console.log(`   Profile Type: ${highSSP.systemCharacteristics.profileType}`);
    console.log(`   Control Implementations: ${highSSP.controlImplementations.length}`);
    
    // Compare the number of controls in each baseline
    console.log('\n📊 Baseline Comparison:');
    console.log(`   LOW: ${lowSSP.controlImplementations.length} controls`);
    console.log(`   MODERATE: ${moderateSSP.controlImplementations.length} controls`);
    console.log(`   HIGH: ${highSSP.controlImplementations.length} controls`);
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up: kill the server process
    console.log('\n🧹 Shutting down server...');
    serverProcess.kill();
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});