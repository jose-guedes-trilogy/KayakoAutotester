import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  // Attributes
  title: null,
  buttonText: null,
  cancelButtonText: 'Cancel',
  onCancel: null,
  onSave: null,
  showFooter: false,
  tabs: null,
  isValid: true,
  onDelete: null,
  isSaving: null,
  needsPlanUpgrade: false,
  isBeta: false,

  plan: service(),

  titleTrail: computed('title', function() {
    let title = this.get('title');
    return title.slice(0, title.lastIndexOf('/') + 1);
  }),

  upgradeUrl: computed('plan.isTrial', function () {
    return this.get('plan.isTrial') ? 'session.admin.account.trial' : 'session.admin.account.plans';
  }),

  titleSuffix: computed('title', function() {
    let title = this.get('title');
    return title.slice(title.lastIndexOf('/') + 1).trim();
  })
});
