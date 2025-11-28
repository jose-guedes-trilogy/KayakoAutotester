import Component from '@ember/component';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Component.extend({
  tagName: '',
  store: service(),
  reportsService: service('reports'),

  generate: task(function * (report) {
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
    }
  }

});
