export default
{
  'status': 200,
  'data': {
    'start_at': '2016-04-01T21:00:00+00:00',
    'end_at': '2016-05-30T20:59:59+00:00',
    'previous_start_at': '2016-02-02T21:00:01+00:00',
    'previous_end_at': '2016-04-01T21:00:00+00:00',
    'interval': 'WEEK',
    'interval_count': 9,
    'series': {
      'name': 'average_csat',
      'data': [
        100,
        100,
        83.333333333333,
        100,
        0,
        0,
        0,
        0,
        0
      ],
      'previous': [
        100,
        50,
        100,
        100,
        100,
        0,
        0,
        100,
        100
      ],
      'resource_type': 'report_series_comparison'
    },
    'metric': {
      'name': 'average_csat',
      'value': 91.666666666667,
      'delta_percent': -1.7857142857143,
      'previous': 93.333333333333,
      'resource_type': 'report_value_comparison'
    },
    'resource_type': 'report_case_csat'
  },
  'resource': 'report_case_csat',
  'logs': [
    {
      'level': 'NOTICE',
      'message': 'Redundant request parameters supplied: agent_id, interval'
    }
  ],
  'session_id': 'iKyALPdw3NJa7ihZ9IR74Ou8lNRZe87e7649956a4291380bc705db275efdb15c42c57Xb33VEf6uzfY4va'
};
