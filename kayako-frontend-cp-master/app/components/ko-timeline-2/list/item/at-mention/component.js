import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  subjectId: null,
  subjectType: null,
  placeholderText: null,

  _subject: null,

  session: service(),
  tabStore: service(),
  store: service(),

  didReceiveAttrs() {
    this._super(...arguments);

    let { subjectId, subjectType } = this.getProperties('subjectId', 'subjectType');

    if (subjectId && subjectType) {
      this.get('store').findRecord(subjectType, subjectId)
        .then(subject => this.set('_subject', subject));
    }
  },

  isCurrentUser: computed('subjectId', 'session.user', function() {
    return this.get('session.user.id') === this.get('subjectId');
  }),

  text: computed('subjectType', '_userText', function() {
    let type = this.get('subjectType');

    switch (type) {
      case 'user': {
        return this.get('_userText');
      }

      default: {
        return 'UNKNOWN';
      }
    }
  }),

  _userText: computed('_subject.fullName', 'placeholderText', function() {
    let name = this.get('_subject.fullName');
    let placeholder = this.get('placeholderText');

    if (name) {
      return `@${name}`;
    }

    return placeholder;
  }),

  actions: {
    openMention(event) {
      event.preventDefault();

      const id = this.get('subjectId');
      const tabStore = this.get('tabStore');
      const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey;

      if (hasModifier) {
        this.get('store').findRecord('user', id).then(function (user) {
          tabStore.createTabNextToActiveTab('session.agent.users.user', user);
        });
      }
      else {
        tabStore.transitionAndInsertTabNextToActiveTab('session.agent.users.user.index', [id]);
      }
    }
  }
});
