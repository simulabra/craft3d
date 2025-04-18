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
      function lines(...lines) {
        this.obj(replicad.draw());
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
      function dimensionalize() {
        return this.obj().sketchOnPlane(this.plane()).extrude(this.extrude());
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
          this.obj(this.obj().fuse(part.render()));
        }
        return this;
      },
      function cut(...parts) {
        this.log('cut');
        for (const part of parts) {
          this.obj(this.obj().cut(part.render()));
        }
        return this;
      },
      function translate(x, y, z) {
        this.log('translate', x, y, z);
        this.obj(this.obj().translateX(x).translateY(y).translateZ(z));
        return this;
      },
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
        b2 = b2.rotate(90, [0, 0, 0], [1, 0, 0]).translateZ(w);
        b1 = b1.fuse(b2);
        const loft = replicad.draw()
          .movePointerTo([0, w])
          .hLine(0.01)
          .vLine(0.01).close().sketchOnPlane('YZ');
        const middle = replicad.draw()
          .movePointerTo([d, w])
          .hLine(-d)
          .vLine(d)
          .hLine(d)
          .close()
          .sketchOnPlane('YZ', d)
          .loftWith(loft);
        b1 = b1.fuse(middle);
        const middleHole = replicad.drawCircle(1.75)
          .sketchOnPlane('YZ')
          .extrude(d)
          .translateZ(w + mr)
          .translateY(mr);
        return b1.cut(middleHole).rotate(90, [d, 0, 0], [0, 1, 0]);
      }
    ]
  });
}.module({
  name: 'shelf',
  imports: [base]
}).load();
