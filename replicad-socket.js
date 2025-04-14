const { draw, drawEllipse, drawCircle } = replicad;
const main = () => {
  const w = 70;
  const h = 120;
  const d = 5;
  const socket = {
    bottomWidth: 19,
    height: 29,
    midWidth: 34,
    inter: 10,
    cutoutWidth: 38,
    cutoutHeight: 21,
  };
  socket.offset = (h / 2 - socket.height - socket.inter / 2);
  socket.bulge = (socket.midWidth - socket.bottomWidth) / 2;
  let shape = draw()
    .hLine(w)
    .vLine(h)
    .hLine(-w)
    .vLine(-h)
    .close()
    .sketchOnPlane()
    .extrude(d)
    .fillet(2, f => f.inPlane('XY', d));
  let hole = () => draw()
    .hLine(socket.bottomWidth)
    .halfEllipse(0, -socket.height, socket.bulge)
    .hLine(-socket.bottomWidth)
    .halfEllipse(0, socket.height, socket.bulge)
    .close()
    .sketchOnPlane()
    .extrude(d)
    .translateX((w - socket.bottomWidth) / 2);
  let hole1 = hole()
    .translateY(socket.height + socket.offset);
  let hole2 = hole()
    .translateY(h - socket.offset);
  let hole3 = drawCircle(2)
    .sketchOnPlane()
    .extrude(d)
    .translateX(w / 2)
    .translateY(h / 2);
  let hole4 = draw()
    .vLine(3)
    .hLine(3)
    .close()
    .sketchOnPlane("XZ")
    .revolve()
    .translateX(w / 2)
    .translateY(h / 2)
    .translateZ(d - 3);
  const cutout = () => draw()
    .hLine(socket.cutoutWidth)
    .vLine(socket.cutoutHeight)
    .hLine(-socket.cutoutWidth)
    .close()
    .sketchOnPlane()
    .extrude(3)
    .translateX((w - socket.cutoutWidth) / 2);
  let hole5 = cutout()
  .translateY(socket.offset - socket.cutoutHeight - 1);
  let hole6 = cutout()
    .translateY(h - socket.offset + 1);
  shape = shape.cut(hole1).cut(hole2).cut(hole3).cut(hole4).cut(hole5).cut(hole6);

  return shape;
};
