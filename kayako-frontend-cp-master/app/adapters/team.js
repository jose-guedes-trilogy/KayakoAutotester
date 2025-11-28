import ApplicationAdapter from './application';
import UnpaginateMixin from './unpanginate-mixin';
import { get } from '@ember/object';

export default ApplicationAdapter.extend(UnpaginateMixin, {
  shouldReloadRecord() {
    return true;
  },

  addMembers(team, members) {
    let teamId = get(team, 'id');
    let agentIds = members.mapBy('id').join(',');
    let url = `${this.namespace}/teams/${teamId}/members`;
    let options = { data: { agent_ids: agentIds } };

    return this.ajax(url, 'POST', options);
  },

  removeMembers(team, members) {
    let teamId = get(team, 'id');
    let agentIds = members.mapBy('id').join(',');
    let url = `${this.namespace}/teams/${teamId}/members?agent_ids=${agentIds}`;

    return this.ajax(url, 'DELETE');
  }
});
