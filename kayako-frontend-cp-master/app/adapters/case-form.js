import ApplicationAdapter from './application';

// We are including `case-field` as part of HOTFIX FT-1897
// If and when PDM-9524 lands, we can revert.
const REQUIRED_SIDELOADED_MODELS = 'case-field,locale-field';

export default ApplicationAdapter.extend({

  autoIncludeAll: false,

  pathForType() {
    return 'cases/forms';
  },

  urlForFindAll() {
    const url = this._super(...arguments);
    return `${url}?include=${REQUIRED_SIDELOADED_MODELS}`;
  },

  urlForQuery() {
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
