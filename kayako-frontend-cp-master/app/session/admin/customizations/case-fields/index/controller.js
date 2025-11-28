import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  i18n: service(),

  tabs: computed(function() {
    return [{
      id: 'conversation',
      label: this.get('i18n').t('admin.casefields.title'),
      routeName: 'session.admin.customizations.case-fields',
      dynamicSegments: [],
      queryParams: null
    },
    {
      id: 'organization',
      label: this.get('i18n').t('admin.organizationfields.title'),
      routeName: 'session.admin.customizations.organization-fields',
      dynamicSegments: [],
      queryParams: null
    },
    {
      id: 'user',
      label: this.get('i18n').t('admin.userfields.title'),
      routeName: 'session.admin.customizations.user-fields',
      dynamicSegments: [],
      queryParams: null
    }];
  }),

  actions: {
    transitionToNewCaseFieldRoute() {
      this.transitionToRoute('session.admin.customizations.case-fields.select-type');
    }
  }
});
