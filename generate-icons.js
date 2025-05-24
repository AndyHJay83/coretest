const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// Create a simple SVG icon
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#f0f0f0"/>
    <text x="256" y="256" font-family="Arial" font-size="200" text-anchor="middle" dominant-baseline="middle" fill="#333">WF</text>
</svg>
`;

// Save SVG
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);

console.log('Icons generated successfully!');
console.log('Please convert the SVG to PNG files of sizes 192x192 and 512x512 using an image editor or online converter.');
console.log('Save them as:');
console.log('- icons/icon-192x192.png');
console.log('- icons/icon-512x512.png'); 