import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';

export default Model.extend({
  logType: attr('string'),
  case: belongsTo('case'),
  agent: belongsTo('user'),
  creator: belongsTo('user'),
  tracked: belongsTo('timetracking-tracked'),
  timeSpent: attr('number'),
  currentTime: attr('number')
});
