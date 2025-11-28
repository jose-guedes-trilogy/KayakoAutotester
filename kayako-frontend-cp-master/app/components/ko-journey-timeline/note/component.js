import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  notification: service(),
  i18n: service(),
  store: service(),
  session: service(),

  activity: null,
  model: null,
  note: null,

  pinTooltipText: computed('note.isPinned', function () {
    const i18n = this.get('i18n');
    let isPinned = this.get('note.isPinned');
    let modelName = this.get('activity.object.name');
    let pinMode = isPinned ? 'unpin' : 'pin';

    switch (modelName) {
      case 'user': return i18n.t(`generic.${pinMode}.user`);
      case 'organization': return i18n.t(`generic.${pinMode}.org`);
    }
  }),

  toggleNotePin: task(function * (activity) {
    let modelName = this.get('activity.object.name');
    let entityName = modelName + 's';
    let entityId = this.get('activity.object.url').match(/[0-9]+$/)[0];
    let note = this.get('note.content');
    let pinNote = !this.get('note.isPinned');
    let user, errMessage;

    try {
      if (pinNote) {
        user = this.get('session.user');
      }
      note.setProperties({ isPinned: pinNote, pinnedBy: user });
      yield note.save({ adapterOptions: { entityName, entityId } });
    }
    catch (e) {
      if (pinNote) {
        errMessage = 'generic.pin_failed';
      } else {
        errMessage = 'generic.unpin_failed';
      }

      note.rollbackAttributes();

      this.get('notification').error(this.get('i18n').t(errMessage));
    }
  }).drop()
});
