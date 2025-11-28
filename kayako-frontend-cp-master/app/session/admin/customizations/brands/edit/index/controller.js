import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../../schema';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  // Attributes
  brand: null,
  editedBrand: null,
  schema,

  // Services
  notification: service(),
  i18n: service(),
  virtualModel: service(),
  metrics: service(),

  // CPs
  tabs: computed('brand.id', function() {
    return [{
      label: this.get('i18n').t('admin.manage.brands.edit.tabs.settings'),
      routeName: 'session.admin.customizations.brands.edit.index',
      dynamicSegments: [this.get('brand.id')],
      queryParams: null
    },
    {
      label: this.get('i18n').t('admin.manage.brands.edit.tabs.email_templates'),
      routeName: 'session.admin.customizations.brands.edit.templates',
      dynamicSegments: [this.get('brand.id')],
      queryParams: null
    }];
  }),

  // Actions
  actions: {
    canceled() {
      this.transitionToRoute('session.admin.customizations.brands.index');
    },

    updated() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });
      this.initEdits();
      if (variation('release-event-tracking') && (this.get('editedBrand.alias') !== '' || this.get('editedBrand.alias') !== null)) {
        this.get('metrics').trackEvent({
          event: 'custom_domain_added',
          object: this.get('editedBrand.id'),
          brand: this.get('editedBrand.domain'),
          alias: this.get('editedBrand.alias')
        });
      }
      this.transitionToRoute('session.admin.customizations.brands.index');
    }
  },

  // Methods
  initEdits() {
    this.set('editedBrand', this.get('virtualModel').makeSnapshot(this.get('brand'), schema));
  },

  isEdited() {
    return isEdited(this.get('brand'), this.get('editedBrand'), schema);
  }

});
