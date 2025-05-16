/**
 * Simple test script to interact with MCP server
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MCP request counter
let requestId = 1;

// Create an MCP request object
function createRequest(method, params = {}) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id: requestId++
  };
}

// Start MCP server and run tests
async function runTests() {
  console.log('🧪 Starting MCP Server Tests...');
  
  // Start the server process
  console.log('📡 Starting server...');
  const serverProcess = spawn('node', ['src/index.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Process server output
  let serverReady = false;
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`[Server log]: ${output}`);
    
    if (output.includes('ready for input')) {
      serverReady = true;
    }
  });
  
  // Wait for server to be ready
  let waitCount = 0;
  while (!serverReady && waitCount < 50) {
    await new Promise(r => setTimeout(r, 100));
    waitCount++;
  }
  
  if (!serverReady) {
    console.error('Server did not start properly');
    serverProcess.kill();
    process.exit(1);
  }
  
  console.log('🚀 Server ready, starting tests...');
  
  try {
    // Define test cases
    const tests = [
      {
        name: 'Get Control Families',
        request: createRequest('getControlFamilies'),
        validate: (response) => {
          if (!Array.isArray(response.result)) {
            throw new Error('Expected array result');
          }
          return `Got ${response.result.length} control families`;
        }
      },
      {
        name: 'Get Control',
        request: createRequest('getControl', { controlId: 'AC-1' }),
        validate: (response) => {
          if (!response.result.id) {
            throw new Error('Invalid control response');
          }
          return `Got control: ${response.result.id} - ${response.result.title}`;
        }
      },
      {
        name: 'Search Controls',
        request: createRequest('searchControls', { family: 'AC' }),
        validate: (response) => {
          if (!Array.isArray(response.result)) {
            throw new Error('Expected array result');
          }
          return `Found ${response.result.length} controls in family AC`;
        }
      },
      {
        name: 'Get SSP',
        request: createRequest('getSSP', { sspId: 'sample-ssp' }),
        validate: (response) => {
          if (!response.result.id) {
            throw new Error('Invalid SSP response');
          }
          return `Got SSP: ${response.result.id} - ${response.result.metadata.title}`;
        }
      },
      {
        name: 'Create New SSP',
        request: createRequest('createSSP', {
          title: 'Test SSP',
          description: 'This is a test SSP',
          securityLevel: 'MODERATE'
        }),
        validate: (response) => {
          const { id, metadata } = response.result;
          if (!id || !metadata) {
            throw new Error('Invalid create SSP response');
          }
          return `Created SSP: ${id} - ${metadata.title}`;
        }
      },
      {
        name: 'Validate SSP',
        request: createRequest('validateSSP', { sspId: 'sample-ssp' }),
        validate: (response) => {
          if (response.result.implementationPercentage === undefined) {
            throw new Error('Invalid validation response');
          }
          return `Validated SSP with ${response.result.implementationPercentage}% implementation`;
        }
      }
    ];
    
    // Run tests sequentially
    for (const test of tests) {
      console.log(`\n🔍 Test: ${test.name}`);
      
      // Send the request
      const requestJson = JSON.stringify(test.request);
      console.log(`➡️ Sending: ${requestJson}`);
      serverProcess.stdin.write(requestJson + '\n');
      
      // Wait for response
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for server response'));
        }, 5000);
        
        const responseHandler = (data) => {
          try {
            const responseText = data.toString().trim();
            console.log(`⬅️ Received: ${responseText}`);
            
            const response = JSON.parse(responseText);
            
            if (response.id === test.request.id) {
              clearTimeout(timeout);
              serverProcess.stdout.removeListener('data', responseHandler);
              resolve(response);
            }
          } catch (error) {
            // Ignore parsing errors, might be partial response
          }
        };
        
        serverProcess.stdout.on('data', responseHandler);
      });
      
      // Validate response
      if (response.error) {
        console.error(`❌ Error: ${response.error.message}`);
      } else {
        const message = test.validate(response);
        console.log(`✅ Success: ${message}`);
      }
    }
    
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error(`❌ Test Failed: ${error.message}`);
  } finally {
    // Clean up
    console.log('\n🧹 Shutting down server...');
    serverProcess.kill();
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});