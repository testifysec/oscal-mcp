# NIST 800-53 OSCAL Server

A Model Context Protocol (MCP) server for managing NIST 800-53 security controls and System Security Plans (SSPs) in OSCAL format.

## Overview

This server provides a standardized interface for:

- Accessing NIST 800-53 security control information
- Creating and managing System Security Plans (SSPs)
- Implementing security controls within SSPs
- Validating control implementations
- Exporting OSCAL-formatted documents

## Features

- **Control Information Retrieval**: Search, filter, and retrieve NIST 800-53 control details
- **SSP Management**: Create, read, update, and delete System Security Plans
- **Control Implementation**: Define and document control implementations
- **Validation**: Validate SSPs against baselines and implementation requirements
- **OSCAL Format Support**: Work with OSCAL-formatted security documentation
- **MCP Integration**: Seamless integration with Claude and other AI assistants

## Installation

### Prerequisites

- Node.js 16+
- Git

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-organization/nist-800-53-oscal-server.git
   cd nist-800-53-oscal-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Generate test data:
   ```
   npm run setup-test-data
   ```

4. Run the server:
   ```
   ./scripts/run-mcp-server.sh
   ```

## MCP Server Usage

The server implements the Model Context Protocol (MCP) for integrating with Claude and other AI assistants. It uses standard JSON-RPC over stdin/stdout for communication.

### JSON-RPC Methods:

#### Control-related methods

- `getControl`: Get details about a specific NIST 800-53 control
- `searchControls`: Search for controls by family, query, or baseline
- `getControlFamilies`: Get all NIST 800-53 control families

#### SSP-related methods

- `createSSP`: Create a new System Security Plan
- `getSSP`: Get a System Security Plan by ID
- `listSSPs`: List all System Security Plans

#### Implementation-related methods

- `addControlImplementation`: Add a control implementation to an SSP
- `getControlImplementation`: Get a control implementation from an SSP
- `listControlImplementations`: List all control implementations for an SSP

#### Validation-related methods

- `validateSSP`: Validate an SSP against its baseline

### Example request:

```json
{
  "jsonrpc": "2.0",
  "method": "getControlFamilies",
  "id": 1
}
```

### Example response:

```json
{
  "jsonrpc": "2.0",
  "result": [
    {"id": "AC", "title": "Access Control"},
    {"id": "AT", "title": "Awareness and Training"},
    /* ... other families ... */
  ],
  "id": 1
}
```

## Development

```
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## License

[MIT](LICENSE)