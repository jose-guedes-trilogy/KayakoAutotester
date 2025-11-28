import Component from '@ember/component';
import _ from 'npm:lodash';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import highchartsTheme from '../../highcharts/kayako-theme';
import highchartsDefaultOptions from '../../highcharts/default-options';
import highchartsTooltipFormatter from '../../highcharts/tooltip-formatters/number';

export default Component.extend({
  tagName: '',

  i18n: service(),
  insights: service(),

  data: null,
  interval: null,

  isSingleInterval: computed.equal('data.interval_count', 1),

  chartOptions: computed('isSingleInterval', function() {
    const i18n = this.get('i18n');
    const markerEnabled = this.get('isSingleInterval');

    return _.merge(_.cloneDeep(highchartsDefaultOptions(i18n)), {
      tooltip: {
        formatter: highchartsTooltipFormatter(i18n)
      },
      plotOptions: {
        spline: {
          marker: {
            enabled: markerEnabled
          }
        },
        line: {
          marker: {
            enabled: markerEnabled
          }
        },
        area: {
          marker: {
            enabled: markerEnabled
          }
        }
      }
    });
  }),

  content: computed('data', function() {
    const i18n = this.get('i18n');
    const data = this.get('data');
    const interval = this.get('interval');
    const insights = this.get('insights');

    let { point, pointInterval, zones, current, previous } = insights.prepareSeriesData(
      data.series.data,
      data.series.previous,
      data.start_at,
      data.end_at,
      data.previous_start_at,
      interval
    );

    return [{
      name: i18n.t('insights.chart.completion_vs_csat.completed_cases_current'),
      color: highchartsTheme.colors[0],
      data: current,
      pointStart: point,
      pointInterval: pointInterval,
      type: 'area',
      start_at: data.start_at,
      end_at: data.end_at,
      interval: interval,
      animation: true
    }, {
      name: i18n.t('insights.chart.completion_vs_csat.completed_cases_previous'),
      color: highchartsTheme.colors[1],
      data: previous,
      pointStart: point,
      pointInterval: pointInterval,
      type: 'line',
      zoneAxis: 'x',
      zones: zones,
      start_at: data.previous_start_at,
      end_at: data.previous_end_at,
      interval: interval,
      animation: true
    }];
  })
});
