/**
 * Converts a moment time (with timezone applied) into a Date that, when given
 * to Intl, will render the right thing. Trust me.
 *
 * @method momentToIntl
 * @param {Moment} m - a moment object
 * @returns {Date}
 */
export default function momentToIntl(m) {
  return new Date(
    m.year(),
    m.month(),
    m.date(),
    m.hours(),
    m.minutes(),
    m.seconds()
  );
}
