import Component from '@ember/component';
import { computed } from '@ember/object';

const defaultPlot = [0, 0, 0, 0, 0, 0, 0, 0];

export default Component.extend({

  // Attributes
  engagement: null,
  background: '#FFFFFF',
  showVisible: false,
  showClicked: false,
  showUsed: false,
  width: 160,
  height: 70,
  conversion: 0,

  points: computed('showVisible', 'showClicked', 'showUsed', function() {
    const showVisible = this.get('showVisible');
    const showClicked = this.get('showClicked');
    const showUsed = this.get('showUsed');
    if(showVisible === true) {
      return this.get('visiblePlot');
    } else if (showClicked === true) {
      return this.get('clickedPlot');
    } else if (showUsed === true) {
      return this.get('usedPlot');
    } else {
      return defaultPlot.join(' ');
    }
  }),

  count: computed('showVisible', 'showClicked', 'showUsed', function() {
    const visibleCount = this.get('engagement.metric.visible_count');
    const clickedCount = this.get('engagement.metric.clicked_count');
    const usedCount = this.get('engagement.metric.used_count');
    const showVisible = this.get('showVisible');
    const showClicked = this.get('showClicked');
    const showUsed = this.get('showUsed');
    if(visibleCount === 0) {
      return '-';
    } else if(showVisible === true) {
      return visibleCount;
    } else if(showClicked === true) {
      if (clickedCount > visibleCount) {
        return visibleCount;
      }
      return clickedCount;
    } else if(showUsed === true) {
      if (usedCount > clickedCount) {
        return clickedCount;
      }
      return usedCount;
    }
    return 0;
  }),

  visiblePlot: computed('engagement', function() {
    let visibleCount = this.get('engagement.metric.visible_count');
    let clickedCount = this.get('engagement.metric.clicked_count');
    let visiblePlot = [0, 0, 0, 0, 0, 0, 0, 0];
    if (visibleCount > 0) {
      if (clickedCount > visibleCount) {
        clickedCount = visibleCount;
      }
      visiblePlot = [0, 0, 0, this.height, this.width, this.height, this.width, 0];
      const clickedToVisible = (this.height - Math.round((clickedCount / visibleCount) * this.height));
      visiblePlot[7] = clickedToVisible;
    }
    return visiblePlot.join(' ');
  }),

  clickedPlot: computed('engagement', function() {
    let visibleCount = this.get('engagement.metric.visible_count');
    let clickedCount = this.get('engagement.metric.clicked_count');
    let usedCount = this.get('engagement.metric.used_count');
    let clickedPlot = [0, 0, 0, 0, 0, 0, 0, 0];
    if (visibleCount === 0) {
      return clickedPlot.join(' ');
    }
    clickedCount = (clickedCount > visibleCount) ? visibleCount : clickedCount;
    usedCount = (usedCount > clickedCount) ? clickedCount : usedCount;
    clickedPlot = [0, 0, 0, this.height, this.width, this.height, this.width, 0];
    const clickToVisible = (this.height - Math.round((clickedCount / visibleCount) * this.height));
    clickedPlot[1] = clickToVisible;

    const usedToVisible = (this.height - Math.round((usedCount / visibleCount) * this.height));
    clickedPlot[7] = usedToVisible;

    return clickedPlot.join(' ');
  }),

  usedPlot: computed('engagement', function() {
    let visibleCount = this.get('engagement.metric.visible_count');
    let clickedCount = this.get('engagement.metric.clicked_count');
    let usedCount = this.get('engagement.metric.used_count');
    let usedPlot = [0, 0, 0, 0, 0, 0, 0, 0];
    if (visibleCount === 0 || clickedCount === 0) {
      return usedPlot.join(' ');
    }
    clickedCount = (clickedCount > visibleCount) ? visibleCount : clickedCount;
    usedCount = (usedCount > clickedCount) ? clickedCount : usedCount;
    usedPlot = [0, 0, 0, this.height, this.width, this.height, this.width, 0];
    const usedToVisible = (this.height - Math.round((usedCount / visibleCount) * this.height));
    usedPlot[1] = usedToVisible;
    usedPlot[7] = usedToVisible;
    this.set('conversion', (parseFloat((usedCount / visibleCount) * 100).toFixed(2)));
    return usedPlot.join(' ');
  })
});
