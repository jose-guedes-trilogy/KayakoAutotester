import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  caseField: null,

  tagName: '',

  store: service(),

  value: computed('caseField', function() {
    const ids = this.get('caseField.value').split(',');

    const choices = ids.filter(id => id).map(id => {
      const option = this.get('store').peekRecord('field-option', id);
      return option ? option.get('value') : null;
    });

    return choices.join(', ');
  })
});
