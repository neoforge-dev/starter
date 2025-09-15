#!/bin/bash

# NeoForge PWA Icon Generation Script
# This script generates PWA icons from SVG templates

set -e

# Colors
PRIMARY_COLOR="#4f46e5"
BACKGROUND_COLOR="#ffffff"
TEXT_COLOR="#ffffff"

# Icon sizes to generate
SIZES=(72 96 128 144 152 192 384 512)

# Create assets directory if it doesn't exist
mkdir -p ../public/assets/icons

echo "Generating NeoForge PWA icons..."

# Generate SVG template
cat > /tmp/neoforge-icon.svg << EOF
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#bg)" stroke="#ffffff" stroke-width="32"/>

  <!-- NeoForge logo - stylized 'N' -->
  <path d="M180 140 L180 372 L220 372 L280 220 L340 372 L380 372 L380 140 L340 140 L280 292 L220 140 Z"
        fill="#ffffff" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Decorative elements -->
  <circle cx="160" cy="160" r="8" fill="#ffffff" opacity="0.8"/>
  <circle cx="352" cy="352" r="8" fill="#ffffff" opacity="0.8"/>
</svg>
EOF

# Check if ImageMagick is available
if command -v convert >/dev/null 2>&1; then
    echo "ImageMagick found. Generating PNG icons..."

    for size in "${SIZES[@]}"; do
        echo "Generating ${size}x${size} icon..."
        convert /tmp/neoforge-icon.svg -resize ${size}x${size} ../public/assets/icons/icon-${size}x${size}.png
    done

    # Generate favicon
    echo "Generating favicon..."
    convert /tmp/neoforge-icon.svg -resize 32x32 ../public/assets/icons/favicon.ico

    # Generate badge for notifications
    echo "Generating notification badge..."
    convert /tmp/neoforge-icon.svg -resize 72x72 ../public/assets/icons/badge-72x72.png

    # Generate docs and examples icons
    echo "Generating shortcut icons..."
    convert /tmp/neoforge-icon.svg -resize 192x192 ../public/assets/icons/docs-192x192.png
    convert /tmp/neoforge-icon.svg -resize 192x192 ../public/assets/icons/examples-192x192.png

    echo "✅ All PWA icons generated successfully!"
    echo "📁 Icons saved to: frontend/public/assets/icons/"

else
    echo "⚠️  ImageMagick not found. Installing placeholder SVG icons..."
    echo "To generate PNG icons, install ImageMagick and run: brew install imagemagick"

    # Copy SVG as placeholder for key icons
    for size in "${SIZES[@]}"; do
        cp /tmp/neoforge-icon.svg ../public/assets/icons/icon-${size}x${size}.svg
    done

    # Create simple favicon placeholder
    cat > ../public/assets/icons/favicon.ico << EOF
# Placeholder favicon - replace with actual .ico file
# Use an online favicon generator with the SVG above
EOF

    echo "✅ SVG placeholder icons created!"
    echo "📝 To generate PNG icons:"
    echo "   1. Install ImageMagick: brew install imagemagick"
    echo "   2. Run this script again"
    echo "   3. Or use an online SVG to PNG converter"
fi

# Cleanup
rm -f /tmp/neoforge-icon.svg

echo ""
echo "🎯 PWA Icon Generation Complete!"
echo "📋 Generated icons:"
echo "   • Main app icons: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512"
echo "   • Favicon: favicon.ico"
echo "   • Notification badge: badge-72x72.png"
echo "   • Shortcut icons: docs-192x192.png, examples-192x192.png"