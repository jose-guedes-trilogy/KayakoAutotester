/* eslint-env node  */

const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '../app/locales/en-us');
let files = fs.readdirSync(DIR);
let status = 0;

console.info('==> Sanity checking translations...');

files.forEach(function(file) {
  let filePath = path.join(DIR, file);

  try {
    require(filePath);
  } catch(error) {
    console.error(error); /* eslint no-console: "off" */
    status = 1;
  }
});

if (status === 0) {
  console.info('==> All translations parse successfully');
} else {
  console.error('==> Some translations fail to parse. See above for details');
}

process.exit(status);
