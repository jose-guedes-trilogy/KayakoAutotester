import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import { variation } from 'ember-launch-darkly';

export default Component.extend({
  tagName: '',

  plan: service(),
  permissions: service(),
  insights: service(),

  init() {
    this._super(...arguments);

    this.get('insights').requestSLAs().then(slas => {
      if (this.isDestroying || this.isDestroyed) {
        return;
      }

      if (!isEmpty(slas)) {
        this.set('slas', slas);
      }
    });
  },

  hasSLAs: computed('slas.[]', function() {
    const slas = this.get('slas');
    const permissions = this.get('permissions');
    return !isEmpty(slas) && (((this.get('plan').has('insights_sla') && permissions.has('slas.manage'))) || variation('feature-restrict-sla-insights'));
  }),

  hasHelpCenterInsights: computed(function() {
    return this.get('plan').has('helpcenter_insights') || variation('feature-restrict-helpcenter-insights');
  }),

  hasCustomReportingInsights: computed(function() {
    return this.get('plan').has('custom_reporting') || variation('feature-restrict-custom-reporting-insights');
  }),

  hasAgentTeamInsights: computed(function() {
    return this.get('plan').has('agent_team_insights') || variation('feature-restrict-agent-team-insights');
  })

});
