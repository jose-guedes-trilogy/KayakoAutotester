import BaseComponent from '../base/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { buildTreeFromList } from 'frontend-cp/components/ko-select/drill-down/component';
import { get } from '@ember/object';

export default BaseComponent.extend({
  i18n: service(),
  definition: null,
  automationAction: null,

  valuePlaceholder: computed('definition.name', function() {
    let name = this.get('definition.name');
    let i18n = this.get('i18n');
    let translationKey = `admin.automation_actions_builder.placeholders.${name}`;
    if (i18n.exists(translationKey)) {
      return i18n.t(translationKey);
    } else {
      return i18n.t('admin.automation_actions_builder.placeholders.default');
    }
  }),

  tree: computed('definition.values', function() {
    const items = this.get('definition.values').filter(option => option && get(option, 'value'));

    return buildTreeFromList(items, item => ({
      id: get(item, 'id'),
      value: get(item, 'value')
    }));
  }),

  actions: {
    changeValue(value) {
      this.set('automationAction.value', get(value, 'id'));
    }
  }
});
