# OSCAL Content Directory

This directory contains OSCAL (Open Security Controls Assessment Language) content used by the NIST 800-53 OSCAL Server, organized to support multiple security control frameworks and custom extensions.

## Directory Structure

```
oscal-content/
  ├── catalogs/                  # Standard OSCAL catalogs (NIST, ISO, etc.)
  │   └── nist.gov/
  │       └── SP800-53/          # NIST 800-53 control catalog
  │           └── catalog.json   # Official NIST 800-53 controls in OSCAL format
  │
  ├── profiles/                  # Standard profiles (baselines)
  │   └── fedramp/               # FedRAMP profiles
  │       └── fedramp_moderate.json  # FedRAMP Moderate baseline
  │
  ├── extensions/                # Custom extensions organized by framework
  │   └── nist-800-53/           # Extensions specific to NIST 800-53
  │       └── cloud-native/      # Cloud-native implementation guidance
  │           └── cloud-native-controls.json  # Cloud-native control implementations
  │
  └── index/                     # Legacy directory (for backward compatibility)
```

## Content Types

### Catalogs

The `catalogs/` directory contains official control catalogs represented in OSCAL format. These are the authoritative sources of security controls like NIST 800-53. Each catalog is organized by source organization and publication.

### Profiles

The `profiles/` directory contains baseline profiles that select and tailor controls from catalogs for specific compliance frameworks like FedRAMP. These profiles define which controls are required for a given compliance level.

### Extensions

The `extensions/` directory contains custom extensions to standard catalogs, organized by framework:

- `nist-800-53/cloud-native/`: Cloud-native implementation guidance for NIST 800-53 controls
  - `cloud-native-controls.json`: Provides cloud-native specific implementation guidance, examples, and validation criteria for NIST 800-53 controls

This structure allows for extending different control frameworks with specialized guidance while maintaining separation between official control definitions and custom extensions.

## Mapping Between Content Types

1. **Catalogs → Profiles**: Profiles reference controls from catalogs, specifying which controls are required for a given compliance framework.

2. **Catalogs → Extensions**: Extensions reference controls from catalogs, providing additional guidance without modifying the original control definitions.

3. **Profiles + Extensions → SSPs**: System Security Plans (SSPs) use both the control requirements from profiles and the implementation guidance from extensions to document how systems satisfy control requirements.

## Using the Content

In the MCP server, various services access this content:

- `oscalService.js`: Accesses standard OSCAL catalogs and profiles
- `fedrampControlsService.js`: Accesses cloud-native control extensions
- `sspService.js`: Creates and manages SSPs based on profiles and extensions

## Adding New Control Frameworks

To add support for a new control framework:

1. Add the official catalog to `catalogs/[source]/[framework]/`
2. Add any profiles to `profiles/[framework]/`
3. Create extension directories at `extensions/[framework-id]/`
4. Add implementation guidance to the appropriate extension directory

## File Formats

All content files use JSON format following OSCAL schemas or compatible extensions of OSCAL for custom guidance.