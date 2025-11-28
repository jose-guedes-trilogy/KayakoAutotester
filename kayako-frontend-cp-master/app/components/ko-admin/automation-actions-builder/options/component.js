import BaseComponent from '../base/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default BaseComponent.extend({
  i18n: service(),

  valuePlaceholder: computed('definition.name', function() {
    let name = this.get('definition.name');
    let i18n = this.get('i18n');
    let translationKey = `admin.automation_actions_builder.placeholders.${name}`;
    if (i18n.exists(translationKey)) {
      return i18n.t(translationKey);
    } else {
      return i18n.t('admin.automation_actions_builder.placeholders.default');
    }
  })
});
