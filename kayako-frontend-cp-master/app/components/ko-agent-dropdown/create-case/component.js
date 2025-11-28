import { Promise as EmberPromise } from 'rsvp';
import { next, debounce, later } from '@ember/runloop';
import EmberObject from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import moment from 'moment';

import buttonStyles from 'frontend-cp/components/ko-button/styles';

export default Component.extend({
  isDisabled: false,
  store: service(),
  i18n: service(),
  fields: null,
  filteredUsers: null,

  // Lifecycle hooks
  init() {
    this._super(...arguments);

    const i18n = this.get('i18n');
    const requesterErrorText = i18n.t('generic.create_case_panel.requester_required');
    this.set('fields', EmberObject.create({
      requester: {
        value: null,
        validator: value => value ? null : requesterErrorText
      }
    }));
    this.set('filteredUsers', null);

    next(() => {
      this.$('.ember-power-select-trigger input').focus();
    });
  },

  // Actions
  actions: {
    searchUsers(filterString) {
      return new EmberPromise((resolve) => {
        debounce(this, this._searchUsers, filterString, resolve, 200);
      });
    },

    selectRequester(user) {
      this.set('fields.requester.value', user);
      const className = buttonStyles.primary.split(' ')[0];
      later(this.$(`.${className}`), 'focus');
    },

    submit() {
      this.get('onSubmit')('session.agent.cases.new',
        moment().format('YYYY-MM-DD-hh-mm-ss'),
        { queryParams: { requester_id: this.get('fields.requester.value.id') } }
      );
    }
  },

  // Methods
  _searchUsers(filterString, resolve) {
    if (filterString.length === 0) {
      return resolve([]);
    }

    return this.get('store').query('user', {
      name: filterString
    }).then(results => resolve(results), () => resolve([]));
  }
});
