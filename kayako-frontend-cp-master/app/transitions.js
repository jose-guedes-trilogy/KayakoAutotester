import isIE from 'frontend-cp/lib/is-ie';

export default function() {
  if (!isIE) {
    this.transition(
      this.hasClass('leftHandSideBarAnimation'),

      this.toValue(true),

      this.use('toLeft', {duration: 250}),
      this.reverse('toRight', {duration: 250})
    );
    this.transition(
      this.hasClass('animate-widget'),
      this.toValue(false),
      this.use('fade', {duration: 100})
    );
  }
}
