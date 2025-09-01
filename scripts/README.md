# NeoForge Navigation Scripts

## Documentation Navigator CLI

**`nav.py`** - CLI tool for quick navigation to project documentation.

### Usage

```bash
# Show all available sections and workflows
python scripts/nav.py help

# View specific section details
python scripts/nav.py section getting_started
python scripts/nav.py section architecture
python scripts/nav.py section testing

# View workflow file lists
python scripts/nav.py workflow new_developer_onboarding
python scripts/nav.py workflow feature_development

# Open canonical documentation files
python scripts/nav.py open system_architecture
python scripts/nav.py open backend_testing

# Check documentation consolidation status
python scripts/nav.py status
```

### Examples

```bash
# Quick start for new developers
python scripts/nav.py workflow new_developer_onboarding

# Find testing documentation
python scripts/nav.py section testing

# Open main architecture document
python scripts/nav.py open system_architecture
```

### Features

- **Section Navigation**: Browse documentation by topic
- **Workflow Guidance**: Step-by-step file lists for common tasks
- **Single Source Lookup**: Quick access to canonical documents
- **Status Reporting**: Documentation consolidation metrics
- **Editor Integration**: Automatically opens files in available editors

### Navigation Index Files

- **`NAVIGATION_INDEX.md`** - Human-readable documentation map
- **`NAVIGATION_INDEX.json`** - Structured data for programmatic access
- **`scripts/nav.py`** - CLI navigation tool

---

*Part of the NeoForge documentation consolidation system*
