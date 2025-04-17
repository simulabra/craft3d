import { __, base } from 'simulabra';
// import html from 'simulabra/html';
import opencascade from 'replicad-opencascadejs/src/replicad_single.js';
import opencascadeWasm from 'replicad-opencascadejs/src/replicad_single.wasm';
import { setOC } from 'replicad';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { syncFaces, syncLines, syncLinesFromFaces } from "replicad-threejs-helper";
import { drawBracket } from './shelf.js';

export default await async function (_, $) {
  $.Class.new({
    name: 'Draw',
    slots: []
  });
  $.Class.new({
    name: 'Craft3d',
    slots: [
      $.Var.new({
        name: 'loadedWasm',
        default: false
      }),
      async function initReplicad() {
        const init = async () => {
          if (this.loadedWasm()) return Promise.resolve(true);

          const OC = await opencascade({
            locateFile: () => opencascadeWasm,
          });

          this.loadedWasm(true);
          setOC(OC);

          console.log('loaded wasm');
          return true;
        };
        const started = await init();
      },
      async function mount() {
        await this.initReplicad();
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 3;
        THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);
        const bracket = drawBracket();
        const faces = bracket.mesh();
        const edges = bracket.meshEdges();
        const body = new THREE.BufferGeometry();
        const lines = new THREE.BufferGeometry();
        syncFaces(body, faces);
        syncLines(lines, edges);

        const bodyMaterial = new THREE.MeshNormalMaterial({ flatShading: false });
        const bodyMesh = new THREE.Mesh(body, bodyMaterial);
        scene.add(bodyMesh);

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
        const lineSegments = new THREE.LineSegments(lines, lineMaterial);
        scene.add(lineSegments);

        controls.update();
        const animate = () => {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);

        }
        animate();
      },
    ]
  });

  const craft3d = $.Craft3d.new();
  await craft3d.mount();
}.module({
  name: 'craft3d',
  imports: [base],
}).load();
