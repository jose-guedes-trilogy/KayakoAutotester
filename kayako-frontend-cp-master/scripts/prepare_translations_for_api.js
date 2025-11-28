/* eslint-env node  */

const fs = require('fs');
const path = require('path');

let DIR = process.argv[2];

let files = fs.readdirSync(DIR);
files.forEach(function(file) {

  let filePath = path.join(DIR, file);
  let fileContents = fs.readFileSync(filePath, { encoding: 'utf-8' });

  let json = JSON.parse(fileContents);
  let result = collectStringsForLevel(json);

  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), { encoding: 'utf-8' });
});

function collectStringsForLevel(json, path, blob) {
  path = path || [];
  blob = blob || {};
  Object.keys(json).forEach(function(key) {
    let fullPath = path.concat([key]);

    if (typeof json[key] === 'string') {
      blob[fullPath.join('.')] = json[key];
    } else {
      collectStringsForLevel(json[key], fullPath, blob);
    }
  });
  return blob;
}
