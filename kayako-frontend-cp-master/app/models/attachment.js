import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default DS.Model.extend({
  name: DS.attr('string'),
  size: DS.attr('number'),
  width: DS.attr('number'), // TODO should exist on attachment within posts/:id
  height: DS.attr('number'), // TODO should exist on attachment within posts/:id
  type: DS.attr('string'), // TODO should exist on attachment within posts/:id
  attachmentType: DS.attr('string'),
  url: DS.attr('string'), // TODO should exist on attachment within posts/:id
  urlDownload: DS.attr('string'), // TODO should exist on attachment within posts/:id
  thumbnails: MF.fragmentArray('thumbnail'),
  createdAt: DS.attr('date'), // TODO should exist on attachment within posts/:id

  // Virtual parent field
  message: DS.belongsTo('case-message', { async: true })
});
