import { on } from '@ember/object/evented';
import Service from '@ember/service';

export default Service.extend({
  createCanvas: on('init', function() {
    this.set('ctx', document.createElement('canvas').getContext('2d'));
  }),

  measureText: function(text, font) {
    let ctx = this.get('ctx');
    if (font) {
      ctx.font = font;
    }
    return ctx.measureText(text).width;
  }
});
