/* eslint-env node  */

const COLOR_CODES = {
  red: '31',
  green: '32'
};

module.exports = Reporter;

function Reporter(out) {
  this.out = out || process.stdout;
  this.total = 0;
  this.pass = 0;
  this.results = [];
}

Reporter.prototype = {
  report(prefix, result) {
    this.total++;
    if (result.passed) {
      this.pass++;
    }
    this.results.push(result);

    this.out.write(formatResult(result) + '\n');

    if (!result.passed && result.items) {
      this.out.write('\n');

      result.items.forEach(item => {
        if (item.passed) { return; }

        this.out.write(formatItem(item));
        this.out.write('\n\n');
      });
    }
  },

  finish() {
    this.out.write('\n' + this.pass + '/' + this.total + ' tests passed\n');
    this.out.write('\n5 slowest tests:\n\n');

    let sorted = this.results.sort((a, b) => b.runDuration - a.runDuration);
    let slowest = sorted.slice(0, 5);

    slowest.forEach(result => {
      this.out.write(formatResult(result) + '\n');
    });
  }
};

function formatResult(result) {
  return [
    formatResultStatus(result),
    formatResultDuration(result),
    formatResultName(result)
  ].join(' -- ');
}

function formatItem(item) {
  return [
    '  Message:\n    ' + item.message,
    '  Expected:\n    ' + item.expected,
    '  Actual:\n    ' + item.actual,
    '  Stack:\n' + item.stack
  ].join('\n');
}

function formatResultStatus(result) {
  return result.passed ? color('PASS', 'green') : color('FAIL', 'red');
}

function formatResultDuration({ runDuration }) {
  if (runDuration) {
    let text = pad(runDuration + 'ms', 7);
    let colorName = runDuration <= 5000 ? 'green' : 'red';

    return color(text, colorName);
  } else {
    return color('    N/A', 'red');
  }
}

function formatResultName(result) {
  return result.name.trim();
}

function color(str, name) {
  return '\x1B[' + COLOR_CODES[name] + 'm' + str + '\x1B[0m';
}

function pad(str, length, chr = ' ') {
  while (str.length < length) {
    str = chr + str;
  }
  return str;
}

/*
Example of a result:

{
  "passed": false,
  "name": "Acceptance | admin/manage/brands/edit: editing brand templates",
  "skipped": false,
  "runDuration": 1666,
  "logs": [],
  "error": {
    "passed": false,
    "actual": "/admin/manage/brands/1/templates",
    "expected": "/admin/manage/brands/1",
    "stack": "    at http://localhost:7357/assets/tests.js:4382:21\n    at Class.andThen (http://localhost:7357/assets/vendor.js:50534:33)\n    at http://localhost:7357/assets/vendor.js:51241:19\n    at isolate (http://localhost:7357/assets/vendor.js:51442:13)\n    at http://localhost:7357/assets/vendor.js:51426:14\n    at tryCatch (http://localhost:7357/assets/vendor.js:62347:14)"
  },
  "launcherId": "8421",
  "failed": 1,
  "items": [
    {
      "passed": true,
      "message": "Reply says \"{{ foo }}\""
    },
    {
      "passed": true,
      "message": "Reply says \"{{ bar }}\""
    },
    {
      "passed": true,
      "message": "Reply says \"{{ baz }}\""
    },
    {
      "passed": false,
      "actual": "/admin/manage/brands/1/templates",
      "expected": "/admin/manage/brands/1",
      "stack": "    at http://localhost:7357/assets/tests.js:4382:21\n    at Class.andThen (http://localhost:7357/assets/vendor.js:50534:33)\n    at http://localhost:7357/assets/vendor.js:51241:19\n    at isolate (http://localhost:7357/assets/vendor.js:51442:13)\n    at http://localhost:7357/assets/vendor.js:51426:14\n    at tryCatch (http://localhost:7357/assets/vendor.js:62347:14)"
    },
    {
      "passed": true,
      "message": "Reply says \"{{ contents }}\""
    }
  ],
  "prefix": "Chrome 51.0"
}
*/
