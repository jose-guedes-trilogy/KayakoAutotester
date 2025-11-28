import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { task, timeout } from 'ember-concurrency';
import { firstName } from 'frontend-cp/helpers/first-name';

export default Component.extend({
  tagName: '',

  preview: null,
  activeAgents: null,
  agentAvatars: [],
  existingStyle: '',

  didReceiveAttrs() {
    this.getAgents();
  },

  hasMultipleAgents: computed.gt('preview.lastActiveAgents.length', 1),

  primaryColor: computed.readOnly('preview.primaryColor'),

  colorStyle: computed('primaryColor', function() {
    return htmlSafe(`color: ${this.get('primaryColor')}`);
  }),

  buttonStyle: computed('primaryColor', function() {
    return htmlSafe(`background-color: ${this.get('primaryColor')}`);
  }),

  backgroundStyle: computed('preview.patternUrl', 'preview.activeGradient', 'preview.activeSolidColor', 'preview.backgroundMode', function() {
    this.get('animateBackground').perform();

    let mode = this.get('preview.backgroundMode');
    let patternUrl = this.get('preview.patternUrl');
    let gradientValue = this.get('preview.activeGradient');
    let gradient = '';
    let pattern = '';
    let separator = '';
    let solidColor = '';
    let backgroundImage = 'none';

    if (mode === 'gradient') {
      gradient = `linear-gradient(${gradientValue})`;
    }
    if (patternUrl) {
      pattern = `url(${patternUrl})`;
    }
    if (mode === 'gradient' && pattern) {
      separator = ',';
    }
    if (mode === 'gradient' || pattern) {
      backgroundImage = `${pattern}${separator}${gradient}`;
    }
    if (mode === 'color') {
      solidColor = `background-color:${this.get('preview.activeSolidColor')}`;
    }

    return htmlSafe(`background-image: ${backgroundImage};${solidColor}`);
  }),

  animateBackground: task(function * () {
    yield timeout(520);
    this.set('existingStyle', this.get('backgroundStyle'));
  }).drop(),

  getAgents() {
    let firstNames = [];
    this.get('preview.lastActiveAgents').mapBy('fullName').forEach((agent) => {
      firstNames.push(firstName(agent));
    });

    let names = firstNames.join(', ');
    let avatars = this.get('preview.lastActiveAgents').mapBy('avatar');
    this.set('activeAgents', names);
    this.set('agentAvatars', avatars);
  }
});
