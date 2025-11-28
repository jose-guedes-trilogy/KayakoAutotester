/* eslint-env node  */

const stew = require('broccoli-stew');

module.exports = {
  name: 'remove-session-test-from-build',

  included: function(app) {
    this.options = { enabled: (app.env === 'production') };
  },

  postprocessTree: function(type, tree) {
    if (this.options.enabled && type === 'js') {
      return stew.rm(tree, '*/session/test/**/*');
    } else {
      return tree;
    }
  }
};
