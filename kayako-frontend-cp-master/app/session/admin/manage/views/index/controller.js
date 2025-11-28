import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

export default Controller.extend({
  i18n: service(),
  sessionService: service('session'),
  notifications: service('notification'),
  confirmation: service(),
  caseListTab: service('case-list-tab'),

  // CPs
  inboxView: computed('model.[]', function() {
    return this.get('model').find(caseView => caseView.get('viewType') === 'INBOX');
  }),

  trashView: computed('model.[]', function() {
    return this.get('model').find(caseView => caseView.get('viewType') === 'TRASH');
  }),

  enabledViews: computed('model.@each.isEnabled', 'model.@each.sortOrder', function () {
    return this.get('model').filter(view => {
      return view.get('isEnabled') && ![this.get('inboxView'), this.get('trashView')].includes(view);
    }).sortBy('sortOrder');
  }),

  disabledViews: computed('model.@each.isEnabled', 'model.@each.sortOrder', function() {
    return this.get('model').filter(view => {
      return !view.get('isEnabled');
    }).sortBy('sortOrder');
  }),

  // Actions
  actions: {
    transitionToNewViewRoute() {
      this.transitionToRoute('session.admin.manage.views.new');
    },
    editView(view) {
      this.transitionToRoute('session.admin.manage.views.edit', view);
    },

    reorderViews(orderedViews) {
      const adapter = getOwner(this).lookup('adapter:application');
      const url = `${adapter.namespace}/views/reorder`;

      let startingSortOrderNumber = 2;  // The inbox is always frst

      let orderedIds = orderedViews.getEach('id');

      let sortOrder = startingSortOrderNumber;
      orderedViews.forEach(customView => {
        customView.set('sortOrder', sortOrder);
        sortOrder++;
      });

      const options = {
        data: {
          view_ids: orderedIds.toString()      // eslint-disable-line camelcase
        }
      };

      adapter.ajax(url, 'PUT', options).then(() => {
        this.get('notifications').success(this.get('i18n').t('admin.views.order_saved.message'));
        this.get('caseListTab').set('forceNextLoad', true);
      });
    },

    toggleEnabledStatus(view, e) {
      e.stopPropagation();
      view.toggleProperty('isEnabled');
      view.save().then(() => {
        let notificationMessage;
        if (view.get('isEnabled')) {
          notificationMessage = this.get('i18n').t('admin.views.enabled.message');
        } else {
          notificationMessage = this.get('i18n').t('admin.views.disabled.message');
        }

        this.get('caseListTab').set('forceNextLoad', true);
        this.get('notifications').success(notificationMessage);
      });
    },

    delete(view, e) {
      e.preventDefault();
      e.stopPropagation();
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'generic.confirm.delete'
      })
      .then(() => view.destroyRecord())
      .then(() => {
        let msg = this.get('i18n').t('admin.views.deleted.message');
        this.get('notifications').success(msg);
        this.get('caseListTab').set('forceNextLoad', true);
      });
    }
  }
});
