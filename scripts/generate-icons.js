/**
 * PWA Icon Generator Script
 *
 * This script generates all required PWA icons from the source SVG.
 *
 * Prerequisites:
 *   npm install sharp
 *
 * Usage:
 *   node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_SVG = path.join(__dirname, '../public/icon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Read the source SVG
  const svgBuffer = fs.readFileSync(SOURCE_SVG);

  console.log('Generating PWA icons...\n');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated icon-${size}x${size}.png`);
  }

  // Generate favicon.ico (32x32)
  const faviconPath = path.join(__dirname, '../public/favicon.ico');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(faviconPath.replace('.ico', '.png'));
  console.log('✓ Generated favicon.png');

  // Generate apple-touch-icon (180x180)
  const appleTouchPath = path.join(__dirname, '../public/apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('✓ Generated apple-touch-icon.png');

  // Generate shortcut icons
  const shortcutSizes = [96];
  for (const size of shortcutSizes) {
    // Trip shortcut icon (with a different tint or you can customize)
    const tripPath = path.join(OUTPUT_DIR, `shortcut-trip.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(tripPath);

    // Discover shortcut icon
    const discoverPath = path.join(OUTPUT_DIR, `shortcut-discover.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(discoverPath);
  }
  console.log('✓ Generated shortcut icons');

  // Generate OG image placeholder (1200x630)
  const ogImagePath = path.join(__dirname, '../public/og-image.png');
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 20, g: 184, b: 166, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(200, 200).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(ogImagePath);
  console.log('✓ Generated og-image.png');

  console.log('\n✅ All icons generated successfully!');
  console.log('\nNote: You may want to create custom OG images and shortcut icons for better branding.');
}

// Check if sharp is installed
try {
  require.resolve('sharp');
  generateIcons().catch(console.error);
} catch (e) {
  console.log('Sharp is not installed. Run: npm install sharp');
  console.log('Then run: node scripts/generate-icons.js');

  // Create placeholder files so the app doesn't break
  console.log('\nCreating placeholder icons...');

  const placeholderSVG = fs.readFileSync(SOURCE_SVG, 'utf8');
  const outputDir = path.join(__dirname, '../public/icons');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create a simple instruction file
  fs.writeFileSync(
    path.join(outputDir, 'README.md'),
    `# PWA Icons

To generate the required PWA icons:

1. Install sharp: \`npm install sharp\`
2. Run the script: \`node scripts/generate-icons.js\`

Or use an online tool like https://realfavicongenerator.net with the SVG at /public/icon.svg
`
  );
  console.log('Created README with instructions');
}
