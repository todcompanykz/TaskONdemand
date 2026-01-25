const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const svg192 = path.join(publicDir, 'icon-192.svg');
const svg512 = path.join(publicDir, 'icon-512.svg');

async function convertSvgToPng(inputPath, outputPath, size) {
  try {
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Created ${outputPath} (${size}x${size})`);
  } catch (error) {
    console.error(`✗ Failed to convert ${inputPath}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('Converting SVG icons to PNG...\n');
  
  try {
    // Convert 192x192
    await convertSvgToPng(svg192, path.join(publicDir, 'icon-192.png'), 192);
    
    // Convert 512x512
    await convertSvgToPng(svg512, path.join(publicDir, 'icon-512.png'), 512);
    
    // Create 180x180 for iOS (from 192)
    await convertSvgToPng(svg192, path.join(publicDir, 'apple-touch-icon.png'), 180);
    
    console.log('\n✓ All icons converted successfully!');
  } catch (error) {
    console.error('\n✗ Conversion failed:', error);
    process.exit(1);
  }
}

main();
