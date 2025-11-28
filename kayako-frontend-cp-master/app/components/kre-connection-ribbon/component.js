import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { STATE_CLOSED } from 'frontend-cp/services/socket';

export default Component.extend({
  tagName: '',

  socket: service(),

  failedToConnect: computed('socket.state', 'socket.hasAttemptedConnection', function() {
    return this.get('socket.state') === STATE_CLOSED && this.get('socket.hasAttemptedConnection');
  }),

  isOffline: computed('socket.state', 'socket.hasConnectedOnce', function() {
    return this.get('socket.state') === STATE_CLOSED && this.get('socket.hasConnectedOnce');
  }),

  actions: {
    reloadToRetry(e) {
      e.preventDefault();
      window.location.reload(true);
    }
  }
});
