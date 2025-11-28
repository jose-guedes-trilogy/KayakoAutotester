import Component from '@ember/component';
import _ from 'npm:lodash';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import HighchartsTheme from '../../highcharts/kayako-theme';
import highchartsDefaultOptions from '../../highcharts/default-options';
import highchartsTooltipFormatterPercent from '../../highcharts/tooltip-formatters/percent';

export default Component.extend({
  i18n: service(),
  insights: service(),

  data: null,
  interval: null,

  isSingleInterval: computed.equal('data.interval_count', 1),

  chartOptions: computed('isSingleInterval', function() {
    const markerEnabled = this.get('isSingleInterval');
    const i18n = this.get('i18n');

    return _.merge(_.cloneDeep(highchartsDefaultOptions(i18n)), {
      yAxis: [{
        labels: {
          format: '{value:.,0f}%'
        },
        tickInterval: 20,
        min: 0,
        max: 100
      }],
      tooltip: {
        formatter: highchartsTooltipFormatterPercent(i18n)
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

  content: computed('data', function () {
    const data = this.get('data');
    const i18n = this.get('i18n');
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
      name: i18n.t('insights.chart.current_period'),
      color: HighchartsTheme.colors[0],
      data: current,
      pointStart: point,
      pointInterval: pointInterval,
      type: 'area',
      start_at: data.start_at,
      end_at: data.end_at
    }, {
      name: i18n.t('insights.chart.previous_period'),
      color: HighchartsTheme.colors[1],
      data: previous,
      pointStart: point,
      pointInterval: pointInterval,
      type: 'line',
      zoneAxis: 'x',
      zones: zones,
      start_at: data.previous_start_at,
      end_at: data.previous_end_at
    }];
  })
});
