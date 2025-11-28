function getChartPointInterval(interval) {
  const intervals = {
    DAY: 24 * 3600 * 1000,
    WEEK: 24 * 3600 * 1000 * 7,
    MONTH: 24 * 3600 * 1000 * 31
  };

  return intervals[interval];
}

function getTickInterval(interval) {
  if (interval === 'DAY') {
    return getChartPointInterval(interval) * 2;
  }

  return getChartPointInterval(interval);
}

export { getChartPointInterval, getTickInterval };
