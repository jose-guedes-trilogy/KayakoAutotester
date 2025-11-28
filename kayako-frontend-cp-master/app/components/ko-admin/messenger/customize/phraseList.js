/**
 * Phrases and the date time logic to be used
 * for displaying the team reply under xxx
 * minutes.
 */
const phraseList = [
  {
    times: [-1, 5],
    sentence: () => {
      return { locale: 'reply_in_few_minutes', data: {} };
    }
  },
  {
    times: [6, 15],
    sentence: () => {
      return { locale: 'reply_in_under_minutes', data: { minutes: 10 } };
    }
  },
  {
    times: [16, 25],
    sentence: () => {
      return { locale: 'reply_in_under_minutes', data: { minutes: 20 } };
    }
  },
  {
    times: [26, 40],
    sentence: () => {
      return { locale: 'reply_in_under_minutes', data: { minutes: 30 } };
    }
  },
  {
    times: [41, 80],
    sentence: () => {
      return { locale: 'reply_in_under_hour', data: {} };
    }
  },
  {
    times: [81, 240],
    sentence: () => {
      return { locale: 'reply_in_few_hours', data: {} };
    }
  },
  {
    times: [241, 1800],
    sentence: () => {
      return { locale: 'reply_in_a_day', data: {} };
    }
  }
];

export default phraseList;
