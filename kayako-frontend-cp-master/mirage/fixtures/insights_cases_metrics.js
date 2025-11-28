export default {
  status: 200,
  data: {
    start_at: '2016-04-30T21:00:00+00:00',
    end_at: '2016-05-31T20:59:59+00:00',
    previous_start_at: '2016-03-30T21:00:01+00:00',
    previous_end_at: '2016-04-30T21:00:00+00:00',
    metric: [
      {
        name: 'total_assigned',
        value: 115,
        delta_percent: 43.75,
        previous: 80,
        resource_type: 'report_value_comparison'
      },
      {
        name: 'total_created',
        value: 97,
        delta_percent: 2.1052631578947,
        previous: 95,
        resource_type: 'report_value_comparison'
      },
      {
        name: 'customers_helped',
        value: 173,
        delta_percent: 1.7647058823529,
        previous: 170,
        resource_type: 'report_value_comparison'
      },
      {
        name: 'cases_touched',
        value: 242,
        delta_percent: 680.64516129032,
        previous: 31,
        resource_type: 'report_value_comparison'
      },
      {
        name: 'total_public_replies',
        value: 344,
        delta_percent: -33.462282398453,
        previous: 517,
        resource_type: 'report_value_comparison'
      },
      {
        name: 'average_first_response_time',
        value: 9429.2143,
        delta_percent: -10.353772728353,
        previous: 10518.25,
        resource_type: 'report_value_comparison'
      },
      {
        name: 'average_replies_to_resolution',
        value: 0.6786,
        delta_percent: 100,
        previous: 0,
        resource_type: 'report_value_comparison'
      },
      {
        name: 'percentage_first_contact_resolved',
        value: 16.326530612245,
        delta_percent: 79.591836734694,
        previous: 9.0909090909091,
        resource_type: 'report_value_comparison'
      },
      {
        name: 'average_team_changes',
        value: 1.1222,
        delta_percent: 4.7219111608809,
        previous: 1.0716,
        resource_type: 'report_value_comparison'
      },
      {
        name: 'average_assignee_changes',
        value: 0.9142,
        delta_percent: 33.129459734964,
        previous: 0.6867,
        resource_type: 'report_value_comparison'
      },
      {
        name: 'average_first_assignment_time',
        value: 7143.8432544243,
        delta_percent: -27.418343855666,
        previous: 9842.4913868295,
        resource_type: 'report_value_comparison'
      }
    ],
    resource_type: 'report_case_metrics'
  },
  resources: [],
  resource: 'report_case_metrics',
  logs: [
    {
      level: 'WARNING',
      message: 'Entire resources enforced for flat mode'
    }
  ]
};
