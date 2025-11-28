import Service from '@ember/service';

export default Service.extend({
  _hasRequestedAllRecordsHash: null,

  init() {
    this._hasRequestedAllRecordsHash = {};
  },

  hasRequestedAllRecords(modelName) {
    return this._hasRequestedAllRecordsHash[modelName];
  },

  setRequestedAllRecords(modelName) {
    this._hasRequestedAllRecordsHash[modelName] = true;
  }
});
