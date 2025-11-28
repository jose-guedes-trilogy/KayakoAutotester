import DS from 'ember-data';

export default DS.Model.extend({
  unitOfMeasure: DS.attr('string'),
  quantity: DS.attr('string'),
  isLastSegment: DS.attr('boolean')
});
