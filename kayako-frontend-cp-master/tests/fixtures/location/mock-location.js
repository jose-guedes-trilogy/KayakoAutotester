import HistoryLocation from '@ember/routing/history-location';
import { History, Location } from 'frontend-cp/tests/fixtures/browser/mock-browser';

export default HistoryLocation.extend({
  init: function() {
    let location = new Location();
    let history = new History({
      location: location
    });
    this.set('location', location);
    this.set('history', history);
    this._super();
    this.initState();
    this.replaceState(this.formatURL('/'));
  }
});
