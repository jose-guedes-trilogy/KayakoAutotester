export default {
  'status': 200,
  'data': {
    'start_at': '2016-04-01T21:00:00+00:00',
    'end_at': '2016-05-30T20:59:59+00:00',
    'previous_start_at': '2016-02-02T21:00:01+00:00',
    'previous_end_at': '2016-04-01T21:00:00+00:00',
    'interval': 'WEEK',
    'interval_count': 9,
    'series': {
      'name': 'total_completed',
      'data': [
        0,
        1,
        2,
        6,
        0,
        1,
        14,
        24,
        0
      ],
      'previous': [
        6,
        3,
        1,
        5,
        6,
        3,
        12,
        21,
        6
      ],
      'resource_type': 'report_series_comparison'
    },
    'metric': {
      'name': 'total_completed',
      'value': 48,
      'delta_percent': 100,
      'previous': 0,
      'resource_type': 'report_value_comparison'
    },
    'resource_type': 'report_cases_completion'
  },
  'resource': 'report_cases_completion',
  'logs': [
    {
      'level': 'NOTICE',
      'message': 'Redundant request parameters supplied: agent_id, interval'
    }
  ],
  'session_id': 'wly5xMqoBEA9yZAUyivJcb58c97ef699dd3ad2da6ad728c59bbce5325fd0RJnyad8FvOvYKGiKqcrX'
};
