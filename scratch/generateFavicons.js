// scratch/generateFavicons.js
const fs = require('fs');
const path = require('path');

// Base64 representation of a 32x32 orange truck-colored square PNG
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAADhlWElUWHRDb21tZW50AEFkM2JlIEltYWdlUmVhZHkclDszAAAAY0lEQVRYR+3VwQkAIQxFQZO0/y5W4lEsxNvgwBvCvyLhF1tEAAAgT3O1/t0/b621BggAAAABgH2AGwAAAAEAfYAbAAAAAQB9gBsAAAABgH2AGwAAAAEAfYAbAAAAAQB9gBswAFo1AD2tWkXWAAAAAElFTkSuQmCC';
const buffer = Buffer.from(base64Png, 'base64');

const filesToWrite = [
    '../favicon-32x32.png',
    '../apple-touch-icon.png',
    '../favicon.ico'
];

filesToWrite.forEach(f => {
    const fullPath = path.resolve(__dirname, f);
    try {
        fs.writeFileSync(fullPath, buffer);
        console.log(`Successfully generated: ${fullPath}`);
    } catch (e) {
        console.error(`Failed to write: ${fullPath}`, e);
    }
});
