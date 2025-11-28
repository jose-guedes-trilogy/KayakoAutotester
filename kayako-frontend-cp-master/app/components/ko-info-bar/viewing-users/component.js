import Component from '@ember/component';
import Ember from 'ember';
import { task, timeout } from 'ember-concurrency';
import config from '../../../config/environment';
import { list } from 'frontend-cp/utils/presence';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { assign } from '@ember/polyfills';
import moment from 'moment';

const inactiveThreshold = config.APP.viewingUsersInactiveThreshold;
const taskTimeoutInterval = 5000; // 5 seconds

export default Component.extend({
  tagName: '',

  sessionService: service('session'),

  now: null,

  // Attributes
  presence: null,

  viewingUsers: computed('presence', 'tick', 'sessionService.user.id', function() {
    const presence = this.get('presence');
    if (!presence) {
      return [];
    }

    const now = (new Date()).getTime();
    const userID = this.get('sessionService.user.id');

    const metas = list(presence, (id, { metas }) => {
      const lastActiveTS = Math.max(...(metas.map(m => m.last_active_at || 0)));
      const typing = metas.any(m => m.is_typing);
      const isViewing = metas.any(m => m.is_viewing);
      const isForeground = metas.any(m => m.is_foreground);
      const isUpdating = metas.any(m => m.is_updating);
      const inactive = !isForeground || (now - lastActiveTS) > inactiveThreshold;
      const lastActiveAt = lastActiveTS ? moment(lastActiveTS) : null;

      return assign({}, metas[0], {
        id,
        typing,
        lastActiveAt,
        inactive,
        isViewing,
        isForeground,
        isUpdating
      });
    });

    return metas
      .filterBy('isViewing')
      .filter(m => m.user && String(m.user.id) !== userID);
  }),

  // causes viewingUsers to recalculate regardless of whether any presence info has changed
  // so that we can update the `inactive` field
  tickTask: task(function* () {
    if (Ember.testing) {
      return;
    }

    while (true) { // eslint-disable-line
      this.set('tick', (new Date()).getTime());
      yield timeout(taskTimeoutInterval);
    }
  }).on('init')

});
