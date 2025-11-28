import Mixin from '@ember/object/mixin';

export default Mixin.create({
  startAt: '',
  endAt: '',
  interval: '',
  agent: '',
  team: '',
  sla: '',

  actions: {
    intervalChanged(interval) {
      this.transitionToRoute({ queryParams: { interval: interval }});
    },

    dateRangeHidden(start, end) {
      const startAt = this.get('startAt');
      const endAt = this.get('endAt');

      if (startAt !== start || endAt !== end) {
        this.transitionToRoute({ queryParams: { startAt: start, endAt: end }});
      }
    },

    updateAgent(agent) {
      this.set('agentItem', agent);
      this.set('actorQueryTerm', '');
      this.transitionToRoute({ queryParams: { agent: agent.get('id') }});
    },

    updateTeam(team) {
      this.set('teamItem', team);
      this.set('actorQueryTerm', '');
      this.transitionToRoute({ queryParams: { team: team.get('id') }});
    },

    updateSla(sla) {
      this.set('slaItem', sla);
      this.transitionToRoute({ queryParams: { sla: sla.get('id') }});
    }
  }
});
