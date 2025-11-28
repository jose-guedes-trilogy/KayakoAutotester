export default {
  date: {
    month: {
      month: 'long'
    },
    dayMonth: {
      day: 'numeric',
      month: 'short'
    },
    year: {
      year: 'numeric'
    },
    L: {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    },
    full: {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    },
    ll: {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    },
    weekdayDate: {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    },
    lll: {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    },
    LLL: {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    },
    fullWithTime: {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    }
  },
  number: {
    filesize: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  time: {
    time: {
      hour: 'numeric',
      minute: 'numeric'
    },
    tooltip: {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }
  }
};
