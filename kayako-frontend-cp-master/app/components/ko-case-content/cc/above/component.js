import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',
  select: null,

  store: service(),

  hasNoResults: computed('select.searchText', 'select.resultsCount', function () {
    const searchText = this.get('select.searchText');
    const resultsCount = this.get('select.resultsCount');

    return searchText && !resultsCount;
  }),

  isMailboxCC: computed('hasNoResults', function () {
    const hasNoResults = this.get('hasNoResults');
    const searchText = this.get('select.searchText');

    if (!hasNoResults) return false;

    let mailboxAddresses = this.get('store').peekAll('channel').filterBy('isChannelTypeMailbox').getEach('handle');
    return mailboxAddresses.includes(searchText);
  })
});
