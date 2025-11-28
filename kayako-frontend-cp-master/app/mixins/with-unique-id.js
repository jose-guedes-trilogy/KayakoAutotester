import { guidFor } from '@ember/object/internals';
import Mixin from '@ember/object/mixin';

export default Mixin.create({
  init() {
    this._super(...arguments);
    this.uniqueId = guidFor(this);
  }
});
