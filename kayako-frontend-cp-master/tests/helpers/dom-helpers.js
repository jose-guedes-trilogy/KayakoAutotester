import layoutStyles from 'frontend-cp/components/ko-agent-content/layout/styles';

function text(selector) {
  return $.trim($(selector).text()).replace(/\s+/g, ' ');
}

function scrollConversationTimelineUp() {
  let scrollParent = find(`.${layoutStyles.timeline}`);
  scrollParent.scrollTop(0).trigger('scroll');
}

export { text, scrollConversationTimelineUp };
