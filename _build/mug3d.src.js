// NevervoidStore 360° mug viewer: the exact Printrove print file wrapped on an 11oz mug (8.5" x 3.8" print area).
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const R = 1.6, H = 3.9, WALL = 0.11, PRINT_W = 8.5, PRINT_H = 3.8;
const ARC = PRINT_W / R;                       // radians covered by the print
const HANDLE = Math.PI / 2;                    // handle on +X (screen right at rotation 0)

export function mount(el, url, start = 0, onSide) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.95;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.32;
  const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-5, 4, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45); fill.position.set(6, 1, 2); scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfcfcf, 0.25));
  const cam = new THREE.PerspectiveCamera(20, 1, 0.1, 100);
  cam.position.set(0, 3.1, 17.2); cam.lookAt(0.8, -0.2, 0);

  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.08 });
  const inner = ceramic.clone(); inner.side = THREE.BackSide;
  const mug = new THREE.Group(); scene.add(mug);
  mug.add(new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.985, H, 160, 1, true), ceramic));
  const inWall = new THREE.Mesh(new THREE.CylinderGeometry(R - WALL, R - WALL, H - 0.02, 160, 1, true), inner); mug.add(inWall);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R - WALL / 2, WALL / 2, 16, 160), ceramic); rim.rotation.x = Math.PI / 2; rim.position.y = H / 2; mug.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R - WALL, 96), ceramic); floor.rotation.x = -Math.PI / 2; floor.position.y = -H / 2 + 0.3; mug.add(floor);
  const base = new THREE.Mesh(new THREE.CircleGeometry(R * 0.985, 96), ceramic); base.rotation.x = Math.PI / 2; base.position.y = -H / 2; mug.add(base);
  // handle: one tube that leaves the wall and returns into it (ends hidden inside the body), shaped like the Printrove photo
  const P = (x, y) => new THREE.Vector3(R + x, y, 0);
  const path = new THREE.CatmullRomCurve3([P(-0.25, 1.38), P(0.15, 1.42), P(0.75, 1.36), P(1.22, 1.02), P(1.44, 0.35),
    P(1.36, -0.32), P(1.02, -0.82), P(0.5, -1.04), P(0.1, -1.07), P(-0.25, -1.06)], false, "centripetal");
  const handle = new THREE.Mesh(new THREE.TubeGeometry(path, 220, 0.185, 28, false), ceramic);
  handle.scale.z = 0.82; mug.add(handle);
  // a soft fillet where the handle meets the wall
  for (const y of [1.39, -1.065]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16), ceramic); f.position.set(R - 0.02, y, 0); f.scale.set(0.55, 1, 0.82); mug.add(f); }

  // print band: three's cylinder uv.u grows with theta (x = r sin t, z = r cos t), so the image reads left to right
  const t0a = HANDLE + (2 * Math.PI - ARC) / 2;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.002, R * 1.002 - 0.015 * PRINT_H / H, PRINT_H, 320, 1, true, t0a, ARC),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.08, transparent: true }));
  mug.add(band);
  new THREE.TextureLoader().load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); band.material.map = t; band.material.needsUpdate = true; el.classList.add("ready"); intro(); });

  // soft contact shadow
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128); grd.addColorStop(0, "rgba(0,0,0,.38)"); grd.addColorStop(.45, "rgba(0,0,0,.14)"); grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.set(0.5, -H / 2 - 0.001, 0); scene.add(sh);

  // gentle automatic swing around the design side, handle mostly turned away; a drag nudges it, then the swing resumes
  // sweep the whole print: rot 0 = handle right (side facing a right-handed drinker), PI/2 = handle behind (centre of the print), PI = handle left (side facing the person opposite)
  const centre = Math.PI / 2, AMP = Math.PI / 2 - 0.14, PERIOD = 11000, LIMIT = Math.PI / 2 + 0.2;
  const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let rot = start ? Math.PI - 0.14 : 0.14, drag = false, lastX = 0, resumeAt = 0, phase = 0, prev = 0, visible = true, running = false, ready = false, side = -1;
  phase = start ? Math.PI / 2 : -Math.PI / 2;
  function size() { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  function draw() { const tx = 0.8 * Math.cos(rot); cam.position.x = tx; cam.lookAt(tx, -0.2, 0); report(); mug.rotation.y = rot; sh.position.x = 0.5 * Math.cos(rot); sh.position.z = -0.5 * Math.sin(rot); renderer.render(scene, cam); }
  function report() { if (!onSide) return; const f = rot / Math.PI, k = f < 0.3 ? 0 : f > 0.7 ? 2 : 1; if (k !== side) { side = k; onSide(k); } }
  function tick(now) {
    if (!visible || still || !ready) { running = false; return; }
    const dt = Math.min(64, now - (prev || now)); prev = now;
    if (!drag && now > resumeAt) {
      phase += dt / PERIOD * 2 * Math.PI;
      const target = centre + AMP * Math.max(-1, Math.min(1, 1.18 * Math.sin(phase)));   // short pause at each side
      rot += (target - rot) * Math.min(1, dt / 220);      // eases back into the swing after a nudge
      draw();
    }
    requestAnimationFrame(tick);
  }
  function run() { if (!running && visible && !still && ready) { running = true; prev = 0; requestAnimationFrame(tick); } }
  const cv = renderer.domElement; cv.style.touchAction = "pan-y"; cv.style.cursor = "grab";
  cv.addEventListener("pointerdown", e => { drag = true; lastX = e.clientX; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; el.classList.add("touched"); });
  cv.addEventListener("pointermove", e => { if (!drag) return; rot = Math.max(centre - LIMIT, Math.min(centre + LIMIT, rot + (e.clientX - lastX) * 0.009)); lastX = e.clientX; draw(); });
  const up = () => { if (!drag) return; drag = false; cv.style.cursor = "grab"; resumeAt = performance.now() + 1800;
    phase = Math.asin(Math.max(-1, Math.min(1, (rot - centre) / AMP / 1.18))); };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  new ResizeObserver(() => { size(); draw(); }).observe(el);
  new IntersectionObserver(es => { visible = es[0].isIntersecting && !el.hidden; run(); }).observe(el);
  function intro() { ready = true; draw(); run(); }
  size(); draw();
  return { set(a) { rot = a; draw(); }, get: () => rot, centre, wake() { visible = !el.hidden; run(); } };
}
