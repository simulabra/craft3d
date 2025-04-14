import { __, base } from 'simulabra';
// import html from 'simulabra/html';
import opencascade from 'replicad-opencascadejs/src/replicad_single.js';
import opencascadeWasm from 'replicad-opencascadejs/src/replicad_single.wasm';
import { setOC } from 'replicad';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default await function (_, $) {
  $.Class.new({
    name: 'Craft3d',
    slots: [
      $.Var.new({
        name: 'loadedWasm',
        default: false
      }),
      $.Method.new({
        name: 'initReplicad',
        async do() {
          const init = async () => {
            if (this.loaded()) return Promise.resolve(true);

            const OC = await opencascade({
              locateFile: () => opencascadeWasm,
            });

            this.loaded(true);
            setOC(OC);

            return true;
          };
          const started = await init();
        }
      }),
      $.Method.new({
        name: 'mount',
        do() {
          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.z = 3;
          THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
          const renderer = new THREE.WebGLRenderer();
          renderer.setSize(window.innerWidth, window.innerHeight);
          document.body.appendChild(renderer.domElement);
          const controls = new OrbitControls(camera, renderer.domElement);
          const testGeometry = new THREE.BoxGeometry(1, 1, 1);
          const testMaterial = new THREE.MeshNormalMaterial({ flatShading: true });
          const testMesh = new THREE.Mesh(testGeometry, testMaterial);
          scene.add(testMesh);

          controls.update();
          const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);

          }
          animate();
        }
      }),
    ]
  });

  const craft3d = $.Craft3d.new();
  craft3d.mount();
}.module({
  name: 'craft3d',
  imports: [base],
}).load();
