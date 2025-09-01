# Component and Test Cleanup Plan

## Identified Duplicates

### 1. ErrorPage Component
- **Duplicate Implementations**:
  - `src/components/error/error-page.js` - Extends LitElement
  - `src/components/error-page.js` - Extends BaseComponent

- **Multiple Test Files**:
  - `src/test/components/error-page.test.js` - Full test suite
  - `src/test/components/error-page-simple.test.js` - Simplified test
  - `src/test/components/error-page-minimal.test.js` - Minimal test

### 2. Toast Component
- **Duplicate Implementations**:
  - `src/components/ui/toast.js` - Basic implementation
  - `src/components/ui/toast/index.js` - Similar implementation in a folder structure
  - `src/components/organisms/toast.js` - Contains a `NeoToast` component
  - `src/components/molecules/toast/toast.js` - Contains another `NeoToast` component

- **Import References**:
  - `src/services/error-service.test.js` - Imports from `../components/ui/toast/index.js`
  - `src/services/error-service.js` - Imports from `../components/ui/toast/index.js`
  - `src/services/upload.js` - Imports from `../components/ui/toast.js`
  - `src/services/offline.js` - Imports from `../components/ui/toast.js`
  - `src/components/pages/auth/login-page.js` - Imports from `../../components/ui/toast.js`
  - `src/components/pages/auth/register-page.js` - Imports from `../../components/ui/toast.js`

## Cleanup Approach

### General Strategy
1. Identify the most complete and up-to-date implementation
2. Merge any unique functionality from the duplicate into the primary implementation
3. Update imports across the codebase to use the primary implementation
4. Remove the duplicate files
5. Consolidate tests to avoid redundancy

### ErrorPage Component Cleanup
1. **Choose Primary Implementation**:
   - `src/components/error/error-page.js` appears to be the more complete implementation with better error handling

2. **Merge Functionality**:
   - Incorporate any unique features from `src/components/error-page.js` into the primary implementation
   - Ensure all properties and methods are preserved

3. **Update Imports**:
   - No direct imports found, but we should check for any dynamic imports or references

4. **Consolidate Tests**:
   - Merge the test cases from all three test files into a single comprehensive test file
   - Ensure all functionality is properly tested
   - Remove the redundant test files

### Toast Component Cleanup
1. **Choose Primary Implementation**:
   - `src/components/ui/toast/index.js` appears to be the more structured implementation and is already imported in multiple places

2. **Merge Functionality**:
   - Incorporate any unique features from other toast implementations into the primary implementation
   - Ensure all properties and methods are preserved

3. **Update Imports**:
   - Update the following files to use the primary implementation:
     - `src/services/upload.js`
     - `src/services/offline.js`
     - `src/components/pages/auth/login-page.js`
     - `src/components/pages/auth/register-page.js`

4. **Remove Duplicates**:
   - Remove the following files after ensuring all functionality is preserved:
     - `src/components/ui/toast.js`
     - `src/components/organisms/toast.js` (if it's a duplicate)
     - `src/components/molecules/toast/toast.js` (if it's a duplicate)

## Implementation Steps

1. ✅ Create backup branches before making changes
2. ✅ Update primary implementations with merged functionality
3. ✅ Run tests to ensure everything still works
4. ✅ Update imports across the codebase
5. ✅ Remove duplicate files
6. ✅ Run full test suite to verify everything still works
7. ✅ Document the changes in the project documentation

## Detailed Implementation Plan

### Step 1: ErrorPage Component Consolidation
1. ✅ Compare both implementations and create a consolidated version in `src/components/error/error-page.js`
2. ✅ Update the consolidated implementation to include all features from both versions
3. ✅ Run tests to ensure the consolidated component works correctly
4. ✅ Update imports to use the consolidated implementation
5. ✅ Remove the duplicate implementation

### Step 2: Toast Component Consolidation
1. ✅ Compare all toast implementations and create a consolidated version in `src/components/ui/toast/index.js`
2. ✅ Update the consolidated implementation to include all features from all versions
3. ✅ Update all import references to use the consolidated implementation
4. ✅ Run tests to ensure the consolidated component works correctly
5. ✅ Remove the duplicate implementations

## Future Prevention

1. Establish clear component organization guidelines
2. Implement a component registry to prevent duplicates
3. Use linting rules to detect potential duplicates
4. Regular codebase audits to identify and clean up duplicates
5. Document component locations in a central registry
