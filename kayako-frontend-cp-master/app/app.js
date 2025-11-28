import Application from '@ember/application';
import Resolver from './resolver';
import loadInitializers from 'ember-load-initializers';
import LinkComponent from '@ember/routing/link-component';
import config from './config/environment';

// Set CSRF token received from kayako website
const regex = /^#CsrfToken=(.+)/;
const matches = window.location.hash.match(regex);
const csrfToken = matches && matches[1];

if (csrfToken) {
  localStorage.setItem(`${config.localStore.prefix}:${config.localStore.defaultNamespace}:csrf`, JSON.stringify(csrfToken));

  // Remove CSRF hash param from URL
  history.replaceState(undefined, undefined, window.location.pathname + window.location.search);
}

let App;

App = Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver
});

loadInitializers(App, config.modulePrefix);

export default App;

// Backports fix from Ember for FT-1233 (Clicking "Cases" button while a tab is closing throws an error)
// https://github.com/emberjs/ember.js/pull/14068
// TODO - remove this when we update to the next version of Ember which includes the fix

import { computed } from '@ember/object';
LinkComponent.reopen({
  queryParams: computed({
    get() { },
    set(k, qps) {
      if (qps && !('values' in qps)) {
        return { values: {} };
      } else {
        return qps;
      }
    }
  })
});

Resolver.reopen({
  pluralizedTypes: {
    process: 'processes',
    timeline: 'timelines'
  }
});
