import Component from '@ember/component';
import { inject as service } from '@ember/service';
import activityFacade from 'frontend-cp/lib/facade/activity';
import { computed } from '@ember/object';
import { get } from '@ember/object';

export default Component.extend({
  tagName: '',

  // Attributes
  activity: null,
  caseFields: null,
  model: null,
  isItemMenuOpen: false,

  // State
  expanded: false,

  // Services
  i18n: service(),
  store: service(),
  session: service(),

  // Lifecycle Hooks
  init() {
    this._super(...arguments);
    this.set('activityFacade', new activityFacade({ activity: this.get('activity')}));
  },

  // CPs
  activityBelongsToUser: computed.equal('activityFacade.object.name', 'user'),
  activityBelongsToOrg: computed.equal('activityFacade.object.name', 'organization'),
  activityHasTokenAvatar: computed.or('activityBelongsToUser', 'activityBelongsToOrg'),

  // Functions
  localizedMetricName: function (metricName) {
    const i18n = this.get('i18n');
    switch (metricName) {
      case 'FIRST_REPLY_TIME':
        return i18n.t('timeline.activity.firstReplyTimeBreach');
      case 'NEXT_REPLY_TIME':
        return i18n.t('timeline.activity.nextReplyTimeBreach');
      case 'RESOLUTION_TIME':
        return i18n.t('timeline.activity.resolutionTimeBreach');
    }
  },

  isArticleSuggestionActivity: computed('activityFacade.isArticleSuggestion', 'activityFacade.isViewSuggestedArticle', function() {
    return this.get('activityFacade.isArticleSuggestion');
  }),

  articleSuggestedTo: computed('activityFacade.isArticleSuggestion', function () {
    if (this.get('activityFacade.isArticleSuggestion')) {
      let user = this.get('activityFacade.activityActions').filterBy('field', 'user_id')[0];
      return get(user, 'newObject.title') || '';
    }
    return '';
  }),

  articleSuggestedByBrand: computed('activityFacade.isArticleSuggestion', function() {
    if(this.get('activityFacade.isArticleSuggestion')) {
      let brand = this.get('activityFacade.activityActions').filterBy('field', 'brand_id')[0];
      return get(brand, 'newObject.title') || '';
    }
    return '';
  }),

  articleSuggestedActions: computed('activityFacade.isArticleSuggestion', function() {
    if(this.get('activityFacade.isArticleSuggestion')) {
      return this.get('activityFacade.activityActions').filterBy('field', 'article_id');
    }
    return [];
  }),

  articleViewedBy: computed('activityFacade.isViewSuggestedArticle', function() {
    if (this.get('activityFacade.isViewSuggestedArticle')) {
      return this.get('activityFacade.actor.title') || '';
    }
    return '';
  }),

  articleViewedThroughBrand: computed('activityFacade.isViewSuggestedArticle', function() {
    if(this.get('activityFacade.isViewSuggestedArticle')) {
      const brand = this.get('activityFacade.activityActions').filterBy('field', 'brand_id')[0];
      return get(brand, 'newObject.title') || '';
    }
    return '';
  }),

  articleTitle: computed('activityFacade.isViewSuggestedArticle', function() {
    if (this.get('activityFacade.isViewSuggestedArticle')) {
      return this.get('activityFacade.object.title') || '';
    }
    return '';
  }),

  localizedAutomationDesc: computed('activityBelongsToUser', 'activityBelongsToOrg', function () {
    if (this.get('activityBelongsToUser')) {
      return 'timeline.avatar_tooltips.rule_user';
    } else if (this.get('activityBelongsToOrg')) {
      return 'timeline.avatar_tooltips.rule_org';
    }

    return 'timeline.avatar_tooltips.rule';
  }),

  localizedPropertyName: function (propertyName) {
    const i18n = this.get('i18n');
    switch (propertyName) {
      case 'subject':
        return i18n.t('cases.subject');
      case 'casestatusid':
        return i18n.t('cases.status');
      case 'casepriorityid':
        return i18n.t('cases.priority');
      case 'casetypeid':
        return i18n.t('cases.type');
      case 'assigneeteamid':
        return i18n.t('cases.assignee.team');
      case 'assigneeagentid':
        return i18n.t('cases.assignee.agent');
      case 'requesterid':
        return i18n.t('cases.requester');
      case 'name':
      case 'tags':
        return i18n.t('cases.tags');
      case 'slaversionid':
        return i18n.t('generic.SLA');
      case 'event':
        return i18n.t('timeline.action.event');
      case 'title':
        return i18n.t('timeline.action.title');
      case 'caseformid':
        return i18n.t('cases.caseformid');
      case 'brandid':
        return i18n.t('cases.brandid');
      case 'organizationid':
        return i18n.t('cases.organization');
      default:
        const field = this.get('caseFields').findBy('key', propertyName);
        if (field) {
          return field.get('title');
        } else {
          return propertyName;
        }
    }
  },

  helpers: {
    extractSearchTerm(str) {
      let pattern = 'searched for';
      return str.substr(str.indexOf(pattern) + pattern.length, str.length);
    }
  },

  actions: {
    toggle(expanded) {
      this.set('expanded', expanded);
      this.get('scroll-into-view')();
    }
  }
});
