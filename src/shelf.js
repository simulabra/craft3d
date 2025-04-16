import { draw, drawEllipse, drawCircle } from 'replicad';
export function drawBracket() {
  const d = 45;
  const w = 36;
  const mr = d / 2;
  const drawBracket = () => {
    let bracket = draw()
      .hLine(d)
      .vLine(d)
      .close()
      .sketchOnPlane()
      .extrude(w);
    
    const screwHole = (plane = "XY", x, z) => {
      let throughHole = drawCircle(1.75).sketchOnPlane(plane).extrude(d);
      const headHole = drawCircle(4).sketchOnPlane(plane).extrude(d - 8);
      return throughHole.fuse(headHole).translateX(x).translateY(d).translateZ(z);
    };

    const mountHole = drawCircle(1.75)
      .sketchOnPlane('YZ')
      .extrude(d)
      .translateZ(w / 2)
      .translateY(mr);

    bracket = bracket
      .cut(screwHole('XZ', 20, 8))
      .cut(screwHole('XZ', 14, w - 8))
      .cut(mountHole);
    
    return bracket;
  }
  let b1 = drawBracket();
  let b2 = drawBracket();
  b2 = b2.rotate(90, [0, 0, 0], [1, 0, 0]).translateZ(w);
  b1 = b1.fuse(b2);
  const loft = draw()
    .movePointerTo([0, w])
    .hLine(0.01)
    .vLine(0.01).close().sketchOnPlane('YZ');
  const middle = draw()
    .movePointerTo([d, w])
    .hLine(-d)
    .vLine(d)
    .hLine(d)
    .close()
    .sketchOnPlane('YZ', d)
    .loftWith(loft);
  b1 = b1.fuse(middle);
  const middleHole = drawCircle(1.75)
      .sketchOnPlane('YZ')
      .extrude(d)
      .translateZ(w + mr)
      .translateY(mr);
  return b1.cut(middleHole).rotate(90, [d, 0, 0], [0, 1, 0]);
}
