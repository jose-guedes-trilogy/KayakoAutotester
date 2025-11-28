import { readOnly } from '@ember/object/computed';
import Component from '@ember/component';
import humanizeSeconds from 'frontend-cp/lib/computed/humanize-seconds';

export default Component.extend({
  tagName: '',

  onDateRangeChange: () => {},

  // Attrs
  startAt: null,
  endAt: null,
  interval: null,
  casesCompletion: null,
  casesResponse: null,
  casesResolution: null,

  casesCompletionMetric: readOnly('casesCompletion.metric'),

  casesResponseMetricValue: humanizeSeconds('casesResponse.metric.value'),
  casesResponseMetricPrevious: humanizeSeconds('casesResponse.metric.previous'),
  casesResolutionMetricValue: humanizeSeconds('casesResolution.metric.value'),
  casesResolutionMetricPrevious: humanizeSeconds('casesResolution.metric.previous')
});
