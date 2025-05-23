/**
 * Setup Test Data
 * 
 * This script creates test data for the NIST 800-53 OSCAL server.
 * It creates the necessary directory structure and adds sample OSCAL content.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Define paths
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const SSP_DIR = path.join(DATA_DIR, 'ssp');
const OSCAL_CONTENT_DIR = path.join(PROJECT_ROOT, 'oscal-content');
const CATALOGS_DIR = path.join(OSCAL_CONTENT_DIR, 'catalogs/nist.gov/SP800-53');
const PROFILES_DIR = path.join(OSCAL_CONTENT_DIR, 'profiles/baselines');

/**
 * Create a minimal NIST 800-53 catalog in OSCAL format (simplified)
 */
const createSampleCatalog = async () => {
  const catalog = {
    "catalog": {
      "uuid": randomUUID(),
      "metadata": {
        "title": "NIST SP 800-53 Revision 5 Security Controls (Sample)",
        "last-modified": new Date().toISOString(),
        "version": "5.0",
        "oscal-version": "1.1.0"
      },
      "groups": [
        {
          "id": "ac",
          "title": "Access Control",
          "controls": [
            {
              "id": "ac-1",
              "title": "Policy and Procedures",
              "props": [
                {
                  "name": "label",
                  "value": "AC-1"
                }
              ],
              "parts": [
                {
                  "id": "ac-1_smt",
                  "name": "statement",
                  "prose": "a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles] an access control policy that: 1. Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and 2. Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and b. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]: 1. Procedures to facilitate the implementation of the access control policy and the associated access controls; and 2. Review and update the current access control: (a) Policy [Assignment: organization-defined frequency]; and (b) Procedures [Assignment: organization-defined frequency]."
                }
              ]
            },
            {
              "id": "ac-2",
              "title": "Account Management",
              "props": [
                {
                  "name": "label",
                  "value": "AC-2"
                }
              ],
              "parts": [
                {
                  "id": "ac-2_smt",
                  "name": "statement",
                  "prose": "a. Define and document the types of accounts allowed and specifically prohibited for use within the system; b. Assign account managers; c. Require [Assignment: organization-defined prerequisites and criteria] for group and role membership; d. Specify: 1. Authorized users of the system; 2. Group and role membership; and 3. Access authorizations (i.e., privileges) and [Assignment: organization-defined attributes (as required)] for each account; e. Require approvals by [Assignment: organization-defined personnel or roles] for requests to create accounts; f. Create, enable, modify, disable, and remove accounts in accordance with [Assignment: organization-defined policy, procedures, prerequisites, and criteria]; g. Monitor the use of accounts; h. Notify account managers and [Assignment: organization-defined personnel or roles] within: 1. [Assignment: organization-defined time period] when accounts are no longer required; 2. [Assignment: organization-defined time period] when users are terminated or transferred; and 3. [Assignment: organization-defined time period] when system usage or need-to-know changes for an individual; i. Authorize access to the system based on: 1. A valid access authorization; 2. Intended system usage; and 3. [Assignment: organization-defined attributes (as required)]; j. Review accounts for compliance with account management requirements [Assignment: organization-defined frequency]; k. Establish and implement a process for changing shared or group account authenticators (if deployed) when individuals are removed from the group; and l. Align account management processes with personnel termination and transfer processes."
                }
              ]
            }
          ]
        },
        {
          "id": "si",
          "title": "System and Information Integrity",
          "controls": [
            {
              "id": "si-4",
              "title": "System Monitoring",
              "props": [
                {
                  "name": "label",
                  "value": "SI-4"
                }
              ],
              "parts": [
                {
                  "id": "si-4_smt",
                  "name": "statement",
                  "prose": "a. Monitor the system to detect: 1. Attacks and indicators of potential attacks in accordance with [Assignment: organization-defined monitoring objectives]; and 2. Unauthorized local, network, and remote connections; b. Identify unauthorized use of the system through [Assignment: organization-defined techniques and methods]; c. Invoke internal monitoring capabilities or deploy monitoring devices: 1. Strategically within the system to collect organization-determined essential information; and 2. At ad hoc locations within the system to track specific types of transactions of interest to the organization; d. Analyze detected events and anomalies; e. Adjust the level of system monitoring activity when there is a change in risk to organizational operations and assets, individuals, other organizations, or the Nation; f. Obtain legal opinion regarding system monitoring activities; and g. Provide [Assignment: organization-defined system monitoring information] to [Assignment: organization-defined personnel or roles] [Selection (one or more): as needed; [Assignment: organization-defined frequency]]."
                }
              ]
            }
          ]
        }
      ]
    }
  };

  await fs.mkdir(CATALOGS_DIR, { recursive: true });
  await fs.writeFile(
    path.join(CATALOGS_DIR, 'catalog.json'),
    JSON.stringify(catalog, null, 2)
  );
  console.log('Sample NIST 800-53 catalog created');
};

/**
 * Create a baseline profile in OSCAL format (simplified)
 */
const createSampleProfiles = async () => {
  // Moderate impact baseline
  const moderateProfile = {
    "profile": {
      "uuid": randomUUID(),
      "metadata": {
        "title": "Moderate Impact Baseline (Sample)",
        "last-modified": new Date().toISOString(),
        "version": "1.0",
        "oscal-version": "1.1.0"
      },
      "imports": [
        {
          "href": "../../../catalogs/nist.gov/SP800-53/catalog.json",
          "include-controls": [
            {
              "with-ids": ["ac-1", "ac-2", "si-4"]
            }
          ]
        }
      ],
      "modify": {
        "set-parameters": [
          {
            "param-id": "ac-1_prm_1",
            "values": ["organization-defined personnel or roles"]
          }
        ]
      }
    }
  };

  await fs.mkdir(PROFILES_DIR, { recursive: true });
  await fs.writeFile(
    path.join(PROFILES_DIR, 'moderate_baseline.json'),
    JSON.stringify(moderateProfile, null, 2)
  );
  console.log('Sample moderate impact baseline profile created');
};

/**
 * Create a sample SSP
 */
const createSampleSSP = async () => {
  const ssp = {
    "id": "sample-ssp",
    "uuid": randomUUID(),
    "metadata": {
      "title": "Sample System Security Plan",
      "lastModified": new Date().toISOString(),
      "version": "1.0",
      "oscalVersion": "1.1.0"
    },
    "systemCharacteristics": {
      "systemName": "Sample System",
      "description": "This is a sample system for testing purposes",
      "securityImpactLevel": "MODERATE",
      "status": "operational",
      "authorizationType": "oscal",
      "dateAuthorized": null
    },
    "controlImplementations": [
      {
        "controlId": "AC-1",
        "status": "IMPLEMENTED",
        "description": "We have implemented an access control policy that is documented in our organization's security policy manual. The policy addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance. The policy is reviewed and updated annually.",
        "responsibleRoles": ["security-team", "it-department"],
        "lastUpdated": new Date().toISOString()
      },
      {
        "controlId": "AC-2",
        "status": "PARTIALLY_IMPLEMENTED",
        "description": "We have account management procedures in place, but we are still working on implementing automated notifications when accounts are no longer required or when users are terminated.",
        "responsibleRoles": ["system-administrators"],
        "lastUpdated": new Date().toISOString()
      },
      {
        "controlId": "SI-4",
        "status": "PLANNED",
        "description": "System monitoring is planned but not yet implemented. We will be deploying an intrusion detection system in the next quarter.",
        "responsibleRoles": ["security-team"],
        "lastUpdated": new Date().toISOString()
      }
    ],
    "created": new Date().toISOString(),
    "updated": new Date().toISOString()
  };

  await fs.mkdir(SSP_DIR, { recursive: true });
  await fs.writeFile(
    path.join(SSP_DIR, 'sample-ssp.json'),
    JSON.stringify(ssp, null, 2)
  );
  console.log('Sample SSP created');
};

/**
 * Main function to set up all test data
 */
const setupTestData = async () => {
  try {
    console.log('Setting up test data...');
    
    // Create directories
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(SSP_DIR, { recursive: true });
    await fs.mkdir(OSCAL_CONTENT_DIR, { recursive: true });
    
    // Create sample data
    await createSampleCatalog();
    await createSampleProfiles();
    await createSampleSSP();
    
    console.log('Test data setup complete!');
  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
};

// Run the setup
setupTestData();