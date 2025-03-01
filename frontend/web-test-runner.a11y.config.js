import { playwrightLauncher } from "@web/test-runner-playwright";
import { axe } from "@web/test-runner-axe";

export default {
  files: "src/test/accessibility/**/*.test.js",
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: "chromium" }),
    playwrightLauncher({ product: "firefox" }),
  ],
  testFramework: {
    config: {
      timeout: "10000",
      ui: "bdd",
    },
  },
  plugins: [
    axe({
      // Axe configuration options
      config: {
        rules: [
          {
            // Enable all WCAG 2.1 rules
            tags: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
          },
        ],
      },
      // Reporting options
      reporter: {
        reportName: "accessibility-report",
        reportDir: "reports/accessibility",
        formats: ["html", "json"],
      },
    }),
  ],
  testRunnerHtml: (testFramework) => `
    <html>
      <head>
        <script type="importmap">
          {
            "imports": {
              "lit": "/node_modules/lit/index.js",
              "@lit/reactive-element": "/node_modules/@lit/reactive-element/reactive-element.js",
              "lit-html": "/node_modules/lit-html/lit-html.js",
              "lit-element": "/node_modules/lit-element/lit-element.js",
              "@services": "/src/services",
              "@components": "/src/components",
              "@utils": "/src/utils",
              "@pages": "/src/pages"
            }
          }
        </script>
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
  coverage: true,
  coverageConfig: {
    include: ["src/components/**/*.js"],
    exclude: [
      "src/**/*.stories.js",
      "src/**/*.test.js",
      "node_modules/**/*",
      "tests/**/*",
    ],
    threshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    reporters: ["html", "lcov", "text"],
    reportDir: "coverage/accessibility",
  },
};
