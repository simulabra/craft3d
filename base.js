import { __, base } from 'simulabra';
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
  console.log('craft3d');
}.module({
  name: 'craft3d',
  imports: [base],
}).load();
