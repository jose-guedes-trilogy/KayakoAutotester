export default function(i18n) {
  return function () {
    let tooltip = [
      `<b>${i18n.formatDate(this.x, { format: 'weekdayDate' })}</b>`
    ];

    this.points.forEach(point => {
      tooltip.push(`<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: ${i18n.formatNumber(point.y)}`);
    });

    return tooltip.join('<br/>');
  };
}
