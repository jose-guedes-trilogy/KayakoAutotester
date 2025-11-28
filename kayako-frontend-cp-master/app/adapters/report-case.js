import ApplicationAdapter from './application';

const REQUIRED_SIDELOADED_MODELS = [
  'case',
  'user',
  'user_minimal',
  'status',
  'case_status',
  'article',
  'section',
  'category',
  'locale_field',
  'channel'
].join(',');

const REQUIRED_FIELDS = [
  'resource',
  'resource_url',
  'subject',
  'requester(avatar,full_name)',
  'assigned_agent(avatar,full_name)',
  'status',
  'updated_at',
  'last_message_preview'
].join(',');

export default ApplicationAdapter.extend({
  pathForType() {
    return 'reports/preview';
  },

  urlForQuery () {
    const url = this._super(...arguments);
    return `${url}?include=${REQUIRED_SIDELOADED_MODELS}&fields=${REQUIRED_FIELDS}`;
  },

  // TODO - use methodForRequest when the 'ds-improved-ajax' flag is enabled
  ajax(url, type, data) {
    return this._super(url, 'POST', data);
  }
});
