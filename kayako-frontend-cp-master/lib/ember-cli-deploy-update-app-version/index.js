/* eslint-env node */
'use strict';

var request = require('request-promise');
var DeployPluginBase = require('ember-cli-deploy-plugin');

module.exports = {
  name: 'ember-cli-deploy-update-app-version',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      requiredConfig: ['projectKey', 'featureFlagKey', 'accessToken'],

      didActivate: function(context) {
        let revisionData = context.revisionData || {};
        let git = revisionData.git || {};

        if (git.abbreviatedSha) {
          return this._updateAppVersionInLaunchDarkly(git.abbreviatedSha);
        }
      },

      _updateAppVersionInLaunchDarkly(sha) {
        let projectKey = this.readConfig('projectKey');
        let featureFlagKey = this.readConfig('featureFlagKey');
        let accessToken = this.readConfig('accessToken');

        let options = {
          method: 'PATCH',
          uri: `https://app.launchdarkly.com/api/v2/flags/${projectKey}/${featureFlagKey}`,
          headers: {
            'Authorization': accessToken
          },
          body: [
            {
              'op': 'replace',
              'path': '/variations/0/value',
              'value': sha
            }
          ],
          json: true
        };

        return request(options);
      }
    });

    return new DeployPlugin();
  },
};
