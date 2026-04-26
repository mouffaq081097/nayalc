const fs = require('fs');
const https = require('https');
const path = require('path');

const texturesDir = path.join(__dirname, '..', 'public', 'textures');

if (!fs.existsSync(texturesDir)) {
    fs.mkdirSync(texturesDir, { recursive: true });
}

const textures = [
    'natural-paper.png',
    'carbon-fibre.png',
    'brushed-alum.png'
];

const download = (filename) => {
    const url = `https://www.transparenttextures.com/patterns/${filename}`;
    const filePath = path.join(texturesDir, filename);
    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`✓ Downloaded: ${filename}`);
        });
    }).on('error', (err) => {
        fs.unlink(filePath);
        console.error(`✗ Error downloading ${filename}:`, err.message);
    });
};

console.log('Downloading textures to public/textures...');
textures.forEach(download);
