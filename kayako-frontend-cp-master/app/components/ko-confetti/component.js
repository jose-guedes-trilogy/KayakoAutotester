import Component from '@ember/component';

const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;

export default Component.extend({
  tagName: 'canvas',

  // Attributes
  height: 350,
  widthOffset: 0,

  didRender () {
    this._super(...arguments);

    if (!requestAnimationFrame) {
      return;
    }

    let height = this.get('height');
    let widthOffset = this.get('widthOffset');

    this._removeListeners();

    const NUM_CONFETTI = 40;
    const xpos = 0.5;

    const COLORS = [
      [172, 180, 131],
      [159, 199, 205],
      [249, 212, 128],
      [245, 141, 140],
      [251, 194, 184]
    ];

    const canvas = this.get('element');
    const context = canvas.getContext('2d');

    window.w = 0;
    window.h = 0;

    const resizeWindow = function() {
      window.w = canvas.width = window.innerWidth - widthOffset;
      window.h = canvas.height = height;
    };

    const range = function(a, b) {
      return (b - a) * Math.random() + a;
    };

    const drawCircle = function(a, b, c, d) {
      context.beginPath();
      context.moveTo(a, b);
      context.bezierCurveTo(a - 17, b + 14, a + 13, b + 5, a - 5, b + 22);
      context.lineWidth = 2;
      context.strokeStyle = d;
      return context.stroke();
    };

    const drawCircle2 = function(a, b, c, d) {
      context.beginPath();
      context.moveTo(a, b);
      context.lineTo(a + 6, b + 9);
      context.lineTo(a + 12, b);
      context.lineTo(a + 6, b - 9);
      context.closePath();
      context.fillStyle = d;
      return context.fill();
    };

    const drawCircle3 = function(a, b, c, d) {
      context.beginPath();
      context.moveTo(a, b);
      context.lineTo(a + 5, b + 5);
      context.lineTo(a + 10, b);
      context.lineTo(a + 5, b - 5);
      context.closePath();
      context.fillStyle = d;
      return context.fill();
    };

    const Confetti = (function() {
      function a() {
        this.style = COLORS[parseInt(range(0, 5))];
        this.rgb = 'rgba(' + this.style[0] + ',' + this.style[1] + ',' + this.style[2];
        this.r = parseInt(range(2, 6));
        this.r2 = 2 * this.r;
        this.replace();
      }

      a.prototype.replace = function() {
        this.opacity = 0;
        this.dop = 0.01 * range(1, 4);
        this.x = range(-this.r2, window.w - this.r2);
        this.y = range(-20, window.h - this.r2);
        this.xmax = window.w - this.r;
        this.ymax = window.h - this.r;
        this.vx = range(0, 2) + 8 * xpos - 5;
        return (this.vy = 0.4 * this.r + range(-1, 1));
      };

      a.prototype.draw = function() {
        var a;
        this.x += this.vx;
        this.y += this.vy;
        this.opacity += this.dop;
        if (this.opacity > 1) {
          this.opacity = 1;
          this.dop *= -1;
        }

        if (this.opacity < 0 || this.y > this.ymax) {
          this.replace();
        }

        /* eslint yoda: [0] */
        if (!(0 < (a = this.x) && a < this.xmax)) {
          this.x = (this.x + this.xmax) % this.xmax;
        }

        drawCircle(parseInt(this.x), parseInt(this.y), this.r, this.rgb + ',' + this.opacity + ')');
        drawCircle3(0.5 * parseInt(this.x), parseInt(this.y), this.r, this.rgb + ',' + this.opacity + ')');
        return drawCircle2(1.5 * parseInt(this.x), 1.5 * parseInt(this.y), this.r, this.rgb + ',' + this.opacity + ')');
      };

      return a;
    }());

    const confetti = (function() {
      let a, b, c, i;
      c = [];
      i = a = 1;
      for (b = NUM_CONFETTI; 1 <= b ? a <= b : a >= b; i <= b ? ++a : --a) {
        c.push(new Confetti());
      }
      return c;
    }());

    const step = () => {
      var a, b, c, d;
      this._animationFrameRequest = requestAnimationFrame(step);
      context.clearRect(0, 0, window.w, window.h);
      d = [];
      b = 0;
      for (c = confetti.length; b < c; b++) {
        a = confetti[b];
        d.push(a.draw());
      }
      return d;
    };

    step();
    resizeWindow();

    this._resizeListener = resizeWindow;
    window.addEventListener('resize', this._resizeListener, false);
  },

  willDestroyElement() {
    this._super(...arguments);
    this._removeListeners();
    this._cancelAnimation();
  },

  _removeListeners() {
    if (this._resizeListener) {
      window.removeEventListener('resize', this._resizeListener, false);
      this._resizeListener = null;
    }
  },

  _cancelAnimation() {
    if (!cancelAnimationFrame) {
      return;
    }

    cancelAnimationFrame(this._animationFrameRequest);
  }
});
