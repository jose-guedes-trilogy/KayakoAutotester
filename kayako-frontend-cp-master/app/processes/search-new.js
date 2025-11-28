import Process from './process';
import EmberObject from '@ember/object';
import { get } from '@ember/object';

const SearchNewProcess = Process.extend({
  type: 'search-new',

  restoreModel(json) {
    return EmberObject.create({
      id: json.modelId
    });
  }
});

SearchNewProcess.reopenClass({
  generatePid(model) {
    let id = get(model, 'id');
    return `search-new:${id}`;
  }
});

export default SearchNewProcess;
