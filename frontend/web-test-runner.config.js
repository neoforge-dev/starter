import { playwrightLauncher } from "@web/test-runner-playwright";

export default {
  files: "src/test/components/**/*.test.js",
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: "chromium" }),
    // Temporarily disabled for faster development
    // playwrightLauncher({ product: "firefox" }),
    // playwrightLauncher({ product: "webkit" }),
  ],
  testFramework: {
    config: {
      timeout: "10000",
      ui: "bdd",
      retries: 3,
    },
  },
  browserStartTimeout: 60000,
  testsStartTimeout: 60000,
  testsFinishTimeout: 60000,
  testRunnerHtml: (testFramework) => `
    <html>
      <head>
        <script>
          // Debug logging
          window.addEventListener('error', function(e) {
            console.error('Global error:', e.error);
          });
          window.addEventListener('unhandledrejection', function(e) {
            console.error('Unhandled rejection:', e.reason);
          });
        </script>
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
        <script>
          // Mock localStorage for tests
          const localStorageMock = {
            getItem: (key) => null,
            setItem: (key, value) => {},
            removeItem: (key) => {},
            clear: () => {}
          };
          Object.defineProperty(window, 'localStorage', { value: localStorageMock });
          
          // Mock fetch for tests
          window.fetch = async () => ({
            ok: true,
            json: async () => ({})
          });

          // Mock matchMedia for tests
          window.matchMedia = (query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false
          });

          // Mock ResizeObserver
          window.ResizeObserver = class ResizeObserver {
            observe() {}
            unobserve() {}
            disconnect() {}
          };

          // Disable transitions for tests
          const style = document.createElement('style');
          style.textContent = '* { transition: none !important; animation: none !important; }';
          document.head.appendChild(style);
        </script>
      </head>
      <body>
        <script type="module">
          // Set up any global test environment here
          window.process = { env: { NODE_ENV: 'test' } };
        </script>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
  concurrency: 1,
  concurrentBrowsers: 1,
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
  middleware: [
    function rewriteIndex(context, next) {
      return next();
    },
  ],
  plugins: [],
};
