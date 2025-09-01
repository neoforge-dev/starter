import { playwrightLauncher } from "@web/test-runner-playwright";
import { visualRegressionPlugin } from "@web/test-runner-visual-regression/plugin";
import { esbuildPlugin } from "@web/dev-server-esbuild";

// Development configuration (faster)
const devConfig = {
  files: "src/test/components/**/*.test.js",
  nodeResolve: true,
  browsers: [playwrightLauncher({ product: "chromium" })],
  testFramework: {
    config: {
      timeout: "10000",
      ui: "bdd",
      retries: 1,
    },
  },
  plugins: [
    visualRegressionPlugin({
      update: process.env.UPDATE_VISUAL === "true",
      baseDir: "src/test/visual/baseline",
      diffDir: "src/test/visual/diff",
      failureThreshold: 0.05,
    }),
    esbuildPlugin({
      ts: true,
      target: "es2020",
      define: {
        "process.env.NODE_ENV": "'test'",
      },
    }),
  ],
  browserStartTimeout: 30000,
  testsStartTimeout: 30000,
  testsFinishTimeout: 60000,
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
              "lit/decorators.js": "/node_modules/lit/decorators.js",
              "@services": "/src/services",
              "@components": "/src/components",
              "@utils": "/src/utils",
              "@pages": "/src/pages",
              "chai": "/node_modules/chai/chai.js",
              "@open-wc/testing": "/node_modules/@open-wc/testing/index.js",
              "@open-wc/testing-helpers": "/node_modules/@open-wc/testing-helpers/index.js"
            }
          }
        </script>
        <script>
          // Mock APIs
          const storedValues = new Map();
          window.localStorage = {
            getItem: (key) => storedValues.get(key) || null,
            setItem: (key, value) => storedValues.set(key, value),
            removeItem: (key) => storedValues.delete(key),
            clear: () => storedValues.clear(),
            length: 0,
            key: () => null
          };

          window.fetch = async () => ({ ok: true, json: async () => ({}) });
          window.matchMedia = () => ({
            matches: false,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {}
          });

          window.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
          };

          window.IntersectionObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
          };

          window.process = { env: { NODE_ENV: 'test' } };

          // Disable animations
          document.head.appendChild(Object.assign(document.createElement('style'), {
            textContent: '* { transition: none !important; animation: none !important; }'
          }));
        </script>
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
  concurrency: 4,
  concurrentBrowsers: 2,
  coverage: false,
};

// Production configuration (full coverage)
const prodConfig = {
  ...devConfig,
  browsers: [
    playwrightLauncher({ product: "chromium" }),
    playwrightLauncher({ product: "firefox" }),
    playwrightLauncher({ product: "webkit" }),
  ],
  testFramework: {
    config: {
      timeout: "30000",
      ui: "bdd",
      retries: 3,
    },
  },
  coverage: true,
  coverageConfig: {
    include: ["src/components/**/*.js"],
    exclude: [
      "src/**/*.stories.js",
      "src/**/*.test.js",
      "node_modules/**/*",
      "tests/**/*",
      "**/storybook-static/**/*",
    ],
    threshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    reporters: ["html", "lcov", "clover", "text"],
    reportDir: "coverage",
  },
  concurrency: 2,
  concurrentBrowsers: 1,
};

export default process.env.NODE_ENV === "production" ? prodConfig : devConfig;
