import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  activity: null,
  readState: 'UNSEEN',
  createdAt: new Date(),
  notificationDay: new Date(),
  resource_type: 'notification'
});
