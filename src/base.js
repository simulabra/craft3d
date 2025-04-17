import { __, base } from 'simulabra';
import opencascade from 'replicad-opencascadejs/src/replicad_single.js';
import opencascadeWasm from 'replicad-opencascadejs/src/replicad_single.wasm';
import { setOC } from 'replicad';
import * as THREE from 'three';
import { syncFaces, syncLines } from "replicad-threejs-helper";
import { drawBracket } from './shelf.js';

export default await async function (_, $) {
  $.Class.new({
    name: 'FirstPersonControls',
    slots: [
      $.Var.new({ name: 'camera', doc: 'The THREE.Camera to control.' }),
      $.Var.new({ name: 'domElement', doc: 'The DOM element for event listeners.' }),
      $.Var.new({ name: 'moveSpeed', default: 50.0, doc: 'Units per second.' }),
      $.Var.new({ name: 'lookSpeed', default: 0.002, doc: 'Radians per pixel.' }),
      $.Var.new({ name: 'isEnabled', default: false }),
      $.Var.new({ name: 'isLocked', default: false }), // Pointer Lock status
      $.Var.new({ name: 'keysPressed', default: () => new Set() }),
      $.Var.new({ name: 'euler', default: () => new THREE.Euler(0, 0, 0, 'ZXY') }),
      $.Var.new({ name: 'vec', default: () => new THREE.Vector3() }),

      $.Method.new({
        name: '_onPointerLockChange',
        do: function _onPointerLockChange() {
          if (document.pointerLockElement === this.domElement()) {
            this.isEnabled(true);
            this.isLocked(true);
          } else {
            this.isEnabled(false);
            this.isLocked(false);
            this.keysPressed().clear();
          }
        }
      }),
      $.Method.new({
        name: '_onPointerLockError',
        do: function _onPointerLockError() {
          console.error('$.FirstPersonControls: PointerLock Error.');
          this.isEnabled(false);
          this.isLocked(false);
        }
      }),
      $.Method.new({
        name: '_onMouseMove',
        do: function _onMouseMove(event) {
          if (!this.isEnabled()) return;
          const movementX = event.movementX || 0;
          const movementY = event.movementY || 0;
          this.euler().y = 0;
          this.euler().z -= movementX * this.lookSpeed();
          this.euler().x -= movementY * this.lookSpeed();
          this.camera().quaternion.setFromEuler(this.euler());
        }
      }),
      $.Method.new({
        name: '_onKeyDown',
        do: function _onKeyDown(event) {
          if (!this.isLocked()) return;
          this.keysPressed().add(event.code);
        }
      }),
      $.Method.new({
        name: '_onKeyUp',
        do: function _onKeyUp(event) {
          this.keysPressed().delete(event.code);
        }
      }),

      $.Method.new({
        name: 'connect',
        do: function connect() {
          this._boundOnMouseMove = this._onMouseMove.bind(this);
          this._boundOnPointerLockChange = this._onPointerLockChange.bind(this);
          this._boundOnPointerLockError = this._onPointerLockError.bind(this);
          this._boundOnKeyDown = this._onKeyDown.bind(this);
          this._boundOnKeyUp = this._onKeyUp.bind(this);

          document.addEventListener('mousemove', this._boundOnMouseMove);
          document.addEventListener('pointerlockchange', this._boundOnPointerLockChange);
          document.addEventListener('pointerlockerror', this._boundOnPointerLockError);
          document.addEventListener('keydown', this._boundOnKeyDown);
          document.addEventListener('keyup', this._boundOnKeyUp);

          this.domElement().addEventListener('click', () => {
            this.domElement().requestPointerLock();
          });
          this._onPointerLockChange(); // Initial check
        }
      }),
      $.Method.new({
        name: 'disconnect',
        do: function disconnect() {
          document.removeEventListener('mousemove', this._boundOnMouseMove);
          document.removeEventListener('pointerlockchange', this._boundOnPointerLockChange);
          document.removeEventListener('pointerlockerror', this._boundOnPointerLockError);
          document.removeEventListener('keydown', this._boundOnKeyDown);
          document.removeEventListener('keyup', this._boundOnKeyUp);
          // Optional: remove click listener
          this.isEnabled(false);
          this.isLocked(false);
        }
      }),
      $.Method.new({
        name: 'update',
        do: function update(deltaTime) {
            if (!this.isEnabled()) return;

            const speed = this.moveSpeed() * deltaTime;
            const keys = this.keysPressed();
            const cam = this.camera();

            const moveDirection = this.vec().set(0, 0, 0);
            let verticalMove = 0;

            if (keys.has('KeyW') || keys.has('ArrowUp')) moveDirection.z -= 1;
            if (keys.has('KeyS') || keys.has('ArrowDown')) moveDirection.z += 1;
            if (keys.has('KeyA') || keys.has('ArrowLeft')) moveDirection.x -= 1;
            if (keys.has('KeyD') || keys.has('ArrowRight')) moveDirection.x += 1;

            if (keys.has('KeyE')) verticalMove += 1;
            if (keys.has('KeyQ')) verticalMove -= 1;

            if (moveDirection.x !== 0 || moveDirection.z !== 0) {
                moveDirection.applyQuaternion(cam.quaternion);
                moveDirection.normalize();
            }

            cam.position.addScaledVector(moveDirection, speed);
            cam.position.z += verticalMove * speed;
        }
      }),
       $.After.new({
        name: 'init',
        do: function init_after() {
          if (!this.camera() || !this.domElement()) {
             throw new Error("FirstPersonControls requires 'camera' and 'domElement' slots to be set.");
          }
          this.camera().rotation.order = this.euler().order;
          this.connect();
        }
      }),
    ]
  });

  $.Class.new({
    name: 'Craft3d',
    slots: [
      $.Var.new({ name: 'loadedWasm', default: false }),
      $.Var.new({ name: 'controls' }),
      $.Var.new({ name: 'clock', default: () => new THREE.Clock() }),

      async function initReplicad() {
        const init = async () => {
          if (this.loadedWasm()) return Promise.resolve(true);
          const OC = await opencascade({ locateFile: () => opencascadeWasm });
          this.loadedWasm(true);
          setOC(OC);
          console.log('loaded wasm');
          return true;
        };
        await init();
      },

      async function mount() {
        await this.initReplicad();
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, -100, 50); // Start further back and slightly up
        camera.lookAt(0, 0, 0); // Look towards origin initially
        THREE.Object3D.DEFAULT_UP.set(0, 0, 1); // IMPORTANT: Keep Z as up

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        this.controls($.FirstPersonControls.new({
          camera: camera,
          domElement: renderer.domElement,
          moveSpeed: 50,
        }));

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

        const axesHelper = new THREE.AxesHelper(50);
        scene.add(axesHelper);

        const animate = () => {
          requestAnimationFrame(animate);
          const deltaTime = this.clock().getDelta();
          this.controls().update(deltaTime);
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

