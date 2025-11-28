import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  autoIncludeAll: false,

  pathForType() {
    return 'reply';
  },

  urlForCreateRecord(modelType, snapshot) {
    const requiredResources = 'case,post,case_message,note,sla_metric,sla_version_target,sla_version,attachment,message_recipient,identity_email,twitter_tweet,twitter_message,facebook_post,facebook_message,facebook_comment';

    let pathForType = this.pathForType();
    var url = this._super(...arguments);
    return url.replace(pathForType, `cases/${snapshot.record.get('case.id')}/${pathForType}?include=${requiredResources}`);
  }
});
