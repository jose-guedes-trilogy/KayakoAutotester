import { computed } from '@ember/object';
import { filterBy, sort, oneWay } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { getOwner } from '@ember/application';

export default Controller.extend({
  // Attributes:
  originalSettings: null,
  currentSettings: null,

  // Services
  i18n: service(),
  notification: service(),
  store: service(),
  timezone: service('timezones'),

  // CPs
  availableTimeFormats: computed(function() {
    let i18n = this.get('i18n');
    return [
      { id: '24hour', value: i18n.t('generic.settings.24hour') },
      { id: '12hour', value: i18n.t('generic.settings.12hour') }
    ];
  }),

  selectedTimeFormat: computed('currentSettings.time_format', function() {
    return this.get('availableTimeFormats').find(timeFormat => timeFormat.id === this.get('currentSettings.time_format'));
  }),

  availableLanguages: computed(function() {
    return this.get('store').findAll('locale');
  }),

  enabledLanguages: filterBy('availableLanguages', 'isPublic'),
  languagesSorting: ['navtiveName'],
  sortedLanguages: sort('enabledLanguages', 'languagesSorting'),

  availableTimezones: oneWay('timezone.timeZones'),

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
  }),

  isTimeFormatEdited: computed('currentSettings.time_format', 'originalSettings.time_format', function() {
    return this.get('currentSettings.time_format') !== this.get('originalSettings.time_format');
  }),
  isDefaultLanguageEdited: computed('currentSettings.default_language', 'originalSettings.default_language', function() {
    return this.get('currentSettings.default_language') !== this.get('originalSettings.default_language');
  }),
  isTimezoneEdited: computed('currentSettings.timezone', 'originalSettings.timezone', function() {
    return this.get('currentSettings.timezone') !== this.get('originalSettings.timezone');
  }),
  hasChanges: computed('isTimezoneEdited', 'isDefaultLanguageEdited', 'isTimeFormatEdited', function() {
    return this.get('isTimezoneEdited') || this.get('isDefaultLanguageEdited') || this.get('isTimeFormatEdited');
  }),

  selectedLocale: computed('currentSettings.default_language', function() {
    return this.get('store').peekAll('locale').find(locale => locale.get('locale') === this.get('currentSettings.default_language'));
  }),

  selectedTimezone: computed('currentSettings.timezone', function() {
    return this.get('availableTimezones').find(timezone => timezone.id === this.get('currentSettings.timezone'));
  }),

  // Actions
  actions: {
    editLanguage(locale) {
      this.set('currentSettings.default_language', locale.get('locale'));
    },

    editTimezone(timezone) {
      this.set('currentSettings.timezone', timezone.id);
    },

    editTimeFormat(timeFormat) {
      this.set('currentSettings.time_format', timeFormat.id);
    },

    save() {
      const adapter = getOwner(this).lookup('adapter:application');

      return adapter.ajax(
        `${adapter.namespace}/settings`,
        'PUT',
        {
          data: {
            values: {
              'account.default_language': this.get('currentSettings.default_language'),
              'account.timezone': this.get('currentSettings.timezone'),
              'account.time_format': this.get('currentSettings.time_format')
            }
          }
        }
      ).then(result => {
        this.updateStore();
        return result;
      });
    },

    cancel() {
      this.transitionToRoute('session.admin.customizations.localization');
    },

    handleSuccess() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      // so no unsaved changes popup appears on transition
      this.set('originalSettings.default_language', this.get('currentSettings.default_language'));
      this.set('originalSettings.timezone', this.get('currentSettings.timezone'));
      this.set('originalSettings.time_format', this.get('currentSettings.time_format'));

      this.transitionToRoute('session.admin.customizations.localization');
    }
  },

  // Methods
  initEdits() {
    // noop
  },

  isEdited() {
    return this.get('hasChanges');
  },

  updateStore() {
    let store = this.get('store');
    let settings = store.peekAll('setting');
    let keys = ['default_language', 'timezone', 'time_format'];

    keys.forEach(key => {
      let value = this.get(`currentSettings.${key}`);
      let setting = settings.findBy('key', `account.${key}`);

      if (!setting) { return; }

      store.push({
        data: {
          id: setting.get('id'),
          type: 'setting',
          attributes: { value }
        }
      });
    });
  }
});
