.
├── CHANGELOG.md
├── CLAUDE.md
├── CODE_OF_CONDUCT.md
├── README.md
├── TODO.md
├── agentMode.js
├── agentMode.test.js
├── app
│   ├── api
│   │   └── middleware
│   │       └── validation.py
│   └── core
│       ├── config.py
│       ├── email_templates.py
│       └── metrics.py
├── backend
│   ├── README.md
│   ├── TESTING.md
│   ├── alembic
│   │   ├── env.py
│   │   └── versions
│   │       ├── 20250216_1538_10dde5a7dde1_initial.py
│   │       ├── 20250302_1317_c9b3dee5ebce_create_tables.py
│   │       └── 20250302_1353_5f00d7881d03_create_tables_with_models.py
│   ├── app
│   │   ├── __init__.py
│   │   ├── api
│   │   │   ├── deps.py
│   │   │   ├── endpoints
│   │   │   │   ├── examples.py
│   │   │   │   ├── health.py
│   │   │   │   └── metrics.py
│   │   │   ├── health.py
│   │   │   ├── middleware
│   │   │   │   ├── __init__.py
│   │   │   │   ├── rate_limit.py
│   │   │   │   ├── security.py
│   │   │   │   └── validation.py
│   │   │   ├── middleware.py
│   │   │   └── v1
│   │   │       ├── api.py
│   │   │       └── endpoints
│   │   │           ├── admin.py
│   │   │           ├── auth.py
│   │   │           ├── items.py
│   │   │           └── users.py
│   │   ├── core
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── cache.py
│   │   │   ├── celery.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── email.py
│   │   │   ├── email_templates.py
│   │   │   ├── logging.py
│   │   │   ├── metrics.py
│   │   │   ├── middleware.py
│   │   │   ├── ml.py
│   │   │   ├── queue.py
│   │   │   ├── redis.py
│   │   │   └── security.py
│   │   ├── crud
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── base.py
│   │   │   ├── email_tracking.py
│   │   │   ├── item.py
│   │   │   └── user.py
│   │   ├── db
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── base_class.py
│   │   │   ├── init_db.py
│   │   │   ├── metrics.py
│   │   │   ├── query_monitor.py
│   │   │   ├── session.py
│   │   │   └── types.py
│   │   ├── main.py
│   │   ├── migrations
│   │   │   ├── env.py
│   │   │   └── versions
│   │   │       └── 20250208_2233_557ac051c599_initial_schema.py
│   │   ├── models
│   │   │   ├── admin.py
│   │   │   ├── email_tracking.py
│   │   │   ├── item.py
│   │   │   └── user.py
│   │   ├── schemas
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── common.py
│   │   │   ├── email_tracking.py
│   │   │   ├── item.py
│   │   │   ├── token.py
│   │   │   └── user.py
│   │   ├── utils
│   │   │   └── datetime.py
│   │   └── worker
│   │       ├── README.md
│   │       ├── email_worker.py
│   │       └── run_worker.py
│   ├── coverage_html
│   │   ├── coverage_html_cb_6fb7b396.js
│   │   └── style_cb_8e611ae1.css
│   ├── docker
│   │   └── postgres
│   │       └── init-test-db.sh
│   ├── docker-compose.dev.yml
│   ├── htmlcov
│   │   ├── coverage_html.js
│   │   ├── coverage_html_cb_6fb7b396.js
│   │   ├── style.css
│   │   └── style_cb_8e611ae1.css
│   ├── metrics_updated.py
│   ├── run_metrics_test.py
│   ├── scripts
│   │   ├── create_test_db.py
│   │   ├── fix_postgres_collation.sh
│   │   ├── init_test_env.sh
│   │   ├── migrate.sh
│   │   ├── run_db_tests.sh
│   │   ├── run_tests.sh
│   │   ├── run_tests_fixed.sh
│   │   └── wait-for-db.sh
│   ├── src
│   │   └── routes
│   │       └── docs.py
│   ├── standalone_test_auth.py
│   ├── standalone_test_middleware.py
│   ├── standalone_test_security.py
│   └── tests
│       ├── README.md
│       ├── TESTING.md
│       ├── api
│       │   ├── test_admin.py
│       │   ├── test_admin_router.py
│       │   ├── test_auth.py
│       │   ├── test_deps.py
│       │   ├── test_examples.py
│       │   ├── test_items.py
│       │   ├── test_middleware.py
│       │   ├── test_rate_limit.py
│       │   ├── test_security_middleware.py
│       │   ├── test_users.py
│       │   └── test_validation_middleware.py
│       ├── conftest.py
│       ├── core
│       │   ├── simple_test_auth.py
│       │   ├── test_cache.py
│       │   ├── test_celery.py
│       │   ├── test_config.py
│       │   ├── test_core_metrics.py
│       │   ├── test_database.py
│       │   ├── test_email.py
│       │   ├── test_email_templates.py
│       │   ├── test_logging.py
│       │   ├── test_metrics.py
│       │   ├── test_ml.py
│       │   ├── test_queue.py
│       │   ├── test_redis.py
│       │   └── test_security.py
│       ├── crud
│       │   ├── test_base.py
│       │   ├── test_email_tracking.py
│       │   └── test_user.py
│       ├── db
│       │   ├── __init__.py
│       │   ├── test_metrics.py
│       │   ├── test_session.py
│       │   └── test_types.py
│       ├── factories.py
│       ├── init_test_db.py
│       ├── test_admin_endpoints.py
│       ├── test_config_simple.py
│       ├── test_datetime_simple.py
│       ├── test_db
│       │   ├── README.md
│       │   ├── test_crud_operations.py
│       │   ├── test_database_connection.py
│       │   └── test_relationships.py
│       ├── test_factories.py
│       ├── test_health.py
│       ├── test_metrics_simple.py
│       ├── test_metrics_standalone.py
│       ├── test_security_simple.py
│       ├── test_simple.py
│       ├── utils
│       │   └── test_datetime.py
│       └── worker
│           └── test_email_worker.py
├── create-storybook-files.js
├── cursor-agent-prompt.md
├── deploy
│   ├── alertmanager
│   │   └── alertmanager.yml
│   ├── docker-compose.monitoring.yml
│   ├── grafana
│   │   └── provisioning
│   │       ├── dashboards
│   │       │   └── dashboards.yml
│   │       └── datasources
│   │           └── prometheus.yml
│   └── prometheus
│       ├── prometheus.yml
│       └── rules
│           └── alerts.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── docker-compose.test.yml
├── docker-compose.yml
├── docs
│   ├── README.md
│   ├── adr
│   │   └── README.md
│   ├── api
│   │   └── README.md
│   ├── architecture.md
│   ├── backend
│   │   └── README.md
│   ├── best-practices.md
│   ├── costs.md
│   ├── database
│   │   └── README.md
│   ├── deployment
│   │   └── README.md
│   ├── deployment.md
│   ├── development-plan.md
│   ├── frontend
│   │   ├── README.md
│   │   └── adr
│   │       ├── 0001-use-lit-elements.md
│   │       ├── 0002-no-build-tooling.md
│   │       ├── 0003-pwa-first.md
│   │       ├── 0004-authentication-strategy.md
│   │       ├── README.md
│   │       └── template.md
│   ├── getting-started.md
│   ├── infrastructure
│   │   └── README.md
│   ├── monitoring.md
│   └── tree.md
├── frontend
│   ├── DEVELOPER_EXPERIENCE.md
│   ├── DEVELOPMENT_STATUS.md
│   ├── README.md
│   ├── TODO.md
│   ├── build
│   │   └── plugins
│   │       └── critical-css.js
│   ├── coverage
│   │   ├── base.css
│   │   ├── block-navigation.js
│   │   ├── lcov-report
│   │   │   ├── base.css
│   │   │   ├── block-navigation.js
│   │   │   ├── prettify.css
│   │   │   ├── prettify.js
│   │   │   └── sorter.js
│   │   ├── prettify.css
│   │   ├── prettify.js
│   │   └── sorter.js
│   ├── create-storybook-files.js
│   ├── custom-elements.config.js
│   ├── docker-compose.prod.yml
│   ├── docker-compose.yml
│   ├── docs
│   │   ├── ATOMIC_DESIGN.md
│   │   ├── CLEANUP_PLAN.md
│   │   ├── COMPONENT_REGISTRY.md
│   │   ├── MOCK_COMPONENT_TESTING.md
│   │   ├── PATTERN_LIBRARY.md
│   │   ├── PERFORMANCE_POLYFILL.md
│   │   ├── TESTING.md
│   │   ├── api
│   │   │   ├── README.md
│   │   │   ├── services
│   │   │   │   └── analytics.md
│   │   │   └── testing
│   │   │       └── performance-testing.md
│   │   ├── browser-support-matrix.md
│   │   ├── browser-support.md
│   │   ├── getting-started.md
│   │   ├── guides
│   │   │   └── deployment.md
│   │   ├── infrastructure
│   │   │   └── architecture.md
│   │   ├── performance-polyfill.md
│   │   ├── testing
│   │   │   ├── dom-mocking.md
│   │   │   ├── mocking-components.md
│   │   │   └── test-migration.md
│   │   ├── testing-guide.md
│   │   └── testing-web-components.md
│   ├── js
│   │   └── components
│   │       └── app-shell.js
│   ├── memory-bank
│   │   ├── active-context.md
│   │   ├── product-context.md
│   │   └── project-brief.md
│   ├── playwright.a11y.config.js
│   ├── playwright.config.js
│   ├── playwright.e2e.config.js
│   ├── playwright.visual.config.js
│   ├── public
│   │   └── docs
│   │       ├── architecture.md
│   │       ├── components.md
│   │       ├── getting-started.md
│   │       └── installation.md
│   ├── run-tests.sh
│   ├── scripts
│   │   ├── build.js
│   │   ├── eslint-plugin-component-registry
│   │   │   ├── README.md
│   │   │   └── index.js
│   │   ├── fast-test.js
│   │   ├── fix-deprecations.js
│   │   ├── fix-figspec.js
│   │   ├── fix-stories.js
│   │   ├── fix-tests.js
│   │   ├── generate-icons.js
│   │   ├── migrate-tests.js
│   │   ├── mock-templates
│   │   │   └── basic.js
│   │   ├── patch-figspec.js
│   │   ├── run-single-test.js
│   │   ├── run-working-tests.js
│   │   ├── setup-component-registry.js
│   │   └── setup-vendor.js
│   ├── service-worker.js
│   ├── src
│   │   ├── app.js
│   │   ├── components
│   │   │   ├── Card.js
│   │   │   ├── accessibility
│   │   │   │   └── accessibility-dashboard.js
│   │   │   ├── analytics
│   │   │   │   ├── analytics-dashboard.js
│   │   │   │   ├── error-log.js
│   │   │   │   ├── performance-chart.js
│   │   │   │   └── user-behavior.js
│   │   │   ├── app-shell.js
│   │   │   ├── atomic-reorganize.sh
│   │   │   ├── atoms
│   │   │   │   ├── badge
│   │   │   │   │   ├── badge.js
│   │   │   │   │   ├── badge.stories.fixed.js
│   │   │   │   │   └── badge.stories.js
│   │   │   │   ├── badge.stories.js
│   │   │   │   ├── button
│   │   │   │   │   ├── button.js
│   │   │   │   │   ├── button.stories.fixed.js
│   │   │   │   │   └── button.stories.js
│   │   │   │   ├── button.stories.js
│   │   │   │   ├── checkbox
│   │   │   │   │   ├── checkbox.js
│   │   │   │   │   └── checkbox.stories.js
│   │   │   │   ├── checkbox.stories.js
│   │   │   │   ├── dropdown.js
│   │   │   │   ├── dropdown.stories.js
│   │   │   │   ├── icon
│   │   │   │   │   ├── icon.js
│   │   │   │   │   ├── icon.stories.js
│   │   │   │   │   └── icons.js
│   │   │   │   ├── index.js
│   │   │   │   ├── input
│   │   │   │   │   ├── input.js
│   │   │   │   │   └── input.stories.js
│   │   │   │   ├── input.stories.js
│   │   │   │   ├── link
│   │   │   │   │   ├── link.js
│   │   │   │   │   └── link.stories.js
│   │   │   │   ├── progress
│   │   │   │   │   ├── progress-bar.js
│   │   │   │   │   └── progress-bar.stories.js
│   │   │   │   ├── radio
│   │   │   │   │   ├── radio.js
│   │   │   │   │   └── radio.stories.js
│   │   │   │   ├── radio.stories.js
│   │   │   │   ├── select
│   │   │   │   │   ├── select.js
│   │   │   │   │   └── select.stories.js
│   │   │   │   ├── spinner
│   │   │   │   │   ├── spinner.js
│   │   │   │   │   └── spinner.stories.js
│   │   │   │   ├── spinner.stories.js
│   │   │   │   ├── text-input
│   │   │   │   │   ├── text-input.js
│   │   │   │   │   └── text-input.stories.js
│   │   │   │   └── tooltip
│   │   │   │       ├── tooltip.js
│   │   │   │       └── tooltip.stories.js
│   │   │   ├── auth
│   │   │   │   ├── auth-modal.js
│   │   │   │   ├── login-form.js
│   │   │   │   ├── signup-form.js
│   │   │   │   └── verify-email.js
│   │   │   ├── autoform.js
│   │   │   ├── base-component.js
│   │   │   ├── code
│   │   │   │   └── code-snippet.js
│   │   │   ├── core
│   │   │   │   ├── app-footer.js
│   │   │   │   ├── app-header.js
│   │   │   │   ├── app-shell.js
│   │   │   │   ├── error-boundary.js
│   │   │   │   ├── loading-indicator.js
│   │   │   │   ├── memory-monitor.js
│   │   │   │   ├── memory-monitor.test.js
│   │   │   │   ├── optimized-image.js
│   │   │   │   └── pwa-prompt.js
│   │   │   ├── data
│   │   │   │   ├── tree-view.js
│   │   │   │   └── tree-view.stories.js
│   │   │   ├── docs
│   │   │   │   ├── doc-nav.js
│   │   │   │   ├── doc-search.js
│   │   │   │   ├── doc-viewer.js
│   │   │   │   ├── documentation-content.js
│   │   │   │   ├── documentation-page.js
│   │   │   │   └── markdown-viewer.js
│   │   │   ├── error
│   │   │   │   └── error-page.js
│   │   │   ├── footer.js
│   │   │   ├── form
│   │   │   │   ├── autoform.js
│   │   │   │   ├── autoform.stories.js
│   │   │   │   ├── color-picker.js
│   │   │   │   ├── color-picker.stories.js
│   │   │   │   ├── rating.js
│   │   │   │   └── rating.stories.js
│   │   │   ├── header.js
│   │   │   ├── index.js
│   │   │   ├── interaction
│   │   │   │   ├── drag-drop.js
│   │   │   │   └── drag-drop.stories.js
│   │   │   ├── layout
│   │   │   │   ├── layout.js
│   │   │   │   └── layout.stories.js
│   │   │   ├── marketing
│   │   │   │   ├── bento-grid.js
│   │   │   │   ├── bento-grid.stories.js
│   │   │   │   ├── faq-accordion.js
│   │   │   │   ├── faq-accordion.stories.js
│   │   │   │   ├── hero.js
│   │   │   │   ├── hero.stories.js
│   │   │   │   ├── pricing-tables.js
│   │   │   │   ├── pricing-tables.stories.js
│   │   │   │   ├── testimonials.js
│   │   │   │   └── testimonials.stories.js
│   │   │   ├── molecules
│   │   │   │   ├── alert
│   │   │   │   │   ├── alert.js
│   │   │   │   │   └── alert.stories.js
│   │   │   │   ├── breadcrumbs.js
│   │   │   │   ├── breadcrumbs.stories.js
│   │   │   │   ├── card
│   │   │   │   │   ├── card.js
│   │   │   │   │   ├── card.stories.fixed.js
│   │   │   │   │   └── card.stories.js
│   │   │   │   ├── card.js
│   │   │   │   ├── date-picker.js
│   │   │   │   ├── date-picker.stories.js
│   │   │   │   ├── index.js
│   │   │   │   ├── language-selector.js
│   │   │   │   ├── language-selector.stories.js
│   │   │   │   ├── modal
│   │   │   │   │   ├── modal.js
│   │   │   │   │   └── modal.stories.js
│   │   │   │   ├── phone-input.js
│   │   │   │   ├── phone-input.stories.js
│   │   │   │   ├── select.js
│   │   │   │   ├── select.stories.js
│   │   │   │   ├── tabs.js
│   │   │   │   ├── tabs.stories.js
│   │   │   │   └── toast
│   │   │   │       ├── toast.js
│   │   │   │       └── toast.stories.js
│   │   │   ├── navigation
│   │   │   │   ├── sidebar.js
│   │   │   │   └── sidebar.stories.js
│   │   │   ├── organisms
│   │   │   │   ├── charts.js
│   │   │   │   ├── charts.stories.js
│   │   │   │   ├── data-table.js
│   │   │   │   ├── data-table.stories.js
│   │   │   │   ├── file-upload.js
│   │   │   │   ├── file-upload.stories.js
│   │   │   │   ├── form-validation.js
│   │   │   │   ├── form.js
│   │   │   │   ├── form.stories.js
│   │   │   │   ├── index.js
│   │   │   │   ├── modal-dialog.js
│   │   │   │   ├── modal-dialog.stories.js
│   │   │   │   ├── modal.js
│   │   │   │   ├── modal.stories.js
│   │   │   │   ├── pagination.js
│   │   │   │   ├── pagination.stories.js
│   │   │   │   ├── rich-text-editor.js
│   │   │   │   ├── rich-text-editor.stories.js
│   │   │   │   ├── table
│   │   │   │   │   ├── table.js
│   │   │   │   │   ├── table.stories.js
│   │   │   │   │   └── table.test.js
│   │   │   │   └── toast.stories.js
│   │   │   ├── pages
│   │   │   │   ├── 404-page.js
│   │   │   │   ├── auth
│   │   │   │   │   ├── login-page.js
│   │   │   │   │   └── register-page.js
│   │   │   │   ├── blog-page.js
│   │   │   │   ├── community-page.js
│   │   │   │   ├── components-page.js
│   │   │   │   ├── contact-page.js
│   │   │   │   ├── contact-page.stories.js
│   │   │   │   ├── dashboard-page.js
│   │   │   │   ├── dashboard-page.stories.js
│   │   │   │   ├── docs-page.js
│   │   │   │   ├── docs-page.stories.js
│   │   │   │   ├── examples-page.js
│   │   │   │   ├── examples-page.stories.js
│   │   │   │   ├── faq-page.stories.js
│   │   │   │   ├── forgot-password-page.js
│   │   │   │   ├── home-page.js
│   │   │   │   ├── index.js
│   │   │   │   ├── landing-page.js
│   │   │   │   ├── landing-page.stories.js
│   │   │   │   ├── login-page.js
│   │   │   │   ├── login-page.stories.js
│   │   │   │   ├── not-found-page.js
│   │   │   │   ├── profile-page.js
│   │   │   │   ├── profile-page.stories.js
│   │   │   │   ├── projects-page.js
│   │   │   │   ├── reset-password-page.js
│   │   │   │   ├── settings-page.js
│   │   │   │   ├── settings-page.stories.js
│   │   │   │   ├── signup-page.js
│   │   │   │   ├── status-page.js
│   │   │   │   ├── status-page.stories.js
│   │   │   │   ├── support-page.js
│   │   │   │   ├── tutorials-page.js
│   │   │   │   ├── tutorials-page.stories.js
│   │   │   │   └── verify-email-page.js
│   │   │   ├── performance
│   │   │   │   └── performance-dashboard.js
│   │   │   ├── playground
│   │   │   │   └── component-playground.js
│   │   │   ├── router
│   │   │   │   └── transition-manager.js
│   │   │   ├── services
│   │   │   │   ├── api.js
│   │   │   │   └── auth.js
│   │   │   ├── styles
│   │   │   │   ├── base.js
│   │   │   │   └── critical.css
│   │   │   ├── templates
│   │   │   │   └── index.js
│   │   │   ├── theme
│   │   │   │   └── theme-provider.js
│   │   │   ├── theme-toggle.js
│   │   │   ├── tokens
│   │   │   │   └── design-tokens.js
│   │   │   ├── ui
│   │   │   │   ├── data-table
│   │   │   │   │   ├── data-table.js
│   │   │   │   │   └── index.js
│   │   │   │   ├── data-table.js
│   │   │   │   ├── file-upload
│   │   │   │   │   └── index.js
│   │   │   │   ├── file-upload.js
│   │   │   │   ├── form
│   │   │   │   │   └── index.js
│   │   │   │   ├── form-validation
│   │   │   │   │   └── index.js
│   │   │   │   ├── form-validation.js
│   │   │   │   ├── form.js
│   │   │   │   ├── language-selector
│   │   │   │   │   └── index.js
│   │   │   │   ├── language-selector.js
│   │   │   │   ├── modal.js
│   │   │   │   ├── navigation
│   │   │   │   │   └── index.js
│   │   │   │   ├── navigation.js
│   │   │   │   ├── pagination
│   │   │   │   │   └── index.js
│   │   │   │   ├── pagination.js
│   │   │   │   ├── phone-input
│   │   │   │   │   └── index.js
│   │   │   │   ├── phone-input.js
│   │   │   │   ├── tabs
│   │   │   │   │   └── index.js
│   │   │   │   ├── tabs.js
│   │   │   │   └── toast
│   │   │   │       └── index.js
│   │   │   ├── update-imports.sh
│   │   │   └── utils
│   │   │       └── logger.js
│   │   ├── config
│   │   │   ├── routes.js
│   │   │   └── security.js
│   │   ├── docs
│   │   │   ├── components
│   │   │   │   └── memory-monitor.md
│   │   │   ├── contributing.md
│   │   │   └── guides
│   │   │       └── deployment.md
│   │   ├── main.js
│   │   ├── middleware
│   │   │   └── security.js
│   │   ├── mixins
│   │   │   ├── error.js
│   │   │   ├── form-validation.js
│   │   │   ├── loading.js
│   │   │   └── translation.js
│   │   ├── pages
│   │   │   ├── 404-page.js
│   │   │   ├── about-page.js
│   │   │   ├── blog-page.js
│   │   │   ├── community-page.js
│   │   │   ├── components-page.js
│   │   │   ├── contact-page.js
│   │   │   ├── dashboard-page.js
│   │   │   ├── docs-page.js
│   │   │   ├── documentation-page.js
│   │   │   ├── examples-page.js
│   │   │   ├── faq-page.js
│   │   │   ├── home-page.js
│   │   │   ├── landing-page.js
│   │   │   ├── login-page.js
│   │   │   ├── playground-page.js
│   │   │   ├── pricing-page.js
│   │   │   ├── profile-page.js
│   │   │   ├── projects-page.js
│   │   │   ├── registration-page.js
│   │   │   ├── search-page.js
│   │   │   ├── settings-page.js
│   │   │   ├── status-page.js
│   │   │   ├── support-page.js
│   │   │   └── tutorials-page.js
│   │   ├── router.js
│   │   ├── service-worker.js
│   │   ├── services
│   │   │   ├── accessibility-monitor.js
│   │   │   ├── analytics.js
│   │   │   ├── api-client.js
│   │   │   ├── api.js
│   │   │   ├── auth-service.js
│   │   │   ├── auth.js
│   │   │   ├── docs.js
│   │   │   ├── error-service.js
│   │   │   ├── error-service.test.js
│   │   │   ├── i18n.js
│   │   │   ├── image-optimizer.js
│   │   │   ├── modal-service.js
│   │   │   ├── notifications.js
│   │   │   ├── offline.js
│   │   │   ├── performance-monitor.js
│   │   │   ├── pwa.js
│   │   │   ├── router-service.js
│   │   │   ├── router.js
│   │   │   ├── store.js
│   │   │   ├── toast-service.js
│   │   │   ├── translation-updater.js
│   │   │   ├── translations-loader.js
│   │   │   └── upload.js
│   │   ├── stories
│   │   │   ├── Button.js
│   │   │   ├── Button.stories.js
│   │   │   ├── Header.js
│   │   │   ├── Header.stories.js
│   │   │   ├── Page.js
│   │   │   ├── Page.stories.js
│   │   │   ├── button.css
│   │   │   ├── example.stories.js
│   │   │   ├── header.css
│   │   │   ├── page.css
│   │   │   └── simple-button.stories.js
│   │   ├── styles
│   │   │   ├── auth.js
│   │   │   ├── base.js
│   │   │   ├── components
│   │   │   │   ├── button.css
│   │   │   │   ├── card.css
│   │   │   │   ├── input.css
│   │   │   │   ├── modal.css
│   │   │   │   ├── toast-container.css
│   │   │   │   ├── toast.css
│   │   │   │   └── transition.css
│   │   │   ├── error.css
│   │   │   ├── global.css
│   │   │   ├── loading.css
│   │   │   ├── modern-features.css
│   │   │   └── theme.js
│   │   ├── test
│   │   │   ├── TESTING.md
│   │   │   ├── WEB_COMPONENT_TESTING.md
│   │   │   ├── accessibility
│   │   │   │   ├── basic.test.js
│   │   │   │   └── web-components.test.js
│   │   │   ├── base-component.test.js
│   │   │   ├── component-registration-helper.js
│   │   │   ├── components
│   │   │   │   ├── atoms
│   │   │   │   │   ├── badge.test.js
│   │   │   │   │   ├── button.test.js
│   │   │   │   │   ├── button.visual.test.js
│   │   │   │   │   ├── checkbox.test.js
│   │   │   │   │   ├── dropdown.test.js
│   │   │   │   │   ├── icon.test.js
│   │   │   │   │   ├── input.test.js
│   │   │   │   │   ├── link.test.js
│   │   │   │   │   ├── progress-bar.test.js
│   │   │   │   │   ├── radio.test.js
│   │   │   │   │   ├── select.test.js
│   │   │   │   │   ├── spinner.test.js
│   │   │   │   │   ├── text-input.test.js
│   │   │   │   │   └── tooltip.test.js
│   │   │   │   ├── autoform.test.js
│   │   │   │   ├── badge.test.js
│   │   │   │   ├── button.test.js
│   │   │   │   ├── checkbox.test.js
│   │   │   │   ├── data-table.test.js
│   │   │   │   ├── error-page-minimal.test.js
│   │   │   │   ├── error-page-simple.test.js
│   │   │   │   ├── error-page.test.js
│   │   │   │   ├── faq-accordion.test.js
│   │   │   │   ├── file-upload.test.js
│   │   │   │   ├── form-validation.test.js
│   │   │   │   ├── form.test.js
│   │   │   │   ├── icon.test.js
│   │   │   │   ├── input.test.js
│   │   │   │   ├── language-selector.test.js
│   │   │   │   ├── modal.test.js
│   │   │   │   ├── molecules
│   │   │   │   │   ├── alert.test.js
│   │   │   │   │   ├── card.test.js
│   │   │   │   │   ├── modal.test.js
│   │   │   │   │   └── toast.test.js
│   │   │   │   ├── navigation.test.js
│   │   │   │   ├── organisms
│   │   │   │   │   └── table.test.js
│   │   │   │   ├── pagination.test.js
│   │   │   │   ├── performance.test.js
│   │   │   │   ├── phone-input.test.js
│   │   │   │   ├── spinner.test.js
│   │   │   │   ├── tabs.test.js
│   │   │   │   ├── testimonials.test.js
│   │   │   │   ├── theme-toggle.test.js
│   │   │   │   ├── theme-transition.test.js
│   │   │   │   └── toast.test.js
│   │   │   ├── e2e
│   │   │   │   ├── button.spec.js
│   │   │   │   ├── input.spec.js
│   │   │   │   └── playwright.spec.js
│   │   │   ├── examples
│   │   │   │   └── component-test-example.test.js
│   │   │   ├── features
│   │   │   │   └── modern-css.test.js
│   │   │   ├── global-setup.js
│   │   │   ├── global-teardown.js
│   │   │   ├── helpers
│   │   │   │   ├── component-test-helper.js
│   │   │   │   └── mock-component.js
│   │   │   ├── improved-setup.js
│   │   │   ├── mocks
│   │   │   │   ├── api-client.mock.js
│   │   │   │   └── auth-service.mock.js
│   │   │   ├── pages
│   │   │   │   ├── 404-page.test.js
│   │   │   │   ├── about-page.test.js
│   │   │   │   ├── blog-page.test.js
│   │   │   │   ├── components-page.test.js
│   │   │   │   ├── contact-page.test.js
│   │   │   │   ├── dashboard-page.test.js
│   │   │   │   ├── docs-page.test.js
│   │   │   │   ├── documentation-page.test.js
│   │   │   │   ├── examples-page.test.js
│   │   │   │   ├── faq-page.test.js
│   │   │   │   ├── home-page.test.js
│   │   │   │   ├── landing-page.test.js
│   │   │   │   ├── login-page.test.js
│   │   │   │   ├── pricing-page.test.js
│   │   │   │   ├── profile-page.test.js
│   │   │   │   ├── projects-page.test.js
│   │   │   │   ├── registration-page-simple.test.js
│   │   │   │   ├── registration-page.test.js
│   │   │   │   ├── search-page.test.js
│   │   │   │   ├── settings-page.test.js
│   │   │   │   ├── status-page.test.js
│   │   │   │   ├── support-page.test.js
│   │   │   │   └── tutorials-page.test.js
│   │   │   ├── performance
│   │   │   │   └── performance.test.js
│   │   │   ├── services
│   │   │   │   ├── api-client.test.js
│   │   │   │   ├── error-service.test.js
│   │   │   │   └── notification-service.test.js
│   │   │   ├── setup
│   │   │   │   ├── README.md
│   │   │   │   ├── direct-patch-vitest-worker.js
│   │   │   │   ├── direct-vitest-worker-patch.js
│   │   │   │   ├── global-performance-polyfill.js
│   │   │   │   ├── monkey-patch-vitest-worker.js
│   │   │   │   ├── optimized-performance-polyfill.js
│   │   │   │   ├── package-patches.js
│   │   │   │   ├── patch-vitest-worker.js
│   │   │   │   ├── performance-polyfill.js
│   │   │   │   ├── performance-polyfill.test.js
│   │   │   │   ├── silence-lit-dev-mode.js
│   │   │   │   ├── vitest-worker-polyfill.js
│   │   │   │   └── worker-performance-polyfill.js
│   │   │   ├── templates
│   │   │   │   └── component-test.template.js
│   │   │   ├── test-setup.js
│   │   │   ├── test-utils.js
│   │   │   ├── utils
│   │   │   │   ├── component-mock-utils.js
│   │   │   │   ├── component-mock-utils.test.js
│   │   │   │   ├── dom-mock-utils.js
│   │   │   │   ├── dom-mock-utils.test.js
│   │   │   │   ├── performance-utils.js
│   │   │   │   ├── polyfill-loader.mock.js
│   │   │   │   └── polyfill-loader.test.js
│   │   │   └── visual
│   │   │       ├── config.js
│   │   │       ├── helpers.js
│   │   │       └── memory-monitor.visual.test.js
│   │   └── utils
│   │       ├── critical-css.js
│   │       ├── dedupeMixin.js
│   │       ├── feature-detection.js
│   │       ├── fixes
│   │       │   ├── firefox-container-query-fix.js
│   │       │   ├── safari-grid-fix.js
│   │       │   └── safari-shadow-dom-fix.js
│   │       ├── keyboard.js
│   │       ├── lazy-load.js
│   │       ├── logger.js
│   │       ├── memory-leak-detector.js
│   │       ├── polyfill-loader.js
│   │       └── router.js
│   ├── test
│   │   ├── base-component.test.js
│   │   ├── components
│   │   │   └── autoform.test.js
│   │   ├── pages
│   │   │   └── dashboard-page.test.js
│   │   └── setup.js
│   ├── vendor
│   │   ├── highlight.min.css
│   │   ├── highlight.min.js
│   │   ├── lit-core.min.js
│   │   ├── lit-html
│   │   │   └── unsafe-html.js
│   │   └── marked.min.js
│   ├── vite.config.js
│   ├── vitest-setup-performance.js
│   ├── vitest-worker-setup.js
│   ├── vitest.config.js
│   ├── vitest.setup.js
│   ├── web-test-runner.a11y.config.js
│   └── web-test-runner.config.js
├── memory-bank
│   ├── active-context.md
│   ├── neo-table-testing.md
│   ├── product-context.md
│   ├── progress.md
│   ├── project-brief.md
│   ├── refactoring-summary.md
│   ├── system-patterns.md
│   └── tech-context.md
├── playwright.config.js
├── src
│   ├── pages
│   │   ├── dashboard-page.js
│   │   ├── documentation-page.js
│   │   ├── faq-page.js
│   │   └── home-page.js
│   └── test
│       ├── components
│       │   └── atoms
│       │       ├── button.test.js
│       │       └── input.test.js
│       ├── features
│       │   └── modern-css.test.js
│       ├── pages
│       │   ├── 404-page.test.js
│       │   ├── contact-page.test.js
│       │   ├── docs-page.test.js
│       │   ├── examples-page.test.js
│       │   ├── login-page.test.js
│       │   ├── profile-page.test.js
│       │   ├── settings-page.test.js
│       │   └── tutorials-page.test.js
│       ├── setup.js
│       ├── test-setup.js
│       └── visual
│           └── memory-monitor.visual.test.js
└── tests
    ├── core
    │   └── test_config.py
    ├── factories.py
    └── factories_new.py

179 directories, 727 files
