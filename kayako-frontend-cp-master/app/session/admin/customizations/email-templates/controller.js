import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from 'frontend-cp/session/admin/customizations/email-templates/schema';

export default Controller.extend({
  // Attributes
  brands: null,
  emailCaseNotification: null,
  emailNotification: null,
  emailSatisfaction: null,
  editedEmailCaseNotification: null,
  editedEmailNotification: null,
  editedEmailSatisfaction: null,

  // Services
  i18n: service(),
  notification: service(),
  virtualModel: service(),
  confirmation: service(),

  // CPs
  hasMultipleBrands: computed.gt('brands.length', 1),

  brand: computed(function() {
    return this.get('brands').findBy('isDefault', true);
  }),

  // Methods
  initEdits() {
    this.set('editedEmailCaseNotification', this.get('virtualModel').makeSnapshot(this.get('emailCaseNotification'), schema));
    this.set('editedEmailNotification', this.get('virtualModel').makeSnapshot(this.get('emailNotification'), schema));
    this.set('editedEmailSatisfaction', this.get('virtualModel').makeSnapshot(this.get('emailSatisfaction'), schema));
  },

  isCaseNotificationEdited() {
    return isEdited(this.get('emailCaseNotification'), this.get('editedEmailCaseNotification'), schema);
  },

  isEmailNotificationEdited() {
    return isEdited(this.get('emailNotification'), this.get('editedEmailNotification'), schema);
  },

  isEmailSatisfactionEdited() {
    return isEdited(this.get('emailSatisfaction'), this.get('editedEmailSatisfaction'), schema);
  },

  isEdited() {
    return this.isCaseNotificationEdited() ||
      this.isEmailNotificationEdited() ||
      this.isEmailSatisfactionEdited();
  },

  // Tasks
  changeBrand: task(function * (brand) {
    if (this.isEdited()) {
      this.get('confirmation').confirm({
        intlConfirmationHeader: 'generic.confirm.lose_changes_header',
        intlConfirmationBody: 'generic.confirm.lose_changes',
        intlConfirmLabel: 'generic.confirm.lose_changes_button'
      }).then(() => {
        this.set('brand', brand);
        this.get('updateTemplates').perform();
      });
    } else {
      this.set('brand', brand);
      this.get('updateTemplates').perform();
    }
  }),

  updateTemplates: task(function * () {
    let brand = this.get('brand');
    let caseNotificationTemplate = yield this.store.queryRecord('template', { brand, name: 'cases_email_notification' });
    let emailNotificationTemplate = yield this.store.queryRecord('template', { brand, name: 'base_email_notification' });
    let satisfactionTemplate = yield this.store.queryRecord('template', { brand, name: 'cases_email_satisfaction' });

    this.set('emailCaseNotification', caseNotificationTemplate);
    this.set('emailNotification', emailNotificationTemplate);
    this.set('emailSatisfaction', satisfactionTemplate);
    this.initEdits();
  }),

  save: task(function * () {
    try {
      if (this.isCaseNotificationEdited()) {
        this.set('emailCaseNotification.contents', this.get('editedEmailCaseNotification.contents'));
        yield this.get('emailCaseNotification').save();
      }

      if (this.isEmailNotificationEdited()) {
        this.set('emailNotification.contents', this.get('editedEmailNotification.contents'));
        yield this.get('emailNotification').save();
      }

      if (this.isEmailSatisfactionEdited()) {
        this.set('emailSatisfaction.contents', this.get('editedEmailSatisfaction.contents'));
        yield this.get('emailSatisfaction').save();
      }

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
    } catch (e) {
      // intentional
    }
  }).drop(),

  // Actions
  actions: {
    brandChanged(brand) {
      this.get('changeBrand').perform(brand);
    },

    updatedCaseNotification(newValue) {
      this.get('editedEmailCaseNotification').set('contents', newValue);
    },

    updatedEmailNotification(newValue) {
      this.get('editedEmailNotification').set('contents', newValue);
    },

    updatedEmailSatisfaction(newValue) {
      this.get('editedEmailSatisfaction').set('contents', newValue);
    }
  }
});
