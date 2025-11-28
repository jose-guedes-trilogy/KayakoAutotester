import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // attrs
  startAt: null,
  endAt: null,
  interval: null,
  slaId: null,
  metricsQueryParams: null,
  slaQueryTerm: '',

  onActorChange: () => {},
  onDateRangeChange: () => {},
  onIntervalChange: () => {}
});
