import formatSeconds from 'frontend-cp/lib/humanize-seconds';

export default function(i18n) {
  return function () {
    let tooltip = [];

    this.points.forEach(point => {
      let formattedDate = i18n.formatDate(point.point.date, { format: 'weekdayDate' });
      tooltip.push(`<b>${formattedDate}</b>`);
      tooltip.push(`<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: ${formatSeconds(point.y)}`);
    });

    return tooltip.join('<br/>');
  };
}
