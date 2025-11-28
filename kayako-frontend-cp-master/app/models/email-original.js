import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  subject: attr('string'),
  from: attr('string'),
  to: attr('string'),
  receivedAt: attr('string'),
  htmlContent: attr('string'),
  sourceContent: attr('string')
});
