import AppSlotApp from 'frontend-cp/components/ko-app-slot/app/component';
import layout from 'frontend-cp/components/ko-app-slot/app/template';
import styles from 'frontend-cp/components/ko-app-slot/app/styles';
// import { computed } from '@ember/computed';

export default AppSlotApp.extend({
  layout,
  styles,

  handleUpdatePromptValue(msg) {
    this.get('on-change')(msg.data.payload.value);
    this.replyTo(msg, { status: 'ok' });
  }

});
