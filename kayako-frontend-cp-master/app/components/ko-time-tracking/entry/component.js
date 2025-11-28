import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import jQuery from 'jquery';
import styles from './styles';

export default Component.extend({
  store: service(),
  notification: service(),
  session: service(),
  i18n: service(),

  entry: null,
  isEditing: true,

  didUpdateAttrs() {
    if (!this.get('isEditing')) {
      this.removeActive();
    }
  },

  hasEditPermission: computed(function() {
    const roleType = this.get('session.user.role.roleType');
    return roleType === 'OWNER' || roleType === 'ADMIN';
  }),

  deleteEntry: task(function * (entry, e) {
    e.stopPropagation();

    const id = entry.get('id');
    const log = yield this.get('store').findRecord('timetracking-log', id);
    log.deleteRecord();
    try {
      yield log.save();
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('cases.timetracking.messages.delete'),
        autodismiss: true
      });
      this.get('afterDeleteEntry')(entry);
    } catch(error) {
      log.rollbackAttributes();
    }
  }),

  removeActive() {
    jQuery(`.${styles['list-item']}`).removeClass(styles['is-editing']);
  },

  actions: {
    edit(entry, e) {
      this.get('onEditEntry')(entry);

      this.removeActive();
      jQuery(e.target)
        .closest(`.${styles['list-item']}`)
        .addClass(styles['is-editing']);
    }
  }
});
