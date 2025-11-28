/**
 * Wrapper for a collection of methods that make requests to the API that
 * cannot be readily modelled in an EmberData way
 */
import { getOwner } from '@ember/application';

import Service, { inject as service } from '@ember/service';

export default Service.extend({
  // Services
  store: service('store'),

  trashCase(caseId) {
    return this._updateCaseState(caseId, `/cases/${caseId}/trash`);
  },

  restoreCase(caseId) {
    return this._updateCaseState(caseId, `/cases/${caseId}/restore`);
  },

  mergeCases(target, mergeCandidates) {
    let adapter = getOwner(this).lookup('adapter:case');
    let requestUrl = adapter.namespace + `/cases/${target}/merge`;
    let candidates = mergeCandidates.toString();
    return adapter.ajax(requestUrl, 'POST', { data: { case_ids: candidates } });
  },

  _updateCaseState(caseId, path) {
    let adapter = getOwner(this).lookup('adapter:case');
    let url = adapter.namespace + path;
    return adapter.ajax(url, 'put').then((response) => {
      this.get('store').pushPayload('case', {
        id: caseId,
        type: 'case',
        attributes: { state: response.data.state }
      });
    });
  }
});
