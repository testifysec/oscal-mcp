/**
 * SSP Service
 * Provides functionality for managing System Security Plans (SSPs)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { oscalService } from './oscalService.js';
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
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../data');
const SSP_DIR = path.join(DATA_DIR, 'ssp');

/**
 * The SSP service for managing System Security Plans
 */
export const sspService = {
  /**
   * Initialize the SSP service
   */
  async initialize() {
    try {
      // Ensure data directories exist
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.mkdir(SSP_DIR, { recursive: true });
      
      console.log(`SSP directory: ${SSP_DIR}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize SSP service:', error);
      return false;
    }
  },

  /**
   * Create a new System Security Plan
   * 
   * @param {string} title - Title of the SSP
   * @param {string} description - Description of the system
   * @param {string} securityLevel - Security categorization level (LOW, MODERATE, HIGH)
   * @param {string} systemId - Optional system identifier
   * @returns {Promise<Object>} - The created SSP
   */
  async createSSP(title, description, securityLevel, systemId) {
    try {
      // Validate security level
      const validLevels = ['LOW', 'MODERATE', 'HIGH'];
      if (!validLevels.includes(securityLevel)) {
        throw new Error(`Invalid security level: ${securityLevel}. Must be one of: ${validLevels.join(', ')}`);
      }
      
      // Create a unique ID for the SSP
      const id = systemId || randomUUID();
      
      // Create the SSP object
      const ssp = {
        id,
        uuid: randomUUID(),
        metadata: {
          title,
          lastModified: new Date().toISOString(),
          version: '1.0',
          oscalVersion: '1.1.0',
        },
        systemCharacteristics: {
          systemName: title,
          description,
          securityImpactLevel: securityLevel,
          status: 'operational',
          authorizationType: 'fedramp',
          dateAuthorized: null,
        },
        controlImplementations: [],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
      
      // Get baseline controls for the security level
      const baselineControls = await oscalService.getBaselineControls(securityLevel);
      
      // Initialize control implementations
      ssp.controlImplementations = baselineControls.map(controlId => {
        return {
          controlId: normalizeControlId(controlId),
          status: 'PLANNED',
          description: `Implementation of ${controlId} is planned.`,
          responsibleRoles: [],
        };
      });
      
      // Save the SSP to file
      const sspPath = path.join(SSP_DIR, `${id}.json`);
      await fs.writeFile(sspPath, JSON.stringify(ssp, null, 2));
      
      console.log(`Created SSP ${id} at ${sspPath}`);
      return ssp;
    } catch (error) {
      console.error('Failed to create SSP:', error);
      throw error;
    }
  },

  /**
   * Get an SSP by ID
   * 
   * @param {string} sspId - The SSP ID
   * @returns {Promise<Object>} - The SSP
   */
  async getSSP(sspId) {
    try {
      const sspPath = path.join(SSP_DIR, `${sspId}.json`);
      const sspData = await fs.readFile(sspPath, 'utf8');
      return JSON.parse(sspData);
    } catch (error) {
      console.error(`Failed to get SSP ${sspId}:`, error);
      throw new Error(`SSP not found: ${sspId}`);
    }
  },

  /**
   * List all SSPs
   * 
   * @returns {Promise<Array>} - Array of SSPs
   */
  async listSSPs() {
    try {
      const files = await fs.readdir(SSP_DIR);
      const sspFiles = files.filter(file => file.endsWith('.json'));
      
      const ssps = [];
      for (const file of sspFiles) {
        const sspPath = path.join(SSP_DIR, file);
        const sspData = await fs.readFile(sspPath, 'utf8');
        const ssp = JSON.parse(sspData);
        
        // Include only summary information
        ssps.push({
          id: ssp.id,
          title: ssp.metadata.title,
          securityLevel: ssp.systemCharacteristics.securityImpactLevel,
          status: ssp.systemCharacteristics.status,
          created: ssp.created,
          updated: ssp.updated,
        });
      }
      
      return ssps;
    } catch (error) {
      console.error('Failed to list SSPs:', error);
      throw error;
    }
  },

  /**
   * Add a control implementation to an SSP
   * 
   * @param {string} sspId - The SSP ID
   * @param {string} controlId - The control ID
   * @param {string} implementationStatus - Implementation status
   * @param {string} description - Description of the implementation
   * @param {Array} responsibleRoles - Roles responsible for the implementation
   * @returns {Promise<Object>} - The updated control implementation
   */
  async addControlImplementation(sspId, controlId, implementationStatus, description, responsibleRoles = []) {
    try {
      // Get the SSP
      const ssp = await this.getSSP(sspId);
      
      // Normalize control ID
      const normalizedControlId = normalizeControlId(controlId);
      
      // Validate implementation status
      const validStatuses = ['IMPLEMENTED', 'PARTIALLY_IMPLEMENTED', 'PLANNED', 'ALTERNATIVE_IMPLEMENTATION', 'NOT_APPLICABLE'];
      if (!validStatuses.includes(implementationStatus)) {
        throw new Error(`Invalid implementation status: ${implementationStatus}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Check if the control implementation already exists
      const implementationIndex = ssp.controlImplementations.findIndex(
        impl => impl.controlId === normalizedControlId
      );
      
      // Create or update the control implementation
      const implementation = {
        controlId: normalizedControlId,
        status: implementationStatus,
        description,
        responsibleRoles: responsibleRoles || [],
        lastUpdated: new Date().toISOString(),
      };
      
      if (implementationIndex >= 0) {
        ssp.controlImplementations[implementationIndex] = implementation;
      } else {
        ssp.controlImplementations.push(implementation);
      }
      
      // Update the SSP
      ssp.updated = new Date().toISOString();
      
      // Save the updated SSP
      const sspPath = path.join(SSP_DIR, `${sspId}.json`);
      await fs.writeFile(sspPath, JSON.stringify(ssp, null, 2));
      
      return implementation;
    } catch (error) {
      console.error(`Failed to add control implementation for ${sspId}/${controlId}:`, error);
      throw error;
    }
  },

  /**
   * Get a control implementation from an SSP
   * 
   * @param {string} sspId - The SSP ID
   * @param {string} controlId - The control ID
   * @returns {Promise<Object>} - The control implementation
   */
  async getControlImplementation(sspId, controlId) {
    try {
      // Get the SSP
      const ssp = await this.getSSP(sspId);
      
      // Normalize control ID
      const normalizedControlId = normalizeControlId(controlId);
      
      // Find the control implementation
      const implementation = ssp.controlImplementations.find(
        impl => impl.controlId === normalizedControlId
      );
      
      if (!implementation) {
        throw new Error(`Control implementation not found: ${normalizedControlId}`);
      }
      
      return implementation;
    } catch (error) {
      console.error(`Failed to get control implementation for ${sspId}/${controlId}:`, error);
      throw error;
    }
  },

  /**
   * List control implementations for an SSP
   * 
   * @param {string} sspId - The SSP ID
   * @param {string} status - Filter by implementation status
   * @returns {Promise<Array>} - Array of control implementations
   */
  async listControlImplementations(sspId, status) {
    try {
      // Get the SSP
      const ssp = await this.getSSP(sspId);
      
      // Filter by status if provided
      let implementations = ssp.controlImplementations;
      if (status) {
        implementations = implementations.filter(impl => impl.status === status);
      }
      
      return implementations;
    } catch (error) {
      console.error(`Failed to list control implementations for ${sspId}:`, error);
      throw error;
    }
  },

  /**
   * Validate an SSP against its baseline
   * 
   * @param {string} sspId - The SSP ID
   * @returns {Promise<Object>} - Validation results
   */
  async validateSSP(sspId) {
    try {
      // Get the SSP
      const ssp = await this.getSSP(sspId);
      
      // Get baseline controls for the SSP's security level
      const securityLevel = ssp.systemCharacteristics.securityImpactLevel;
      const baselineControls = await oscalService.getBaselineControls(securityLevel);
      
      // Check if all baseline controls are implemented
      const normalizedBaselineControls = baselineControls.map(c => normalizeControlId(c));
      const implementedControls = ssp.controlImplementations.map(impl => impl.controlId);
      
      const missingControls = normalizedBaselineControls.filter(
        controlId => !implementedControls.includes(controlId)
      );
      
      // Check implementation status
      const implementationByStatus = {
        IMPLEMENTED: 0,
        PARTIALLY_IMPLEMENTED: 0,
        PLANNED: 0,
        ALTERNATIVE_IMPLEMENTATION: 0,
        NOT_APPLICABLE: 0,
      };
      
      for (const impl of ssp.controlImplementations) {
        implementationByStatus[impl.status] = (implementationByStatus[impl.status] || 0) + 1;
      }
      
      // Calculate implementation percentage
      const totalControls = ssp.controlImplementations.length;
      const implementedCount = implementationByStatus.IMPLEMENTED || 0;
      const partiallyImplementedCount = implementationByStatus.PARTIALLY_IMPLEMENTED || 0;
      const implementationPercentage = totalControls === 0 ? 0 : 
        (((implementedCount + (partiallyImplementedCount * 0.5)) / totalControls) * 100).toFixed(2);
      
      return {
        valid: missingControls.length === 0,
        missingControls,
        implementationByStatus,
        implementationPercentage: parseFloat(implementationPercentage),
        totalControls,
      };
    } catch (error) {
      console.error(`Failed to validate SSP ${sspId}:`, error);
      throw error;
    }
  }
};

// Initialize the SSP service when imported
sspService.initialize();