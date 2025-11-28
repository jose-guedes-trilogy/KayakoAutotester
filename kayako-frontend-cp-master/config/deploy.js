/* eslint-env node  */
/* eslint no-process-env: 0 */

const DEPLOY_TARGETS = ['production', 'staging', 'cs-sandbox', 'cs-prod'];

const GITHUB_DEPLOYMENT_STATUS_DEFAULTS = {
  org: function () {
    return process.env.GITHUB_ORG_NAME;
  },
  repo: function () {
    return process.env.GITHUB_REPO_NAME;
  },
  deploymentId: process.env.GITHUB_DEPLOYMENT_ID,
  ref: function (context) {
    return context.revisionData.git.sha;
  },
  token: function () {
    return process.env.GITHUB_TOKEN;
  },
  environment: 'development',
  targetUrl: function (context) {
    let key = context.revisionData.git.sha;
    return process.env.DEFAULT_AGENT_URL + '?version=' + key;
  }
};

let url = require('url');

function consulHost() {
  return url.parse(process.env.CONSUL_HOST);
}

function buildStatus(context, status) {
  return [{
      'title': 'Project name',
      'value': context.project.pkg.name,
      'short': false
    },
    {
      'title': 'Environment',
      'value': process.env.DEPLOY_ENVIRONMENT,
      'short': false,
    },
    {
      'title': 'Target Environment',
      'value': context.deployTarget,
      'short': false,
    },
    {
      'title': 'Time',
      'value': new Date(),
      'short': false,
    },
    {
      'title': 'Revision number',
      'value': context.revisionData.git.sha,
      'short': false,
    },
    {
      'title': 'Status',
      'value': status,
      'short': false,
    }
  ];
}

function contains(arr, str) {
  arr = arr || [];
  return arr.indexOf(str) > -1;
}

function jiraNumberFromBranch(branch) {
  if (!branch) {
    return null;
  }

  let jiraRegex = /^([a-zA-Z]+)-?(\d+)/;
  let matches = branch.match(jiraRegex);

  if (matches && matches.length === 3) {
    let left = matches[1];
    let right = matches[2];

    return left + '-' + right;
  }
}

function aliases(context) {
  let aliases = [];

  let branch = context.revisionData.git.branch;
  if (branch) {
    branch = branch.toLowerCase();
    aliases.push(branch);

    let jira = jiraNumberFromBranch(branch);
    if (jira) {
      aliases.push(jira);
    }
  }

  return aliases;
}

function validateDeployTarget(deployTarget) {
  if (!contains(DEPLOY_TARGETS, deployTarget)) {
    throw new Error('Invalid deployTarget ' + deployTarget);
  }
}

module.exports = function (deployTarget) {
  validateDeployTarget(deployTarget);

  let ENV = {
    build: {
      environment: 'production'
    },
    pipeline: {
      runOrder: {
        'branch-name-env-var': {
          after: 'git-revision-data'
        }
      },
      disabled: {
        'update-app-version': deployTarget !== 'production' && deployTarget !== 'cs-sandbox' && deployTarget !== 'cs-prod',
      }
    },
    'consul-config': {
      host: consulHost().hostname,
      port: consulHost().port || 80,
      secure: false,
      token: process.env.CONSUL_TOKEN,
      keys: {
        'frontend/config/aws-access-key-id': 'AWS_ACCESS_KEY_ID',
        'frontend/config/aws-secret-access-key': 'AWS_SECRET_ACCESS_KEY',
        'frontend/config/s3-asset-bucket-name': 'S3_BUCKET_NAME',
        'frontend/config/s3-asset-bucket-region': 'S3_BUCKET_REGION',
        'frontend/config/github-deployment-status-access-token': 'GITHUB_TOKEN',
        'frontend/config/bugsnag-api-key': 'BUGSNAG_API_KEY',
        'frontend/config/launch-darkly-access-token': 'LD_ACCESS_TOKEN',
        'frontend/config/slack-webhook': 'SLACK_WEBHOOK_URL',
        'frontend/config/deploy-environment': 'DEPLOY_ENVIRONMENT',
        'frontend/config/github-org-name': 'GITHUB_ORG_NAME',
        'frontend/config/github-repo-name': 'GITHUB_REPO_NAME',
        'frontend/config/default-agent-url': 'DEFAULT_AGENT_URL',
        'frontend/config/deploy-target-config': 'DEPLOY_TARGET_CONFIG',
        'frontend/config/target-specific-overrides': 'TARGET_SPECIFIC_OVERRIDES'
      }
    },
    s3: {
      filePattern: function (context, pluginHelper) {
        let filePattern = pluginHelper.readConfigDefault('filePattern');
        let index = filePattern.lastIndexOf('}');
        return filePattern.slice(0, index) + ',mp4,json,mp3' + filePattern.slice(index);
      },
      accessKeyId: function () {
        return process.env.AWS_ACCESS_KEY_ID;
      },
      secretAccessKey: function () {
        return process.env.AWS_SECRET_ACCESS_KEY;
      },
      bucket: function () {
        return process.env.S3_BUCKET_NAME;
      },
      region: function () {
        return process.env.S3_BUCKET_REGION;
      }
    },
    manifest: {
      filePattern: function (context, pluginHelper) {
        let filePattern = pluginHelper.readConfigDefault('filePattern');
        let index = filePattern.lastIndexOf('}');
        return filePattern.slice(0, index) + ',mp4,json,mp3' + filePattern.slice(index);
      }
    },
    'consul-kv-index': {
      host: consulHost().hostname,
      port: consulHost().port || 80,
      secure: false,
      token: process.env.CONSUL_TOKEN,
      namespaceToken: process.env.CONSUL_NAMESPACE_TOKEN || 'frontend/frontend-cp/default',
      allowOverwrite: true,
      aliases: aliases,
      maxRevisions: 100,
      revisionKey: function (context) {
        return context.revisionData.git.sha;
      }
    },
    'update-app-version': {
      projectKey: 'default',
      featureFlagKey: 'app-version',
      accessToken: function () {
        return process.env.LD_ACCESS_TOKEN;
      }
    }
  };
  
  ENV['webhooks'] = {
    services: {}
  };

  if (deployTarget === 'production' || deployTarget === 'cs-sandbox' || deployTarget === 'cs-prod') {
    ENV['github-deployment-status'] = Object.assign({}, GITHUB_DEPLOYMENT_STATUS_DEFAULTS, {
      environment: 'production'
    });

    ENV['webhooks'] = {
      services: {
        bugsnag: {
          url: 'https://notify.bugsnag.com/deploy',
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: function (context) {
            return {
              apiKey: process.env.BUGSNAG_API_KEY,
              releaseStage: 'production',
              repository: 'https://github.com/' + process.env.GITHUB_ORG_NAME + '/' + process.env.GITHUB_REPO_NAME,
              branch: context.revisionData.git.branch,
              revision: context.revisionData.git.sha
            };
          },
          didActivate: true
        }
      }
    };
  }


  if (deployTarget === 'staging' || deployTarget === 'production') {
    ENV.webhooks.services.slack = {
      url: () => process.env.SLACK_WEBHOOK_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: function (context) {
        return {
          'attachments': [{
            'color': '#2980B9',
            'fields': buildStatus(context, 'deploying'),
          }]
        };
      },
      willDeploy: true,
      didDeploy: {
        body:
          (context) => ({
            'attachments': [{
              fields: buildStatus(context, 'success'),
              color: '#3EB890'
            }]
          })
      },
      didActivate: {
        body:
          (context) => ({
            'attachments': [{
              fields: buildStatus(context, 'activated'),
              color: '#E8A723'
            }]
          })
      },
      didFail: {
        body:
          (context) => ({
            'attachments': [{
              fields: buildStatus(context, 'failed'),
              color: '#E01765'
            }]
          })
      }
    };
  }

  if (deployTarget === 'staging') {
    ENV['github-deployment-status'] = Object.assign({}, GITHUB_DEPLOYMENT_STATUS_DEFAULTS, {
      environment: 'staging'
    });
  }

  return ENV;
};
