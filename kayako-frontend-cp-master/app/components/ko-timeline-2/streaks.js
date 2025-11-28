import jQuery from 'jquery';
import activityStyles from 'frontend-cp/components/ko-timeline-2/list/activity/standard/styles';

export default function streaks(container) {
  let posts = jQuery(container).children().get();
  let streaks = [];
  let streak;

  posts.forEach(post => {
    if (
      post.querySelector('[data-connectable]') ||
      post.querySelector('[data-connectable-no-icon]')
    ) {
      if (!streak) {
        streak = [];
        streaks.push(streak);
      }
      streak.push(post);
    } else {
      streak = null;
    }
  });

  let activityItemClass = activityStyles.activity;

  streaks.forEach(streak => {
    if (streak.length === 1) {
      let targetDiv = jQuery(streak[0]).find('div.' + activityItemClass);

      if (targetDiv.data('connectable') !== undefined) {
        streak[0].setAttribute('data-single', '');
      } else if (targetDiv.data('connectable-no-icon') !== undefined) {
        streak[0].setAttribute('data-single-no-icon', '');
      }
    }

    streak.forEach((post, index) => {
      let targetDiv = jQuery(post).find('div.' + activityItemClass);

      if (index === streak.length - 1) {
        post.removeAttribute('data-connect');
        post.removeAttribute('data-connect-no-icon');
      } else {
        if (targetDiv.data('connectable') !== undefined) {
          post.setAttribute('data-connect', '');
        } else if (targetDiv.data('connectable-no-icon') !== undefined) {
          post.setAttribute('data-connect-no-icon', '');
        }
      }
    });
  });
}
