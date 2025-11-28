export default (i18n) => ({
  chart: {
    type: 'line',
    height: 260,
    marginTop: 70,
    spacingTop: 50,
    spacingLeft: 0,
    spacingRight: 0
  },
  title: {
    text: ''
  },
  xAxis: {
    type: 'datetime',
    labels: {
      y: 22
    }
  },
  yAxis: [{
    title: {
      text: null
    },
    labels: {
      style: {fontSize: 8},
      x: 10,
      y: -5,
      align: 'left',
      format: '{value:.,0f}'
    },
    gridLineDashStyle: 'Dot',
    min: 0,
    showFirstLabel: true
  }],
  tooltip: {
    shared: true,
    crosshairs: true
  },
  legend: {
    labelFormatter: function() {
      const startAt = i18n.formatDate(this.userOptions.start_at, { format: 'll', timeZone: 'UTC' });
      const endAt = i18n.formatDate(this.userOptions.end_at, { format: 'll', timeZone: 'UTC' });

      return `<span style="font-weight: normal;">${startAt} - ${endAt}</span>`;
    },
    shadow: false,
    layout: 'vertical',
    align: 'left',
    verticalAlign: 'top',
    floating: true,
    itemMarginBottom: 5,
    x: -5,
    y: -50
  },
  credits: {
    enabled: false
  }
});
