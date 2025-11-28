import { createCaseForView } from './cases';
import {
  createPostsAndActivities,
  viewingAnArticleInHelpcenter,
  searchingForAnArticleInHelpcenter,
  commentingOnAnArticleInHelpcenter,
  caseMessageFromCustomer,
  caseMessageFromAgent,
  chatMessage,
  facebookMessage,
  twitterMessage,
  twitterTweet
} from './posts-all-permutations';
import activitiesAllPermutationsScenario from './activities-all-permutations';

export default function createTimelineExamples(server, customerUser, adminUser) {
  let columns = [
    server.create('column', {
      title: 'Case ID',
      name: 'caseid'
    }),
    server.create('column', {
      title: 'Subject',
      name: 'subject'
    }),
  ];

  let timelineExamplesView = server.create('view', {
    title: 'Timeline examples',
    is_default: false,
    is_enabled: true,
    columns: columns,
    sort_order: 1,
    type: 'CUSTOM'
  });

  //The kitchen sink
  let kitchenSinkCaseId = _nextAvailableCaseId(server);
  createCaseForView(server, {viewId: timelineExamplesView.id, caseId: kitchenSinkCaseId, subject: 'Timeline all permutations of posts and activities', requester: customerUser});
  createPostsAndActivities(server, customerUser, customerUser.emails[0], adminUser, adminUser.emails[0], kitchenSinkCaseId);
  activitiesAllPermutationsScenario(server, customerUser, customerUser.emails[0], adminUser, adminUser.emails[0]);

  //Historical posts
  let historicalPostsCaseId = _nextAvailableCaseId(server);
  viewingAnArticleInHelpcenter(server, customerUser, customerUser.emails[0], historicalPostsCaseId);
  searchingForAnArticleInHelpcenter(server, customerUser, customerUser.emails[0], historicalPostsCaseId);
  commentingOnAnArticleInHelpcenter(server, customerUser, customerUser.emails[0], historicalPostsCaseId);
  createCaseForView(server, {viewId: timelineExamplesView.id, caseId: historicalPostsCaseId, subject: 'Activities that can occur prior to conversation start', requester: customerUser});

  //All standard message types
  let allStandardMessageTypesCaseId = _nextAvailableCaseId(server);
  caseMessageFromCustomer(server, customerUser, allStandardMessageTypesCaseId);
  caseMessageFromAgent(server,adminUser, allStandardMessageTypesCaseId);
  chatMessage(server, customerUser, allStandardMessageTypesCaseId);
  facebookMessage(server, customerUser, allStandardMessageTypesCaseId);
  twitterTweet(server, customerUser, allStandardMessageTypesCaseId);
  twitterMessage(server, customerUser, allStandardMessageTypesCaseId);
  createCaseForView(server, {viewId: timelineExamplesView.id, caseId: allStandardMessageTypesCaseId, subject: 'All standard message types', requester: customerUser});
}

function _nextAvailableCaseId(server) {
  let lastCaseId = +server.schema.db.cases[server.schema.db.cases.length - 1].id;
  return `${lastCaseId+1}`;
}
