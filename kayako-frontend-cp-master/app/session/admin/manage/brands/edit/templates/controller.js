import { inject as service } from '@ember/service';
import { or, oneWay } from '@ember/object/computed';
import Controller from '@ember/controller';
import RSVP from 'rsvp';
import EmberObject, { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { attr, model } from 'frontend-cp/services/virtual-model';

import { variation } from 'ember-launch-darkly';

const schema = model('template', {
  contents: attr()
});

export default Controller.extend({
  // Attributes
  brand: null,
  templates: null,

  // State
  editedTemplates: null,

  // Services
  i18n: service(),
  notification: service(),
  virtualModel: service(),
  metrics: service(),

  // CPs
  tabs: computed('brand.id', function() {
    return [{
      label: this.get('i18n').t('admin.manage.brands.edit.tabs.settings'),
      routeName: 'session.admin.manage.brands.edit.index',
      dynamicSegments: [this.get('brand.id')],
      queryParams: null
    },
    {
      label: this.get('i18n').t('admin.manage.brands.edit.tabs.email_templates'),
      routeName: 'session.admin.manage.brands.edit.templates',
      dynamicSegments: [this.get('brand.id')],
      queryParams: null
    }];
  }),

  isEmailCaseNotificationEdited: computed('templates.emailCaseNotification.contents', 'editedTemplates.emailCaseNotification.contents', function () {
    return this.get('templates.emailCaseNotification.contents') !== this.get('editedTemplates.emailCaseNotification.contents');
  }),

  isEmailNotificationEdited: computed('templates.emailNotification.contents', 'editedTemplates.emailNotification.contents', function () {
    return this.get('templates.emailNotification.contents') !== this.get('editedTemplates.emailNotification.contents');
  }),

  isEmailSatisfactionEdited: computed('templates.emailSatisfaction.contents', 'editedTemplates.emailSatisfaction.contents', function () {
    return this.get('templates.emailSatisfaction.contents') !== this.get('editedTemplates.emailSatisfaction.contents');
  }),

  hasChanges: or('isEmailCaseNotificationEdited', 'isEmailNotificationEdited', 'isEmailSatisfactionEdited'),

  isEdited: oneWay('hasChanges'),

  // Tasks
  save: task(function * () {
    const virtualModel = this.get('virtualModel');
    const { emailCaseNotification, emailNotification, emailSatisfaction } = this.get('templates');
    const editedTemplates = this.get('editedTemplates');
    try {
      yield RSVP.hash({
        emailCaseNotification: virtualModel.save(emailCaseNotification, editedTemplates.get('emailCaseNotification'), schema),
        emailNotification: virtualModel.save(emailNotification, editedTemplates.get('emailNotification'), schema),
        emailSatisfaction: virtualModel.save(emailSatisfaction, editedTemplates.get('emailSatisfaction'), schema)
      });

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'email_template_edited'
        });
      }

      this.transitionToRoute('session.admin.manage.brands.edit.index', this.get('brand.id'));
    } catch (e) {
      // intentional
    }
  }).drop(),

  // Actions
  actions: {
    cancel() {
      this.transitionToRoute('session.admin.manage.brands.edit.index', this.get('brand.id'));
    },
    editorUpdated(contents) {
      this.set('editedTemplates.emailCaseNotification.contents', contents);
    }
  },

  // Methods
  initEdits() {
    const { emailCaseNotification, emailNotification, emailSatisfaction } = this.get('templates');
    this.set('editedTemplates', EmberObject.create({
      emailCaseNotification: this.get('virtualModel').makeSnapshot(emailCaseNotification, schema),
      emailNotification: this.get('virtualModel').makeSnapshot(emailNotification, schema),
      emailSatisfaction: this.get('virtualModel').makeSnapshot(emailSatisfaction, schema)
    }));
  }
});
