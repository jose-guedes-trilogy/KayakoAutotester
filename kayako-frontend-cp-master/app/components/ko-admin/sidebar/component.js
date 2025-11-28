import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  plan: service(),
  session: service(),
  permissions: service(),

  shouldShowPeopleSection: computed('session.permissions.[]', function () {
    const permissions = this.get('permissions');

    return permissions.has('teams.manage') ||
      permissions.has('roles.manage') ||
      permissions.has('business_hours.manage');
  }),

  shouldShowMessengerSection: computed('session.permissions.[]', function () {
    const permissions = this.get('permissions');

    return permissions.has('channels.manage') || permissions.has('automations.manage');
  }),

  shouldShowAutomationsSection: computed('session.permissions.[]', function () {
    const permissions = this.get('permissions');

    return permissions.has('macros.manage') ||
      permissions.has('slas.manage') ||
      permissions.has('automations.manage');
  }),

  shouldShowCustomizationSection: computed('session.permissions.[]', function () {
    const permissions = this.get('permissions');

    return permissions.has('brands.manage') ||
      permissions.has('case_fields.manage') ||
      permissions.has('user_fields.manage') ||
      permissions.has('organizations_fields.manage') ||
      permissions.has('localization.manage');
  }),

  hostname: computed(() => location.hostname),

  shouldShowAccountSection: computed('hostname', function() {
    return this.get('hostname') !== 'support.kayako.com';
  })
});
