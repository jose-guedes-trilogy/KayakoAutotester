import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  metrics: service(),

  // Actions
  actions: {
    saved() {
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'role_created',
          object: this.get('model').get('id'),
          type: this.get('model').get('roleType'),
          name: this.get('model').get('title')
        });
      }

      this.send('transitionToIndex');
    },

    transitionToIndex() {
      this.transitionToRoute('session.admin.people.roles.index');
    }
  },

  // Methods
  isEdited() {
    let model = this.get('model');
    return model.get('hasDirtyAttributes') && Object.keys(model.changedAttributes()).length > 0;
  },

  initEdits() {
    this.get('model').rollbackAttributes();
  }
});
