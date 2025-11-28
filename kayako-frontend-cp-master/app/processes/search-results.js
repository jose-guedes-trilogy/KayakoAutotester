import Process from './process';
import EmberObject from '@ember/object';
import { get } from '@ember/object';

const SearchResultsProcess = Process.extend({
  type: 'search-results',

  restoreModel(json) {
    return EmberObject.create({
      id: json.modelId
    });
  }
});

SearchResultsProcess.reopenClass({
  generatePid(model) {
    let id = get(model, 'id');
    return `search-results:${id}`;
  }
});

export default SearchResultsProcess;
