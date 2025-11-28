import legacyDefault from './legacy-default';
import {
  createAllSlaPermutations,

  slaVersionForAllMetricStates,
  slaVersionTargetForFirstReplyTime,
  slaVersionTargetForResolutionTime,

  allFirstReplySlaMetricStates,
  // allResolutionTimeSlaMetricStates,

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
} from './sla-all-permutations';
import { createViewForAllSlas } from './view-for-all-slas';
import { createCaseForView } from './cases';
import { createAdmin, createCustomer } from './users';
import { admin, agent } from './roles';
import { defaultLocale } from './locales';
import { createPrivacyExamples } from './privacy';
import userDefinitions from './user-definitions';
import createTimelineExamples from './timeline-examples';

function createCaseSpecificPosts(server, adminUser, requester) {
  let inboxView = server.schema.db.views.where({ title: 'Inbox' })[0];
  let lastCaseId = +server.schema.db.cases[server.schema.db.cases.length - 1].id;

  createCaseForView(server, {viewId: inboxView.id, caseId: lastCaseId + 1, subject: 'Assistance with reports', requester});
  // let kase = createCaseForView(server, {viewId: inboxView.id, caseId: lastCaseId + 1, subject: 'Assistance with reports', requester});
  // let identityEmail = server.schema.db.identityEmails[0];

  //server.createList('post', 5, { creator: adminUser, identity: identityEmail, case_id: kase.id });

  //kase = createCaseForView(server, inboxView.id, +kase.id + 1, 'License query', null, null, null);

  //server.createList('post', 2, { creator: adminUser, identity: identityEmail, case_id: kase.id });
}

export default function(server) {
  let billMurrayDotCom = server.create('organization', {
    domains: [
      server.create('identity-domain', {
        domain: 'billmurray.com'
      })
    ],
    metadata: server.create('metadata'),
    tags: server.createList('tag', 2)
  });

  let murrayMurrayDotCom = server.create('organization', {
    domains: [
      server.create('identity-domain', {
        domain: 'murraymurray.com'
      })
    ],
    metadata: server.create('metadata'),
    tags: server.createList('tag', 2)
  });

  let adminUser = createAdmin(server, 'Bill Murray', billMurrayDotCom);
  let adminUserFromAnotherOrg = createAdmin(server, 'Murray Murray', murrayMurrayDotCom);
  let adminUserWithNoIdentities = createAdmin(server, 'John Doe', null, [], [], [], []);

  let customerOrganization = server.create('organization', {
    domains: [
      server.create('identity-domain', {
        domain: 'c.ustomer.com'
      })
    ],
    metadata: server.create('metadata'),
    tags: server.createList('tag', 2)
  });

  let customerUser = createCustomer(server, 'Charlie Ustomer', customerOrganization);

  userDefinitions(server);

  createAllSlaPermutations(server);
  createPrivacyExamples(server);
  let adminRole = admin(server);
  let locale = defaultLocale(server);

  //old default scenario needs to run before any new cases are created as there are some tests that depend on the auto incrementing id of case creation
  //this needs to be fixed
  legacyDefault(server, locale, adminRole, adminUser, adminUserFromAnotherOrg, adminUserWithNoIdentities, slaVersionForAllMetricStates, allFirstReplySlaMetricStates);

  //Agent Role is required by  Acceptance | Conversation | User: Update a user with invalid info highlights the errors
  agent(server);
let allSlaView = createViewForAllSlas(server); createCaseForView(server, {viewId: allSlaView.id, caseId: 991, subject: 'replied within', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [repliedWithinSla], slaVersionTargets: [slaVersionTargetForFirstReplyTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 992, subject: 'replied outside', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [repliedOutsideSla], slaVersionTargets: [slaVersionTargetForFirstReplyTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 993, subject: 'no reply within', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [noReplyButWithinSla], slaVersionTargets: [slaVersionTargetForFirstReplyTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 994, subject: 'no reply outside', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [noReplyOutsideSla], slaVersionTargets: [slaVersionTargetForFirstReplyTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 995, subject: 'paused within', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [firstReplyTimePausedWithinSla], slaVersionTargets: [slaVersionTargetForFirstReplyTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 996, subject: 'paused outside', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [firstReplyTimePausedOutsideSla], slaVersionTargets: [slaVersionTargetForFirstReplyTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 997, subject: 'resolved within', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [resolvedWithinSla], slaVersionTargets: [slaVersionTargetForResolutionTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 998, subject: 'resolved outside', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [resolvedOutsideSla], slaVersionTargets: [slaVersionTargetForResolutionTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 999, subject: 'no resolution within', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [noResolutionButWithinSla], slaVersionTargets: [slaVersionTargetForResolutionTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 1000, subject: 'no reply outside', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [noResolutionOutsideSla], slaVersionTargets: [slaVersionTargetForResolutionTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 1001, subject: 'paused within', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [resolutionTimePausedWithinSla], slaVersionTargets: [slaVersionTargetForResolutionTime]});
  createCaseForView(server, {viewId: allSlaView.id, caseId: 1002, subject: 'paused outside', requester: customerUser, slaVersions: slaVersionForAllMetricStates, slaMetrics: [resolutionTimePausedOutsideSla], slaVersionTargets: [slaVersionTargetForResolutionTime]});

  createCaseSpecificPosts(server, adminUser, customerUser);

  createTimelineExamples(server, customerUser, adminUser);

}
