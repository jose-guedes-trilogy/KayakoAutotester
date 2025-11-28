import { moduleForComponent, test } from 'ember-qunit';

let component;
const defaultPlot = [0, 0, 0, 0, 0, 0, 0, 0];

moduleForComponent('ko-admin/engagements/index/poly-graph', 'Unit | Component | ko admin/engagements/index/poly graph', {
  unit: true,
  setup: function() {
    component = this.subject();
    component.set('width', 160);
    component.set('height', 70);
  },
  beforeEach: function() {
    component.set('engagement', {
      metric: {
        visible_count: 0,
        clicked_count: 0,
        used_count: 0
      }
    });
    component.set('showVisible', true);
  }
});

test('it returns default visiblePlot points', function(assert) {
  assert.equal(component.get('points'), defaultPlot.join(' '), 'points can\'t be determined');
});

test('it returns visiblePlot points', function(assert) {
  component.set('engagement.metric.visible_count', 10);
  const width = component.get('width');
  const height = component.get('height');
  const visibleCount = component.get('engagement.metric.visible_count');
  const clickedCount = component.get('engagement.metric.clicked_count');
  const visiblePlot = [0, 0, 0, height, width, height, width, 0];
  const clickToVisible = (height - Math.round((clickedCount / visibleCount) * height));
  visiblePlot[7] = clickToVisible;
  assert.equal(component.get('points'), visiblePlot.join(' '), 'points can\'t be determined');
});

test('it returns default clickedPlot points', function(assert) {
  component.set('showVisible', false);
  component.set('showClicked', true);
  assert.equal(component.get('points'), defaultPlot.join(' '), 'points can\'t be determined');
});

test('it returns clickedPlot points', function(assert) {
  component.set('engagement.metric.visible_count', 30);
  component.set('engagement.metric.clicked_count', 20);
  component.set('engagement.metric.used_count', 10);
  component.set('showVisible', false);
  component.set('showClicked', true);
  const width = component.get('width');
  const height = component.get('height');
  const visibleCount = component.get('engagement.metric.visible_count');
  const clickedCount = component.get('engagement.metric.clicked_count');
  const usedCount = component.get('engagement.metric.used_count');
  const clickedPlot = [0, 0, 0, height, width, height, width, 0];
  const clickToVisible = (height - Math.round((clickedCount / visibleCount) * height));
  clickedPlot[1] = clickToVisible;
  const usedToVisible = (height - Math.round((usedCount / visibleCount) * height));
  clickedPlot[7] = usedToVisible;
  assert.equal(component.get('points'), clickedPlot.join(' '), 'points can\'t be determined');
});

test('it returns default usedPlot points', function(assert) {
  component.set('showVisible', false);
  component.set('showClicked', true);
  assert.equal(component.get('points'), defaultPlot.join(' '), 'points can\'t be determined');
});

test('it returns usedPlot points', function(assert) {
  component.set('showVisible', false);
  component.set('showUsed', true);
  component.set('engagement.metric.visible_count', 30);
  component.set('engagement.metric.clicked_count', 20);
  component.set('engagement.metric.used_count', 10);
  const width = component.get('width');
  const height = component.get('height');
  const visibleCount = component.get('engagement.metric.visible_count');
  const usedCount = component.get('engagement.metric.used_count');
  const usedPlot = [0, 0, 0, height, width, height, width, 0];
  const usedToVisible = (height - Math.round((usedCount / visibleCount) * height));
  usedPlot[1] = usedToVisible;
  usedPlot[7] = usedToVisible;
  assert.equal(component.get('points'), usedPlot.join(' '), 'points can\'t be determined');
});
