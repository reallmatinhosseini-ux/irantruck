/* ==========================================================
   Iran Truck Trading Group — 3D cylinder kit (liner, piston, pin, rings)
   Built procedurally with three.js. Scroll explodes the kit,
   the mouse turns it. Falls back to the product photo when
   WebGL or motion is unavailable.
   ========================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const section = document.querySelector(".kit3d");
const stage = section?.querySelector(".kit3d__stage");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function supportsWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}

if (section && stage && !reduced && supportsWebGL()) {
  section.classList.add("is-3d");
  build();
}

function build() {
  /* ---------- renderer, scene, camera ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.2, 11);
  camera.lookAt(0, 0.2, 0);

  // light: cool key from the left, brand-blue rim, soft warm fill
  const key = new THREE.DirectionalLight(0xdfe8ff, 2.2); key.position.set(-5, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x3d6bff, 3.2); rim.position.set(6, 2, -6); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffe2c4, 0.6); fill.position.set(4, -3, 5); scene.add(fill);

  /* ---------- materials ---------- */
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xd9dde4, metalness: 1, roughness: 0.22, clearcoat: 0.4, clearcoatRoughness: 0.2 });
  const darkSteel = new THREE.MeshPhysicalMaterial({ color: 0x8b9099, metalness: 1, roughness: 0.32 });
  const bronze = new THREE.MeshPhysicalMaterial({ color: 0x6a5240, metalness: 0.95, roughness: 0.38, side: THREE.DoubleSide });
  const pistonMat = steel.clone(); pistonMat.side = THREE.DoubleSide;
  const ringMat = new THREE.MeshPhysicalMaterial({ color: 0x9aa0aa, metalness: 1, roughness: 0.18 });

  const kit = new THREE.Group();
  scene.add(kit);
  const lathe = (pts, mat, seg = 96) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);

  /* ---------- cylinder liner: thin wall with a top flange ---------- */
  const liner = lathe([
    [0.98, -1.55], [1.06, -1.55], [1.06, 0.95], [1.12, 0.98], [1.12, 1.12], [0.98, 1.12], [0.98, -1.55],
  ], bronze);
  kit.add(liner);

  /* ---------- piston: crown with combustion bowl, ring lands, skirt ---------- */
  const R = 0.95;
  const piston = new THREE.Group();
  const body = lathe([
    [0.0, 0.62], [0.32, 0.62], [0.42, 0.7], [0.5, 0.84], [R, 0.84],          // crown with bowl
    [R, 0.76], [0.9, 0.76], [0.9, 0.7], [R, 0.7],                             // top ring groove
    [R, 0.62], [0.9, 0.62], [0.9, 0.56], [R, 0.56],                           // second groove
    [R, 0.48], [0.9, 0.48], [0.9, 0.4], [R, 0.4],                             // oil ring groove
    [R, -0.62], [0.9, -0.66], [0.84, -0.66], [0.84, 0.2], [0.0, 0.2],          // hollow skirt
  ], pistonMat);
  piston.add(body);
  // pin bosses — subtle darker bands where the pin passes through
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 2.0, 48), darkSteel);
  boss.rotation.z = Math.PI / 2; boss.position.y = -0.12; boss.scale.set(1, 0.98, 1);
  piston.add(boss);
  kit.add(piston);

  /* ---------- piston pin ---------- */
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.9, 48, 1, true), steel);
  pin.rotation.z = Math.PI / 2;
  const pinCapGeo = new THREE.RingGeometry(0.1, 0.2, 48);
  [-0.95, 0.95].forEach((x) => { const c = new THREE.Mesh(pinCapGeo, darkSteel); c.position.y = x; c.rotation.x = Math.PI / 2; pin.add(c); });
  kit.add(pin);

  /* ---------- piston rings: two compression, one oil-control ---------- */
  const rings = [0.8, 0.66, 0.52].map((y, i) => {
    const g = new THREE.TorusGeometry(R + 0.005, i === 2 ? 0.045 : 0.032, 16, 160, Math.PI * 2 - 0.08); // small end gap
    const m = new THREE.Mesh(g, ringMat);
    m.rotation.x = Math.PI / 2;
    m.scale.z = i === 2 ? 1.7 : 1.3;
    m.userData.y = y;
    kit.add(m);
    return m;
  });

  /* ---------- exploded-view choreography ---------- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp = (v) => Math.min(1, Math.max(0, v));
  let progress = 0;           // 0 = assembled, 1 = fully exploded (from scroll)
  let smooth = 0;

  function pose(p) {
    const a = ease(clamp(p / 0.6));               // piston leaves the liner
    const b = ease(clamp((p - 0.25) / 0.55));     // rings lift off, pin slides out
    liner.position.y = lerp(0, -1.35, a);
    piston.position.y = lerp(0, 1.05, a);
    pin.position.set(lerp(0, 2.15, b), piston.position.y - 0.12, 0);
    rings.forEach((r, i) => { r.position.y = piston.position.y + r.userData.y + lerp(0, 0.95 + i * 0.42, b); });
  }

  /* ---------- labels follow their parts ---------- */
  const labels = [...section.querySelectorAll("[data-part]")];
  // anchors live in world space (they don't spin with the kit); labels sit just
  // outside each part's silhouette — liner & piston on the left, pin & rings on the right
  const parts = { liner: [liner, -1, -0.7], piston: [piston, -1, 0.1], pin: [pin, 1, 0], rings: [rings[1], 1, 0] };
  const v = new THREE.Vector3(), c = new THREE.Vector3(), e = new THREE.Vector3();
  function placeLabels() {
    const w = stage.clientWidth, h = stage.clientHeight;
    labels.forEach((el) => {
      const key = el.dataset.part;
      let [obj, side, dy] = parts[key];
      if (key === "pin") {
        // follow whichever end of the pin is further from the piston on screen
        piston.getWorldPosition(c).project(camera);
        const a = pin.localToWorld(e.set(0, 1.0, 0)).clone().project(camera);
        const b = pin.localToWorld(e.set(0, -1.0, 0)).project(camera);
        v.copy(Math.abs(a.x - c.x) > Math.abs(b.x - c.x) ? a : b);
        side = v.x >= c.x ? 1 : -1;
      } else {
        obj.getWorldPosition(c); c.y += dy;
        e.copy(c); e.x += side * 1.2;
        v.copy(e).project(camera);
      }
      const lw = el.offsetWidth || 120;
      let x = (v.x * 0.5 + 0.5) * w + side * 18;
      x = side < 0 ? Math.max(lw + 8, x) : Math.min(w - lw - 8, x);          // never leave the stage
      const y = Math.min(h - 16, Math.max(16, (-v.y * 0.5 + 0.5) * h));
      el.style.transform = `translate(${x}px, ${y}px) translate(${side < 0 ? "-100%" : "0"}, -50%)`;
      el.classList.toggle("is-left", side < 0);
      el.classList.toggle("is-on", smooth > (key === "liner" || key === "piston" ? 0.3 : 0.55));
    });
  }

  /* ---------- size, input, render loop ---------- */
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 500 ? 17 : w < 700 ? 14 : 11;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(stage);

  let mx = 0, my = 0, tx = 0, ty = 0;
  section.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 0.8;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 0.35;
  });
  section.addEventListener("pointerleave", () => { tx = 0; ty = 0; });

  // scroll drives the explosion (pinned via GSAP when available)
  if (window.gsap && window.ScrollTrigger) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 921px)", () => {
      ScrollTrigger.create({ trigger: section, start: "top top", end: "+=160%", pin: true, scrub: true, onUpdate: (st) => (progress = st.progress) });
    });
    mm.add("(max-width: 920px)", () => {
      ScrollTrigger.create({ trigger: section, start: "top 70%", end: "bottom 30%", scrub: true, onUpdate: (st) => (progress = st.progress) });
    });
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  } else {
    progress = 0.7;
  }

  let visible = false, raf = 0, spin = 0;
  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    smooth += (progress - smooth) * Math.min(1, dt * 6);
    mx += (tx - mx) * Math.min(1, dt * 4);
    my += (ty - my) * Math.min(1, dt * 4);
    spin = -0.35 + Math.sin(clock.elapsedTime * 0.35) * 0.45;   // slow sway, keeps the pin side-on
    kit.rotation.set(0.28 + my, spin + mx, 0);
    kit.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.04;
    pose(smooth);
    renderer.render(scene, camera);
    placeLabels();
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) { clock.getDelta(); raf = requestAnimationFrame(frame); }
  }, { rootMargin: "200px" }).observe(section);
}
