import { attr, list, model } from 'frontend-cp/services/virtual-model';

export default model('team', {
  title: attr(),
  businesshour: attr(),
  members: list()
});
