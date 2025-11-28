import { newCaseStatus, openCaseStatus, completedCaseStatus, closedCaseStatus } from './case-statuses';
import moment from 'moment';
/**
* This scenario creates a posts some of which have associated activities.*
* It is intended to encompass all of the possible types of activity and post. From this we can confirm all states are rendered correctly in one example. It's a timeline proof sheet.
*
* @function createPostsAndActivities
* @param {Mirage.Server} server
* @returns {null}
*
*/

const priorToConversationCreation = moment.utc('1966-01-01T00:00:00Z').toDate();

export function createPostsAndActivities(server, customer, customerIdentity, agent, agentIdentity, caseId) {
  viewingAnArticleInHelpcenter(server, customer, customerIdentity, caseId);
  searchingForAnArticleInHelpcenter(server, customer, customerIdentity, caseId);
  commentingOnAnArticleInHelpcenter(server, customer, customerIdentity, caseId);

  caseMessageFromCustomer(server, customer, caseId);
  caseMessageFromAgent(server, agent, caseId);
  chatMessage(server, customer, caseId);
  facebookMessage(server, customer, caseId);
  twitterTweet(server, customer, caseId);
  twitterMessage(server, customer, caseId);

  slaAttached(server, caseId);

  firstReplyTimeBreached(server, caseId);

  // Api work around
  propertyUpdateWithNoUpdates(server, agent, agentIdentity, caseId);

  // text displayed is different when the change is to an empty state
  propertyClearOnCasePriority(server, agent, agentIdentity, caseId);
  propertyClearOnCaseType(server, agent, agentIdentity, caseId);
  propertyClearOnTags(server, agent, agentIdentity, caseId);
  propertyClearOnTeam(server, agent, agentIdentity, caseId);
  propertyClearOnAgent(server, agent, agentIdentity, caseId);

  // text displayed is different when the change is from an empty state
  propertySetOnSubject(server, agent, agentIdentity, caseId);
  propertySetOnCaseStatus(server, agent, agentIdentity, caseId);
  propertySetOnCasePriority(server, agent, agentIdentity, caseId);
  propertySetOnCaseType(server, agent, agentIdentity, caseId);
  propertySetOnTags(server, agent, agentIdentity, caseId);
  propertySetOnForm(server, agent, agentIdentity, caseId);
  propertySetOnTeam(server, agent, agentIdentity, caseId);
  propertySetOnAgent(server, agent, agentIdentity, caseId);

  // text displayed is different when the change is from a used state
  propertyUpdateOnSubject(server, agent, agentIdentity, caseId);
  propertyUpdateOnCaseStatus(server, agent, agentIdentity, caseId);
  propertyUpdateOnCasePriority(server, agent, agentIdentity, caseId);
  propertyUpdateOnCaseType(server, agent, agentIdentity, caseId);
  propertyUpdateOnTags(server, agent, agentIdentity, caseId);
  propertyUpdateOnForm(server, agent, agentIdentity, caseId);
  propertyUpdateOnRequester(server, agent, agentIdentity, customer, caseId);
  propertyUpdateOnTeam(server, agent, agentIdentity, caseId);
  propertyUpdateOnAgent(server, agent, agentIdentity, caseId);
  propertyUpdateOnTeamAndAgent(server, agent, agentIdentity, caseId);
  propertyUpdateOnTeamAndAgentFromTeamAndAgentToDifferentTeam(server, agent, agentIdentity, caseId);

  propertiesUpdateOneItemNotOnSummaryLine(server, agent, agentIdentity, caseId);
  propertiesUpdate(server, agent, agentIdentity, caseId);
  propertiesUpdateBySystem(server, agent, agentIdentity, caseId);
  propertiesTagRemoval(server, agent, agentIdentity, caseId);
  propertiesTagAddition(server, agent, agentIdentity, caseId);
  propertiesTagAdditionByTrigger(server, caseId);
  propertiesTagAdditionByMonitor(server, caseId);

  nextReplyTimeBreached(server, caseId);

  merge(server, agent, agentIdentity, caseId);
  trashCase(server, agent, caseId);
  restoreCase(server, agent, caseId);
  eventViaAPIWithNoIconAndNoColor(server, agent, agentIdentity, caseId);
  eventViaAPIWithNoIconButWithColor(server, agent, agentIdentity, caseId);
  eventViaAPIWithIconAndInvalidColor(server, agent, agentIdentity, caseId);
  eventViaAPIWithIconAndNoColor(server, agent, agentIdentity, caseId);
  eventViaAPIWithIconAndSummary(server, agent, agentIdentity, caseId);
  eventViaAPIWithColorInNewFormat(server, agent, agentIdentity, caseId);
  eventViaAPIWithIconAndColorInNewFormat(server, agent, agentIdentity, caseId);

  resolutionTimeSlaBreached(server, caseId);

  goodRating(server, customer, caseId);
  badRating(server, customer, caseId);
  updatedRating(server, customer, caseId);
  completedWithNoOtherUpdates(server, agent, caseId);
  completedWithOtherUpdates(server, agent, caseId);
  closedByMonitor(server, caseId);
  fallback(server, caseId);

  caseNote(server, agent, caseId);
  caseNote(server, agent, caseId);
  organizationNote(server, agent, caseId);
  organizationNote(server, agent, caseId);
  userNote(server, agent, caseId);
  userNote(server, agent, caseId);

  chatMessageFromAgentOnDate(server, agent, '2018-01-02T07:00:00Z', 1, caseId);
  chatMessageFromAgentOnDate(server, agent, '2018-01-02T07:00:01Z', 1, caseId);
  chatMessageFromAgentOnDate(server, agent, '2018-01-02T07:00:02Z', 2, caseId);

  completedByMonitor(server, agent, caseId);
  completedByTrigger(server, agent, caseId);
  trashCaseByMonitor(server, agent, caseId);
  trashCaseByTrigger(server, agent, caseId);
  restoreCaseByMonitor(server, agent, caseId);
  restoreCaseByTrigger(server, agent, caseId);
}

export function caseMessageFromCustomer(server, customer, caseId) {
  let attachment = server.create('attachment', {
    name: 'cage.jpg',
    url_download: 'http://www.placecage.com/100/100',
    thumbnails: [
      {
        width: 100,
        height: 100,
        type: 'image/jpeg',
        name: 'cage.jpg',
        size: 2344,
        url: 'http://www.placecage.com/100/100'
      }
    ],
    type: 'image/jpeg'
  });

  let note = server.create('case-message', {
  });

  let emailChannel = server.create('channel', {
    type: 'MAIL'
  });

  let post = server.create('post', {
    creator: { id: customer.id, resource_type: 'user' },
    identity: { id: customer.id, resource_type: 'identity_email' },
    original: {
      id: note.id,
      resource_type: 'case_message'
    },
    source_channel: {
      id: emailChannel.id,
      resource_type: 'channel'
    },
    attachments: [
      {
        id: attachment.id,
        resource_type: 'attachment'
      }
    ],
    contents: 'This is a case message from a customer',
    post_status: 'DELIVERED',
    case_id: caseId
  });

  server.create('email-original', { id: post.id });
}

export function caseMessageFromAgent(server, agent, caseId) {
  let attachment = server.create('attachment', {
    name: 'cage.jpg',
    url_download: 'http://www.placecage.com/100/100',
    thumbnails: [
      {
        width: 100,
        height: 100,
        type: 'image/jpeg',
        name: 'cage.jpg',
        size: 2344,
        url: 'http://www.placecage.com/100/100'
      }
    ],
    type: 'image/jpeg'
  });

  let note = server.create('case-message', {
    body_html: 'This is a case message from a agent'
  });

  let emailChannel = server.create('channel', {
    type: 'MAIL'
  });

  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: agent.id, resource_type: 'identity_email' },
    original: {
      id: note.id,
      resource_type: 'case_message'
    },
    source_channel: {
      id: emailChannel.id,
      resource_type: 'channel'
    },
    attachments: [
      {
        id: attachment.id,
        resource_type: 'attachment'
      }
    ],
    post_status: 'DELIVERED',
    case_id: caseId,
  });
}

export function caseNote(server, agent, caseId) {
  let note = server.create('note', {
    user: { id: agent.id, resource_type: 'user' }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: agent.id, resource_type: 'identity_email' },
    original: {
      id: note.id,
      resource_type: 'note'
    },
    contents: 'This is the body text of a note, It needs to be very long so that if any message send indicators are present it will over lap with them!',
    post_status: 'SENT',
    created_at: '2018-01-01T07:00:00Z',
    case_id: caseId
  });
}

export function userNote(server, agent, caseId) {
  let note = server.create('note', {
    body_text: 'User note body text, It needs to be very long so that if any message send indicators are present it will over lap with them!',
    user: { id: agent.id, resource_type: 'user' }
  });
  let activity = server.create('activity', {
    actions: [],
    activity: 'create_user_note',
    actor: _actorObjectFromUser(agent),
    summary: '<|Agent Name> added a note on <|User Name>',
    result: {
      original: {
        id: note.id,
        resource_type: 'note'
      }
    },
    verb: 'NOTE'
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: agent.id, resource_type: 'identity_email' },
    original: {
      id: activity.id,
      resource_type: 'activity'
    },
    post_status: 'SENT',
    created_at: '2018-01-01T07:00:00Z',
    case_id: caseId
  });
}

export function organizationNote(server, agent, caseId) {
  let note = server.create('note', {
    body_text: 'Organization note body text, It needs to be very long so that if any message send indicators are present it will over lap with them!',
    user: { id: agent.id, resource_type: 'user' }
  });
  let activity = server.create('activity', {
    actions: [],
    activity: 'create_organization_note',
    actor: _actorObjectFromUser(agent),
    summary: '<|Agent Name> added a note on <|Organization Name>',
    result: {
      original: {
        id: note.id,
        resource_type: 'note'
      }
    },
    verb: 'NOTE'
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: agent.id, resource_type: 'identity_email' },
    original: {
      id: activity.id,
      resource_type: 'activity'
    },
    post_status: 'SENT',
    created_at: '2018-01-01T07:00:00Z',
    case_id: caseId
  });
}

export function chatMessage(server, user, caseId) {
  let chatMessage = server.create('chat-message', {
  });

  let messengerChannel = server.create('channel', {
    type: 'MESSENGER'
  });

  server.create('post', {
    creator: { id: user.id, resource_type: 'user' },
    identity: { id: user.id, resource_type: 'identity_email' },
    original: {
      id: chatMessage.id,
      resource_type: 'chat_message'
    },
    source_channel: {
      id: messengerChannel.id,
      resource_type: 'channel'
    },
    contents: 'This is the text of a chat message',
    post_status: 'SENT',
    case_id: caseId
  });
}

export function chatMessageFromAgentOnDate(server, agent, date, messengerVersion, caseId) {
  server.create('case-message', {
  });

  let chatMessage = server.create('chat-message', {
  });

  let messengerChannel = server.create('channel', {
    type: 'MESSENGER'
  });

  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: agent.id, resource_type: 'identity_email' },
    original: {
      id: chatMessage.id,
      resource_type: messengerVersion === 1 ? 'chat_message' : 'case_message'
    },
    source_channel: {
      id: messengerChannel.id,
      resource_type: 'channel'
    },
    contents: 'This is the text of a chat message. It needs to be very long so that if any message send indicators are present it will over lap with them!',
    post_status: 'SENT',
    created_at: date,
    case_id: caseId
  });
}

export function facebookMessage(server, user, caseId) {
  let facebookMessage = server.create('facebook-message', {
  });

  let messengerChannel = server.create('channel', {
    type: 'FACEBOOK'
  });

  server.create('post', {
    creator: { id: user.id, resource_type: 'user' },
    original: {
      id: facebookMessage.id,
      resource_type: 'facebook_message'
    },
    source_channel: {
      id: messengerChannel.id,
      resource_type: 'channel'
    },
    contents: 'This is the text of a facebook message',
    post_status: 'DELIVERED',
    case_id: caseId
  });
}

export function twitterTweet(server, user, caseId) {
  let twitterTweet = server.create('twitter-tweet', {
  });

  let twitterChannel = server.create('channel', {
    type: 'TWITTER'
  });

  server.create('post', {
    creator: { id: user.id, resource_type: 'user' },
    original: {
      id: twitterTweet.id,
      resource_type: 'twitter_tweet'
    },
    source_channel: {
      id: twitterChannel.id,
      resource_type: 'channel'
    },
    contents: 'This is the text of a twitter tweet',
    post_status: 'DELIVERED',
    case_id: caseId
  });
}

export function twitterMessage(server, user, caseId) {
  let twitterMessage = server.create('twitter-message', {
  });

  let twitterChannel = server.create('channel', {
    type: 'TWITTER'
  });

  server.create('post', {
    creator: { id: user.id, resource_type: 'user' },
    original: {
      id: twitterMessage.id,
      resource_type: 'twitter_message'
    },
    source_channel: {
      id: twitterChannel.id,
      resource_type: 'channel'
    },
    contents: 'This is the text of a twitter message',
    post_status: 'DELIVERED',
    case_id: caseId
  });
}

export function searchingForAnArticleInHelpcenter(server, customer, identity, caseId) {
  let helpcenterSearchActivity = server.create('activity', {
    activity: 'search_helpcenter',
    summary: '<@https://mickey-bubbles-tunes.kayako.com/Base/User/1|Mickey Bubbles> searched for welcome',
    actor: _actorObjectFromUser(customer),
    verb: 'SEARCH'
  });
  server.create('post', {
    creator: { id: customer.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    source_channel: null,
    original: {
      id: helpcenterSearchActivity.id,
      resource_type: 'activity'
    },
    created_at: priorToConversationCreation,
    case_id: caseId
  });
}

export function commentingOnAnArticleInHelpcenter(server, customer, identity, caseId) {
  let comment = server.create('comment', {
    contents: '<p>Here <strong>is</strong> a <em>comment</em> with <u>examples</u> of all the possible formatting options</p> <p></p> <pre>including code</pre> <p>This string needs to be long enough to allow it to wrap</p> <br> <p>Here is some more text on the next line</p>'
  });

  let helpcenterSearchActivity = server.create('activity', {
    activity: 'create_helpcenter_comment',
    actor: _actorObjectFromUser(customer),
    object: {
      original: {
        id: comment.id,
        resource_type: 'comment'
      }
    },
    target: {
      title: '1 Welcome To Your New Help Center',
      url: 'https://mickey-bubbles-tunes.kayako.com/article/1-welcome-to-your-new-help-center'
    },
    verb: 'POST'
  });
  server.create('post', {
    creator: { id: customer.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: helpcenterSearchActivity.id,
      resource_type: 'activity'
    },
    created_at: priorToConversationCreation,
    case_id: caseId
  });
}

export function viewingAnArticleInHelpcenter(server, customer, identity, caseId) {
  let helpcenterViewActivity = server.create('activity', {
    activity: 'view_article',
    actor: _actorObjectFromUser(customer),
    verb: 'VIEW',
    object: {
      title: 'Test article 1',
      url: 'https://mickey-bubbles-tunes.kayako.com/article/1-welcome-to-your-new-help-center'
    }
  });
  server.create('post', {
    creator: { id: customer.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    source_channel: null,
    original: {
      id: helpcenterViewActivity.id,
      resource_type: 'activity'
    },
    created_at: priorToConversationCreation,
    case_id: caseId
  });
}

export function eventViaAPIWithNoIconAndNoColor(server, agent, identity, caseId) {
  let theEvent = server.create('event', {
    event: 'Click Pricing',
    properties: {
      accountID: 'A/C 51434376767',
      type: 'meeting'
    }
  });

  let propertyUpdateActivity = server.create('activity', {
    actor: _actorObjectFromUser(agent),
    verb: 'TRIGGER',
    object: {
      name: 'event',
      title: 'Sales Force',
      url: 'http://salesforce.com',
      original: {
        id: theEvent.id,
        resource_type: 'event'
      }
    },
    summary: '<@https://mickey-bubbles-tunes.kayako.com/Base/User/1|Bill Murray> triggered Sales Force'
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function eventViaAPIWithIconAndNoColor(server, agent, identity, caseId) {
  let theEvent = server.create('event', {
    event: 'Click Pricing',
    properties: {
      accountID: 'A/C 51434376767',
      type: 'meeting'
    },
    icon_url: 'https://cdn2.hubspot.net/hubfs/451005/kayako_for_salesforce/salesforce_logo.svg',
    url: 'https://login.salesforce.com/'
  });

  let propertyUpdateActivity = server.create('activity', {
    actor: _actorObjectFromUser(agent),
    verb: 'TRIGGER',
    object: {
      name: 'event',
      title: 'Sales Force',
      url: 'http://salesforce.com',
      original: {
        id: theEvent.id,
        resource_type: 'event'
      }
    },
    summary: '<@https://mickey-bubbles-tunes.kayako.com/Base/User/1|Bill Murray> triggered Sales Force'
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function eventViaAPIWithIconAndSummary(server, agent, identity, caseId) {
  let theEvent = server.create('event', {
    event: 'Click Pricing',
    properties: {
      accountID: 'A/C 51434376767',
      type: 'meeting',
      summary: 'A lead belonging to Sagar moved to Working - Contacted status'
    },
    icon_url: 'https://cdn2.hubspot.net/hubfs/451005/kayako_for_salesforce/salesforce_logo.svg',
    url: 'https://login.salesforce.com/'
  });

  let propertyUpdateActivity = server.create('activity', {
    actor: _actorObjectFromUser(agent),
    verb: 'TRIGGER',
    object: {
      name: 'event',
      title: 'Sales Force',
      original: {
        id: theEvent.id,
        resource_type: 'event'
      }
    },
    summary: '<@https://mickey-bubbles-tunes.kayako.com/Base/User/1|Bill Murray> triggered Sales Force'
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function eventViaAPIWithColorInNewFormat(server, agent, identity, caseId) {
  let theEvent = server.create('event', {
    event: 'Click Pricing',
    properties: {
      url: 'https://login.salesforce.com/',
      color: '#228B22',
      accountID: 'A/C 51434376767',
      type: 'meeting'
    }
  });

  let propertyUpdateActivity = server.create('activity', {
    actor: _actorObjectFromUser(agent),
    verb: 'TRIGGER',
    object: {
      name: 'event',
      title: 'Sales Force',
      original: {
        id: theEvent.id,
        resource_type: 'event'
      }
    },
    summary: '<@https://mickey-bubbles-tunes.kayako.com/Base/User/1|Bill Murray> triggered Sales Force'
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function eventViaAPIWithIconAndColorInNewFormat(server, agent, identity, caseId) {
  let theEvent = server.create('event', {
    event: 'Click Pricing',
    properties: {
      icon_url: 'https://cdn2.hubspot.net/hubfs/451005/kayako_for_salesforce/salesforce_logo.svg',
      url: 'https://login.salesforce.com/',
      color: '#228B22',
      accountID: 'A/C 51434376767',
      type: 'meeting'
    }
  });

  let propertyUpdateActivity = server.create('activity', {
    actor: _actorObjectFromUser(agent),
    verb: 'TRIGGER',
    object: {
      name: 'event',
      title: 'Sales Force',
      original: {
        id: theEvent.id,
        resource_type: 'event'
      }
    },
    summary: '<@https://mickey-bubbles-tunes.kayako.com/Base/User/1|Bill Murray> triggered Sales Force'
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

// function eventViaAPIWithIconAndSummaryUppercaseS(server, agent, identity) {
//   let theEvent = server.create('event', {
//     event: 'Click Pricing',
//     properties: {
//       accountID: 'A/C 51434376767',
//       type: 'meeting',
//       Summary: 'A lead belonging to Sagar moved to Working - Contacted status'
//     },
//     icon_url: 'https://cdn2.hubspot.net/hubfs/451005/kayako_for_salesforce/salesforce_logo.svg',
//     url: 'https://login.salesforce.com/'
//   });
//
//   let propertyUpdateActivity = server.create('activity', {
//     actor: _actorObjectFromUser(agent),
//     verb: 'TRIGGER',
//     object: {
//       name: 'event',
//       title: 'Sales Force',
//       original: {
//         id: theEvent.id,
//         resource_type: 'event'
//       }
//     },
//     summary: '<@https://mickey-bubbles-tunes.kayako.com/Base/User/1|Bill Murray> triggered Sales Force'
//   });
//   server.create('post', {
//     creator: { id: agent.id, resource_type: 'user' },
//     identity: { id: identity.id, resource_type: 'identity_email' },
//     original: {
//       id: propertyUpdateActivity.id,
//       resource_type: 'activity'
//     },
//     post_status: 'SENT'
//   });
// }

export function eventViaAPIWithNoIconButWithColor(server, agent, identity, caseId) {
  let theEvent = server.create('event', {
    event: 'Click Pricing',
    properties: {
      accountID: 'A/C 51434376767',
      type: 'meeting'
    },
    color: '#228B22'
  });

  let propertyUpdateActivity = server.create('activity', {
    actor: _actorObjectFromUser(agent),
    verb: 'TRIGGER',
    object: {
      name: 'event',
      title: 'Sales Force',
      url: 'http://salesforce.com',
      original: {
        id: theEvent.id,
        resource_type: 'event'
      }
    },
    summary: '<@https://mickey-bubbles-tunes.kayako.com/Base/User/1|Bill Murray> triggered Sales Force'
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function eventViaAPIWithIconAndInvalidColor(server, agent, identity, caseId) {
  let theEvent = server.create('event', {
    event: 'Click Pricing',
    properties: {
      accountID: 'A/C 51434376767',
      type: 'meeting'
    },
    color: 'INVALID',
    icon_url: 'https://cdn2.hubspot.net/hubfs/451005/kayako_for_salesforce/salesforce_logo.svg',
    url: 'https://login.salesforce.com/'
  });

  let propertyUpdateActivity = server.create('activity', {
    actor: _actorObjectFromUser(agent),
    verb: 'TRIGGER',
    object: {
      name: 'event',
      title: 'Sales Force',
      url: 'http://salesforce.com',
      original: {
        id: theEvent.id,
        resource_type: 'event'
      }
    },
    summary: '<@https://mickey-bubbles-tunes.kayako.com/Base/User/1|Bill Murray> triggered Sales Force'
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertySetOnCaseStatus(server, agent, identity, caseId) {
  newCaseStatus(server);
  let openStatus = openCaseStatus(server);

  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casestatusid',
    old_value: null,
    new_value: 'Open',
    new_object: {
      original: {
        id: openStatus.id,
        resource_type: 'case_status'
      }
    }
  }));

  let propertySetActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertySetActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertySetOnCasePriority(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casepriorityid',
    old_value: null,
    new_value: 'Low'
  }));

  let propertySetActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertySetActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertySetOnCaseType(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casetypeid',
    old_value: null,
    new_value: 'Question'
  }));

  let propertySetActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertySetActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertySetOnTags(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'tags',
    old_value: null,
    new_value: 'testtag'
  }));

  let propertySetActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertySetActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertySetOnForm(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'caseformid',
    old_value: null,
    new_value: 'custom'
  }));

  let propertySetActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertySetActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateWithNoUpdates(server, agent, identity, caseId) {
  let propertySetActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: [],
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    source_channel: null,
    original: {
      id: propertySetActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyClearOnCasePriority(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casepriorityid',
    old_value: 'low',
    new_value: null
  }));

  let propertySetActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    source_channel: null,
    original: {
      id: propertySetActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyClearOnCaseType(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casetypeid',
    old_value: 'Question',
    new_value: null
  }));

  let propertySetActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    source_channel: null,
    original: {
      id: propertySetActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyClearOnTags(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'tags',
    old_value: 'testtag',
    new_value: null
  }));

  let propertySetActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    source_channel: null,
    original: {
      id: propertySetActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyClearOnTeam(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeteamid',
    old_value: 'The old team',
    new_value: null
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    source_channel: null,
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertySetOnSubject(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'subject',
    old_value: null,
    new_value: 'New Subject'
  }));

  let propertySetActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertySetActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertySetOnAgent(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeagentid',
    old_value: null,
    new_value: agent.full_name,
    new_object: {
      image: 'http://www.fillmurray.com/100/100',
      original: {
        id: agent.id,
        resource_type: 'user'
      }
    }
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyClearOnAgent(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeagentid',
    old_value: agent.full_name,
    old_object: {
      original: { id: agent.id, resource_type: 'user' },
      image: 'http://www.fillmurray.com/100/100'
    },
    new_object: null
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    source_channel: null,
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateOnAgent(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeagentid',
    old_value: 'Old Agent',
    old_object: {
      image: 'http://www.placecage.com/100/100',
      original: {
        id: agent.id,
        resource_type: 'user'
      }
    },
    new_value: agent.full_name,
    new_object: {
      image: 'http://www.fillmurray.com/100/100',
      original: {
        id: agent.id,
        resource_type: 'user'
      }
    }
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}


export function propertyUpdateOnTeamAndAgent(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeagentid',
    old_value: 'Old Agent',
    old_object: {
      image: 'http://www.placecage.com/100/100',
      original: {
        id: agent.id,
        resource_type: 'user'
      }
    },
    new_value: agent.full_name,
    new_object: {
      image: 'http://www.fillmurray.com/100/100',
      original: {
        id: agent.id,
        resource_type: 'user'
      }
    }
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeteamid',
    old_value: null,
    new_value: 'The Team With The Really Really Really Long Name'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateOnTeamAndAgentFromTeamAndAgentToDifferentTeam(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeagentid',
    old_value: 'Old Agent',
    old_object: {
      image: 'http://www.placecage.com/100/100',
      original: {
        id: agent.id,
        resource_type: 'user'
      }
    },
    new_value: null,
    new_object: null
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeteamid',
    old_value: 'Old Team',
    new_value: 'New Team'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertySetOnTeam(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeteamid',
    old_value: null,
    new_value: 'The Team With The Really Really Really Long Name'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateOnTeam(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeteamid',
    old_value: 'The old team',
    new_value: 'The Team With The Really Really Really Long Name'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateOnCaseStatus(server, agent, identity, caseId) {
  let newStatus = newCaseStatus(server);
  let openStatus = openCaseStatus(server);

  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casestatusid',
    old_value: 'NEW',
    old_object: {
      original: {
        id: newStatus.id,
        resource_type: 'case_status'
      }
    },
    new_value: 'Open',
    new_object: {
      original: {
        id: openStatus.id,
        resource_type: 'case_status'
      }
    }
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateOnCasePriority(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casepriorityid',
    old_value: 'Old',
    new_value: 'Low'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateOnCaseType(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casetypeid',
    old_value: 'Old',
    new_value: 'Question'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateOnTags(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'tags',
    old_value: 'oldtag',
    new_value: 'testtag'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateOnForm(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'caseformid',
    old_value: 'default',
    new_value: 'custom'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateOnRequester(server, agent, customer, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'requesterid',
    old_value: 'Nick Cage',
    old_object: {
      image: 'http://www.placecage.com/100/100',
      original: {
        id: customer.id,
        resource_type: 'user'
      }
    },
    new_value: 'Bill Murray',
    new_object: {
      image: 'http://www.fillmurray.com/100/100',
      original: {
        id: agent.id,
        resource_type: 'user'
      }
    },
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    })
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertyUpdateOnSubject(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'subject',
    old_value: 'Old subject',
    new_value: 'New Subject'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertiesUpdateOneItemNotOnSummaryLine(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'subject',
    old_value: null,
    new_value: 'New Subject'
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeteamid',
    old_value: null,
    new_value: 'The Team With The Really Really Really Long Name'
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casepriorityid',
    old_value: null,
    new_value: 'Low'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertiesUpdate(server, agent, identity, caseId) {
  let newStatus = newCaseStatus(server);
  let openStatus = openCaseStatus(server);

  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'subject',
    old_value: null,
    new_value: 'New Subject'
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeteamid',
    old_value: null,
    new_value: 'The Team With The Really Really Really Long Name'
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeagentid',
    new_value: 'Bill Murray',
    new_object: {
      image: 'http://www.fillmurray.com/100/100',
      original: {
        id: agent.id,
        resource_type: 'user'
      }
    }
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casestatusid',
    old_value: 'NEW',
    old_object: {
      original: {
        id: newStatus.id,
        resource_type: 'case_status'
      }
    },
    new_value: 'Open',
    new_object: {
      original: {
        id: openStatus.id,
        resource_type: 'case_status'
      }
    }
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casepriorityid',
    old_value: null,
    new_value: 'Low'
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casetypeid',
    old_value: null,
    new_value: 'Question'
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'caseformid',
    old_value: null,
    new_value: 'Support'
  }));
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'tags',
    old_value: null,
    new_value: 'testtag'
  }));
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'custom_fields_are_lower_case_underscore_separated',
    old_value: null,
    new_value: 'new string'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertiesUpdateBySystem(server, agent, identity, caseId) {
  let closedStatus = closedCaseStatus(server);
  let openStatus = openCaseStatus(server);

  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casestatusid',
    old_value: 'CLOSED',
    old_object: {
      original: {
        id: closedStatus.id,
        resource_type: 'case_status'
      }
    },
    new_value: 'Open',
    new_object: {
      original: {
        id: openStatus.id,
        resource_type: 'case_status'
      }
    }
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: null,
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    })
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertiesTagRemoval(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'CREATED', //a tag is being removed here but the action is still created
    field: 'tags', //looks odd but confirmed with madhur this is how the tag field is refered to everywhere in the API
    old_value: 'tag1, tag2, tag3',
    new_value: 'tag2'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertiesTagAddition(server, agent, identity, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'tags',
    old_value: '',
    new_value: 'tag1'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertiesTagAdditionByTrigger(server, caseId) {
  let trigger = server.create('trigger', {
    title: 'Add Tag Trigger'
  });

  let actions = [];
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'tags',
    old_value: '',
    new_value: 'tag1'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'create_tag', //although this is a case update when it come from a trigger it's a create tag
    actor: _actorObjectFromTrigger(trigger),
    verb: 'TAG', //although this is still an update when it comes from a trigger it's a tag
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: trigger.id, resource_type: 'trigger' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function propertiesTagAdditionByMonitor(server, caseId) {
  let monitor = server.create('monitor', {
    title: 'Add Tag Monitor'
  });

  let actions = [];
  actions.push(server.create('action', {
    action: 'CREATED',
    field: 'tags',
    old_value: '',
    new_value: 'tag1'
  }));

  let propertyUpdateActivity = server.create('activity', {
    activity: 'create_tag', //although this is a case update when it come from a trigger it's a create tag
    actor: _actorObjectFromMonitor(monitor),
    verb: 'TAG', //although this is still an update when it comes from a trigger it's a tag
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: monitor.id, resource_type: 'monitor' },
    original: {
      id: propertyUpdateActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function merge(server, agent, identity, caseId) {
  let mergeActivity1 = server.create('activity', {
    activity: 'merge_case',
    actor: _actorObjectFromUser(agent),
    verb: 'MERGE',
    object: {
      title: 'Bring everything together and watch the dots connect',
      full_title: 'Bring everything together and watch the dots connect',
      url: '/agent/cases/1'
    },
    target: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: mergeActivity1.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });

  let mergeActivity2 = server.create('activity', {
    activity: 'merge_case',
    actor: _actorObjectFromUser(agent),
    verb: 'MERGE',
    object: {
      title: 'Work better together and get everyone on the same page',
      full_title: 'Work better together and get everyone on the same page',
      url: '/agent/cases/2'
    },
    target: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: mergeActivity2.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });

  let mergeActivity3 = server.create('activity', {
    activity: 'merge_case',
    actor: _actorObjectFromUser(agent),
    verb: 'MERGE',
    object: {
      title: 'Where did all the spam email go?',
      full_title: 'Where did all the spam email go?',
      url: '/agent/cases/3'
    },
    target: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: mergeActivity3.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });

  let mergeActivity4 = server.create('activity', {
    activity: 'merge_case',
    actor: _actorObjectFromUser(agent),
    verb: 'MERGE',
    object: {
      title: 'Impress customers with quick, slick responses',
      full_title: 'Impress customers with quick, slick responses',
      url: '/agent/cases/4'
    },
    target: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: { id: agent.id, resource_type: 'user' },
    identity: { id: identity.id, resource_type: 'identity_email' },
    original: {
      id: mergeActivity4.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function slaAttached(server, caseId) {
  let slaVersion = server.create('sla-version', {
    title: 'Name of SLA'
  });

  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'slaversionid',
    old_value: null,
    new_value: slaVersion.title
  }));

  let slaAttachedActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromSlaVersion(slaVersion),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    })
  });

  server.create('post', {
    creator: {
      id: slaVersion.id,
      resource_type: 'sla_version'
    },
    original: {
      id: slaAttachedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function firstReplyTimeBreached(server, caseId) {
  let slaVersion = server.create('sla-version', {
    title: 'Name of SLA'
  });

  let slaBreachedActivity = server.create('activity', {
    activity: 'breach_case',
    actor: _actorObjectFromSlaVersion(slaVersion),
    result: {
      title: 'FIRST_REPLY_TIME'
    },
    verb: 'BREACH',
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: {
      id: slaVersion.id,
      resource_type: 'sla_version'
    },
    original: {
      id: slaBreachedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function nextReplyTimeBreached(server, caseId) {
  let slaVersion = server.create('sla-version', {
    title: 'Name of SLA'
  });

  let slaBreachedActivity = server.create('activity', {
    activity: 'breach_case',
    actor: _actorObjectFromSlaVersion(slaVersion),
    result: {
      title: 'NEXT_REPLY_TIME'
    },
    verb: 'BREACH',
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: {
      id: slaVersion.id,
      resource_type: 'sla_version'
    },
    original: {
      id: slaBreachedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function resolutionTimeSlaBreached(server, caseId) {
  let slaVersion = server.create('sla-version', {
    title: 'Name of SLA'
  });

  let slaBreachedActivity = server.create('activity', {
    activity: 'breach_case',
    actor: _actorObjectFromSlaVersion(slaVersion),
    result: {
      title: 'RESOLUTION_TIME'
    },
    verb: 'BREACH',
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: {
      id: slaVersion.id,
      resource_type: 'sla_version'
    },
    original: {
      id: slaBreachedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function goodRating(server, customer, caseId) {
  let slaBreachedActivity = server.create('activity', {
    activity: 'create_case_rating',
    actor: _actorObjectFromUser(customer),
    object: {
      title: 'GOOD', //looks a bit odd but this is how ratings are restored
      full_title: 'GOOD',
      resource_type: 'activity_object'
    },
    verb: 'RATE',
    summary: '<@https://instance-name.kayako.com/Base/User/1|Mickey Bubbles> rated GOOD',
    target: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: null, //this will be populated but it's cheaper to get to it via the actor on the associated activity
    original: {
      id: slaBreachedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function badRating(server, customer, caseId) {
  let rating = server.create('rating', {
    comment: 'Very bad customer experience, with a very very very very very long description. I have no idea how long comments can be be but i bet it must be at least this long. Enough to let them wrap a line thats for sure!'
  });
  let slaBreachedActivity = server.create('activity', {
    activity: 'create_case_rating',
    actor: _actorObjectFromUser(customer),
    object: {
      title: 'BAD', //looks a bit odd but this is how ratings are restored
      full_title: 'BAD',
      original: {
        id: rating.id,
        resource_type: 'rating'
      },
      resource_type: 'activity_object'
    },
    verb: 'RATE',
    summary: '<@https://instance-name.kayako.com/Base/User/1|Mickey Bubbles> rated BAD',
    target: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: null, //this will be populated but it's cheaper to get to it via the actor on the associated activity
    original: {
      id: slaBreachedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function updatedRating(server, customer, caseId) {
  let slaBreachedActivity = server.create('activity', {
    activity: 'update_case_rating',
    actor: _actorObjectFromUser(customer),
    object: {
      title: 'GOOD', //looks a bit odd but this is how ratings are restored
      full_title: 'GOOD',
      resource_type: 'activity_object'
    },
    verb: 'RATE',
    summary: '<@https://instance-name.kayako.com/Base/User/1|Mickey Bubbles> rated GOOD',
    target: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: null, //this will be populated but it's cheaper to get to it via the actor on the associated activity
    original: {
      id: slaBreachedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function closedByMonitor(server, caseId) {
  let completedStatus = completedCaseStatus(server);
  let closedStatus = closedCaseStatus(server);

  let monitor = server.create('monitor', {
    title: 'Name of monitor'
  });

  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casestatusid',
    old_value: 'Completed',
    old_object: {
      original: {
        id: completedStatus.id,
        resource_type: 'case_status'
      }
    },
    new_value: 'Closed',
    new_object: {
      original: {
        id: closedStatus.id,
        resource_type: 'case_status'
      }
    }
  }));

  let closedActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromMonitor(monitor),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: {
      id: monitor.id,
      resource_type: 'monitor'
    },
    original: {
      id: closedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function completedWithNoOtherUpdates(server, agent, caseId) {
  let openStatus = openCaseStatus(server);
  let completedStatus = completedCaseStatus(server);

  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casestatusid',
    old_value: 'Open',
    old_object: {
      original: {
        id: openStatus.id,
        resource_type: 'case_status'
      }
    },
    new_value: 'Completed',
    new_object: {
      original: {
        id: completedStatus.id,
        resource_type: 'case_status'
      }
    }
  }));

  let completedActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: null, //this will be populated but it's cheaper to get to it via the actor on the associated activity
    original: {
      id: completedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function completedByMonitor(server, agent, caseId) {
  let monitor = server.create('monitor', {
    title: 'Add Tag Monitor'
  });
  let openStatus = openCaseStatus(server);
  let completedStatus = completedCaseStatus(server);

  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casestatusid',
    old_value: 'Open',
    old_object: {
      original: {
        id: openStatus.id,
        resource_type: 'case_status'
      }
    },
    new_value: 'Completed',
    new_object: {
      original: {
        id: completedStatus.id,
        resource_type: 'case_status'
      }
    }
  }));

  let completedActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromMonitor(monitor),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: null, //this will be populated but it's cheaper to get to it via the actor on the associated activity
    original: {
      id: completedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function completedByTrigger(server, agent, caseId) {
  let trigger = server.create('trigger', {
    title: 'Add Tag Trigger'
  });
  let openStatus = openCaseStatus(server);
  let completedStatus = completedCaseStatus(server);

  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casestatusid',
    old_value: 'Open',
    old_object: {
      original: {
        id: openStatus.id,
        resource_type: 'case_status'
      }
    },
    new_value: 'Completed',
    new_object: {
      original: {
        id: completedStatus.id,
        resource_type: 'case_status'
      }
    }
  }));

  let completedActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromTrigger(trigger),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: null, //this will be populated but it's cheaper to get to it via the actor on the associated activity
    original: {
      id: completedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function completedWithOtherUpdates(server, agent, caseId) {
  let openStatus = openCaseStatus(server);
  let completedStatus = completedCaseStatus(server);

  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'casestatusid',
    old_value: 'Open',
    old_object: {
      original: {
        id: openStatus.id,
        resource_type: 'case_status'
      }
    },
    new_value: 'Completed',
    new_object: {
      original: {
        id: completedStatus.id,
        resource_type: 'case_status'
      }
    }
  }));
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'assigneeteamid',
    old_value: null,
    new_value: 'The Team With The Really Really Really Long Name'
  }));

  let completedActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    creator: null, //this will be populated but it's cheaper to get to it via the actor on the associated activity
    original: {
      id: completedActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function trashCase(server, agent, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'state',
    old_value: 'Active',
    new_value: 'Trash'
  }));

  let trashActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'TRASH',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    },
    summary: '<@https://instance-name.kayako.com/Base/User/1|Mickey Bubbles> trashed <https://instance-name.kayako.com/agent/cases/1|Case Some Case>'
  });
  server.create('post', {
    creator: null, //this will be populated but it's cheaper to get to it via the actor on the associated activity
    original: {
      id: trashActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function trashCaseByTrigger(server, agent, caseId) {
  let trigger = server.create('trigger', {
    title: 'Trash trigger'
  });
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'state',
    old_value: 'Active',
    new_value: 'Trash'
  }));

  let trashActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromTrigger(trigger),
    verb: 'TRASH',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    },
    summary: '<@https://instance-name.kayako.com/Base/User/1|Mickey Bubbles> trashed <https://instance-name.kayako.com/agent/cases/1|Case Some Case>'
  });
  server.create('post', {
    creator: null, //this will be populated but it's cheaper to get to it via the actor on the associated activity
    original: {
      id: trashActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function trashCaseByMonitor(server, agent, caseId) {
  let monitor = server.create('monitor', {
    title: 'Trash monitor'
  });
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'state',
    old_value: 'Active',
    new_value: 'Trash'
  }));

  let trashActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromMonitor(monitor),
    verb: 'TRASH',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    },
    summary: '<@https://instance-name.kayako.com/Base/User/1|Mickey Bubbles> trashed <https://instance-name.kayako.com/agent/cases/1|Case Some Case>'
  });
  server.create('post', {
    creator: null, //this will be populated but it's cheaper to get to it via the actor on the associated activity
    original: {
      id: trashActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function restoreCaseByTrigger(server, agent, caseId) {
  let trigger = server.create('trigger', {
    title: 'Restore trigger'
  });
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'state',
    old_value: 'Trash',
    new_value: 'Active'
  }));

  let trashActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromTrigger(trigger),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    original: {
      id: trashActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function restoreCaseByMonitor(server, agent, caseId) {
  let monitor = server.create('monitor', {
    title: 'Restore monitor'
  });
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'state',
    old_value: 'Trash',
    new_value: 'Active'
  }));

  let trashActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromMonitor(monitor),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    original: {
      id: trashActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function restoreCase(server, agent, caseId) {
  let actions = [];
  actions.push(server.create('action', {
    action: 'UPDATED',
    field: 'state',
    old_value: 'Trash',
    new_value: 'Active'
  }));

  let trashActivity = server.create('activity', {
    activity: 'update_case',
    actor: _actorObjectFromUser(agent),
    verb: 'UPDATE',
    actions: actions.map((action) => {
      return {
        id: action.id,
        resource_type: 'action'
      };
    }),
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    original: {
      id: trashActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function fallback(server, caseId) {
  let unknownActivityActivity = server.create('activity', {
    actions: [],
    activity: 'unknown',
    verb: 'SEARCH',
    summary: '<@https://instance-name.kayako.com/Base/User/1|Mickey Bubbles> updated <https://instance-name.kayako.com/agent/cases/1|Case Subject Here - This is the summary string of an activity with an unknown activity>'
  });
  server.create('post', {
    original: {
      id: unknownActivityActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });

  let unknownVerbActivity = server.create('activity', {
    actions: [],
    activity: 'update_case',
    verb: 'UNKNOWN',
    summary: '<@https://instance-name.kayako.com/Base/User/1|Mickey Bubbles> updated <https://instance-name.kayako.com/agent/cases/1|Case Subject Here - This is the summary string of an activity with an unknown verb>',
    object: {
      title: 'Some case',
      url: 'https://mickey-bubbles-tunes.kayako.com/agent/cases/2191049'
    }
  });
  server.create('post', {
    original: {
      id: unknownVerbActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });

  let nullActivity = server.create('activity', {
    actions: [],
    activity: null,
    verb: null,
    summary: '<@https://instance-name.kayako.com/Base/User/1|Mickey Bubbles> updated <https://instance-name.kayako.com/agent/cases/1|Case Subject Here - This is the summary string of an activity with null activity and verb>'
  });
  server.create('post', {
    original: {
      id: nullActivity.id,
      resource_type: 'activity'
    },
    case_id: caseId
  });
}

export function _actorObjectFromUser(user) {
  return {
    name: 'user', //This looks wrong given the field name but is what is returned. Other options are 'monitor|SLA' etc
    title: user.full_name,
    prefix: '@', //seems to always be returned for users
    full_title: user.full_name,
    preposition: 'of', //seems to always be returned for users
    image: 'http://www.fillmurray.com/100/100',
    original: {
      id: user.id,
      resource_type: 'user'
    },
    resource_type: 'activity_actor'
  };
}

export function _actorObjectFromTrigger(trigger) {
  return {
    name: 'trigger',
    title: trigger.title,
    full_title: trigger.title,
    original: {
      id: trigger.id,
      resource_type: 'trigger'
    },
    resource_type: 'activity_actor'
  };
}

export function _actorObjectFromMonitor(monitor) {
  return {
    name: 'monitor',
    title: monitor.title,
    full_title: monitor.title,
    original: {
      id: monitor.id,
      resource_type: 'monitor'
    },
    resource_type: 'activity_actor'
  };
}

export function _actorObjectFromSlaVersion(slaVersion) {
  return {
    name: 'SLA',
    title: slaVersion.title,
    full_title: slaVersion.title,
    original: {
      id: slaVersion.id,
      resource_type: 'sla_version'
    },
    resource_type: 'activity_actor'
  };
}
