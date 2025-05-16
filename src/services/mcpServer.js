/**
 * MCP Server Implementation
 * Creates a Model Context Protocol server for Claude integration through stdin/stdout
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { oscalService } from './oscalService.js';
import { sspService } from './sspService.js';
import * as extensionControlsService from './extensionControlsService.js';

// Simple implementation of MCP server for testing
const createStdioServer = (options) => {
  const methods = {};
  
  const server = {
    name: options.name,
    version: options.version,
    description: options.description,
    
    addMethod(name, handler) {
      methods[name] = handler;
    },
    
    start() {
      // Increase buffer sizes for better handling of large responses
      process.stdin.setEncoding('utf8');
      
      // Increase highWaterMark for stdout to help with large responses
      // This configures Node.js stream to use larger chunks
      if (process.stdout._handle && typeof process.stdout._handle.setBlocking === 'function') {
        process.stdout._handle.setBlocking(true);
      }
      
      // Redirect console.log to stderr to avoid interfering with stdout JSON-RPC responses
      const originalConsoleLog = console.log;
      console.log = function() {
        console.error.apply(console, arguments);
      };
      
      // Handle JSON-RPC requests
      process.stdin.on('data', async (data) => {
        try {
          const lines = data.toString().trim().split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            const request = JSON.parse(line);
            const { method, params, id } = request;
            
            if (!methods[method]) {
              const response = {
                jsonrpc: '2.0',
                error: {
                  code: -32601,
                  message: `Method not found: ${method}`
                },
                id
              };
              process.stdout.write(JSON.stringify(response) + '\n');
              continue;
            }
            
            try {
              const result = await methods[method](params || {});
              const response = {
                jsonrpc: '2.0',
                result,
                id
              };
              process.stdout.write(JSON.stringify(response) + '\n');
            } catch (error) {
              const response = {
                jsonrpc: '2.0',
                error: {
                  code: -32000,
                  message: error.message
                },
                id
              };
              process.stdout.write(JSON.stringify(response) + '\n');
            }
          }
        } catch (error) {
          console.error('Error processing request:', error);
        }
      });
      
      // Indicate server is ready
      console.error('MCP server ready for input');
    }
  };
  
  return server;
};

/**
 * Sets up and starts the MCP server
 */
export function setupMcpServer() {
  // Create MCP server
  const server = createStdioServer({
    name: 'nist-800-53-oscal-server',
    version: '0.1.0',
    description: 'NIST 800-53 OSCAL server for managing security controls and SSPs',
  });

  // Register all methods as direct methods on the server
  // This allows the MCP server to be used with JSON-RPC style requests

  // Control-related methods
  server.addMethod('getControl', getControl);
  server.addMethod('searchControls', searchControls);
  server.addMethod('getControlFamilies', getControlFamilies);
  
  // SSP-related methods
  server.addMethod('createSSP', createSSP);
  server.addMethod('getSSP', getSSP);
  server.addMethod('listSSPs', listSSPs);
  
  // Implementation-related methods
  server.addMethod('addControlImplementation', addControlImplementation);
  server.addMethod('getControlImplementation', getControlImplementation);
  server.addMethod('listControlImplementations', listControlImplementations);
  
  // Validation-related methods
  server.addMethod('validateSSP', validateSSP);
  
  // Extension control-related methods
  server.addMethod('getExtensionControl', getExtensionControl);
  server.addMethod('searchExtensionControls', searchExtensionControls);
  server.addMethod('getExtensionControlFamilies', getExtensionControlFamilies);

  // Start server
  server.start();
  console.log('MCP server started in stdio mode');

  return server;
}

/**
 * Get a control by ID
 */
async function getControl({ controlId, includeEnhancements = false }) {
  try {
    const control = await oscalService.getControl(controlId, includeEnhancements);
    return control;
  } catch (error) {
    throw new Error(`Failed to get control: ${error.message}`);
  }
}

/**
 * Search for controls
 */
async function searchControls({ query, family, baseline, limit = 20 }) {
  try {
    const controls = await oscalService.searchControls(query, family, baseline, limit);
    return controls;
  } catch (error) {
    throw new Error(`Failed to search controls: ${error.message}`);
  }
}

/**
 * Get all control families
 */
async function getControlFamilies() {
  try {
    const families = await oscalService.getControlFamilies();
    return families;
  } catch (error) {
    throw new Error(`Failed to get control families: ${error.message}`);
  }
}

/**
 * Create a new SSP
 */
async function createSSP({ title, description, securityLevel, systemId }) {
  try {
    const ssp = await sspService.createSSP(title, description, securityLevel, systemId);
    return ssp;
  } catch (error) {
    throw new Error(`Failed to create SSP: ${error.message}`);
  }
}

/**
 * Get an SSP by ID
 */
async function getSSP({ sspId }) {
  try {
    const ssp = await sspService.getSSP(sspId);
    return ssp;
  } catch (error) {
    throw new Error(`Failed to get SSP: ${error.message}`);
  }
}

/**
 * List all SSPs
 */
async function listSSPs() {
  try {
    const ssps = await sspService.listSSPs();
    return ssps;
  } catch (error) {
    throw new Error(`Failed to list SSPs: ${error.message}`);
  }
}

/**
 * Add a control implementation to an SSP
 */
async function addControlImplementation({ sspId, controlId, implementationStatus, description, responsibleRoles }) {
  try {
    const implementation = await sspService.addControlImplementation(
      sspId, 
      controlId, 
      implementationStatus, 
      description, 
      responsibleRoles
    );
    return implementation;
  } catch (error) {
    throw new Error(`Failed to add control implementation: ${error.message}`);
  }
}

/**
 * Get a control implementation
 */
async function getControlImplementation({ sspId, controlId }) {
  try {
    const implementation = await sspService.getControlImplementation(sspId, controlId);
    return implementation;
  } catch (error) {
    throw new Error(`Failed to get control implementation: ${error.message}`);
  }
}

/**
 * List control implementations for an SSP
 */
async function listControlImplementations({ sspId, status }) {
  try {
    const implementations = await sspService.listControlImplementations(sspId, status);
    return implementations;
  } catch (error) {
    throw new Error(`Failed to list control implementations: ${error.message}`);
  }
}

/**
 * Validate an SSP
 */
async function validateSSP({ sspId }) {
  try {
    const validation = await sspService.validateSSP(sspId);
    return validation;
  } catch (error) {
    throw new Error(`Failed to validate SSP: ${error.message}`);
  }
}

/**
 * Get extension control by ID
 */
async function getExtensionControl({ controlId, framework }) {
  try {
    // If a specific framework is provided, construct the path to that framework's controls
    let controlsPath;
    if (framework) {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const PROJECT_ROOT = path.resolve(__dirname, '../..');
      controlsPath = path.join(PROJECT_ROOT, `oscal-content/extensions/${framework}/cloud-native/cloud-native-controls.json`);
    }
    
    const control = await extensionControlsService.getControlById(controlId, controlsPath);
    if (!control) {
      throw new Error(`Control not found: ${controlId}`);
    }
    return control;
  } catch (error) {
    throw new Error(`Failed to get extension control: ${error.message}`);
  }
}

/**
 * Search extension controls
 */
async function searchExtensionControls({ id, familyName, keywords, framework }) {
  try {
    // If a specific framework is provided, construct the path to that framework's controls
    let controlsPath;
    if (framework) {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const PROJECT_ROOT = path.resolve(__dirname, '../..');
      controlsPath = path.join(PROJECT_ROOT, `oscal-content/extensions/${framework}/cloud-native/cloud-native-controls.json`);
    }
    
    const criteria = { id, familyName, keywords };
    const controls = await extensionControlsService.searchControls(criteria, controlsPath);
    return controls;
  } catch (error) {
    throw new Error(`Failed to search extension controls: ${error.message}`);
  }
}

/**
 * Get extension control families
 */
async function getExtensionControlFamilies({ framework }) {
  try {
    // If a specific framework is provided, construct the path to that framework's controls
    let controlsPath;
    if (framework) {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const PROJECT_ROOT = path.resolve(__dirname, '../..');
      controlsPath = path.join(PROJECT_ROOT, `oscal-content/extensions/${framework}/cloud-native/cloud-native-controls.json`);
    }
    
    const families = await extensionControlsService.listControlFamilies(controlsPath);
    return families;
  } catch (error) {
    throw new Error(`Failed to get extension control families: ${error.message}`);
  }
}

