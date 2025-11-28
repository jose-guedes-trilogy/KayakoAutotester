import priority from './action-handlers/priority';
import removeTags from './action-handlers/remove-tags';
import addTags from './action-handlers/add-tags';
import caseType from './action-handlers/case-type';
import status from './action-handlers/status';
import replyType from './action-handlers/reply-type';
import replyContents from './action-handlers/reply-contents';
import assignee from './action-handlers/assignee';

export default {
  priority,
  'remove-tags': removeTags,
  'add-tags': addTags,
  'case-type': caseType,
  status,
  'reply-type': replyType,
  'reply-contents': replyContents,
  assignee
};
