/**
 * OSCAL Service
 * Provides functionality for interacting with OSCAL content
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalize as normalizeControlId } from '../utils/controlUtils.js';

// Ensure all console logs go to stderr in this module
const originalConsoleLog = console.log;
console.log = function() {
  console.error.apply(console, arguments);
};

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OSCAL_CONTENT_PATH = process.env.OSCAL_CONTENT_PATH || 
  path.resolve(__dirname, '../../oscal-content');
const CATALOGS_PATH = path.join(OSCAL_CONTENT_PATH, 'catalogs/nist.gov/SP800-53');
const PROFILES_BASE_PATH = path.join(OSCAL_CONTENT_PATH, 'profiles');
const BASELINES_PATH = path.join(PROFILES_BASE_PATH, 'baselines');
const FEDRAMP_PATH = path.join(PROFILES_BASE_PATH, 'fedramp');

/**
 * The OSCAL service for accessing and processing OSCAL content
 */
export const oscalService = {
  /**
   * Initialize the OSCAL service
   */
  async initialize() {
    try {
      // Check if OSCAL content exists
      await fs.access(OSCAL_CONTENT_PATH);
      console.log(`OSCAL content found at ${OSCAL_CONTENT_PATH}`);
      
      // Load control catalog
      await this.loadControlCatalog();
      
      // Pre-load both types of profiles for availability
      this.baselineProfiles = {};
      this.fedrampProfiles = {};
      
      // Load standard baselines
      try {
        this.baselineProfiles = await this.loadBaselineProfiles('baseline');
        console.log(`Loaded ${Object.keys(this.baselineProfiles).length} baseline profiles`);
      } catch (baselineError) {
        console.log('Could not load standard baselines', baselineError.message);
      }
      
      // Load FedRAMP profiles
      try {
        this.fedrampProfiles = await this.loadBaselineProfiles('fedramp');
        console.log(`Loaded ${Object.keys(this.fedrampProfiles).length} FedRAMP profiles`);
      } catch (fedrampError) {
        console.log('Could not load FedRAMP profiles', fedrampError.message);
      }
      
      // Set the default profiles based on what's available
      if (Object.keys(this.baselineProfiles).length > 0) {
        this.profiles = this.baselineProfiles;
      } else if (Object.keys(this.fedrampProfiles).length > 0) {
        this.profiles = this.fedrampProfiles;
      } else {
        throw new Error('No profiles could be loaded from any source');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize OSCAL service:', error);
      return false;
    }
  },

  /**
   * Load the NIST 800-53 control catalog
   */
  async loadControlCatalog() {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would load the catalog from OSCAL content
      console.log('Loading control catalog...');
      this.catalog = {
        id: 'nist-800-53-rev5',
        title: 'NIST SP 800-53 Revision 5',
        families: [
          'AC', 'AT', 'AU', 'CA', 'CM', 'CP', 'IA', 'IR', 'MA',
          'MP', 'PE', 'PL', 'PM', 'PS', 'PT', 'RA', 'SA', 'SC', 'SI'
        ],
        controls: {}
      };
      
      // In a real implementation, this would load the actual controls from OSCAL content
      console.log('Control catalog loaded');
      return this.catalog;
    } catch (error) {
      console.error('Failed to load control catalog:', error);
      throw error;
    }
  },

  /**
   * Load baseline profiles
   * @param {string} [profileType] - Type of profile to load (baseline, fedramp)
   */
  async loadBaselineProfiles(profileType = 'baseline') {
    console.log(`Loading ${profileType} profiles...`);
    
    let profilesPath;
    if (profileType === 'fedramp') {
      profilesPath = FEDRAMP_PATH;
      console.log(`Using FedRAMP path: ${FEDRAMP_PATH}`);
    } else {
      profilesPath = BASELINES_PATH;
      console.log(`Using baselines path: ${BASELINES_PATH}`);
    }
    
    // Check if profiles directory exists
    try {
      await fs.access(profilesPath);
    } catch (error) {
      console.error(`Profiles directory not found: ${profilesPath}`);
      throw new Error(`Profiles directory not found: ${profilesPath}`);
    }
    
    // List available profiles
    const profileFiles = await fs.readdir(profilesPath);
    const jsonFiles = profileFiles.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.error(`No profile JSON files found in ${profilesPath}`);
      throw new Error(`No profile JSON files found in ${profilesPath}`);
    }
    
    // Map security levels to profile files
    this.profiles = {};
    
    // Basic mapping based on filename patterns
    for (const file of jsonFiles) {
      let securityLevel;
      
      if (file.toLowerCase().includes('low')) {
        securityLevel = 'LOW';
        console.log(`Found LOW profile: ${file}`);
      } else if (file.toLowerCase().includes('moderate')) {
        securityLevel = 'MODERATE';
        console.log(`Found MODERATE profile: ${file}`);
      } else if (file.toLowerCase().includes('high')) {
        securityLevel = 'HIGH';
        console.log(`Found HIGH profile: ${file}`);
      } else {
        console.log(`Skipping file that doesn't match security levels: ${file}`);
        continue;
      }
      
      // Store the profile info with its path
      this.profiles[securityLevel] = {
        id: path.basename(file, '.json'),
        title: `${profileType === 'fedramp' ? 'FedRAMP' : ''} ${securityLevel.charAt(0) + securityLevel.slice(1).toLowerCase()} Impact Baseline`,
        path: path.join(profilesPath, file)
      };
    }
    
    // Check if we found profiles
    if (Object.keys(this.profiles).length === 0) {
      console.error(`Could not identify security levels in profile files`);
      throw new Error(`Could not identify security levels in profile files`);
    }
    
    console.log(`Loaded ${Object.keys(this.profiles).length} ${profileType} profiles`);
    // Store the profiles in the appropriate property based on type
    if (profileType === 'fedramp') {
      this.fedrampProfiles = this.profiles;
    } else {
      this.baselineProfiles = this.profiles;
    }
    
    return this.profiles;
  },

  /**
   * Get a control by ID
   * @param {string} controlId - The control ID (e.g., AC-2 or AC.2)
   * @param {boolean} includeEnhancements - Whether to include control enhancements
   * @returns {Promise<Object>} - The control object
   */
  async getControl(controlId, includeEnhancements = false) {
    try {
      // Normalize control ID
      const normalizedId = normalizeControlId(controlId);
      
      // This is a placeholder implementation
      // In a real implementation, you would retrieve the control from OSCAL content
      const control = {
        id: normalizedId,
        title: `Control ${normalizedId}`,
        description: `This is a placeholder for control ${normalizedId}`,
        family: normalizedId.split('-')[0] || normalizedId.split('.')[0],
        enhancements: includeEnhancements ? [] : undefined
      };
      
      return control;
    } catch (error) {
      console.error(`Failed to get control ${controlId}:`, error);
      throw error;
    }
  },

  /**
   * Search for controls
   * @param {string} query - Search query (control ID, title, or keywords)
   * @param {string} family - Control family (e.g., AC, SI, CM)
   * @param {string} baseline - Security baseline (LOW, MODERATE, HIGH)
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} - Array of matching controls
   */
  async searchControls(query, family, baseline, limit = 20) {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would search through OSCAL content
      const controls = [
        { id: 'AC-1', title: 'Policy and Procedures', family: 'AC' },
        { id: 'AC-2', title: 'Account Management', family: 'AC' },
        { id: 'SI-4', title: 'Information System Monitoring', family: 'SI' },
        { id: 'CM-6', title: 'Configuration Settings', family: 'CM' }
      ];
      
      // Filter by family if provided
      let results = controls;
      if (family) {
        results = results.filter(control => control.family === family);
      }
      
      // Filter by query if provided
      if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(control => 
          control.id.toLowerCase().includes(lowerQuery) || 
          control.title.toLowerCase().includes(lowerQuery)
        );
      }
      
      // Apply limit
      results = results.slice(0, limit);
      
      return results;
    } catch (error) {
      console.error('Failed to search controls:', error);
      throw error;
    }
  },

  /**
   * Get all control families
   * @returns {Promise<Array>} - Array of control families
   */
  async getControlFamilies() {
    try {
      return this.catalog?.families || [
        { id: 'AC', title: 'Access Control' },
        { id: 'AT', title: 'Awareness and Training' },
        { id: 'AU', title: 'Audit and Accountability' },
        { id: 'CA', title: 'Assessment, Authorization, and Monitoring' },
        { id: 'CM', title: 'Configuration Management' },
        { id: 'CP', title: 'Contingency Planning' },
        { id: 'IA', title: 'Identification and Authentication' },
        { id: 'IR', title: 'Incident Response' },
        { id: 'MA', title: 'Maintenance' },
        { id: 'MP', title: 'Media Protection' },
        { id: 'PE', title: 'Physical and Environmental Protection' },
        { id: 'PL', title: 'Planning' },
        { id: 'PM', title: 'Program Management' },
        { id: 'PS', title: 'Personnel Security' },
        { id: 'PT', title: 'PII Processing and Transparency' },
        { id: 'RA', title: 'Risk Assessment' },
        { id: 'SA', title: 'System and Services Acquisition' },
        { id: 'SC', title: 'System and Communications Protection' },
        { id: 'SI', title: 'System and Information Integrity' }
      ];
    } catch (error) {
      console.error('Failed to get control families:', error);
      throw error;
    }
  },

  /**
   * Get baseline controls for a security level
   * @param {string} securityLevel - Security level (LOW, MODERATE, HIGH)
   * @param {string} [profileType] - Profile type to use (baseline, fedramp)
   * @returns {Promise<Array>} - Array of baseline controls
   */
  async getBaselineControls(securityLevel, profileType = 'baseline') {
    // Normalize security level
    const normalizedLevel = securityLevel.toUpperCase();
    
    // Determine which profile set to use
    let profileSet;
    if (profileType === 'fedramp') {
      // Use FedRAMP profiles
      if (!this.fedrampProfiles || Object.keys(this.fedrampProfiles).length === 0) {
        await this.loadBaselineProfiles('fedramp');
      }
      profileSet = this.fedrampProfiles;
    } else {
      // Use standard baselines
      if (!this.baselineProfiles || Object.keys(this.baselineProfiles).length === 0) {
        await this.loadBaselineProfiles('baseline');
      }
      profileSet = this.baselineProfiles;
    }
    
    // Check if the requested security level exists
    if (!profileSet[normalizedLevel]) {
      throw new Error(`Security level ${normalizedLevel} not found in ${profileType} profiles`);
    }
    
    // Profile path
    const profilePath = profileSet[normalizedLevel].path;
    
    if (!profilePath) {
      throw new Error(`No path found for ${profileType} profile ${normalizedLevel}`);
    }
    
    // Read and parse the profile
    const profileData = await fs.readFile(profilePath, 'utf8');
    const profile = JSON.parse(profileData);
    
    // Extract control IDs - this depends on the structure of the profile
    let controlIds = [];
    
    // Navigate through the profile structure to find controls
    if (profile.profile?.imports) {
      for (const importObj of profile.profile.imports) {
        if (importObj['include-controls']) {
          for (const includeControl of importObj['include-controls']) {
            if (includeControl['with-ids']) {
              controlIds = controlIds.concat(includeControl['with-ids']);
            }
          }
        }
      }
    }
    
    if (controlIds.length === 0) {
      throw new Error(`No controls found in profile: ${profilePath}`);
    }
    
    console.log(`Found ${controlIds.length} controls for ${normalizedLevel} in ${profileType} profile`);
    return controlIds;
  }
};

// Initialize the OSCAL service when imported
oscalService.initialize();