import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import moment from 'moment';

function quoteIfRequired(str) {
  return str && str.indexOf(' ') > -1 ? `"${str}"` : str;
}

function buildTagList(tags) {
  return tags.map(tag => quoteIfRequired(tag.get('name'))).map(tagName => `tag:${tagName}`).join(' OR ');
}

function buildFormattedTagList(tags) {
  return tags.map(tag => quoteIfRequired(tag.get('name'))).map(tagName => `<b>tag:</b>${tagName}`).join(' OR&nbsp;');
}

export default Service.extend({
  i18n: service(),
  session: service(),

  // State
  activePage: null,  // case | user | organization
  target: null,

  clearRoute() {
    this.setProperties({activePage: null, target: null});
  },
  setRoot(activePage, target) {
    this.setProperties({activePage: activePage, target: target});
  },

  // CPs
  currentUser: computed.readOnly('session.user'),

  suggestedSearchOptions: computed('activePage', 'userSearchSuggestions', 'caseSearchSuggestions', 'organizationSearchSuggestions', function() {
    switch (this.get('activePage')) {
      case 'case':
        return this.get('caseSearchSuggestions');
      case 'user':
        return this.get('userSearchSuggestions');
      case 'organization':
        return this.get('organizationSearchSuggestions');
      default:
        return this.get('defaultSuggestions');
    }
  }),

  caseSearchSuggestions: computed('target', 'target.tags.[]', function() {
    const currentRequesterName = quoteIfRequired(this.get('target.requester.fullName'));
    const tagList = buildTagList(this.get('target.tags'));
    const formattedTagList = buildFormattedTagList(this.get('target.tags'));
    const twoDaysBeforeCaseCreation = moment(this.get('target.createdAt')).subtract(2, 'days').format('YYYY-MM-DD');
    const twoDaysAfterCaseCreation = moment(this.get('target.createdAt')).add(2, 'days').format('YYYY-MM-DD');

    let suggestions = [
      {
        searchTerm: `in:conversations requester:${currentRequesterName}`,
        markedUpSearchTerm: `<b>in:</b>conversations&nbsp;<b>requester:</b>${currentRequesterName}`,
        searchDescription: this.get('i18n').t('search.suggestions.cases_from_requester')
      },
      {
        searchTerm: `in:conversations requester:${currentRequesterName} (status:open OR status:new)`,
        markedUpSearchTerm: `<b>in:</b>conversations&nbsp;<b>requester:</b>${currentRequesterName} (<b>status:</b>open OR&nbsp;<b>status</b>:new)`,
        searchDescription: this.get('i18n').t('search.suggestions.open_cases_from_requester')
      }
    ];

    if (tagList) {
      suggestions.pushObject({
        searchTerm: `in:conversations ${tagList}`,
        markedUpSearchTerm: `<b>in:</b>conversations&nbsp;${formattedTagList}`,
        searchDescription: this.get('i18n').t('search.suggestions.similarly_tagged_cases')
      });
    }

    suggestions.pushObject({
      searchTerm: `in:conversations created>${twoDaysBeforeCaseCreation} created<${twoDaysAfterCaseCreation}`,
      markedUpSearchTerm: `<b>in:</b>conversations&nbsp;<b>created</b>&gt;${twoDaysBeforeCaseCreation}&nbsp;<b>created</b>&lt;${twoDaysAfterCaseCreation}`,
      searchDescription: this.get('i18n').t('search.suggestions.similar_created_at')
    });

    return suggestions;
  }),

  userSearchSuggestions: computed('target', 'target.tags.[]', function() {
    const currentRequesterName = quoteIfRequired(this.get('target.fullName'));
    const tagList = buildTagList(this.get('target.tags'));
    const formattedTagList = buildFormattedTagList(this.get('target.tags'));

    let suggestions = [
      {
        searchTerm: `in:conversations requester:${currentRequesterName}`,
        markedUpSearchTerm: `<b>in:</b>conversations&nbsp;<b>requester:</b>${currentRequesterName}`,
        searchDescription: this.get('i18n').t('search.suggestions.cases_from_user')
      },
      {
        searchTerm: `in:conversations requester:${currentRequesterName} status:open`,
        markedUpSearchTerm: `<b>in:</b>conversations&nbsp;<b>requester:</b>${currentRequesterName}&nbsp;<b>status:</b>open`,
        searchDescription: this.get('i18n').t('search.suggestions.open_cases_from_user')
      }
    ];

    if (tagList) {
      suggestions.pushObject({
        searchTerm: `in:users ${tagList}`,
        markedUpSearchTerm: `<b>in:</b>users&nbsp;${formattedTagList}`,
        searchDescription: this.get('i18n').t('search.suggestions.similarly_tagged_users')
      });
    }

    return suggestions;
  }),

  organizationSearchSuggestions: computed('target', 'taget.tags.[]', function() {
    const currentOrganizationName = quoteIfRequired(this.get('target.name'));
    const tagList = buildTagList(this.get('target.tags'));
    const formattedTagList = buildFormattedTagList(this.get('target.tags'));

    let suggestions = [
      {
        searchTerm: `in:users organization:${currentOrganizationName}`,
        markedUpSearchTerm: `<b>in:</b>users&nbsp;<b>organization:</b>${currentOrganizationName}`,
        searchDescription: this.get('i18n').t('search.suggestions.users_from_organization')
      },
      {
        searchTerm: `in:conversations organization:${currentOrganizationName}`,
        markedUpSearchTerm: `<b>in:</b>conversations&nbsp;<b>organization:</b>${currentOrganizationName}`,
        searchDescription: this.get('i18n').t('search.suggestions.cases_from_organization')
      }
    ];

    if (tagList) {
      suggestions.pushObject({
        searchTerm: `in:organizations ${tagList}`,
        markedUpSearchTerm: `<b>in:</b>organizations&nbsp;${formattedTagList}`,
        searchDescription: this.get('i18n').t('search.suggestions.similarly_tagged_organizations')
      });
    }

    return suggestions;
  }),

  defaultSuggestions: computed(function() {
    const userName = quoteIfRequired(this.get('currentUser.fullName'));
    return [{
      searchTerm: `in:conversations (status:open OR status:new) assignee:${userName}`,
      markedUpSearchTerm: `<b>in:</b>conversations&nbsp;(<b>status:</b>open OR&nbsp;<b>status:</b>new)&nbsp<b>assignee:</b>${userName}`,
      searchDescription: this.get('i18n').t('search.suggestions.my_open_cases')
    }];
  })
});
