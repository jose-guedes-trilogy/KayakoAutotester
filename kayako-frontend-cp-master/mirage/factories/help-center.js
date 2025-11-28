import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  id: (i) => i + 1,
  displayMessenger: false
});
