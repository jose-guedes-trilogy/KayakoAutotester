import DS from 'ember-data';
import Account from './account';
import { match, not } from '@ember/object/computed';

export default Account.extend({
  uuid: DS.attr('string'),
  service: DS.attr('string'),
  encryption: DS.attr('string'),
  address: DS.attr('string', { defaultValue: '' }),
  prefix: DS.attr('string'),
  smtpType: DS.attr('string'),
  host: DS.attr('string'),
  port: DS.attr('number'),
  username: DS.attr('string'),
  preserveMails: DS.attr('boolean'),
  brand: DS.belongsTo('brand', { async: false }),
  isSystem: DS.attr('boolean', { defaultValue: false }),
  isDefault: DS.attr('boolean'),
  isEnabled: DS.attr('boolean', { defaultValue: true }),
  isVerified: DS.attr('boolean', { defaultValue: false }),
  isDeleted: DS.attr('boolean', { defaultValue: false }),

  isKayakoDomain: match('address', /\.kayako\.com$/),
  isCustomDomain: not('isKayakoDomain')
});
