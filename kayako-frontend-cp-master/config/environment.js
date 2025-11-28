/* eslint-env node  */
/* eslint no-process-env: 0 */
'use strict';
const _ = require('lodash');

function mergeCspData(envValue, targetValue, key) {
  //little hack to handle the CSP policies
  if (typeof envValue === 'string' && key.endsWith('-src') && Array.isArray(targetValue)) {
    return envValue + ' ' + targetValue.join(' ');
  }
}

module.exports = function (environment) {
  let ENV = {
    sessionIdCookieName: 'novo_sessionid',
    rememberMeCookieName: 'session_remember_me',

    modulePrefix: 'frontend-cp',
    zuoraSandboxUrl: 'https://my.kayakostage.net/service/Backend/Hosted/Index',
    environment: environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    lightningVersionCookieName: 'lightning_version',

    contentSecurityPolicy: {
      'default-src': [
        "'self'"
      ].join(' '),

      'worker-src': [
        "'self'",
        'blob:;'
      ].join(' '),

      'img-src': [
        '*',
        'data:',
        'cid:',
        'https://*.hotjar.com',
        'https://*.hotjar.io',
        'blob:;'
      ].join(' '),

      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://*.kayakocdn.com',
        'https://assets.kayakostage.net',
        'https://assets.kayako.com',
        'http://cdn.headwayapp.co',
        'https://cdn.headwayapp.co',
        'https://fonts.googleapis.com', // from Messenger and appcues
        'https://static.hotjar.com',
        'https://script.hotjar.com'
      ].join(' '),

      'font-src': [
        "'self'",
        'data:',
        'https://assets.kayakostage.net',
        'https://assets.kayako.com',
        'https://*.kayakocdn.com',
        'https://fonts.gstatic.com', // from Messenger
        'https://fonts.googleapis.com', // appcues
        'https://script.hotjar.com'
      ].join(' '),

      'connect-src': [
        "'self'",
        'https://*.kayako.com',
        'ws://ws.realtime.kayako.com',
        'ws://localhost:8102',
        'wss://kre.kayako.net',
        'wss://kre.kayakostage.net',
        'wss://kre-us-cs-sandbox.kayako.net',
        'wss://kre-us-cs-prod.kayako.net',
        'wss://kre-eu-cs-prod.kayako.net',
        'https://*.realtime.kayako.com',
        'wss://ws.realtime.kayako.com',
        'http://api.segment.io',
        'https://api.segment.io',
        'https://fullstory.com',
        'https://*.fullstory.com',
        'https://*.kayakocdn.com',
        'https://*.mixpanel.com',
        'https://*.kissmetrics.com',
        'https://assets.kayakostage.net',
        'https://assets.kayako.com',
        'https://*.firebase.com', // appcues
        'wss://*.firebaseio.com', // appcues
        'https://*.firebaseio.com', // appcues
        // 'https://fast.appcues.com', // appcues
        // 'https://api.appcues.net', // appcues
        // 'wss://api.appcues.net', // appcues
        'https://use.fontawesome.com/8173b91df1.js', // appcues
        'https://*.launchdarkly.com',
        'https://apps.kayako.net',
        'https://localhost:5000', // local apps server
        'https://forms.hubspot.com',
        'https://*.wistia.com', // wistia
        'https://embedwistia-a.akamaihd.net', // wistia
        'https://fg8vvsvnieiv3ej16jby.litix.io', // wistia
        'https://*.google-analytics.com',
        'https://*.userpilot.io',
        'wss://*.userpilot.io',
        'https://*.hotjar.com',
        'https://*.hotjar.io',
        'wss://*.hotjar.com'
      ].join(' '),

      'script-src': [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        'https://*.kayakocdn.com',
        'https://support.kayako.com',
        'https://assets.kayakostage.net',
        'https://assets.kayako.com',
        'https://d2wy8f7a9ursnm.cloudfront.net',
        'http://cdn.segment.com',
        'https://cdn.segment.com',
        'http://cdn.headwayapp.co',
        'https://cdn.headwayapp.co',
        'https://static.zuora.com',
        'https://*.pingdom.com',
        'https://*.pingdom.net',
        'https://*.nr-data.net',
        'https://fullstory.com',
        'https://*.fullstory.com',
        'https://*.google-analytics.com',
        'https://*.kissmetrics.com',
        'https://*.mxpnl.com',
        'https://heapanalytics.com',
        'https://*.heapanalytics.com',
        'https://*.totango.com',
        // 'https://fast.appcues.com', // appcues
        // 'https://my.appcues.com', // appcues
        'https://cdn.firebase.com', // appcues
        'https://*.firebaseio.com', // appcues
        'https://s3-eu-west-1.amazonaws.com/share.typeform.com/widget.js', // appcues
        'https://cdnjs.cloudflare.com/ajax/libs/spin.js/2.0.1/spin.min.js', // appcues
        'https://d4z6dx8qrln4r.cloudfront.net', // appcues
        'https://js.hsleadflows.net',
        'https://js.hs-analytics.net',
        'https://js.hs-scripts.com',
        'https://*.wistia.com', // wistia
        'https://*.wistia.net', // wistia
        'https://src.litix.io', // wistia
        'https://www.googletagmanager.com',
        'https://js.userpilot.io',
        'https://static.hotjar.com',
        'https://script.hotjar.com'
      ].join(' '),

      'frame-src': [
        "'self'",
        '*',
        'https://*.kayako.com',
        'https://*.kayakostage.net',
        'http://headwayapp.co',
        'https://headwayapp.co',
        'https://headway-widget.net',
        'http://backend',
        'https://my.appcues.com', // appcues
        'https://*.firebaseio.co', // appcues
        'https://kayako.typeform.com' // appcues
      ].join(' '),

      'media-src': [
        "'self'",
        'blob:',
        'https://assets.kayakostage.net',
        'https://assets.kayako.com',
        'https://*.kayakocdn.com'
      ].join(' ')
    },

    contentSecurityPolicyMeta: true,

    APP: {
      updateLogRefreshTimeout: 30000,
      viewingUsersInactiveThreshold: 1000 * 60 * 5, // 5 minutes
      views: {
        maxLimit: 999,
        casesPollingInterval: 60
      },
      forceTrial: false
    },

    launchDarkly: {
      clientSideId: '5992b42d19338d0af52da231',
      local: process.env.DEPLOY_BRANCH !== 'master',
      streaming: {
        'app-version': true,
        'app-version-notification-frequency': true,
        'ops-audible-reply-alert-only-when-browser-not-focussed': true,
        'ops-new-message-pill-sound-enhancement': false,
        'ops-force-sound-enhancement': false,
        'release-app-version-notification': true,
        'release-live-chat-notification-improvements': true,
        'release-render-html-from-user-emails': true
      },
      localFeatureFlags: {
        'app-version': 'undefined',
        'app-version-notification-frequency': 'undefined',
        'release-apps': true,
        'feature-push-notifications': false,
        'release-event-tracking': true,
        'release-remember-me': true,
        'feature-edit-views': false,
        'ops-audible-reply-alert-only-when-browser-not-focussed': false,
        'ops-event-tracking': false,
        'ops-new-message-pill-sound-enhancement': false,
        'ops-force-sound-enhancement': false,
        'ops-simulate-flaky-sends': false,
        'ops-create-timeline-objects-from-container': true,
        'ops-reduce-notification-center-api-requests': true,
        'ops-refactor-notification-preferences-data-retrieval': true,
        'ops-remember-me-bugsnag-logging': true,
        'ops-use-locale-code-instead-of-id': true,
        'release-app-version-notification': true,
        'release-cc-list-improvements': true,
        'release-send-and-status': true,
        'release-merge-from-lists': true,
        'release-new-custom-reports-ui': true,
        'release-notification-centre-improvements': true,
        'release-infer-twitter-reply-type': true,
        'release-sidebar-custom-fields': true,
        'release-optimize-notification-center-include': true,
        'release-sidebar-compaction': true,
        'feature-impersonation': false,
        'release-live-chat-notification-improvements': true,
        'release-manually-set-messenger-reply-time-expectation': true,
        'release-messenger-persistent-settings': true,
        'release-messenger-link-business-hours': true,
        'release-messenger-smart-reply-time-expectation': true,
        'release-new-onboarding': true,
        'release-predicate-builder-tag-suggestions': true,
        'release-reply-all-by-default': true,
        'release-improved-email-template-editing': true,
        'release-show-original-in-timeline': true,
        'release-admin-landing-page': true,
        'release-apps-management': true,
        'release-render-html-from-user-emails': true,
        'release-restrict-insights': true,
        'feature-restrict-agent-team-insights': false,
        'feature-restrict-custom-reporting-insights': false,
        'feature-restrict-sla-insights': false,
        'feature-restrict-helpcenter-insights': false,
        'release-messenger-helpcenter-suggestions': false,
        'release-kre-connection-ribbon': false,
        'release-privacy-policy': true,
        'zoura-reloading-time': 10000
      }
    },

    froalaEditor: {
      key: 'GIBEVFBOHF1c1UNYVM=='
    },

    'ember-basic-dropdown': {
      destination: 'ember-basic-dropdown-wormhole'
    },

    metricsAdapters: [{
      name: 'Segment',
      environments: ['production'],
      config: {
        key: 'yKT6bkErmXqK5jc646uNleIqcU37J7mi'
      }
    },{
      name: 'userpilot',
      environments: ['all'],
      config: {},
    }],

    defaultLocale: 'en-us',

    localStore: {
      defaultNamespace: 'core',
      prefix: 'ko'
    },

    headAwayApp: {
      key: '9JlDMJ'
    },

    bugsnag: {
      apiKey: 'dee7cbbc59697623dc4372a809972e6c',
      notifyReleaseStages: ['production']
    },

    moment: {
      includeTimezone: 'all',
      allowEmpty: true,
      includeLocales: true
    },

    emberSmartBanner: {
      title: 'Kayako Mobile App',
      description: 'Stay in touch with your customers wherever you are.',
      appIdIOS: '1163593165',
      appIdAndroid: 'com.kayako.android.k5',
      appStoreLanguage: 'en'
    },

    messengerApiUrl: 'https://support.kayako.com/api/v1',
    messengerAssetsUrl: 'https://assets.kayako.com/messenger/pattern-',
    cartServiceBaseUrl: 'https://cart.kayako.com'
  };

  ENV.casesPageSize = 20;
  ENV.userListPageSize = 20;
  ENV.orgListPageSize = 20;

  if (environment === 'development') {
    //ENV.APP.LOG_RESOLVER = true;
    //ENV.APP.LOG_ACTIVE_GENERATION = true;
    ENV.APP.LOG_TRANSITIONS = true;
    //ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    //ENV.APP.LOG_VIEW_LOOKUPS = true;

    // ENV.APP.forceTrial = true;

    // Uncomment to test segment.io to 'frontend-development; project.
    // ENV.metricsAdapters[0].environments = ['development'];

    // Choose a KRE to connect to in development:
    // ENV.kreSocket = 'wss://kre.vagrant.internal:4443/socket';  // Vagrant
    // ENV.kreSocket = 'wss://kre.kayakostage.net/socket';        // Staging
    // ENV.kreSocket = 'wss://kre.kayako.net/socket'; // Production
    ENV.kreSocket = 'ws://localhost:8102/socket';              // Docker

    // staging & prod are already in CSP, not vagrant:
    ENV.contentSecurityPolicy['connect-src'] = 'wss://kre.vagrant.internal:4443 ' + ENV.contentSecurityPolicy['connect-src'];

    // Uncomment as appropriate if running Apps API locally
    // use https://github.com/cameronhunter/local-ssl-proxy to make it work behind SSL
    // ENV.appsApiUrl = 'https://localhost:3334';
    // ENV.contentSecurityPolicy['connect-src'] = 'https://localhost:3334 ' + ENV.contentSecurityPolicy['connect-src'];

    ENV.appsApiUrl = 'https://apps.kayako.net';

  }

  if (environment === 'development' || environment === 'test') {
    // ember-cli-content-security-policy assumes livereload is running on localhost.
    // you can pass in --live-reload-host to change this, but it can't be the same as
    // the host you're using to serve the app.
    const DEVELOPMENT_HOSTS = ['*.kayako.com'];
    let liveReloadPort = process.env.EMBER_CLI_INJECT_LIVE_RELOAD_PORT;
    if (liveReloadPort) {
      DEVELOPMENT_HOSTS.forEach(function (host) {
        ENV.contentSecurityPolicy['script-src'] = 'https://' + host + ':' + liveReloadPort + ' ' + ENV.contentSecurityPolicy['script-src'];
        ENV.contentSecurityPolicy['connect-src'] = 'wss://' + host + ':' + liveReloadPort + ' ' + ENV.contentSecurityPolicy['connect-src'];
      });
    }
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';
    ENV.appsApiUrl = '';

    // Don't stomp on local-storage in tests
    ENV.localStore.prefix = 'ko-test';

    // Don't stomp on main session cookie in tests
    ENV.sessionIdCookieName = 'novo_test_sessionid';
    ENV.rememberMeCookieName = 'test_session_remember_me';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';

    ENV.contentSecurityPolicy['frame-src'] = "'self' " + ENV.contentSecurityPolicy['frame-src'];
  }

  if (process.env.DEPLOY_TARGET === 'staging') {
    ENV.appsApiUrl = 'https://apps.kayakostage.net';
    ENV.kreSocket = 'wss://kre.kayakostage.net/socket';
    ENV.metricsAdapters[0].config.key = 'jSiherbyTwW3twI4Yqv0vzhhK2LdWoQU';
    ENV.bugsnag.apiKey = 'dee7cbbc59697623dc4372a809972e6c';
    ENV.messengerAssetsUrl = 'https://assets.kayakostage.net/messenger/pattern-';
    ENV['ember-cli-mirage'] = {
      excludeFilesFromBuild: true
    };
    ENV.assetsUrl = 'https://assets.kayakostage.net/';
  }

  if (process.env.DEPLOY_TARGET === 'production') {
    ENV.appsApiUrl = 'https://apps.kayakostage.net';
    ENV.kreSocket = 'wss://kre.kayako.net/socket';
    ENV.zuoraSandboxUrl = 'https://my.kayako.com/service/Backend/Hosted/Index';
    ENV.bugsnag.apiKey = '2fbf7c1482a94ccc684738033f2c1f8c';
    ENV.metricsAdapters[0].config.key = 'hBGgFGyU7yqAnhLA6P9wiivY6iMbmb4U';
    ENV.launchDarkly.clientSideId = '5992b42d19338d0af52da232';
    ENV.assetsUrl = 'https://assets.kayako.com/';
    ENV.gtmContainerId = 'GTM-KTXQ9HV';
  }

  if (environment === 'development' || environment === 'test') {
    ENV.contentSecurityPolicy['script-src'] += " 'unsafe-inline'";
  }

  if (process.env.DEPLOY_TARGET) {
    const targetENV = JSON.parse(process.env.DEPLOY_TARGET_CONFIG);
    ENV = _.mergeWith(
      ENV,
      targetENV || {},
      mergeCspData);
  }

  // Allows overriding ENV values based on the OVERRIDE_ENV via consul config (frontend/config/target-specific-overrides)
  if (process.env.OVERRIDE_ENV && process.env.TARGET_SPECIFIC_OVERRIDES) {
    const overrides = JSON.parse(process.env.TARGET_SPECIFIC_OVERRIDES);
    ENV = _.mergeWith(
      ENV,
      overrides[process.env.OVERRIDE_ENV] || {},
      mergeCspData);
  }

  return ENV;
};
