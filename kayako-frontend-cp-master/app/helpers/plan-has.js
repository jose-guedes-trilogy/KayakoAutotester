import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';

export default Helper.extend({
  plan: service(),

  featuresDidChange: observer('plan.features.@each.code', function() {
    this.recompute();
  }),

  compute([feature]) {
    return this.get('plan').has(feature);
  }
});
