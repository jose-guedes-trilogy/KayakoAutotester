module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  extends: 'eslint:recommended',
  env: {
    browser: true
  },
  globals: {
    $: true,
    Ember: true,
    Map: true,
    Reflect: true,
    Set: true,
    WeakMap: true
  },
  plugins: [
    'no-server-logging',
    'ember'
  ],
  rules: {
    'no-server-logging/no-server-logging': 2,

    'semi': ['error', 'always'],
    'quotes': ['error', 'single', 'avoid-escape'],
    'one-var': ['error',  {
      'uninitialized': 'always',
      'initialized': 'never'
    }],
    'block-scoped-var': ['error'],
    'eqeqeq': ['error', 'always'],
    'no-alert': ['error'],
    'eol-last': ['error', 'always'],
    'no-constant-condition': ['error', { 'checkLoops': false }],

    'no-unused-vars': [2, {'vars': 'all', 'args': 'none' } ],

    // TODO - we should enable these
    'require-yield': 'off',
    'no-case-declarations': 'off',
    'ember/no-old-shims': 'error'
  }
};
