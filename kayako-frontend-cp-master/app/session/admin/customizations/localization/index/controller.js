import { inject as service } from '@ember/service';
import { filterBy, sort } from '@ember/object/computed';
import { computed } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  // Services
  i18n: service(),
  notification: service(),

  // CPs
  languagesSorting: ['name:asc'],
  enabledLanguages: filterBy('model', 'isPublic', true),
  disabledLanguages: filterBy('model', 'isPublic', false),
  enabledLanguagesSorted: sort('enabledLanguages', 'languagesSorting'),
  disabledLanguagesSorted: sort('disabledLanguages', 'languagesSorting'),

  tabs: computed(function() {
    return [{
      id: 'case',
      label: this.get('i18n').t('admin.localization.tabs.languages'),
      routeName: 'session.admin.customizations.localization.index',
      dynamicSegments: [],
      queryParams: null
    },
    {
      id: 'case',
      label: this.get('i18n').t('admin.localization.tabs.settings'),
      routeName: 'session.admin.customizations.localization.settings',
      dynamicSegments: [],
      queryParams: null
    }];
  })
});
