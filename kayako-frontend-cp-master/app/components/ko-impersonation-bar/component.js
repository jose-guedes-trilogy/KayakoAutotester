import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',
  session: service(),

  message: computed('session.impersonationToken', 'session.session', function() {
    let iTok = this.get('session.impersonationToken');
    let sessionId = this.get('session.session');

    if (iTok && sessionId) {
      return 'Impersonation Mode';
    }
    if (!sessionId && iTok && iTok === 'error') {
      return 'Impersonation Failed';
    }
    if (!sessionId && iTok) {
      return 'Trying to Impersonate';
    }

    return '';
  })
});
