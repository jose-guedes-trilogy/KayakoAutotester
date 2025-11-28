import Component from '@ember/component';
import { computed } from '@ember/object';
import { equal } from '@ember/object/computed';

export default Component.extend({
  tagName: '',

  report: null,

  isGenerating: computed('report.status', function() {
    return ['TRIGGERED', 'WAITING', 'STARTED'].contains(this.get('report.status'));
  }),

  isCompleted: equal('report.status', 'COMPLETED'),

  actions: {
    changed(data) {
      /**
       * KAYAKO-14666 In the response from KRE the status code
       * for COMPLETED is 4 (as in the database)
       *
       * @author Diego Nobre <diego.nobre@crossover.com>
       */
      if (data.changed_properties.status === 4) {
        this.set('report.status', 'COMPLETED');
      }
      this.get('report').reload();
    }
  }

});
