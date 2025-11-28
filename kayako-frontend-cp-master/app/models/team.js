import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';

export default Model.extend({
  title: attr('string', { defaultValue: '' }),
  memberCount: attr('number'),
  businesshour: belongsTo('business-hour'),
  members: hasMany('user')
});
