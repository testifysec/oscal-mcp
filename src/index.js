/**
 * NIST 800-53 OSCAL Server
 * Main application entry point for stdio-based MCP server
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { setupMcpServer } from './services/mcpServer.js';

// Ensure all console logs go to stderr in this module
const originalConsoleLog = console.log;
console.log = function() {
  console.error.apply(console, arguments);
};

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const OSCAL_CONTENT_PATH = process.env.OSCAL_CONTENT_PATH || '../oscal-content';

console.log('Starting NIST 800-53 OSCAL MCP Server');
console.log(`Using OSCAL content from: ${OSCAL_CONTENT_PATH}`);

// Initialize and start MCP server
setupMcpServer();

// Log startup
console.error('MCP server started and ready for input');