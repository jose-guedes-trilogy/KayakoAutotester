import { inject as service } from '@ember/service';
import { readOnly } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { on } from '@ember/object/evented';
import _ from 'npm:lodash';

const { findLast } = _;

export default Component.extend({
  // Attributes
  targets: null,
  priority: null,
  type: null,
  onValueChange: () => {},

  // State
  unit: null,

  // HTML
  localClassNames: ['target'],

  // Services
  i18n: service(),

  // Init
  initUnit: on('init', function () {
    const units = this.get('units');
    const goalInSeconds = this.get('goalInSeconds');
    this.set('unit', findLast(units, unit => goalInSeconds % unit.seconds === 0) || units[0]);
  }),

  // CPs
  currentTarget: computed('priority', 'type', 'targets.[]', function () {
    const priority = this.get('priority');
    const type = this.get('type');
    return this.get('targets').find(metric =>
      metric.get('priority') === priority && metric.get('slaTargetType') === type
    );
  }),

  goalInSeconds: readOnly('currentTarget.goalInSeconds'),

  units: computed(function () {
    const t = unit => this.get('i18n').t(`admin.sla.edit.targets.units.${unit}`);
    return [
      { label: t('minutes'), id: 'minutes', seconds: 60 },
      { label: t('hours'), id: 'hours', seconds: 60 * 60 },
      { label: t('days'), id: 'days', seconds: 60 * 60 * 24 }
    ];
  }),

  value: computed('goalInSeconds', 'unit', function () {
    const goalInSeconds = this.get('goalInSeconds');
    return _.isNumber(goalInSeconds) ? goalInSeconds / this.get('unit').seconds : '';
  }),

  actions: {
    setValue(value) {
      const unit = this.get('unit');
      const trimmedValue = value.trim();
      if (trimmedValue === '') {
        this.get('onValueChange')(null);
      } else if (trimmedValue === '0') {
        this.$('input').val('');
        this.get('onValueChange')(null);
      } else if (/^\d+$/.test(trimmedValue)) {
        this.$('input').val(trimmedValue);
        this.get('onValueChange')(unit.seconds * parseInt(trimmedValue, 10));
      } else {
        this.$('input').val(this.get('value'));
        this.get('onValueChange')(this.get('goalInSeconds'));
      }
    },

    setUnit(unit) {
      const oldUnit = this.get('unit');
      this.set('unit', unit);
      const seconds = this.get('goalInSeconds') / oldUnit.seconds * unit.seconds;
      this.get('onValueChange')(seconds);
    }
  }
});
