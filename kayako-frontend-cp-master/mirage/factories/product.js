import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'product',
  name: 'Kayako',
  type: 'NOVO',
  family: 'NOVO',
  features: () => []
});
