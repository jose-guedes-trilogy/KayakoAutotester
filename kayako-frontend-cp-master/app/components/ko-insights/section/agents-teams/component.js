import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  permissions: service(),
  tagName: '',

  onActorChange: () => {},
  onDateRangeChange: () => {},

  // Attrs
  section: null,
  startAt: null,
  endAt: null,
  interval: null,
  actorId: null,
  slaId: null,
  actorQueryTerm: '',
  slaQueryTerm: '',
  casesCompletion: null,
  slaTarget: null,
  slaPerformance: null,
  csat: null,

  actorLoaderComponent: computed('section', function() {
    if (this.get('section') === 'agent') {
      return 'ko-insights/loader/actor/agent';
    }

    return 'ko-insights/loader/actor/team';
  }),

  slaSectionEnabled: computed('permissions', function() {
    return this.get('permissions').has('slas.manage');
  })
});
