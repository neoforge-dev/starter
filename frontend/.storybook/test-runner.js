const { injectAxe, checkA11y } = require('axe-playwright');
const { getStoryContext } = require('@storybook/test-runner');

module.exports = {
  async preRender(page) {
    await injectAxe(page);
  },
  async postRender(page, context) {
    // Get story-specific parameters
    const storyContext = await getStoryContext(page, context);
    
    // Run accessibility tests
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });

    // Take screenshot for visual regression testing
    if (storyContext.parameters?.viewport) {
      const { width, height } = storyContext.parameters.viewport;
      await page.setViewportSize({ width, height });
    }
    
    const image = await page.screenshot();
    await expect(image).toMatchImageSnapshot({
      customSnapshotsDir: \`__image_snapshots__/\${context.id}\`,
      customDiffConfig: {
        threshold: 0.1,
      },
      failureThreshold: 0.05,
      failureThresholdType: 'percent',
    });
  },
}; 