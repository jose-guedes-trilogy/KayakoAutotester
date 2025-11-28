import { computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';

import { variation } from 'ember-launch-darkly';

const columns = {
  CASES: [
    'id',
    'subject',
    'priority.label',
    'status.label',
    'assignedAgent.fullName',
    'updatedAt'
  ],
  USERS: [
    'id',
    'fullName',
    'primaryEmail.email',
    'organization.name',
    'lastActivityAt'
  ],
  ORGANIZATIONS: [
    'id',
    'name',
    'updatedAt'
  ]
};

export default Component.extend({
  tagName: '',
  resultGroup: null,
  results: null,
  searchTerm: null,
  metrics: service(),

  columnList: computed('resultGroup', function() {
    return columns[this.get('resultGroup')];
  }),

  isDate(column) {
    return column === 'updatedAt' || column === 'lastActivityAt';
  },

  maxWidthForColumn(column) {
    if (column === 'subject' || column === 'fullName' || column === 'name') {
      return null;
    } else {
      return 150;
    }
  },

  minWidthForColumn(column) {
    if (column === 'subject' || column === 'fullName' || column === 'name') {
      return 200;
    } else {
      return 60;
    }
  },

  actions: {
    openSearchResult(resultGroup, result, hasModifier) {
      if (variation('ops-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'Search - Open a result',
          category: 'Agent'
        });
      }

      switch (resultGroup) {
        case 'USERS':
          this.attrs.onLoadSearchRoute('session.agent.users.user', result.get('fullName'), result.id, hasModifier);
          break;
        case 'CASES':
          this.attrs.onLoadSearchRoute('session.agent.cases.case', result.get('subject'), result.id, hasModifier);
          break;
        case 'ORGANIZATIONS':
          this.attrs.onLoadSearchRoute('session.agent.organizations.organization', result.get('name'), result.id, hasModifier);
          break;
      }
    }
  }
});
