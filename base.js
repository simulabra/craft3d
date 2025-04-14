import { __, base } from 'simulabra';
import html from 'simulabra/html';
import opencascade from 'replicad-opencascadejs/src/replicad_single.js';
import opencascadeWasm from 'replicad-opencascadejs/src/replicad_single.wasm';
import { setOC } from 'replicad';

let loaded = false;
const init = async () => {
  if (loaded) return Promise.resolve(true);

  const OC = await opencascade({
    locateFile: () => opencascadeWasm,
  });

  loaded = true;
  setOC(OC);

  return true;
};
const started = init();

export default await function (_, $) {
  console.log('craft3d', html);
  const $el = $.HtmlElement.proxy();
  $.Class.new({
    name: 'Craft3d',
    slots: [
      $.Window,
      $.Application,
      $.Method.new({
        name: 'render',
        do() {
          return $el.div({}, 'hello there');
        }
      }),
    ]
  });

  const craft3d = $.Craft3d.new();
  craft3d.mount();
}.module({
  name: 'craft3d',
  imports: [base, html],
}).load();
