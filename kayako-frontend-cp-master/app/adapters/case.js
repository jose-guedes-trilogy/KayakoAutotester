import ApplicationAdapter from './application';

const REQUIRED_SIDELOADED_MODELS = 'channel,last_public_channel,mailbox,facebook_page,facebook_account,twitter_account,user,organization,sla_metric,sla_version_target,sla_version,identity_email,identity_domain,identity_facebook,identity_twitter,identity_phone,case_field';

export default ApplicationAdapter.extend({
  autoIncludeAll: false,

  urlForQuery (query, modelName) {
    if (query.parent) {
      let id = query.parent.id;
      let url = this._super(...arguments);
      Reflect.deleteProperty(query, 'parent');
      let newUrl = url.replace('/cases', `/views/${id}/cases`);
      return `${newUrl}?include=read_marker`;
    }
    return this._super(...arguments);
  },

  urlForUpdateRecord() {
    const url = this._super(...arguments);
    return `${url}?include=sla_metric,sla_version_target,sla_version,last_public_channel,read_marker`;
  },

  urlForCreateRecord() {
    const url = this._super(...arguments);
    return `${url}?include=${REQUIRED_SIDELOADED_MODELS},read_marker`;
  },

  urlForFindRecord() {
    const url = this._super(...arguments);
    return `${url}?include=${REQUIRED_SIDELOADED_MODELS},read_marker`;
  },

  // We assume that all endpoints, apart from /cases/:id, might return cases with
  // some fields potentially missing. _isFullyLoaded is set automatically during
  // queryRecord.
  shouldReloadRecord(store, snapshot) {
    return !snapshot.record.get('_isFullyLoaded');
  },

  shouldBackgroundReloadRecord() {
    return false;
  },

  emptyTrash() {
    let url = `${this.namespace}/cases/trash`;
    return this.ajax(url, 'DELETE');
  },

  getParticipants(caseId) {
    const url = `${this.namespace}/cases/${caseId}/participants?include=identity_email&exclude_requester`;
    return this.ajax(url, 'GET').then(response => {
      const emailsMap = (response && response.resources && response.resources.identity_email) || {};
      return (response && response.data || []).flatMap(participant =>
        (participant.emails || []).map(ref =>
          emailsMap[ref.id] && emailsMap[ref.id].email
        ).filter(Boolean)
      );
    }).catch(() => []);
  },  
});
