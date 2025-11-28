import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { hasMany } from 'ember-data/relationships';

export default Model.extend({
  billed: attr('number'),
  worked: attr('number'),
  entries: hasMany('timetracking-log'),
});
