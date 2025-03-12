/**
 * Custom middleware for Storybook to handle template literals in stories
 */
import fs from "fs";
import path from "path";

export default function (router) {
  // Intercept requests for story files
  router.get(/\.stories\.(js|jsx|ts|tsx)$/, (req, res, next) => {
    // Get the original URL
    const originalUrl = req.originalUrl;

    // If the URL contains 'fixed', let it pass through
    if (originalUrl.includes("fixed")) {
      next();
      return;
    }

    // Otherwise, redirect to a fixed version if it exists
    const fixedUrl = originalUrl.replace(
      /\.stories\.(js|jsx|ts|tsx)$/,
      ".stories.fixed.$1"
    );

    // Check if the fixed version exists
    const fixedPath = path.join(process.cwd(), fixedUrl);

    if (fs.existsSync(fixedPath)) {
      res.redirect(fixedUrl);
    } else {
      // If no fixed version exists, just pass through
      next();
    }
  });
}
