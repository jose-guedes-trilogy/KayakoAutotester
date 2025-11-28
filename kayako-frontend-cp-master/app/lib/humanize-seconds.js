export default function(time, maxType = 'hours') {
  let days = Math.floor(time / 86400);
  let hours = parseInt(time / 3600) - (days * 24);
  let minutes = parseInt((parseInt(time % 3600)) / 60);
  let seconds = parseInt(time) - (minutes * 60);

  if (!days && !hours && !minutes) {
    return seconds + 's';
  } else if (!days && !hours) {
    return minutes + 'm ' + (seconds ? seconds + 's' : '');
  } else if (!days) {
    return hours + 'h ' + (minutes ? minutes + 'm' : '');
  } else {
    if (maxType === 'hours') {
      hours += days * 24;
      return hours + 'h ' + minutes + 'm';
    }

    return days + 'd ' + hours + 'h ' + minutes + 'm';
  }
}
