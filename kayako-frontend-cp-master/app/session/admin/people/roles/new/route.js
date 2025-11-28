import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('model'), {
  model() {
    return this.store.createRecord('role');
  }
});
