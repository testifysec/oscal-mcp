#!/bin/bash
# Run the MCP server and handle stdin/stdout properly

# Change to project directory
cd "$(dirname "$0")/.."

# Set up environment variables
export OSCAL_CONTENT_PATH="./oscal-content"
export DATA_DIR="./data"

# Make sure directories exist
mkdir -p "$OSCAL_CONTENT_PATH/catalogs/nist.gov/SP800-53"
mkdir -p "$OSCAL_CONTENT_PATH/profiles/fedramp"
mkdir -p "$DATA_DIR/ssp"

# Run setup if needed
if [ ! -f "$OSCAL_CONTENT_PATH/catalogs/nist.gov/SP800-53/catalog.json" ]; then
  echo "Setting up test data..."
  node scripts/setup-test-data.js
fi

# Run the MCP server
echo "Starting NIST 800-53 OSCAL MCP Server..."
node src/index.js