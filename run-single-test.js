/**
 * Simple test script to test the validateSSP method
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start MCP server and test validateSSP
async function runTest() {
  console.log('🧪 Testing validateSSP method...');
  
  // Start the server process
  console.log('📡 Starting server...');
  const serverProcess = spawn('node', ['src/index.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Process server output
  let serverReady = false;
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server output]: ${data.toString().trim()}`);
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
  
  console.log('🚀 Server ready, sending request...');
  
  try {
    // Send validateSSP request
    const request = {
      jsonrpc: '2.0',
      method: 'validateSSP',
      params: { sspId: 'sample-ssp' },
      id: 1
    };
    
    console.log(`➡️ Sending: ${JSON.stringify(request)}`);
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    
    // Wait for response
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for server response'));
      }, 5000);
      
      serverProcess.stdout.on('data', (data) => {
        try {
          const responseText = data.toString().trim();
          console.log(`⬅️ Received: ${responseText}`);
          
          const response = JSON.parse(responseText);
          if (response.id === 1) {
            clearTimeout(timeout);
            resolve(response);
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });
    });
    
    // Validate response
    if (response.error) {
      console.error(`❌ Error: ${response.error.message}`);
    } else {
      const result = response.result;
      console.log(`✅ Success: Validation result received`);
      console.log(`   Implementation percentage: ${result.implementationPercentage}%`);
      console.log(`   Total controls: ${result.totalControls}`);
      console.log(`   Implementation by status:`, result.implementationByStatus);
    }
    
    console.log('\n🎉 Test completed!');
  } catch (error) {
    console.error(`❌ Test Failed: ${error.message}`);
  } finally {
    // Clean up
    console.log('🧹 Shutting down server...');
    serverProcess.kill();
  }
}

// Run the test
runTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});