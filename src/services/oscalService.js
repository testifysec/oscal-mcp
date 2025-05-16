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
const PROFILES_PATH = path.join(OSCAL_CONTENT_PATH, 'profiles/fedramp');

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
      
      // Load FedRAMP profiles
      await this.loadFedRAMPProfiles();
      
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
   * Load FedRAMP profiles
   */
  async loadFedRAMPProfiles() {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would load profiles from OSCAL content
      console.log('Loading FedRAMP profiles...');
      this.profiles = {
        'LOW': { id: 'fedramp-low', title: 'FedRAMP Low Baseline' },
        'MODERATE': { id: 'fedramp-moderate', title: 'FedRAMP Moderate Baseline' },
        'HIGH': { id: 'fedramp-high', title: 'FedRAMP High Baseline' }
      };
      
      console.log('FedRAMP profiles loaded');
      return this.profiles;
    } catch (error) {
      console.error('Failed to load FedRAMP profiles:', error);
      throw error;
    }
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
   * @returns {Promise<Array>} - Array of baseline controls
   */
  async getBaselineControls(securityLevel) {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would retrieve baseline controls from OSCAL profiles
      const baselines = {
        'LOW': ['AC-1', 'AC-2', 'AC-3', 'AC-7', 'AC-8', 'AC-14', 'AC-17', 'AC-18', 'AC-19', 'AC-20', 'AC-22'],
        'MODERATE': ['AC-1', 'AC-2', 'AC-2(1)', 'AC-2(2)', 'AC-2(3)', 'AC-2(4)', 'AC-3', 'AC-4', 'AC-5', 'AC-6'],
        'HIGH': ['AC-1', 'AC-2', 'AC-2(1)', 'AC-2(2)', 'AC-2(3)', 'AC-2(4)', 'AC-2(5)', 'AC-2(11)', 'AC-2(12)', 'AC-2(13)']
      };
      
      return baselines[securityLevel] || [];
    } catch (error) {
      console.error(`Failed to get ${securityLevel} baseline controls:`, error);
      throw error;
    }
  }
};

// Initialize the OSCAL service when imported
oscalService.initialize();