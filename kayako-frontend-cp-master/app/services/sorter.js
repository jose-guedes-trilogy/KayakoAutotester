import Service from '@ember/service';
import { isEmpty } from '@ember/utils';
import { getOwner } from '@ember/application';

export default Service.extend({
  sort(models, {startingIndex = 0} = {}) {
    if (isEmpty(models)) {
      return;
    }
    const adapter = getOwner(this).lookup('adapter:application');
    const modelName = models.get('firstObject').constructor.modelName;
    const adapterNamespace = adapter.get('namespace');
    const modelNamespace = this._modelNamespaceFor(modelName);

    models.forEach((model, index) => {
      model.set(this._sortingFieldFor(modelName), index + startingIndex);
    });

    adapter.ajax(`${adapterNamespace}/${modelNamespace}/reorder`, 'PUT', {
      data: { [this._idsKeyFor(modelName)]: models.mapBy('id').join(',') }
    });
  },

  _sortingFieldFor(name) {
    switch (name) {
      case 'case-priority': return 'level';
      case 'sla': return 'executionOrder';
      case 'trigger': return 'executionOrder';
      default: return 'sortOrder';
    }
  },

  _modelNamespaceFor(name) {
    switch (name) {
      case 'case-priority': return 'cases/priorities';
      case 'case-status': return 'cases/statuses';
      case 'case-field': return 'cases/fields';
      case 'user-field': return 'users/fields';
      case 'organization-field': return 'organizations/fields';
      case 'sla': return 'slas';
      case 'trigger': return 'triggers';
    }
  },

  _idsKeyFor(name) {
    switch (name) {
      case 'case-priority': return 'priority_ids';
      case 'case-status': return 'status_ids';
      case 'case-field': return 'field_ids';
      case 'user-field': return 'field_ids';
      case 'organization-field': return 'field_ids';
      case 'sla': return 'sla_ids';
      case 'trigger': return 'trigger_ids';
    }
  }
});
