import { computed } from '@ember/object';
import Controller from '@ember/controller';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  i18n: service(),
  confirmation: service(),

  enabledForms: computed('model.@each.isEnabled', 'model.@each.sortOrder', function () {
    return this.get('model').filter((form) => {
      return form.get('isEnabled') && !form.get('isDeleted');
    }).sortBy('sortOrder');
  }),

  disabledForms: computed('model.@each.isEnabled', function () {
    return this.get('model').filter((form) => {
      return !form.get('isEnabled');
    });
  }),

  actions: {
    makeDefault(caseform, e) {
      e.stopPropagation();
      const adapter = getOwner(this).lookup('adapter:application');
      const url = `${adapter.namespace}/cases/forms/default`;

      this.store.peekAll('case-form').forEach(caseform => {
        caseform.set('isDefault', false);
      });
      caseform.set('isDefault', true);
      //TODO: this model is left dirty - it is not an issue,
      //but ideally we would mark this as clean.

      const options = {
        data: {form_id: caseform.get('id')}
      };

      adapter.ajax(url, 'PUT', options);
    },

    reorderForms(orderedForms) {
      const adapter = getOwner(this).lookup('adapter:application');
      const url = `${adapter.namespace}/cases/forms/reorder`;

      let startingSortOrderNumber = 1;
      let orderedIds = orderedForms.map(form => form.id);

      let sortOrder = startingSortOrderNumber;
      orderedForms.forEach(form => {
        form.set('sortOrder', sortOrder);
        sortOrder++;
      });

      const options = {
        data: {form_ids: orderedIds.toString()}
      };

      adapter.ajax(url, 'PUT', options);
    },

    toggleEnabledStatus(caseform, e) {
      e.stopPropagation();
      caseform.toggleProperty('isEnabled');
      caseform.save();
    },

    transitionToNewCaseFormRoute() {
      this.transitionToRoute('session.admin.manage.case-forms.new');
    },
    editForm(form) {
      this.transitionToRoute('session.admin.manage.case-forms.edit', form.get('id'));
    },

    showDeleteConfirmation(form, e) {
      e.stopPropagation();

      this.get('confirmation').confirm({
        intlConfirmLabel: 'generic.confirm.delete_button',
        intlConfirmationBody: 'admin.caseforms.confirm_delete.body',
        intlConfirmationHeader: 'admin.caseforms.confirm_delete.title'
      }).then(() => {
        this.send('deleteField', form);
      });

    },
    deleteField(form) {
      form.destroyRecord();
    }
  }
});
