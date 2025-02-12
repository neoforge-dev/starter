const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "../assets/icons");

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Base SVG icon (simple placeholder - replace with your actual icon)
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2563eb"/>
  <path d="M256 128L384 384H128L256 128Z" fill="white"/>
</svg>
`;

// Icon sizes to generate
const sizes = [192, 512];

// Generate icons
async function generateIcons() {
  for (const size of sizes) {
    const fileName = `icon-${size}x${size}.png`;
    const filePath = path.join(ICONS_DIR, fileName);

    await sharp(Buffer.from(svgIcon)).resize(size, size).png().toFile(filePath);

    console.log(`Generated ${fileName}`);
  }
}

generateIcons().catch(console.error);
