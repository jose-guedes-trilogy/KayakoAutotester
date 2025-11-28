import DS from 'ember-data';
import Account from './account';

export default Account.extend({
  accountId: DS.attr('string'),
  title: DS.attr('string'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  status: DS.attr('string')
});
