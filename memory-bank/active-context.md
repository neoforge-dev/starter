# Active Context

## Current Focus

We are currently working on modernizing the frontend components by replacing decorator syntax with standard class syntax to ensure compatibility with modern browsers and build tools. This involves:

1. Identifying components that use decorator syntax
2. Refactoring them to use standard class syntax
3. Ensuring all tests pass after refactoring
4. Documenting the changes

## Recent Changes

- Successfully refactored the phone-input component to use standard class syntax
- Fixed various issues with the phone-input component:
  - Corrected country code handling
  - Improved phone number formatting for different countries
  - Enhanced validation logic
  - Added support for international format
  - Fixed error message display
  - Ensured all tests pass
- Successfully refactored the pagination component to use standard class syntax
  - Implemented proper page number generation
  - Fixed navigation button states
  - Added support for different sibling and boundary counts
  - Ensured all tests pass
- Successfully refactored the tabs component to use standard class syntax
  - Implemented keyboard navigation for horizontal and vertical orientations
  - Fixed accessibility attributes for ARIA compliance
  - Improved tab panel rendering and content display
  - Added support for empty tabs handling
  - Ensured all tests pass
- Successfully refactored the table component to use standard class syntax
  - Fixed filtering functionality to properly filter by column values
  - Improved sorting and pagination mechanisms
  - Enhanced text formatting for page information display
  - Ensured all tests pass by addressing whitespace normalization in tests
- Successfully refactored the form-validation component to use standard class syntax
  - Fixed error handling and validation logic
  - Improved required field validation
  - Ensured all tests pass
- Successfully refactored the language-selector component to use standard class syntax
  - Fixed event detail structure to match test expectations
  - Implemented keyboard navigation for accessibility
  - Updated class names to match test expectations
  - Ensured all tests pass
- Successfully refactored the data-table component to use standard class syntax
  - Fixed filtering functionality to properly filter by field and value
  - Improved sorting mechanism with proper data attributes
  - Enhanced pagination controls with proper class names
  - Added proper data attributes for testing
  - Fixed row selection event handling
  - Ensured all tests pass
- Successfully refactored the file-upload component to use standard class syntax
  - Fixed import issues by replacing CDN imports with local imports
  - Improved file validation for size and type
  - Enhanced drag and drop functionality
  - Ensured all tests pass

## Next Steps

1. Continue refactoring other components that use decorator syntax:
   - autoform component

2. Address deprecation warnings for @open-wc/semantic-dom-diff in the test environment

3. Consider configuring Lit to run in production mode during tests to eliminate dev mode warnings

## Active Decisions

- We're using standard class syntax instead of decorators for better compatibility
- We're maintaining backward compatibility where possible
- We're ensuring all tests pass after each refactoring
- We're following the "make it work, make it right, make it fast" approach

## Technical Considerations

- Some components may require significant changes to work without decorators
- Test files may need updates to accommodate the new syntax
- We need to be careful about maintaining the same API and behavior
- Memory issues during testing need to be addressed

## Decisions

- Use manual event triggering for animations and transitions in tests
- Implement custom mocks for browser APIs (localStorage, matchMedia)
- Run tests individually to mitigate memory issues
- Increase memory allocation for Node.js during test runs
- Replace decorators with standard class syntax for better compatibility
- Standardize on static properties for component properties
- Implement keyboard navigation for accessibility in interactive components
- Use responsive design patterns for mobile layouts

## Active Decisions
- Need to standardize component property naming conventions
- Tests should account for conditional rendering in components
- Consider adding whitespace trimming in components rather than tests
- Should establish consistent test setup patterns
- Consider adding timeout mechanisms for tests that might hang
- Need to mock browser APIs for testing environment
- Implement a standard approach for handling browser APIs in tests:
  - Create a test-helpers.js file with common mocks
  - Add setup and teardown functions for test suites

## Current Challenges
- Test execution sometimes hangs, particularly with badge.test.js
- API client tests failing with session expiration errors:
  - Tests expect AppError to be thrown when 401 is received
  - Error occurs when dispatching the "auth-expired" event
  - localStorage.removeItem("neo-auth-token") may not be working as expected in test environment
- Theme transition tests failing due to missing window.matchMedia:
  - Error occurs in ThemeToggleButton constructor at line 137
  - JSDOM doesn't implement window.matchMedia natively
- Checkbox component tests failing with rendering issues:
  - Default properties test failing, suggesting initialization issues
  - State change reflection test failing, suggesting update lifecycle issues
- Test workers hitting memory limits
- Inconsistent property naming across components
- Multiple skipped test suites
- Tests expecting behavior that doesn't match component implementation

## Notes
- Badge component has been updated to handle both direct text content and slotted content
- Toast component tests now passing after fixing animation timing
- Input component atoms/input.test.js now passing after fixing whitespace issue
- Main input.test.js still has multiple failures beyond whitespace issues
- Helper text in NeoInput is not rendered when error is present (by design)
- NeoInput component missing implementation for reportValidity, aria-required, etc.
- JSDOM environment has limitations for browser APIs like matchMedia
- API client is correctly handling 401 responses by:
  - Removing auth token from localStorage
  - Dispatching "auth-expired" event
  - Throwing AppError with appropriate message
- Theme toggle component uses window.matchMedia to detect reduced motion preferences
- Dashboard page component now fully implements all features required by tests:
  - Task filtering, sorting, and search
  - Task status and priority updates
  - Task assignment to users
  - Mobile responsive layout with sidebar
  - Keyboard navigation for accessibility
  - Notifications panel
  - User profile display
  - Task statistics

## Current Work Focus
- Investigating test execution hanging issues
- Fixing failing frontend tests, particularly focusing on the API client and theme transition components
- Ensuring tests match component behavior or updating components to match expected behavior
- Addressing environment-specific issues in tests
- Fixing conditional rendering issues in components
- Implementing missing features in components to match test expectations

## Active Decisions and Considerations
1. **Component Patterns**:
   - Using Lit 4.0 web components for frontend
   - Following atomic design principles for component organization
   - Prioritizing browser-native features over framework features
   - Ensuring components are well-tested and documented
   - Implementing accessibility features like keyboard navigation

2. **Testing Strategy**:
   - Run tests with `npm run test:unit` for frontend components
   - Fix failures one at a time before moving to the next issue
   - Update tests to match component behavior when appropriate
   - Focus on event handling and component lifecycle tests
   - Consider adding timeout mechanisms for tests that might hang
   - Mock browser APIs for testing environment
   - Create a standard test setup file with common mocks and utilities

3. **Performance Optimization**:
   - Monitoring bundle size during development
   - Implementing code splitting and dynamic imports
   - Ensuring PWA features work correctly
   - Testing performance on various devices and network conditions
   - Address inefficient update warnings in components

4. **PWA Implementation**:
   - Adding service worker for offline support
   - Implementing web manifest
   - Setting up push notifications
   - Adding install prompts for better user experience

## Current Development Environment
- Using Docker for development
- Frontend with hot-reload for rapid feedback
- Backend with FastAPI for API development
- Local database for testing and development 
- JSDOM for component testing (with limitations)
- Vitest for running unit tests 