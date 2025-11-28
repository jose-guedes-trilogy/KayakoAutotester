'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const Funnel = require('broccoli-funnel');
const unwatchedTree = require('broccoli-unwatched-tree');
const generateScopedName = require('ember-css-modules/lib/generate-scoped-name');
const config = require('./config/environment')(process.env);
const hygenicReferences = require('./lib/svgo-uid-placeholders');

const postcss = require('postcss');
const postCssScssSyntax = require('postcss-scss');
const postcssNested = require('postcss-nested');
const postcssReporter = require('postcss-reporter');
const stylelint = require('stylelint');

// HACK
let Processor = postcss([]).constructor;
let processorProcess = Processor.prototype.process;

Processor.prototype.process = function (css, opts) {
  opts.syntax = postCssScssSyntax;
  return processorProcess.call(this, css, opts);
};

process.env.LC_ALL = 'en_US.UTF-8';

let isProduction = EmberApp.env() === 'production';

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    inlineContent: {
      'conditional-polyfills': {
        file: 'vendor/conditional-polyfills.js',
        enabled: true,
        postProcess: function(content) {
          return content.replace(/\{\{rootURL\}\}/g, config.rootURL);
        }
      }
    },

    'ember-cli-babel': {
      includePolyfill: true,
    },

    eslint: {
      testGenerator: 'qunit',
      group: true
    },

    emberHighCharts: {
      includeHighCharts: true,
      includeHighChartsMore: true
    },

    sassOptions: {
      sourceMap: isProduction,
      includePaths: ['app/styles', 'node_modules/ember-basic-dropdown/app/styles', 'node_modules/ember-power-select/app/styles']
    },

    origin: config.assetsUrl,

    fingerprint: {
      prepend: config.assetsUrl,
      enabled: isProduction,
      extensions: ['js', 'css', 'png', 'jpg', 'gif', 'map', 'woff', 'woff2', 'eot', 'ttf', 'svg', 'mp4', 'json', 'mp3'],
      generateAssetMap: true,
      exclude: ['service-worker', 'kayako-push-service']
    },

    sourcemaps: {
      enabled: isProduction,
      extensions: ['js']
    },

    trees: {
      styles: new Funnel(unwatchedTree('app'), {
        srcDir: '/',
        destDir: '.',
        include: ['**/*.scss']
      })
    },

    'ember-froala-editor': {
      // when adding a plugin, it also needs enabling in ko-text-editor/component.js
      plugins: [
        'align',
        'link',
        'lists',
        'paragraph_format',
        'quote',
        'url',
        'image',
        'font_size',
        'char_counter',
        'code_beautifier',
        'code_view',
        'colors',
        'emoticons',
        'font_family',
        'fullscreen',
        'table'
      ],
      languages: ['en_gb'],
      themes: 'royal'
    },

    cssModules: {
      plugins: {
        before: [
          stylelint(),
          postcssNested(),
          postcssReporter({
            throwError: isProduction
          })
        ]
      },
      generateScopedName: function(className, modulePath) {
        let matchedPath, path;

        matchedPath = modulePath.match(/frontend-cp\/(.*?)\/styles.css/);

        if (matchedPath) {
          path = matchedPath[1]
            .replace(/\//g, '_')
            .replace('components_', '');

          return path + '_' + generateScopedName(className, modulePath);
        }

        return generateScopedName(className, modulePath);
      }
    },

    minifyCSS: {enabled: isProduction},
    minifyJS: {enabled: isProduction},

    svg: {
      paths: [
        'public/images/inline-icons'
      ],
      optimize: {
        plugins: [
          { removeTitle: true },
          { removeDesc: true },
          { cleanupIDs: true },
          { hygenicReferences }
        ]
      }
    },

    ace: {
      themes: ['chrome'],
      modes: ['html', 'json'],
      workers: ['html', 'json'],
      exts: ['language_tools']
    },

    tests: process.env.EMBER_CLI_TEST_COMMAND || !isProduction
  });

  let trialDataAssets = new Funnel('app/trial-data', {
    srcDir: '/',
    include: ['**/*.json'],
    destDir: '/assets/trial'
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.
  app.import('node_modules/jquery.caret/dist/jquery.caret.js');
  app.import('node_modules/at.js/dist/js/jquery.atwho.js');

  return app.toTree(trialDataAssets);
};
