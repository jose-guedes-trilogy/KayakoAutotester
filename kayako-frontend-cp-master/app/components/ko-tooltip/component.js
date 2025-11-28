import TooltipsterComponent from 'ember-cli-tooltipster/components/tool-tipster';
import { computed } from '@ember/object';

import styles from './styles';

export default TooltipsterComponent.extend({

  classNameBindings: ['qaCls'],

  // Attributes
  title: '',
  content: '',
  delay: 300,
  qaCls: null,
  side: 'bottom',
  disable: false,
  arrow: false,
  animationDuration: 400,

  triggerEvent: 'hover',

  theme: `tooltipster-default ${styles.tooltip}`,
  animation: 'grow',

  // CPs
  contentAsHTML: computed('title', 'content', function () {
    const content = this.get('content') || this.get('title');
    return content ? Boolean(content.toHTML) : false;
  })
});
