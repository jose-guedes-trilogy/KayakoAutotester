import Component from '@ember/component';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import diffAttrs from 'ember-diff-attrs';
import { inject as service } from '@ember/service';
import _ from 'npm:lodash';
import phraseList from './phraseList';



export default Component.extend({
  store: service(),
  i18n: service(),

  businessHours: [],

  didReceiveAttrs: diffAttrs('brand', function(changedAttrs, ...args) {
    this._super(...args);
    if(!changedAttrs || (changedAttrs && changedAttrs.brand)) {
      this.get('fetchAverageReplyTime').perform();
    }
  }),

  businessHoursWithPlaceholder: computed('businessHours.[]', function() {
    return [''].concat(this.get('businessHours').toArray());
  }),

  fetchAverageReplyTime: task(function * (id) {
    const brand = this.get('brand');
    if (!brand) return;
    let response = yield this.get('store').adapterFor('conversation-starter').fetchForBrand(brand.get('id'));
    this.set('averageReplyTime', response.data.average_reply_time);
    return response;
  }).restartable(),

  currentResponseTimeExpectation: computed('averageReplyTime', function() {
    return this.getPhrase(this.get('averageReplyTime'));
  }),

  currentExpectation: computed('currentResponseTimeExpectation', function(){
    const itIsCurrently = this.get('i18n').t('admin.messenger.tabs.options.response_time.options.it_is_currently');
    return `${itIsCurrently} "${this.get('currentResponseTimeExpectation')}"`;
  }),

  isSuggestionsFeatureDisabled: computed.equal('enableSuggestions', null),

  getPhrase(replyTime) {
    const phrasePrefix = 'admin.messenger.tabs.options.response_time.options';
    if(replyTime === null) {
      return this.get('i18n').t(`${phrasePrefix}.reply_asap`);
    }
    const matchingPhrase = _.find(phraseList, (ph) => {
      return ph.times[0] <= replyTime && ph.times[1] >= replyTime;
    });
    if (matchingPhrase) {
      const { locale, data } = matchingPhrase.sentence();
      return this.get('i18n').t(`${phrasePrefix}.${locale}`, data);
    }
  },
  
  actions: {
    onBusinessHourChange(businessHour) {
      if (businessHour === '') {
        this.set('linkedBusinessHour', null);
        return;
      }
      this.set('linkedBusinessHour', businessHour);
    },
    onSuggestionsToggle() {
      if (this.get('isSuggestionsFeatureDisabled')) return;
      this.set('enableSuggestions', !this.get('enableSuggestions'));
    }
  }
});
