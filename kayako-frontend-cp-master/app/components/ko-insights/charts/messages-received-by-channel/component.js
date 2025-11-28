import Component from '@ember/component';
import _ from 'npm:lodash';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import highchartsDefaultOptions from '../../highcharts/default-options';
import highchartsTooltipFormatterStacked from '../../highcharts/tooltip-formatters/stacked';

const COLOR_BY_CHANNEL = {
  FACEBOOK: '#3b5998',
  TWITTER: '#4099FF',
  MESSENGER: '#6dd9c2',
  CALL: '#57BE42',
  MAIL: '#f28068',
  HELPCENTER: '#f9c821'
};

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
      chart: {
        type: 'area',
        height: 400,
        spacingTop: 20,
        marginTop: 20
      },
      yAxis: [{
        title: {
          text: null
        },
        gridLineDashStyle: 'Dot',
        min: 0,
        showFirstLabel: true
      }],
      tooltip: {
        formatter: highchartsTooltipFormatterStacked(i18n)
      },
      legend: {
        labelFormat: '{name}',
        shadow: false,
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        floating: false,
        itemMarginBottom: 0,
        x: 0,
        y: 0
      },
      plotOptions: {
        area: {
          marker: {
            enabled: markerEnabled
          },
          stacking: 'normal',
          dataLabels: {
            enabled: false
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
    const allowedChannels = Object.keys(COLOR_BY_CHANNEL);

    let { point, pointInterval } = insights.prepareSeriesData(null, null, data.start_at, data.end_at, null, interval);

    return data.channel_series.filter(channel => {
      return allowedChannels.indexOf(channel.channel) > -1;
    }).map(channel => {
      return {
        name: i18n.t(`insights.chart.channel_stats.${channel.channel}`),
        data: channel.series.data,
        color: COLOR_BY_CHANNEL[channel.channel] ? COLOR_BY_CHANNEL[channel.channel] : null,
        type: 'area',
        pointStart: point,
        pointInterval: pointInterval,
        visible: channel.channel !== 'MESSENGER'
      };
    });
  })
});
