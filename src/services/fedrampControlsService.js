/**
 * FedRAMP Controls Service
 * Provides access to FedRAMP control information and implementation guidance
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure all console logs go to stderr in this module
const originalConsoleLog = console.log;
console.log = function() {
  console.error.apply(console, arguments);
};

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CONTROLS_FILE_PATH = path.join(PROJECT_ROOT, 'oscal-content/extensions/nist-800-53/cloud-native/cloud-native-controls.json');

// Simple in-memory cache
let controlsCache = null;

/**
 * Reads and parses the cloud-native controls file
 */
export async function loadFedRampControls() {
  // Check cache first
  if (controlsCache) {
    console.log('Using cached FedRAMP controls data');
    return controlsCache;
  }
  
  try {
    console.log(`Loading cloud-native controls from: ${CONTROLS_FILE_PATH}`);
    
    // Read the JSON file
    const fileContent = await fs.readFile(CONTROLS_FILE_PATH, 'utf8');
    
    // Parse JSON data
    const controlData = JSON.parse(fileContent);
    
    console.log(`Successfully loaded cloud-native controls data`);
    if (controlData.control_families && controlData.control_families.length) {
      console.log(`Loaded ${controlData.control_families.length} control families`);
    }
    if (controlData.sources && controlData.sources.length) {
      console.log(`With ${controlData.sources.length} sources`);
    }
    
    // Cache the data
    controlsCache = controlData;
    return controlData;
  } catch (error) {
    console.error('Failed to load FedRAMP controls:', error);
    throw new Error(`Failed to load FedRAMP controls data: ${error.message}`);
  }
}

/**
 * Gets a specific control by ID
 * 
 * @param {string} controlId - The control ID to look for
 * @returns {Object|null} - The control object or null if not found
 */
export async function getControlById(controlId) {
  const controlData = await loadFedRampControls();
  
  // Normalize input ID (uppercase with no spaces)
  const normalizedInputId = controlId.toUpperCase().replace(/\\s+/g, '');
  console.log(`Looking for control with normalized ID: ${normalizedInputId}`);
  
  if (controlData.control_families) {
    for (const family of controlData.control_families) {
      for (const control of family.controls) {
        // Normalize control ID for comparison
        const normalizedControlId = control.id.toUpperCase().replace(/\\s+/g, '');
        if (normalizedControlId === normalizedInputId) {
          console.log(`Found control ${control.id}: ${control.title}`);
          return control;
        }
      }
    }
  } else if (controlData.controls) {
    // Alternative structure - flat list of controls
    for (const control of controlData.controls) {
      // Normalize control ID for comparison
      const normalizedControlId = control.id.toUpperCase().replace(/\\s+/g, '');
      if (normalizedControlId === normalizedInputId) {
        console.log(`Found control ${control.id}: ${control.title}`);
        return control;
      }
    }
  }
  
  console.log(`No control found with ID: ${normalizedInputId}`);
  return null;
}

/**
 * Lists all control families
 * 
 * @returns {string[]} - Array of family names
 */
export async function listControlFamilies() {
  const controlData = await loadFedRampControls();
  
  if (controlData.control_families) {
    return controlData.control_families.map(family => family.name);
  } else {
    // Alternative structure - extract family names from controls
    const families = new Set();
    if (controlData.controls) {
      for (const control of controlData.controls) {
        if (control.family) {
          families.add(control.family);
        }
      }
    }
    return Array.from(families);
  }
}

/**
 * Gets all controls for a specific family
 * 
 * @param {string} familyName - The family name to search for
 * @returns {Object[]} - Array of controls in the family
 */
export async function getControlsByFamily(familyName) {
  const controlData = await loadFedRampControls();
  
  // Find the family by name (case-insensitive partial match)
  const normalizedFamilyName = familyName.toLowerCase();
  console.log(`Looking for family matching: ${normalizedFamilyName}`);
  
  if (controlData.control_families) {
    const family = controlData.control_families.find(f => 
      f.name.toLowerCase().includes(normalizedFamilyName)
    );
    
    if (family) {
      console.log(`Found family ${family.name} with ${family.controls.length} controls`);
      return family.controls;
    }
  } else if (controlData.controls) {
    // Alternative structure - filter controls by family
    const controls = controlData.controls.filter(control => 
      control.family && control.family.toLowerCase().includes(normalizedFamilyName)
    );
    
    console.log(`Found ${controls.length} controls in family matching: ${normalizedFamilyName}`);
    return controls;
  }
  
  console.log(`No family found matching: ${normalizedFamilyName}`);
  return [];
}

/**
 * Searches for controls by various criteria
 * 
 * @param {Object} criteria - Search criteria
 * @param {string} [criteria.id] - Control ID to search for
 * @param {string} [criteria.familyName] - Family name to filter by
 * @param {string} [criteria.keywords] - Keywords to search in title and description
 * @returns {Object[]} - Array of matching controls
 */
export async function searchControls(criteria) {
  const controlData = await loadFedRampControls();
  const results = [];
  
  if (controlData.control_families) {
    for (const family of controlData.control_families) {
      // Skip if family filter is provided and doesn't match
      if (criteria.familyName && 
          !family.name.toLowerCase().includes(criteria.familyName.toLowerCase())) {
        continue;
      }
      
      for (const control of family.controls) {
        // Match by ID if provided
        if (criteria.id && !control.id.toLowerCase().includes(criteria.id.toLowerCase())) {
          continue;
        }
        
        // Match by keywords if provided
        if (criteria.keywords) {
          const keywords = criteria.keywords.toLowerCase();
          const matchesKeywords = 
            (control.title && control.title.toLowerCase().includes(keywords)) ||
            (control.description && control.description.toLowerCase().includes(keywords)) ||
            (control.notes && control.notes.toLowerCase().includes(keywords));
          
          if (!matchesKeywords) {
            continue;
          }
        }
        
        results.push(control);
      }
    }
  } else if (controlData.controls) {
    // Alternative structure - flat list of controls
    for (const control of controlData.controls) {
      // Skip if family filter is provided and doesn't match
      if (criteria.familyName && 
          control.family && 
          !control.family.toLowerCase().includes(criteria.familyName.toLowerCase())) {
        continue;
      }
      
      // Match by ID if provided
      if (criteria.id && !control.id.toLowerCase().includes(criteria.id.toLowerCase())) {
        continue;
      }
      
      // Match by keywords if provided
      if (criteria.keywords) {
        const keywords = criteria.keywords.toLowerCase();
        const matchesKeywords = 
          (control.title && control.title.toLowerCase().includes(keywords)) ||
          (control.description && control.description.toLowerCase().includes(keywords)) ||
          (control.notes && control.notes.toLowerCase().includes(keywords));
        
        if (!matchesKeywords) {
          continue;
        }
      }
      
      results.push(control);
    }
  }
  
  console.log(`Found ${results.length} controls matching criteria`);
  return results;
}


// Initialize the module by pre-loading the controls data
loadFedRampControls().catch(error => {
  console.error('Error initializing FedRAMP controls service:', error);
});