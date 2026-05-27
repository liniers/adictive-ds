const SD  = require('style-dictionary');
const fs  = require('fs');
const path = require('path');

// ─── Color themes ─────────────────────────────────────────────────────────────
// Each theme builds in isolation so same-named semantic tokens don't conflict.

const COLOR_THEMES = [
  { source: 'tokens/json/light/color.json',        dest: 'light/color.css',         selector: ':root, .theme-light'       },
  { source: 'tokens/json/dark/color.json',         dest: 'dark/color.css',          selector: '.theme-dark'               },
  { source: 'tokens/json/highContrast/color.json', dest: 'high-contrast/color.css', selector: '.theme-high-contrast'      },
  { source: 'tokens/json/grayScale/color.json',    dest: 'gray-scale/color.css',    selector: '.theme-gray-scale'         },
];

COLOR_THEMES.forEach(({ source, dest, selector }) => {
  SD.extend({
    source: [source],
    platforms: {
      css: {
        transformGroup: 'css',
        prefix: 'color',
        buildPath: 'build/css/',
        files: [{ destination: dest, format: 'css/variables', options: { selector } }]
      }
    }
  }).buildAllPlatforms();
});

// ─── Desktop & Mobile tokens ──────────────────────────────────────────────────
// All files in each breakpoint group are sourced together so cross-file
// references (e.g. {core.050} in space.json → dimension.json) resolve correctly.
// Each token file gets its own CSS output, filtered by originating file path.

const TOKEN_FILES = [
  'dimension', 'font-family', 'font-size', 'border-radius',
  'size', 'space', 'line-height', 'letter-spacing', 'string'
];

['desktop', 'mobile'].forEach(breakpoint => {
  SD.extend({
    source: [`tokens/json/${breakpoint}/*.json`],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: `build/css/${breakpoint}/`,
        files: TOKEN_FILES.map(name => ({
          destination: `${name}.css`,
          format: 'css/variables',
          filter: token => path.basename(token.filePath) === `${name}.json`,
          options: { selector: ':root' }
        }))
      }
    }
  }).buildAllPlatforms();
});

// ─── index.css ────────────────────────────────────────────────────────────────
// Mirrors the structure of tokens/css/index.css so consumer projects
// only need one import.

const indexLines = [
  ...COLOR_THEMES.map(t => `@import "./${t.dest}";`),
  ...TOKEN_FILES.map(t => `@import "./desktop/${t}.css";`),
  ...TOKEN_FILES.map(t => `@import "./mobile/${t}.css";`),
].join('\n');

fs.mkdirSync('build/css', { recursive: true });
fs.writeFileSync('build/css/index.css', indexLines + '\n');
console.log('✅  build/css/index.css generated');
