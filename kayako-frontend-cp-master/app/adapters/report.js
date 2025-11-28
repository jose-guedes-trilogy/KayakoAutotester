import ApplicationAdapter from './application';

const REQUIRED_SIDELOADED_MODELS = 'team,user,predicate-collection,proposition';

export default ApplicationAdapter.extend({
  autoIncludeAll: false,

  urlForQuery () {
    const url = this._super(...arguments);
    return `${url}?include=${REQUIRED_SIDELOADED_MODELS}`;
  },

  urlForUpdateRecord() {
    const url = this._super(...arguments);
    return `${url}?include=${REQUIRED_SIDELOADED_MODELS}`;
  },

  urlForCreateRecord() {
    const url = this._super(...arguments);
    return `${url}?include=${REQUIRED_SIDELOADED_MODELS}`;
  },

  urlForFindRecord() {
    const url = this._super(...arguments);
    return `${url}?include=${REQUIRED_SIDELOADED_MODELS}`;
  }

});
