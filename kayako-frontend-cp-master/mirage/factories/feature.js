import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'product_feature',
  name: 'Collaborators',
  code: 'collaborators',
  description: 'People who may log in as a team member',
});
