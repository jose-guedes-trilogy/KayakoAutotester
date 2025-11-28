import Component from '@ember/component';

const currencyComponent = Component.extend({
  tagName: ''
});

currencyComponent.reopenClass({
  positionalParams: ['amount', 'currency']
});

export default currencyComponent;
