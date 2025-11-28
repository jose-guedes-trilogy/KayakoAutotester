import { filterBy } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  // Attributes
  slas: [],
  onOpenSla: null,
  onAddSla: null,

  // Services
  i18n: service(),
  plan: service(),
  notification: service(),
  confirmation: service(),
  sorter: service(),

  // CPs
  enabledSlas: filterBy('slas', 'isEnabled', true),
  disabledSlas: filterBy('slas', 'isEnabled', false),

  sortedSlas: computed('enabledSlas.@each.executionOrder', function() {
    return this.get('enabledSlas').sortBy('executionOrder');
  }),

  reachedLimit: computed('slas', function () {
    return this.get('plan.limits.slas') <= this.get('slas.meta.total');
  }),

  // Actions
  actions: {
    edit(sla, e) {
      e.stopPropagation();
      this.attrs.onOpenSla(sla);
    },

    toggleStatus(sla, e) {
      e.stopPropagation();
      sla.toggleProperty('isEnabled');
      sla.save().then(() => {
        this.get('notification').success(
          this.get('i18n').t(
            sla.get('isEnabled') ? 'admin.sla.enabled.message' : 'admin.sla.disabled.message'
          )
        );
      });
    },

    delete(sla, e) {
      e.stopPropagation();
      e.preventDefault();
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'generic.confirm.delete'
      })
      .then(() => sla.destroyRecord())
      .then(() => {
        let msg = this.get('i18n').t('admin.sla.delete.success_message');
        this.get('notification').success(msg);
      });
    },

    reorder(orderedSlas) {
      this.get('sorter').sort(orderedSlas);
    }
  }
});
