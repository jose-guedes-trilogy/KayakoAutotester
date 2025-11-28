import Component from '@ember/component';
import { computed } from '@ember/object';
import { not } from '@ember/object/computed';
import { inject as service } from '@ember/service';

const ITEMS_TO_SHOW = 8;

export default Component.extend({
  // Attributes:
  tagName: '',
  user: null,
  case: null,

  // Services
  i18n: service(),

  // CPs
  inRecentCasesMode: not('activeCasesList.length'),

  recentCasesList: computed('case', 'user.recentCases', function () {
    try {
      let recentCases = this.get('user.recentCases').slice(0);
      return recentCases.removeObject(this.get('case'));
    }
    catch (err) {
      return null;
    }
  }),

  activeCasesList: computed('case', 'user.activeCases', function () {
    try {
      let activeCases = this.get('user.activeCases').slice(0);
      return activeCases.removeObject(this.get('case'));
    }
    catch (err) {
      return null;
    }
  }),

  isCurrentCaseActive: computed('user.activeCases', 'case', function () {
    return this.get('user.activeCases').includes(this.get('case'));
  }),

  showTotalCountButton: computed('user.activeCases', 'user.recentCases', function () {
    const thereAreMoreTotalCasesThanActiveCases = this.get('recentCasesList.length') > this.get('activeCasesList.length');
    return this.get('user.recentCases.length') > ITEMS_TO_SHOW || thereAreMoreTotalCasesThanActiveCases;
  }),

  casesTriggerText: computed('activeCasesList', 'recentCasesList', 'case', function () {
    const isCurrentCaseActive = this.get('isCurrentCaseActive');
    const inRecentCasesMode = this.get('inRecentCasesMode');
    let count = this.get('activeCasesList.length') || this.get('recentCasesList.length');
    count = (count > ITEMS_TO_SHOW) ? ITEMS_TO_SHOW + '+' : count;

    if (inRecentCasesMode) {
      return this.get('i18n').t('cases.other_cases_text');
    }
    else {
      return this.get('i18n').t('cases.active_cases_text', { count, mode: isCurrentCaseActive ? 'other' : 'self' });
    }
  })
});
