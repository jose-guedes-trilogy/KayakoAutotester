import activityFacade from 'frontend-cp/lib/facade/activity';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';

module('Unit | Lib | activity facade');

let testUserId = 1;
let testUserName = 'user name goes here';
let testUserTitle = 'Charlie Ustomer';
let testArticleTitle = 'title goes here';
let testArticleUrl = 'http://www.kayako.com';
let testHelpCenterSearchSummary = '<@https://mickey-bubbles-tunes.kayako.com/Base/User/1|Mickey Bubbles> searched for welcome';
let testSlaTitle = 'sla name goes here';
let testCaseTitle = 'case title goes here';
let testCaseUrl = 'http://www.kayako.com';
let alternativeTestCaseTitle = 'alternative case title goes here';
let alternativeTestCaseUrl = 'http://www.kayako.com/1';
let testSlaMetricName = 'FIRST_REPLY_TIME';
let testCaseStatusNewValue = 'New';
let testCaseStatusOpenValue = 'Open';
let testCaseStatusCompletedValue = 'Completed';
let testCaseStatusClosedValue = 'Closed';
let testCaseStatusNewId = 1;
let testCaseStatusOpenId = 2;
let testCaseStatusCompletedId = 3;
let testCaseStatusClosedId = 4;
let testImageUrl = 'http://www.kayako.com';
let testTeamName1 = 'team one';
let testTeamName2 = 'team two';
let testAgentId = 2;
let testAgentTitle = 'Bill Murray';
let testFieldName = 'field name here';
let testOldValue = 'test old value';
let testNewValue = 'test new value';
let testEventName = 'event name here';
let testEventTitle = 'event title here';
let testColor = '#FFFFFF';
let testSummary = 'custom event summary here';
let testGoodRating = 'GOOD';
let testComment = 'comment goes here';

test('help center views', function(assert) {
  assert.expect(9);

  let facade = new activityFacade({ activity: {
    activity: 'view_article',
    verb: 'VIEW',
    actorUser: {
      id: testUserId
    },
    actor: {
      title: testUserTitle
    },
    object: {
      title: testArticleTitle,
      url: testArticleUrl
    }
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), false, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('isView'), true, 'isView');

  assert.equal(facade.get('actorUser.id'), testUserId, 'user id of the viewer');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the viewer');
  assert.equal(facade.get('object.title'), testArticleTitle, 'article url');
  assert.equal(facade.get('object.url'), testArticleUrl, 'article url');
});

test('help center article search', function(assert) {
  assert.expect(8);

  let facade = new activityFacade({ activity: {
    activity: 'search_helpcenter',
    verb: 'SEARCH',
    summary: testHelpCenterSearchSummary,
    actorUser: {
      id: testUserId
    },
    actor: {
      title: testUserTitle
    }
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), false, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('isSearch'), true, 'isSearch');

  assert.equal(facade.get('actorUser.id'), testUserId, 'user id of the viewer');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the viewer');
  assert.equal(facade.get('summary'), testHelpCenterSearchSummary, 'server returned summary string');
});

test('help center article comment', function(assert) {
  assert.expect(9);

  let facade = new activityFacade({ activity: {
    activity: 'create_helpcenter_comment',
    verb: 'POST',
    actorUser: {
      id: testUserId
    },
    actor: {
      title: testUserTitle
    },
    target: {
      title: testArticleTitle,
      url: testArticleUrl
    }
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), false, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('isComment'), true, 'isComment');

  assert.equal(facade.get('actorUser.id'), testUserId, 'user id of the viewer');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the viewer');
  assert.equal(facade.get('target.title'), testArticleTitle, 'article title');
  assert.equal(facade.get('target.url'), testArticleUrl, 'article url');
});

test('sla attached', function(assert) {
  assert.expect(11);

  let facade = new activityFacade({ activity: {
    activity: 'update_case',
    verb: 'UPDATE',
    actor: {
      name: 'SLA',
      title: testUserTitle
    },
    actions: [
      new EmberObject({
        action: 'UPDATED',
        field: 'slaversionid',
        oldValue: null,
        newValue: {
          title: testSlaTitle
        }
      })
    ]
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), false, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('isMinor'), true, 'isMinor');
  assert.equal(facade.get('isSla'), true, 'isSla');

  assert.equal(facade.get('actor.name'), 'SLA', 'user name');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the sla');

  assert.equal(facade.get('activityActions.firstObject.oldValue'), null, 'old value is empty');
  assert.equal(facade.get('activityActions.firstObject.newValue.title'), testSlaTitle, 'new value is the sla title');
  assert.equal(facade.get('activityActions.firstObject.field'), 'slaversionid', 'field specified in the action');
});

test('sla breach', function(assert) {
  assert.expect(10);

  let facade = new activityFacade({ activity: {
    activity: 'breach_case',
    verb: 'BREACH',
    actor: {
      name: 'SLA',
      title: testUserTitle
    },
    result: {
      title: testSlaMetricName
    },
    object: {
      title: testCaseTitle,
      url: testCaseUrl
    }
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), true, 'isLarge');
  //assert.equal(facade.get('isStandard'), false, 'isStandard'); this should pass sla breaches are only ever large. What about journey timelines?

  assert.equal(facade.get('isSla'), true, 'isSla');
  assert.equal(facade.get('isBreach'), true, 'isBreach');

  assert.equal(facade.get('actor.name'), 'SLA', 'user name');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');
  assert.equal(facade.get('result.title'), testSlaMetricName, 'user title of the sla');
  assert.equal(facade.get('object.title'), testCaseTitle, 'the object contains the case title');
  assert.equal(facade.get('object.url'), testCaseUrl, 'the object contains the case url');
});

test('update status of a case', function(assert) {
  assert.expect(12);

  let facade = new activityFacade({ activity: {
    activity: 'update_case',
    verb: 'UPDATE',
    actor: {
      title: testUserTitle,
      image: testImageUrl
    },
    actions: [
      new EmberObject({
        action: 'UPDATED',
        field: 'casestatusid',
        oldValue: testCaseStatusNewValue,
        oldObject: {
          original: {
            id: testCaseStatusNewId
          }
        },
        newValue: testCaseStatusOpenValue,
        newObject: {
          original: {
            id: testCaseStatusOpenId
          }
        }
      })
    ]
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), false, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('hasAvatar'), true, 'hasAvatar');

  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');
  assert.equal(facade.get('actor.image'), testImageUrl, 'user image');

  assert.equal(facade.get('activityActions.firstObject.field'), 'casestatusid', 'field specified in the action');
  assert.equal(facade.get('activityActions.firstObject.oldValue'), testCaseStatusNewValue, 'old value');
  assert.equal(facade.get('activityActions.firstObject.oldObject.original.id'), testCaseStatusNewId, 'old object id');
  assert.equal(facade.get('activityActions.firstObject.newValue'), testCaseStatusOpenValue, 'new value');
  assert.equal(facade.get('activityActions.firstObject.newObject.original.id'), testCaseStatusOpenId, 'new object id');
});

test('update the assignee on a case', function(assert) {
  assert.expect(14);

  let facade = new activityFacade({ activity: {
    activity: 'update_case',
    verb: 'UPDATE',
    actor: {
      title: testUserTitle,
      image: testImageUrl
    },
    actions: [
      new EmberObject({
        action: 'UPDATED',
        field: 'assigneeteamid',
        oldValue: testTeamName1,
        newValue: testTeamName2
      }),
      new EmberObject({
        action: 'UPDATED',
        field: 'assigneeagentid',
        newValue: testAgentTitle,
        newObject: {
          image: testImageUrl,
          original: {
            id: testAgentId
          }
        }
      })
    ]
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), false, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('hasAvatar'), true, 'hasAvatar');

  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');
  assert.equal(facade.get('actor.image'), testImageUrl, 'user image');

  assert.equal(facade.get('activityActions.firstObject.field'), 'assigneeteamid', 'field specified in the action is team');
  assert.equal(facade.get('activityActions.firstObject.oldValue'), testTeamName1, 'old value');
  assert.equal(facade.get('activityActions.firstObject.newValue'), testTeamName2, 'new value');

  assert.equal(facade.get('activityActions.lastObject.field'), 'assigneeagentid', 'field specified in the action is agent');
  assert.equal(facade.get('activityActions.lastObject.newValue'), testAgentTitle, 'new value');
  assert.equal(facade.get('activityActions.lastObject.newObject.image'), testImageUrl, 'new agent image');
  assert.equal(facade.get('activityActions.lastObject.newObject.original.id'), testAgentId, 'new agent id');
});

test('merge a case', function(assert) {
  assert.expect(11);

  let facade = new activityFacade({ activity: {
    activity: 'merge_case',
    verb: 'MERGE',
    actorUser: {
      id: testUserId
    },
    actor: {
      title: testUserTitle
    },
    object: {
      title: testCaseTitle,
      url: testCaseUrl
    },
    target: {
      title: alternativeTestCaseTitle,
      url: alternativeTestCaseUrl
    }
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), false, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('isMerge'), true, 'isMerge');

  assert.equal(facade.get('actorUser.id'), testUserId, 'user id of the user');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');

  assert.equal(facade.get('object.title'), testCaseTitle, 'title of case to be merged from');
  assert.equal(facade.get('object.url'), testCaseUrl, 'url for case to be merged from');

  assert.equal(facade.get('target.title'), alternativeTestCaseTitle, 'title of case to merged to');
  assert.equal(facade.get('target.url'), alternativeTestCaseUrl, 'url for case to be merged to');
});

test('trash a case', function(assert) {
  assert.expect(12);

  let facade = new activityFacade({ activity: {
    activity: 'update_case',
    verb: 'TRASH',
    actor: {
      name: testUserName,
      title: testUserTitle
    },
    actions: [
      new EmberObject({
        field: testFieldName,
        oldValue: testOldValue,
        newValue: testNewValue
      })
    ],
    object: {
      title: testCaseTitle,
      url: testCaseUrl
    }
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), true, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('isTrashed'), true, 'isTrashed');

  assert.equal(facade.get('actor.name'), testUserName, 'user name, used to check if it is a trigger or monitor');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');

  assert.equal(facade.get('object.title'), testCaseTitle, 'title of case to merged from');
  assert.equal(facade.get('object.url'), testCaseUrl, 'title of case to merged from');

  assert.equal(facade.get('activityActions.firstObject.field'), testFieldName, 'field specifed in the action');
  assert.equal(facade.get('activityActions.firstObject.oldValue'), testOldValue, 'old value');
  assert.equal(facade.get('activityActions.firstObject.newValue'), testNewValue, 'new value');
});

test('restore a case', function(assert) {
  assert.expect(12);

  let facade = new activityFacade({ activity: {
    activity: 'update_case',
    verb: 'UPDATE',
    actor: {
      name: testUserName,
      title: testUserTitle
    },
    actions: [
      new EmberObject({
        field: testFieldName,
        oldValue: 'Trash',
        newValue: 'Active'
      })
    ],
    object: {
      title: testCaseTitle,
      url: testCaseUrl
    }
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), true, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('isRestored'), true, 'isRestored');

  assert.equal(facade.get('actor.name'), testUserName, 'user name, used to check if it is a trigger or monitor');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');

  assert.equal(facade.get('object.title'), testCaseTitle, 'title of case to merged from');
  assert.equal(facade.get('object.url'), testCaseUrl, 'title of case to merged from');

  assert.equal(facade.get('activityActions.firstObject.field'), testFieldName, 'field specifed in the action');
  assert.equal(facade.get('activityActions.firstObject.oldValue'), 'Trash', 'old value');
  assert.equal(facade.get('activityActions.firstObject.newValue'), 'Active', 'new value');
});

test('receive an event (old style)', function(assert) {
  assert.expect(20);

  let facade = new activityFacade({ activity: {
    verb: 'TRIGGER',
    apiEvent: {
      event: testEventName,
      color: testColor,
      iconUrl: testImageUrl,
      url: testArticleUrl,
      properties: {
        customUserField: 'custom user value',
        summary: testSummary
      }
    },
    actor: {
      title: testUserTitle
    },
    actorUser: {
      id: testUserId
    },
    object: {
      title: testEventTitle
    }
  }});

  assert.equal(facade.get('isEvent'), true, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), false, 'isLarge');
  //assert.equal(facade.get('isStandard'), false, 'isStandard'); //if it's an event it should not be a standard

  assert.equal(facade.get('isEvent'), true, 'isEvent');

  assert.equal(facade.get('eventIcon'), testImageUrl, 'eventIcon');
  assert.equal(facade.get('eventUrl'), testArticleUrl, 'eventUrl');
  assert.equal(facade.get('hasValidEventColor'), true, 'hasValidEventColor');
  assert.equal(facade.get('eventColor'), testColor, 'eventColor');

  assert.equal(facade.get('hasEventPropertySummary'), true, 'hasEventPropertySummary');
  assert.equal(facade.get('eventPropertySummary'), testSummary, 'eventPropertySummary');
  assert.equal(facade.get('apiEvent.properties.customUserField'), 'custom user value', 'custom property sent in create event payload');

  assert.equal(facade.get('actorUser.id'), testUserId, 'user id');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');

  assert.equal(facade.get('object.title'), testEventTitle, 'title of the event');
  assert.equal(facade.get('apiEvent.event'), testEventName, 'name of the event');

  assert.equal(facade.get('processedEventProperties.summary'), null, 'summary should be removed');
  assert.equal(facade.get('processedEventProperties.Summary'), null, 'Summary should be removed');
  assert.equal(facade.get('processedEventProperties.icon_url'), null, 'icon_url should be removed');
  assert.equal(facade.get('processedEventProperties.url'), null, 'url should be removed');
  assert.equal(facade.get('processedEventProperties.color'), null, 'color should be removed');
});

test('receive an event (new style)', function(assert) {
  assert.expect(19);

  let facade = new activityFacade({ activity: {
    verb: 'TRIGGER',
    apiEvent: {
      event: testEventName,
      properties: {
        customUserField: 'custom user value',
        summary: testSummary,
        color: testColor,
        icon_url: testImageUrl,
        url: testArticleUrl
      }
    },
    actor: {
      title: testUserTitle
    },
    actorUser: {
      id: testUserId
    },
    object: {
      title: testEventTitle
    }
  }});

  assert.equal(facade.get('isEvent'), true, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), false, 'isLarge');
  //assert.equal(facade.get('isStandard'), false, 'isStandard'); //if it's an event it should not be a standard

  assert.equal(facade.get('isEvent'), true, 'isEvent');

  assert.equal(facade.get('eventIcon'), testImageUrl, 'eventIcon');
  assert.equal(facade.get('eventUrl'), testArticleUrl, 'eventUrl');
  assert.equal(facade.get('hasValidEventColor'), true, 'hasValidEventColor');
  assert.equal(facade.get('eventColor'), testColor, 'eventColor');

  assert.equal(facade.get('hasEventPropertySummary'), true, 'hasEventPropertySummary');
  assert.equal(facade.get('eventPropertySummary'), testSummary, 'eventPropertySummary');
  assert.equal(facade.get('apiEvent.properties.customUserField'), 'custom user value', 'custom property sent in create event payload');

  assert.equal(facade.get('actorUser.id'), testUserId, 'user id');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');

  assert.equal(facade.get('object.title'), testEventTitle, 'title of the event');
  assert.equal(facade.get('apiEvent.event'), testEventName, 'name of the event');

  assert.equal(facade.get('processedEventProperties.summary'), null, 'summary should be removed');
  assert.equal(facade.get('processedEventProperties.Summary'), null, 'Summary should be removed');
  assert.equal(facade.get('processedEventProperties.icon_url'), null, 'icon_url should be removed');
  assert.equal(facade.get('processedEventProperties.color'), null, 'color should be removed');
});

test('apply a rating', function(assert) {
  assert.expect(14);

  let facade = new activityFacade({ activity: {
    activity: 'update_case_rating',
    verb: 'RATE',
    actor: {
      title: testUserTitle
    },
    actorUser: {
      id: testUserId
    },
    object: {
      title: testGoodRating
    },
    rating: {
      comment: testComment
    },
    target: {
      title: testCaseTitle,
      url: testCaseUrl
    }
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), true, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('isRating'), true, 'isRating');
  assert.equal(facade.get('isGoodRating'), true, 'isGoodRating');
  assert.equal(facade.get('isBadRating'), false, 'isBadRating');
  assert.equal(facade.get('hasComment'), true, 'hasComment');

  assert.equal(facade.get('actorUser.id'), testUserId, 'user id');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');

  assert.equal(facade.get('object.title'), testGoodRating, 'rating that was applied to the case');

  assert.equal(facade.get('target.title'), testCaseTitle, 'title of case rating was applied to');
  assert.equal(facade.get('target.url'), testCaseUrl, 'url of case rating was applied to');

  assert.equal(facade.get('rating.comment'), testComment, 'comment');
});

test('completing a case', function(assert) {
  assert.expect(10);

  let facade = new activityFacade({ activity: {
    activity: 'update_case',
    verb: 'UPDATE',
    actions: [
      new EmberObject({
        action: 'UPDATED',
        field: 'casestatusid',
        newValue: testCaseStatusCompletedValue
      })
    ],
    actor: {
      title: testUserTitle,
      name: testUserName,
      image: testImageUrl
    },
    actorUser: {
      id: testUserId
    },
    object: {
      title: testCaseTitle,
      url: testCaseUrl
    },
    rating: {
      comment: testComment
    },
    target: {
      title: testCaseTitle,
      url: testCaseUrl
    }
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), true, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('isCompleted'), true, 'isCompleted');
  assert.equal(facade.get('isMonitorOrTrigger'), false, 'isMonitorOrTrigger');

  assert.equal(facade.get('actorUser.id'), testUserId, 'user id');
  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');
  assert.equal(facade.get('actor.name'), testUserName, 'user name of the user');
  assert.equal(facade.get('actor.image'), testImageUrl, 'image url for the user');
});

test('closing a case', function(assert) {
  assert.expect(11);

  let facade = new activityFacade({ activity: {
    activity: 'update_case',
    verb: 'UPDATE',
    actions: [
      new EmberObject({
        action: 'UPDATED',
        field: 'casestatusid',
        oldValue: testCaseStatusCompletedValue,
        oldObject: {
          id: testCaseStatusCompletedId
        },
        newValue: testCaseStatusClosedValue,
        newObject: {
          id: testCaseStatusClosedId
        }
      })
    ],
    actor: {
      title: testUserTitle
    },
    object: {
      title: testCaseTitle,
      url: testCaseUrl
    }
  }});

  assert.equal(facade.get('isEvent'), false, 'isEvent');
  assert.equal(facade.get('isOrgOrUserNote'), false, 'isOrgOrUserNote');
  assert.equal(facade.get('isLarge'), false, 'isLarge');
  assert.equal(facade.get('isStandard'), true, 'isStandard');

  assert.equal(facade.get('isClosed'), true, 'isCompleted');

  assert.equal(facade.get('actor.title'), testUserTitle, 'user title of the user');

  assert.equal(facade.get('activityActions.firstObject.field'), 'casestatusid', 'field specifed in the action');
  assert.equal(facade.get('activityActions.firstObject.oldValue'), testCaseStatusCompletedValue, 'old value');
  assert.equal(facade.get('activityActions.firstObject.oldObject.id'), testCaseStatusCompletedId, 'old id');
  assert.equal(facade.get('activityActions.firstObject.newValue'), testCaseStatusClosedValue, 'new value');
  assert.equal(facade.get('activityActions.firstObject.newObject.id'), testCaseStatusClosedId, 'new id');
});
