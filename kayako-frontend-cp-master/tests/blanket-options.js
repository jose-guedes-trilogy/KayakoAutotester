/* globals blanket, module */
/*eslint-disable */
var options = {
  modulePrefix: 'frontend-cp',
  filter: '//.*frontend-cp/.*/',
  antifilter: '//.*(tests|template).*/',
  loaderExclusions: [],
  enableCoverage: true,
  cliOptions: {
    reporters: ['json'],
    autostart: true
  }
};
if (typeof exports === 'undefined') {
  blanket.options(options);
} else {
  module.exports = options;
}
/*eslint-enable */
