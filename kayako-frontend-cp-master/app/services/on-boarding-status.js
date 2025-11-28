import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import jQuery from 'jquery';

export default Service.extend({
  session: service(),
  store: service(),

  settings: null,
  completedCases: 0,

  init() {
    this._super(...arguments);
    this.set('settings', []);
  },

  getSettings() {
    return this.get('store')
      .findAll('setting')
      .then((response) => {
        this.set('settings', response.toArray());
      });
  },

  getCompletedCases() {
    this.get('store')
      .query('case', { status: 'COMPLETED' })
      .then(response => {
        this.set('completedCases', response.get('length'));
      });
  },

  progress: computed('settings.@each.value', function() {
    const steps = {};
    const stepsToPick = [
      'learn_kayako_completed',
      'experience_kayako_completed',
      'account_setup',
      'account_connected',
      'setup',
      'team_added',
      'agent_added'];

    this.get('settings').forEach((setting) => {
      if (stepsToPick.includes(setting.get('name'))) {
        steps[setting.get('name')] = setting.get('value') === '1';
      }
    });
    return steps;
  }),

  updateStatus: function(property, data) {
    const payload = this.get('settings').find((setting) => {
      return setting.get('name') === property;
    });

    payload.set('value', '1');

    jQuery.ajax({
      url: '/api/v1/settings',
      headers: {
        'X-CSRF-Token': this.get('session.csrfToken')
      },
      processData: false,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ values: data }),
      error() {
        payload.set('value', '0');
      }
    });
  },

  pendingSteps: computed('progress', function () {
    let counter = 0;

    if (!this.get('progress.account_setup')) {
      counter++;
    }

    if (!this.get('progress.account_connected')) {
      counter++;
    }

    if (!this.get('progress.setup')) {
      counter++;
    }

    if (!this.get('progress.team_added')) {
      counter++;
    }

    if (!this.get('progress.agent_added')) {
      counter++;
    }

    if (this.get('completedCases') < 3) {
      counter++;
    }

    return counter;
  })
});
