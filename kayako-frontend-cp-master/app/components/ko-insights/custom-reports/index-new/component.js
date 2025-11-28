import Component from '@ember/component';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

import { variation } from 'ember-launch-darkly';

export default Component.extend({
  tagName: '',
  store: service(),
  confirmation: service(),
  notification: service(),
  i18n: service(),
  metrics: service(),
  reportsService: service('reports'),

  generate: task(function * (report) {
    report.set('status', 'TRIGGERED');

    const id = report.get('id');
    const adapter = getOwner(this).lookup('adapter:application');
    const response = yield adapter.ajax(`${adapter.namespace}/reports/${id}/generate`, 'POST');
    this.get('store').pushPayload('report-case', response);
  }).drop(),

  actions: {
    download(report, e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      this.get('reportsService').download(report);
    },

    generate(report, e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      this.get('generate').perform(report);
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'custom_reports_run'
        });
      }
    },

    delete(report) {
      return this.get('confirmation').confirm({
        intlConfirmLabel: 'generic.confirm.delete_button',
        intlConfirmationBody: 'insights.custom_reports.confirm_delete.body',
        intlConfirmationHeader: 'insights.custom_reports.confirm_delete.title'
      }).then(() => {
        return report.destroyRecord().then(() => {
          this.get('notification').add({
            type: 'success',
            title: this.get('i18n').t('insights.custom_reports.deleted'),
            autodismiss: true
          });
        });
      });
    }
  }
});
