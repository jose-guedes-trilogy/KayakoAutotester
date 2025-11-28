import PowerSelect from 'ember-power-select/components/power-select';
import InboundActions from 'ember-component-inbound-actions/inbound-actions';

export default PowerSelect.extend(InboundActions, {
  actions: {
    open() {
      this.publicAPI.actions.open();
    }
  }
});
