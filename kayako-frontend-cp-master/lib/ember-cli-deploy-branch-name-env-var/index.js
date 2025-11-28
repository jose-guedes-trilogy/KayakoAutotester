/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-cli-deploy-branch-name-env-var',

  createDeployPlugin: function(options) {
    return {
      name: options.name,

      setup: function(context) {
        var revisionData = context.revisionData || {};
        var git = revisionData.git || {};

        if (git.branch) {
          process.env.DEPLOY_BRANCH = git.branch;
        }
      }
    };
  }
};
