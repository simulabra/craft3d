import { __, base } from 'simulabra';
// import { draw, drawEllipse, drawCircle } from 'replicad';
import * as replicad from 'replicad';
export default await async function (_, $) {
  $.Class.new({
    name: 'Sketcher',
    slots: [
      $.Var.new({ name: 'obj' }),
      $.Var.new({ name: 'extrude' }),
      $.Var.new({ name: 'plane', default: 'XY' }),
      $.Var.new({ name: 'planeOffset', default: 0 }),
      function startDraw(startX = 0, startY = 0) {
        if (!this.obj()) {
          this.obj(replicad.draw());
          this.obj().movePointerTo([startX, startY]);
        }
        return this;
      },
      function lines(...lines) {
        if (!this.obj()) {
          this.obj(replicad.draw());
        }
        for (const line of lines) {
          this.obj(this.obj().line(...line));
        }
        this.obj(this.obj().close());
        return this;
      },
      function circle(radius) {
        this.obj(replicad.drawCircle(radius));
        return this;
      },
      function sketch() {
        this.obj(this.obj().sketchOnPlane(this.plane(), this.planeOffset()));
        return this;
      },
      function dimensionalize() {
        this.sketch();
        return $.Drawing.new({ obj: this.obj().extrude(this.extrude()) });
      },
      function loft(loftTarget) {
        this.sketch();
        return $.Drawing.new({ obj: this.obj().loftWith(loftTarget.obj()) });
      }
    ]
  });

  $.Class.new({
    name: 'Drawing',
    slots: [
      $.Var.new({ name: 'obj' }),
      function fuse(...parts) {
        this.log('fuse');
        for (const part of parts) {
          this.obj(this.obj().fuse(part.obj()));
        }
        return this;
      },
      function cut(...parts) {
        this.log('cut');
        for (const part of parts) {
          this.obj(this.obj().cut(part.obj()));
        }
        return this;
      },
      function translate(x, y, z) {
        this.log('translate', x, y, z);
        this.obj(this.obj().translateX(x).translateY(y).translateZ(z));
        return this;
      },
      function rotate(deg, pos, rot) {
        this.obj(this.obj().rotate(deg, pos, rot));
        return this;
      }
    ]
  });

  $.Class.new({
    name: 'Bracket',
    slots: [
      $.Var.new({ name: 'd', default: 45 }),
      $.Var.new({ name: 'w', default: 36 }),
      function render() {
        const d = this.d();
        const w = this.w();
        const mr = d / 2;
        const drawBracket = () => {
          let bracket = $.Sketcher.new({
            extrude: w
          }).lines([d, 0], [0, d], [-d, -d]);

          const screwHole = (plane = "XY", x, z) => {
            const headHole = $.Sketcher.new({
              plane,
              extrude: d - 8
            }).circle(4).dimensionalize();
            const throughHole = $.Sketcher.new({
              plane,
              extrude: d
            }).circle(1.75)
              .dimensionalize()
              .fuse(headHole)
              .translate(x, d, z);
            return throughHole;
          };

          const mountHole = $.Sketcher.new({
            plane: 'YZ',
            extrude: d,
          }).circle(1.75).dimensionalize().translate(0, mr, w / 2);

          bracket = bracket.dimensionalize().cut(
            screwHole('XZ', 20, 8),
            screwHole('XZ', 14, w - 8),
            mountHole
          );

          return bracket;
        };
        let b1 = drawBracket();
        let b2 = drawBracket();
        b2 = b2.rotate(90, [0, 0, 0], [1, 0, 0]).translate(0, 0, w);
        b1 = b1.fuse(b2);
        const ep = 0.01;
        const loft = $.Sketcher.new({ plane: 'YZ' })
          .startDraw(0, w)
          .lines([ep, 0], [0, ep], [-ep, -ep])
          .sketch();
        const middle = $.Sketcher.new({
          plane: 'YZ',
          planeOffset: d
        }).startDraw(d, w)
          .lines([-d, 0], [0, d], [d, 0], [0, -d])
          .loft(loft);
        b1 = b1.fuse(middle);
        const middleHole = $.Sketcher.new({
          plane: 'YZ',
          extrude: d
        }).circle(1.75)
          .dimensionalize()
          .translate(0, mr, w + mr);
        return b1.cut(middleHole).rotate(90, [d, 0, 0], [0, 1, 0]).obj();
      }
    ]
  });
}.module({
  name: 'shelf',
  imports: [base]
}).load();
