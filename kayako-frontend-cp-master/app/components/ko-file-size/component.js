import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

function readableFilesize(bytes, unitSet) {
  // this is correct for kilo, 1024 is for kibi
  const thresh = 1000;

  if (Math.abs(bytes) < thresh) {
    return {
      size: String(bytes),
      unit: unitSet.B
    };
  }
  let units = [
    unitSet.kB,
    unitSet.MB,
    unitSet.GB
  ];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return {
    size: String(bytes.toFixed(2)),
    unit: units[u]
  };
}

export default Component.extend({
  tagName: 'span',
  size: null,
  i18n: service(),

  options: computed('size', function () {
    const i18n = this.get('i18n');

    const units = {
      B: i18n.t('generic.units.B'),
      kB: i18n.t('generic.units.kB'),
      MB: i18n.t('generic.units.MB'),
      GB: i18n.t('generic.units.GB')
    };

    return readableFilesize(this.get('size'), units);
  })
});
