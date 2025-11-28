import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Controller.extend({
  session: service(),

  name: computed(function() {
    const fullName = this.get('session.user.fullName');
    return fullName ? ` ${fullName.split(' ')[0]}` : '';
  }),

  actions: {
    wakeUp() {
      this.set('wakingUp', true);
    },

    didWakeUp() {
      this.set('wakingUp', false);
      this.set('awakened', true);
    }
  }
});
