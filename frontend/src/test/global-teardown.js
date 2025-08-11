/**
 * Global teardown for Playwright tests
 * @module tests/global-teardown
 */

import fs from "fs";
import path from "path";

/**
 * Global teardown function
 * Cleans up test artifacts and generates reports
 */
async function globalTeardown() {
  console.log("Starting global test teardown...");

  // Generate test report
  const testResults = {
    timestamp: process.env.TEST_TIMESTAMP,
    environment: process.env.TEST_ENVIRONMENT,
    browsers: global.__BROWSER_INFO__,
    results: {},
  };

  // Process test results
  const resultsDir = path.join(process.cwd(), "test-results");
  if (fs.existsSync(resultsDir)) {
    const files = fs.readdirSync(resultsDir);

    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const resultPath = path.join(resultsDir, file);
        const result = JSON.parse(fs.readFileSync(resultPath, "utf-8"));
        testResults.results[file] = result;
      }
    });
  }

  // Generate browser compatibility report
  const compatReport = {
    timestamp: new Date().toISOString(),
    browsers: global.__BROWSER_INFO__,
    features: {
      webComponents: {},
      cssGrid: {},
      containerQueries: {},
      viewTransitions: {},
      performanceAPI: {},
      intersectionObserver: {},
      resizeObserver: {},
      cssCustomProperties: {},
      importMaps: {},
    },
  };

  // Process test results for compatibility report
  Object.entries(testResults.results).forEach(([, result]) => {
    if (result.suites) {
      result.suites.forEach((suite) => {
        if (suite.title === "Browser Compatibility") {
          suite.specs.forEach((spec) => {
            const feature = spec.title.toLowerCase().replace(/\s+/g, "");
            compatReport.features[feature] = {
              ...compatReport.features[feature],
              [result.browser]: spec.ok,
            };
          });
        }
      });
    }
  });

  // Save compatibility report
  const reportsDir = path.join(process.cwd(), "test-reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportsDir, "compatibility-report.json"),
    JSON.stringify(compatReport, null, 2)
  );

  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Browser Compatibility Report</title>
  <style>
    body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
    th, td { padding: 0.5rem; border: 1px solid #ddd; text-align: left; }
    th { background: #f5f5f5; }
    .success { color: green; }
    .failure { color: red; }
  </style>
</head>
<body>
  <h1>Browser Compatibility Report</h1>
  <p>Generated: ${compatReport.timestamp}</p>
  
  <h2>Browser Information</h2>
  <table>
    <tr>
      <th>Browser</th>
      <th>Version</th>
      <th>Engine</th>
      <th>Engine Version</th>
    </tr>
    ${Object.entries(compatReport.browsers)
      .map(
        ([, info]) => `
        <tr>
          <td>${info.browserName}</td>
          <td>${info.browserVersion}</td>
          <td>${info.engineName}</td>
          <td>${info.engineVersion}</td>
        </tr>
      `
      )
      .join("")}
  </table>

  <h2>Feature Support</h2>
  <table>
    <tr>
      <th>Feature</th>
      ${Object.keys(compatReport.browsers)
        .map((browser) => `<th>${browser}</th>`)
        .join("")}
    </tr>
    ${Object.entries(compatReport.features)
      .map(
        ([feature, support]) => `
        <tr>
          <td>${feature}</td>
          ${Object.keys(compatReport.browsers)
            .map(
              (browser) => `
              <td class="${support[browser] ? "success" : "failure"}">
                ${support[browser] ? "✓" : "✗"}
              </td>
            `
            )
            .join("")}
        </tr>
      `
      )
      .join("")}
  </table>
</body>
</html>
  `;

  fs.writeFileSync(
    path.join(reportsDir, "compatibility-report.html"),
    htmlReport
  );

  // Clean up temporary files
  if (process.env.CI) {
    const dirsToClean = ["test-results", "test-snapshots"];
    dirsToClean.forEach((dir) => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    });
  }

  console.log("Global test teardown completed");
  console.log("Reports generated in:", reportsDir);
}

export default globalTeardown;
