import moment from 'moment';

let slaVersionForAllMetricStates,

  slaVersionTargetsForAllMetricStates,
  slaVersionTargetForFirstReplyTime,
  slaVersionTargetForResolutionTime,

  allFirstReplySlaMetricStates,
  allResolutionTimeSlaMetricStates,

  repliedWithinSla,
  repliedOutsideSla,
  noReplyButWithinSla,
  noReplyOutsideSla,
  firstReplyTimePausedWithinSla,
  firstReplyTimePausedOutsideSla,

  resolvedWithinSla,
  resolvedOutsideSla,
  noResolutionButWithinSla,
  noResolutionOutsideSla,
  resolutionTimePausedWithinSla,
  resolutionTimePausedOutsideSla;

function createAllSlaPermutations(server) {
  slaVersionTargetForFirstReplyTime = server.create('sla-version-target', {
    goal_in_seconds: 10,
    operational_hours: 'BUSINESS_HOURS',
    type: 'FIRST_REPLY_TIME'
  });

  slaVersionTargetForResolutionTime = server.create('sla-version-target', {
    goal_in_seconds: 10,
    operational_hours: 'BUSINESS_HOURS',
    type: 'RESOLUTION_TIME'
  });

  slaVersionTargetsForAllMetricStates = [
    slaVersionTargetForFirstReplyTime,
    slaVersionTargetForResolutionTime,
  ];


  slaVersionForAllMetricStates = server.create('sla-version', {
    title: 'All sla metric states',
    targets: slaVersionTargetsForAllMetricStates.map((slaVersionTarget) => {
      return {
        id: slaVersionTarget.id,
        resource_type: 'sla_target'
      };
    })
  });

  // First Reply Metrics
  repliedWithinSla = server.create('sla-metric', {
    metric_type: 'FIRST_REPLY_TIME',
    stage: 'COMPLETED',
    due_at: moment().add(1, 'minutes'),
    completed_at: moment().subtract(1, 'minutes'),
    target: {
      id: slaVersionTargetForFirstReplyTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  repliedOutsideSla = server.create('sla-metric', {
    metric_type: 'FIRST_REPLY_TIME',
    stage: 'COMPLETED',
    due_at: moment().subtract(10, 'minutes'),
    completed_at: moment().subtract(1, 'minutes'),
    target: {
      id: slaVersionTargetForFirstReplyTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  noReplyButWithinSla = server.create('sla-metric', {
    metric_type: 'FIRST_REPLY_TIME',
    stage: 'ACTIVE',
    due_at: moment().add(15, 'seconds'),
    completed_at: null,
    target: {
      id: slaVersionTargetForFirstReplyTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  noReplyOutsideSla = server.create('sla-metric', {
    metric_type: 'FIRST_REPLY_TIME',
    stage: 'ACTIVE',
    due_at: moment().subtract(10, 'minutes'),
    completed_at: null,
    target: {
      id: slaVersionTargetForFirstReplyTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  firstReplyTimePausedWithinSla = server.create('sla-metric', {
    metric_type: 'FIRST_REPLY_TIME',
    stage: 'PAUSED',
    due_at: moment().add(15, 'seconds'),
    last_paused_at: moment(),
    completed_at: null,
    target: {
      id: slaVersionTargetForFirstReplyTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  firstReplyTimePausedOutsideSla = server.create('sla-metric', {
    metric_type: 'FIRST_REPLY_TIME',
    stage: 'PAUSED',
    due_at: moment().subtract(10, 'minutes'),
    last_paused_at: moment(),
    completed_at: null,
    target: {
      id: slaVersionTargetForFirstReplyTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  allFirstReplySlaMetricStates = [
    repliedWithinSla,
    repliedOutsideSla,
    noReplyButWithinSla,
    noReplyOutsideSla,
    firstReplyTimePausedWithinSla,
    firstReplyTimePausedOutsideSla
  ];

  // Resolution Time Metrics
  resolvedWithinSla = server.create('sla-metric', {
    metric_type: 'RESOLUTION_TIME',
    stage: 'COMPLETED',
    due_at: moment().add(1, 'minutes'),
    completed_at: moment().subtract(1, 'minutes'),
    target: {
      id: slaVersionTargetForResolutionTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  resolvedOutsideSla = server.create('sla-metric', {
    metric_type: 'RESOLUTION_TIME',
    stage: 'COMPLETED',
    due_at: moment().subtract(10, 'minutes'),
    completed_at: moment().subtract(1, 'minutes'),
    target: {
      id: slaVersionTargetForResolutionTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  noResolutionButWithinSla = server.create('sla-metric', {
    metric_type: 'RESOLUTION_TIME',
    stage: 'ACTIVE',
    due_at: moment().add(15, 'seconds'),
    completed_at: null,
    target: {
      id: slaVersionTargetForResolutionTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  noResolutionOutsideSla = server.create('sla-metric', {
    metric_type: 'RESOLUTION_TIME',
    stage: 'ACTIVE',
    due_at: moment().subtract(10, 'minutes'),
    completed_at: null,
    target: {
      id: slaVersionTargetForResolutionTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  resolutionTimePausedWithinSla = server.create('sla-metric', {
    metric_type: 'RESOLUTION_TIME',
    stage: 'PAUSED',
    due_at: moment().add(15, 'seconds'),
    last_paused_at: moment(),
    completed_at: null,
    target: {
      id: slaVersionTargetForResolutionTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  resolutionTimePausedOutsideSla = server.create('sla-metric', {
    metric_type: 'RESOLUTION_TIME',
    stage: 'PAUSED',
    due_at: moment().subtract(10, 'minutes'),
    last_paused_at: moment(),
    completed_at: null,
    target: {
      id: slaVersionTargetForResolutionTime.id,
      resource_type: 'sla_version_target'
    }
  }),

  allResolutionTimeSlaMetricStates = [
    resolvedWithinSla,
    resolvedOutsideSla,
    noResolutionButWithinSla,
    noResolutionOutsideSla,
    resolutionTimePausedWithinSla,
    resolutionTimePausedOutsideSla
  ];

}

export {
  createAllSlaPermutations,

  slaVersionForAllMetricStates,

  slaVersionTargetsForAllMetricStates,
  slaVersionTargetForFirstReplyTime,
  slaVersionTargetForResolutionTime,

  allFirstReplySlaMetricStates,
  allResolutionTimeSlaMetricStates,

  repliedWithinSla,
  repliedOutsideSla,
  noReplyButWithinSla,
  noReplyOutsideSla,
  firstReplyTimePausedWithinSla,
  firstReplyTimePausedOutsideSla,

  resolvedWithinSla,
  resolvedOutsideSla,
  noResolutionButWithinSla,
  noResolutionOutsideSla,
  resolutionTimePausedWithinSla,
  resolutionTimePausedOutsideSla
};
