import Component from '@ember/component';
import { computed } from '@ember/object';
import { equal } from '@ember/object/computed';

export default Component.extend({
  tagName: '',

  report: null,

  isGenerating: computed('report.status', function() {
    return ['WAITING', 'STARTED'].includes(this.get('report.status'));
  }),

  isCompleted: equal('report.status', 'COMPLETED'),

  actions: {
    changed(data) {
      this.get('report').reload();
    }
  }

});
