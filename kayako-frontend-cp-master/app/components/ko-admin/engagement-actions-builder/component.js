import Component from '@ember/component';
import fallbackIfUndefined from 'ember-basic-dropdown/utils/computed-fallback-if-undefined';

export default Component.extend({

  // Attributes

  classNames: ['ko-automation-actions-builder'],
  type: '',
  isNew: true,
  team: null,
  agent: null,
  teams: fallbackIfUndefined([]),
  agents: fallbackIfUndefined([]),
  automationActions: fallbackIfUndefined([]),
  definitions: fallbackIfUndefined([]),

  // Lifecycle hooks

  didReceiveAttrs() {
    this._super(...arguments);
  }
});
