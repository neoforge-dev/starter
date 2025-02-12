import fs from "fs";
import { join } from "path";
import https from "https";

const VENDOR_DIR = join(process.cwd(), "vendor");
const DEPENDENCIES = {
  "lit-core.min.js":
    "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js",
  "lit-core.min.js.map":
    "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js.map",
};

async function downloadFile(url, path) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          const file = fs.createWriteStream(path);
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        } else {
          reject(
            new Error(`Failed to download ${url}: ${response.statusCode}`)
          );
        }
      })
      .on("error", reject);
  });
}

async function setupVendor() {
  try {
    // Create vendor directory if it doesn't exist
    if (!fs.existsSync(VENDOR_DIR)) {
      fs.mkdirSync(VENDOR_DIR, { recursive: true });
    }

    // Download each dependency
    for (const [filename, url] of Object.entries(DEPENDENCIES)) {
      const filePath = join(VENDOR_DIR, filename);
      console.log(`Downloading ${filename}...`);
      await downloadFile(url, filePath);
      console.log(`Downloaded ${filename}`);
    }

    console.log("Vendor setup complete!");
  } catch (error) {
    console.error("Error setting up vendor:", error);
    process.exit(1);
  }
}

setupVendor();
