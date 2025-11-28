import ApplicationSerializer from './application';

export function addResourcesToActivity(activity) {
  addNoteToActivity(activity);
  addRatingToActivity(activity);
  addApiEventToActivity(activity);
  addUserToActivity(activity);
  addObjectUserToActivity(activity);
  addCaseToActivity(activity);
  addCaseMessageToActivity(activity);
  addHelpcenterCommentToActivity(activity);
  addSideConversationToActivity(activity);
}

export default ApplicationSerializer.extend({
  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    payload.data.forEach(addResourcesToActivity);
    payload.data.forEach(convertCaseToConversation);
    return this._super(store, primaryModelClass, payload, id, requestType);
  }
});

function addNoteToActivity(activity) {
  if (activity.result &&
      activity.result.original &&
      activity.result.original.id &&
      activity.result.original.resource_type === 'note' &&
      (activity.activity === 'create_user_note' ||
      activity.activity === 'create_organization_note')) {

    let noteId = activity.result.original.id;

    activity.note = { id: noteId, resource_type: 'note' };
    activity.result.original = null;
  }
  return activity;
}

function addRatingToActivity(activity) {
  if (activity.object &&
      activity.object.original &&
      activity.object.original.id &&
      activity.object.original.resource_type === 'rating') {

    let ratingId = activity.object.original.id;

    activity.rating = { id: ratingId, resource_type: 'rating' };
    activity.object.original = null;
  }
  return activity;
}

function addCaseToActivity(activity) {
  if (activity.object &&
      activity.object.original &&
      activity.object.original.id &&
      activity.object.original.resource_type === 'case') {

    let caseId = activity.object.original.id;

    activity.case = { id: caseId, resource_type: 'case' };
    activity.object.original = null;
  } else if (activity.target &&
      activity.target.original &&
      activity.target.original.id &&
      activity.target.original.resource_type === 'case') {

    let caseId = activity.target.original.id;

    activity.case = { id: caseId, resource_type: 'case' };
    activity.target.original = null;
  }
  return activity;
}

function addCaseMessageToActivity(activity) {
  if (activity.object &&
      activity.object.original &&
      activity.object.original.id &&
      activity.object.original.resource_type === 'case_message') {

    let caseMessageId = activity.object.original.id;

    activity.case_message = { id: caseMessageId, resource_type: 'case_message' };
    activity.object.original = null;
  }
  return activity;
}

function addApiEventToActivity(activity) {
  if (activity.object &&
      activity.object.original &&
      activity.object.original.id &&
      activity.object.original.resource_type === 'event') {

    let eventId = activity.object.original.id;

    activity.api_event = { id: eventId, resource_type: 'event' };
    activity.object.original = null;
  }
  return activity;
}

function addUserToActivity(activity) {
  if (activity.actor &&
      activity.actor.original &&
      activity.actor.original.id &&
      activity.actor.original.resource_type === 'user') {

    let userId = activity.actor.original.id;
    activity.actor_user = { id: userId, resource_type: 'user' };
    activity.actor.original = null;
  }
  return activity;
}

function addObjectUserToActivity(activity) {
  if (activity.object_actor &&
      activity.object_actor.original &&
      activity.object_actor.original.id &&
      activity.object_actor.original.resource_type === 'user') {

    let userId = activity.object_actor.original.id;
    activity.object_actor_user = { id: userId, resource_type: 'user' };
    activity.object_actor.original = null;
  }
  return activity;
}

function addHelpcenterCommentToActivity(activity) {
  if (activity.object &&
      activity.object.original &&
      activity.object.original.id &&
      activity.object.original.resource_type === 'comment') {

    let commentId = activity.object.original.id;
    activity.helpcenter_comment = { id: commentId, resource_type: 'comment' };
    activity.object.original = null;
  }
  return activity;
}

function addSideConversationToActivity(activity) {
  if (activity.object &&
      activity.object.original &&
      activity.object.original.id &&
      activity.object.original.resource_type === 'side_conversation') {

    let sideConversationId = activity.object.original.id;
    activity.side_conversation = { id: sideConversationId, resource_type: 'side_conversation' };
    activity.object.original = null;
  }
  return activity;
}

function convertCaseToConversation(activity) {
  let props = Object.keys(activity);

  props.forEach(prop => {
    let value = activity[prop];

    if (value && typeof value.url === 'string') {
      value.url = value.url.replace(/case/g, 'conversation');
    }
  });
}
