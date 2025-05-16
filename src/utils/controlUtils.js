/**
 * Control Utilities
 * Utility functions for working with control IDs and other control-related operations
 */

/**
 * Normalize a control ID to a consistent format
 * Supports formats like:
 * - AC-2
 * - AC.2
 * - AC-2(1)
 * - AC.2.1
 * - AC2
 * 
 * @param {string} controlId - The control ID to normalize
 * @param {string} format - The output format: 'dot' (AC.2.1) or 'hyphen' (AC-2(1))
 * @returns {string} - The normalized control ID
 */
export function normalize(controlId, format = 'hyphen') {
  if (!controlId) {
    throw new Error('Control ID is required');
  }
  
  // Parse the control ID
  const parsed = parse(controlId);
  
  // Return in the requested format
  if (format === 'dot') {
    return parsed.internal;
  } else {
    return parsed.mcp;
  }
}

/**
 * Parse a control ID into its components
 * 
 * @param {string} controlId - The control ID to parse
 * @returns {Object} - The parsed control with family, number, enhancement, and formatted strings
 */
export function parse(controlId) {
  if (!controlId) {
    throw new Error('Control ID is required');
  }
  
  // Convert to uppercase
  const upperControlId = controlId.toUpperCase();
  
  // Regular expressions for different formats
  const dotNotationRegex = /^([A-Z]{2})\.([0-9]+)(?:\.([0-9]+))?$/;
  const hyphenParensRegex = /^([A-Z]{2})-([0-9]+)(?:\(([0-9]+)\))?$/;
  const hyphenRegex = /^([A-Z]{2})-([0-9]+)$/;
  const spaceRegex = /^([A-Z]{2})\s+([0-9]+)$/;
  const noSepRegex = /^([A-Z]{2})([0-9]+)$/;
  
  let family, number, enhancement;
  
  // Try each format
  let matches = upperControlId.match(dotNotationRegex);
  if (matches) {
    family = matches[1];
    number = parseInt(matches[2], 10);
    enhancement = matches[3] ? parseInt(matches[3], 10) : undefined;
  } else if ((matches = upperControlId.match(hyphenParensRegex))) {
    family = matches[1];
    number = parseInt(matches[2], 10);
    enhancement = matches[3] ? parseInt(matches[3], 10) : undefined;
  } else if ((matches = upperControlId.match(hyphenRegex))) {
    family = matches[1];
    number = parseInt(matches[2], 10);
  } else if ((matches = upperControlId.match(spaceRegex))) {
    family = matches[1];
    number = parseInt(matches[2], 10);
  } else if ((matches = upperControlId.match(noSepRegex))) {
    family = matches[1];
    number = parseInt(matches[2], 10);
  } else {
    throw new Error(`Invalid control ID format: ${controlId}`);
  }
  
  // Create internal representation (dot notation)
  let internal = `${family}.${number}`;
  if (enhancement !== undefined) {
    internal += `.${enhancement}`;
  }
  
  // Create MCP representation (hyphen with parentheses)
  let mcp = `${family}-${number}`;
  if (enhancement !== undefined) {
    mcp += `(${enhancement})`;
  }
  
  return {
    family,
    number,
    enhancement,
    internal,
    mcp,
    display: mcp
  };
}

/**
 * Get the control family from a control ID
 * 
 * @param {string} controlId - The control ID
 * @returns {string} - The control family (e.g., AC, SI, CM)
 */
export function getFamily(controlId) {
  if (!controlId) {
    throw new Error('Control ID is required');
  }
  
  return parse(controlId).family;
}

/**
 * Check if a control ID includes an enhancement
 * 
 * @param {string} controlId - The control ID
 * @returns {boolean} - Whether the control ID includes an enhancement
 */
export function hasEnhancement(controlId) {
  if (!controlId) {
    throw new Error('Control ID is required');
  }
  
  return parse(controlId).enhancement !== undefined;
}

/**
 * Get the base control ID for an enhancement
 * 
 * @param {string} controlId - The control ID
 * @returns {string} - The base control ID
 */
export function getBaseControl(controlId) {
  if (!controlId) {
    throw new Error('Control ID is required');
  }
  
  const parsed = parse(controlId);
  return `${parsed.family}-${parsed.number}`;
}

/**
 * Compare two control IDs for sorting
 * 
 * @param {string} controlIdA - The first control ID
 * @param {string} controlIdB - The second control ID
 * @returns {number} - Negative if A < B, positive if A > B, zero if equal
 */
export function compareControlIds(controlIdA, controlIdB) {
  if (!controlIdA || !controlIdB) {
    throw new Error('Both control IDs are required');
  }
  
  const parsedA = parse(controlIdA);
  const parsedB = parse(controlIdB);
  
  // Compare families
  if (parsedA.family < parsedB.family) return -1;
  if (parsedA.family > parsedB.family) return 1;
  
  // Compare numbers
  if (parsedA.number < parsedB.number) return -1;
  if (parsedA.number > parsedB.number) return 1;
  
  // Compare enhancements
  const enhA = parsedA.enhancement === undefined ? -1 : parsedA.enhancement;
  const enhB = parsedB.enhancement === undefined ? -1 : parsedB.enhancement;
  
  if (enhA < enhB) return -1;
  if (enhA > enhB) return 1;
  
  return 0;
}