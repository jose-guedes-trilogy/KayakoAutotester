import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { validateEmailFormat } from 'frontend-cp/utils/format-validations';

export default Component.extend({
  // Attributes
  domain: '',
  email: '',
  store: service(),

  buttonDisabled: computed('_formDataValid', 'impersonate.isRunning', function() {
    return !this.get('_formDataValid') || this.get('impersonate.isRunning');
  }),

  isLoading: computed('impersonate.isRunning', function() {
    return this.get('impersonate.isRunning');
  }),

  _emailValid: computed('email', function() {
    return validateEmailFormat(this.get('email'));
  }),

  _domainValid: computed('domain', function() {
    return this.get('domain').length > 0 && this.get('domain') !== 'support';
  }),

  _formDataValid: computed('_emailValid', '_domainValid', function() {
    return this.get('_emailValid') && this.get('_domainValid');
  }),

  url: computed('domain', 'email', {
    get(key) { return ''; },
    set(key, value) { return value; },
  }),

  impersonate: task(function * (e) {
    const emailValue = this.get('email');
    const domainValue = this.get('domain');

    const apiRes = yield this.get('store')
      .adapterFor('impersonate')
      .impersonate({'email': emailValue, 'domain': `${domainValue}.kayako.com`});
    const token = apiRes['data']['token'];

    this.set('url', `https://${this.get('domain')}.kayako.com/agent#impersonationToken=${token}`);
  }).drop(),
});
