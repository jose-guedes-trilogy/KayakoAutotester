import { alias } from '@ember/object/computed';
import DS from 'ember-data';

export default DS.Model.extend({
  name: alias('id'),
  title: DS.attr('string')
});
