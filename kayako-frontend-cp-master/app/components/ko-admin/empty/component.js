import Component from '@ember/component';
import { computed } from '@ember/object';

const URLS = {
  brands: '/images/empty-states/brands.svg',
  'business-hours': '/images/empty-states/business-hours.svg',
  conversation: '/images/empty-states/conversation.svg',
  email: '/images/empty-states/email.svg',
  endpoints: '/images/empty-states/endpoints.svg',
  facebook: '/images/empty-states/facebook.svg',
  localization: '/images/empty-states/localization.svg',
  macros: '/images/empty-states/macros.svg',
  monitors: '/images/empty-states/monitors.svg',
  'oauth-apps': '/images/empty-states/endpoints.svg',
  'organization-fields': '/images/empty-states/organization-fields.svg',
  roles: '/images/empty-states/roles.svg',
  search: '/images/empty-states/search.svg',
  slas: '/images/empty-states/slas.svg',
  'team-directory': '/images/empty-states/team-directory.svg',
  teams: '/images/empty-states/teams.svg',
  triggers: '/images/empty-states/triggers.svg',
  twitter: '/images/empty-states/twitter.svg',
  'user-fields': '/images/empty-states/user-fields.svg',
  webhooks: '/images/empty-states/webhooks.svg'
};

export default Component.extend({
  tagName: '',

  // Attributes
  image: '',

  // Computed Properties
  src: computed('image', function() {
    return URLS[this.get('image')];
  })
});
