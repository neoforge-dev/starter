import { playwrightLauncher } from "@web/test-runner-playwright";

export default {
  files: "src/**/*.test.js",
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: "chromium" }),
    playwrightLauncher({ product: "firefox" }),
    playwrightLauncher({ product: "webkit" }),
  ],
  testFramework: {
    config: {
      ui: "bdd",
      timeout: "10000",
    },
  },
  testRunnerHtml: (testFramework) => `
    <html>
      <head>
        <script type="importmap">
          {
            "imports": {
              "lit": "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js",
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
        </script>
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
  rootDir: ".",
  staticFiles: [{ path: ".", mount: "/" }],
  middleware: [
    function rewriteImports(context, next) {
      if (context.response.is("js")) {
        context.body = context.body.replace(
          /'\.\.\/services\/auth-service\.js'/g,
          "'@services/auth-service.js'"
        );
      }
      return next();
    },
  ],
  coverageConfig: {
    include: ["src/**/*.js"],
    exclude: ["src/**/*.test.js", "src/test/**/*"],
    threshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
