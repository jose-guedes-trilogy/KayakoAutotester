/* eslint-env node */

var Reporter = require('./lib/reporter');

module.exports = {
  test_page: 'tests/index.html?hidepassed',
  disable_watching: true,
  parallel: -1,
  launch_in_ci: [
    'Chromium'
  ],
  launch_in_dev: [
    'Chromium'
  ],
  browser_args: {
    Chromium: [
      '--no-sandbox',
      '--disable-gpu',
      '--headless',
      '--remote-debugging-port=9222',
      '--window-size=1440,900',
      // '--auto-open-devtools-for-tabs'
    ]
  },
  reporter: new Reporter()
};
