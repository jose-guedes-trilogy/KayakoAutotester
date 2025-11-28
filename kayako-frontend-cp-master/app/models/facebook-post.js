import DS from 'ember-data';
import Postable from './postable';

export default Postable.extend({
  uuid: DS.attr('string'),
  postType: 'facebookPost',
  isMessage: true
});
