import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  // Attributes
  brand: null,
  brands: [],
  editedBrand: null,
  schema,
  metrics: service(),

  // Services
  notification: service(),
  i18n: service(),
  confirmation: service(),
  virtualModel: service(),

  // Actions
  actions: {
    cancel() {
      this.transitionToRoute('session.admin.customizations.brands.index');
    },

    onSuccess() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'brand_created',
          object: this.get('editedBrand.id'),
          name: this.get('editedBrand.domain'),
          alias: this.get('editedBrand.alias')
        });
      }
      this.transitionToRoute('session.admin.customizations.brands.edit.index', this.get('brand.id'));
    }
  },

  // Actions
  initEdits() {
    this.set('editedBrand', this.get('virtualModel').makeSnapshot(this.get('brand'), schema));
  },

  isEdited() {
    return isEdited(this.get('brand'), this.get('editedBrand'), schema);
  }
});
