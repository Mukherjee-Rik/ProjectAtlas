'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * A plated dish, lit like food photography.
 *
 * Design notes, because the choices here are deliberate:
 *
 *  - Naturalistic, not neon. The dish is the only warm thing on an otherwise
 *    near-black page, which is what makes it a focal point. No emissive
 *    materials, no coloured rim lights, no wireframes, no particles.
 *  - Image-based lighting comes from three's RoomEnvironment, which builds a
 *    soft studio env map procedurally — no HDR asset to ship. That's what
 *    gives the sauce and glaze a real specular response instead of the flat
 *    clay look you get from point lights alone.
 *  - Geometry is seeded, not random, so the plating is identical on every
 *    load. A designer wants a fixed composition, and it makes the render
 *    verifiable.
 *  - Motion is a slow drift (a full turn takes ~80s) plus a shallow bob. A
 *    turntable spin would read as a 3D model viewer; this reads as a held
 *    shot.
 *
 * three.js is imported dynamically so its ~600KB stays out of the initial
 * bundle and the hero text paints immediately.
 */

/** Deterministic PRNG (mulberry32) so the plating never shifts between loads. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Status = 'loading' | 'ready' | 'unsupported';

export function PlatedDishScene({ className = '' }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      // Probed inside the async body rather than the effect body: setting
      // state synchronously during an effect triggers a cascading render.
      const probeCanvas = document.createElement('canvas');
      const hasWebGL = !!(
        probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl')
      );
      if (!hasWebGL) {
        if (!disposed) setStatus('unsupported');
        return;
      }

      // Only now is it worth pulling ~600KB of three over the wire.
      const THREE = await import('three');
      const { RoomEnvironment } = await import(
        'three/addons/environments/RoomEnvironment.js'
      );
      if (disposed || !mountRef.current) return;

      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      /* ── Renderer ─────────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power', // integrated GPUs are the common case
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      // Neutral, not ACES. The filmic curve desaturates and darkens deep reds,
      // which is exactly where the curry lives (#a8390c) — it came out muddy
      // brown. Neutral rolls off highlights without shifting hue.
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      // PCFSoftShadowMap is deprecated in three 0.185; PCF plus a shadow
      // radius gives the same softness without the warning.
      renderer.shadowMap.type = THREE.PCFShadowMap;
      container.appendChild(renderer.domElement);
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';

      const scene = new THREE.Scene();

      // Plate is 2.4 units across. At fov 32 the visible width is
      // 2*d*tan(16°), so d = 2.4/0.85/0.5734 ≈ 4.9 puts the rim at ~85% of
      // frame width with margin to spare. Elevation is 24° rather than
      // straight down, which shows the height of the rice and naan instead of
      // flattening everything into a disc.
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 2.0, 4.5);
      camera.lookAt(0, 0.12, 0);

      /* ── Image-based lighting, generated not downloaded ───────────── */
      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envMap = pmrem.fromScene(roomEnv, 0.04).texture;
      scene.environment = envMap;
      scene.environmentIntensity = 0.32; // present, but not the main light
      roomEnv.dispose?.();
      pmrem.dispose();

      /* ── Key + fill. Two lights, both white-ish. ──────────────────── */
      const key = new THREE.DirectionalLight(0xfff2e0, 2.4);
      key.position.set(-2.6, 4.2, 2.4);
      key.castShadow = true;
      key.shadow.mapSize.set(512, 512);
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 12;
      key.shadow.camera.left = -3;
      key.shadow.camera.right = 3;
      key.shadow.camera.top = 3;
      key.shadow.camera.bottom = -3;
      key.shadow.bias = -0.0015;
      key.shadow.radius = 3;
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xb6c8d8, 0.32);
      fill.position.set(3.1, 1.4, -2.2);
      scene.add(fill);

      /* ── The group everything hangs off, for drift + parallax ─────── */
      const dish = new THREE.Group();
      scene.add(dish);

      const geos: import('three').BufferGeometry[] = [];
      const mats: import('three').Material[] = [];
      const track = <T extends { geometry?: unknown; material?: unknown }>(m: T) => {
        if (m.geometry) geos.push(m.geometry as import('three').BufferGeometry);
        if (m.material) mats.push(m.material as import('three').Material);
        return m;
      };

      // Seeded so the plating, the char spots and the grain scatter are
      // identical on every load. A dish that reshuffles itself each refresh
      // is not a design, and it would break pixel verification.
      const rnd = seeded(20260824);

      /* ── Procedural texture maps ──────────────────────────────────────
         No image assets ship with this project, so every map is painted into
         a canvas at runtime. This matters more than geometry: uniform
         roughness across a whole surface is the single loudest "this is CG"
         tell, because real food never has an even sheen. Breaking the
         specular up with a mottle map does more for believability than any
         extra polygons would. */
      const textures: import('three').Texture[] = [];

      /** Blank canvas + 2D context at a given square size. */
      const canvas2d = (size: number) => {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        return { c, ctx: c.getContext('2d')! };
      };

      const asTexture = (c: HTMLCanvasElement, repeat = 1) => {
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(repeat, repeat);
        t.colorSpace = THREE.NoColorSpace; // data maps, not colour
        textures.push(t);
        return t;
      };

      /** Soft blotches — used for roughness variation on most surfaces. */
      const mottleMap = (size: number, blobs: number, base: number, spread: number) => {
        const { c, ctx } = canvas2d(size);
        ctx.fillStyle = `rgb(${base},${base},${base})`;
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < blobs; i++) {
          const x = rnd() * size;
          const y = rnd() * size;
          const r = size * (0.03 + rnd() * 0.12);
          const v = Math.max(0, Math.min(255, base + (rnd() - 0.5) * spread * 2));
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(${v},${v},${v},0.85)`);
          g.addColorStop(1, `rgba(${v},${v},${v},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        return c;
      };

      /* Naan: scorch marks and blistering from the tandoor, plus flour dust.
         Doubles as the bump map — char sits in the low spots, blisters raised. */
      const naanCanvas = (() => {
        const size = 512;
        const { c, ctx } = canvas2d(size);
        ctx.fillStyle = '#d8a86a';
        ctx.fillRect(0, 0, size, size);
        // Uneven bake tone.
        for (let i = 0; i < 90; i++) {
          const x = rnd() * size, y = rnd() * size, r = size * (0.04 + rnd() * 0.10);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(150,96,38,${0.10 + rnd() * 0.18})`);
          g.addColorStop(1, 'rgba(150,96,38,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        // Char spots where the dough touched the oven wall.
        for (let i = 0; i < 44; i++) {
          const x = rnd() * size, y = rnd() * size, r = size * (0.008 + rnd() * 0.030);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(48,26,10,${0.55 + rnd() * 0.4})`);
          g.addColorStop(0.6, 'rgba(90,52,20,0.35)');
          g.addColorStop(1, 'rgba(90,52,20,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        // Flour dusting.
        for (let i = 0; i < 500; i++) {
          ctx.fillStyle = `rgba(255,250,235,${0.05 + rnd() * 0.18})`;
          ctx.beginPath();
          ctx.arc(rnd() * size, rnd() * size, rnd() * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        return c;
      })();

      /* Sauce: whole spices and oil pooling. Read as a roughness map so the
         oil slicks stay glossy while the body of the curry is duller. */
      const sauceRough = (() => {
        const size = 512;
        const { c, ctx } = canvas2d(size);
        ctx.fillStyle = 'rgb(60,60,60)'; // fairly glossy overall
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 70; i++) { // oil slicks: glossier still
          const x = rnd() * size, y = rnd() * size, r = size * (0.02 + rnd() * 0.09);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(14,14,14,0.9)');
          g.addColorStop(1, 'rgba(14,14,14,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        for (let i = 0; i < 240; i++) { // spice grit: matte
          ctx.fillStyle = `rgba(190,190,190,${0.3 + rnd() * 0.5})`;
          ctx.beginPath();
          ctx.arc(rnd() * size, rnd() * size, 0.8 + rnd() * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        return c;
      })();

      const naanTex = new THREE.CanvasTexture(naanCanvas);
      naanTex.colorSpace = THREE.SRGBColorSpace;
      textures.push(naanTex);
      const naanBump = asTexture(naanCanvas);
      const sauceRoughTex = asTexture(sauceRough);
      const plateRoughTex = asTexture(mottleMap(256, 40, 70, 26));

      /* ── Plate: a lathed profile, glazed ceramic ──────────────────── */
      // Profile runs across the top face out to the rim, over the edge, then
      // back underneath, so the plate is a closed solid rather than a shell.
      // Rim at 1.2, not 1.5. A wider plate left the food reading as a garnish
      // on an empty dish; tightening it makes the food the subject.
      const plateProfile = [
        [0.0, 0.0],
        [0.69, 0.024],
        [0.91, 0.098],
        [1.07, 0.2],
        [1.16, 0.255],
        [1.2, 0.257],
        [1.2, 0.223],
        [1.05, 0.155],
        [0.8, 0.053],
        [0.48, -0.015],
        [0.0, -0.034],
      ].map(([x, y]) => new THREE.Vector2(x, y));

      const plateGeo = new THREE.LatheGeometry(plateProfile, 96);
      const plateMat = new THREE.MeshPhysicalMaterial({
        color: 0xe8e2d6,
        roughness: 0.28,
        roughnessMap: plateRoughTex, // glaze is never perfectly even
        metalness: 0.0,
        clearcoat: 0.55, // the glaze
        clearcoatRoughness: 0.16,
      });
      const plate = track(new THREE.Mesh(plateGeo, plateMat));
      plate.castShadow = true;
      plate.receiveShadow = true;
      dish.add(plate);

      /* ── Curry: a sunken dome so only the meniscus shows ──────────── */
      const curryGeo = new THREE.SphereGeometry(0.78, 48, 32);
      const curryMat = new THREE.MeshPhysicalMaterial({
        color: 0xa8390c,
        roughness: 0.19,
        roughnessMap: sauceRoughTex, // oil slicks gloss, spice grit dulls
        metalness: 0.0,
        clearcoat: 0.9, // wet-looking sauce is the strongest appetite cue
        clearcoatRoughness: 0.1,
      });
      const curry = track(new THREE.Mesh(curryGeo, curryMat));
      curry.scale.set(1.02, 0.2, 1.02);
      curry.position.set(0.12, 0.052, 0.08);
      curry.receiveShadow = true;
      dish.add(curry);

      /* ── Rice: individual grains, not a mound ──────────────────────────
         This is the single biggest gain in the whole scene. A smooth
         displaced sphere reads as clay no matter how well it is lit, because
         rice is legible by its GRAIN — hundreds of small specular highlights
         at scattered angles. One InstancedMesh puts ~420 of them on screen
         for one draw call, which an integrated GPU handles fine.

         Grains are packed into a squashed hemisphere and given a slight
         outward lean near the surface, the way a real spooned mound sits. */
      const GRAINS = 420;
      const grainGeo = new THREE.SphereGeometry(1, 7, 5); // unit; scaled per instance
      const riceMat = new THREE.MeshStandardMaterial({
        color: 0xf6efdd,
        roughness: 0.55, // parboiled rice is slightly waxy, not chalky
        metalness: 0.0,
      });
      geos.push(grainGeo);
      mats.push(riceMat);

      const riceMound = new THREE.InstancedMesh(grainGeo, riceMat, GRAINS);
      riceMound.castShadow = true;
      riceMound.receiveShadow = true;
      {
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const e = new THREE.Euler();
        const pos = new THREE.Vector3();
        const scl = new THREE.Vector3();
        const RX = 0.46, RY = 0.30, RZ = 0.40; // mound radii
        for (let i = 0; i < GRAINS; i++) {
          // Cube-root keeps the packing even instead of clustering at the core.
          const t = Math.cbrt(rnd());
          const theta = rnd() * Math.PI * 2;
          const phi = Math.acos(rnd()); // upper half only
          const sx = Math.sin(phi) * Math.cos(theta);
          const sy = Math.cos(phi);
          const sz = Math.sin(phi) * Math.sin(theta);
          pos.set(sx * RX * t, sy * RY * t, sz * RZ * t);
          // Grains near the surface tip outward; buried ones sit any which way.
          e.set(
            rnd() * Math.PI,
            rnd() * Math.PI * 2,
            (rnd() - 0.5) * Math.PI * (0.3 + t * 0.7)
          );
          q.setFromEuler(e);
          const len = 0.030 + rnd() * 0.014; // a grain is ~3x longer than wide
          scl.set(len * 0.34, len * 0.34, len);
          m.compose(pos, q, scl);
          riceMound.setMatrixAt(i, m);
        }
        riceMound.instanceMatrix.needsUpdate = true;
      }
      riceMound.position.set(-0.44, 0.12, 0.1);
      dish.add(riceMound);

      /* ── Paneer: rounded cubes, each rotated differently ──────────── */
      const paneerMat = new THREE.MeshStandardMaterial({
        color: 0xf7f0e2,
        roughness: 0.62,
        metalness: 0.0,
      });
      mats.push(paneerMat);
      // y sits on the curry's dome, not in it. The sauce surface is at
      // 0.052 + 0.156*sqrt(1-(r/0.795)^2) for radius r from the curry centre,
      // which lands near 0.20 here; add half a cube's height on top.
      const paneerPlaces: [number, number, number][] = [
        [0.06, 0.275, 0.26],
        [0.38, 0.272, -0.02],
        [-0.04, 0.272, -0.14],
      ];
      paneerPlaces.forEach(([x, y, z], i) => {
        const s = 0.19 + rnd() * 0.05;
        // Segmented so the corners can be knocked off. A mathematically
        // perfect cube is an instant CG tell — hand-cut paneer has rounded,
        // slightly uneven faces and no two pieces match.
        const g = new THREE.BoxGeometry(s, s * 0.72, s, 4, 4, 4);
        const p = g.attributes.position;
        const v = new THREE.Vector3();
        for (let k = 0; k < p.count; k++) {
          v.fromBufferAttribute(p, k);
          // Pull vertices toward the centre proportional to how far out they
          // are — rounds edges and corners most, faces least.
          const soften = 0.88 + rnd() * 0.06;
          v.multiplyScalar(soften);
          v.x += (rnd() - 0.5) * s * 0.06;
          v.y += (rnd() - 0.5) * s * 0.05;
          v.z += (rnd() - 0.5) * s * 0.06;
          p.setXYZ(k, v.x, v.y, v.z);
        }
        g.computeVertexNormals();
        geos.push(g);
        const chunk = new THREE.Mesh(g, paneerMat);
        chunk.position.set(x, y, z);
        chunk.rotation.set(rnd() * 0.5, rnd() * Math.PI, rnd() * 0.35);
        chunk.castShadow = true;
        chunk.receiveShadow = true;
        dish.add(chunk);
        void i;
      });

      /* ── Naan: an extruded irregular oval, leaning on the rim ─────── */
      const naanShape = new THREE.Shape();
      {
        const pts: import('three').Vector2[] = [];
        const steps = 26;
        for (let i = 0; i < steps; i++) {
          const t = (i / steps) * Math.PI * 2;
          // Teardrop-ish: wider at one end, with a little edge wobble.
          const rad = 0.5 * (1 + 0.34 * Math.cos(t)) * (1 + (rnd() - 0.5) * 0.07);
          pts.push(new THREE.Vector2(Math.cos(t) * rad, Math.sin(t) * rad * 0.66));
        }
        naanShape.setFromPoints(pts);
      }
      const naanGeo = new THREE.ExtrudeGeometry(naanShape, {
        depth: 0.055,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.035,
        bevelSegments: 3,
        curveSegments: 10,
      });
      naanGeo.center();
      const naanMat = new THREE.MeshStandardMaterial({
        map: naanTex,          // char, blistering, flour
        bumpMap: naanBump,     // same canvas drives the relief
        bumpScale: 0.6,
        roughness: 0.85,
        metalness: 0.0,
      });
      const naan = track(new THREE.Mesh(naanGeo, naanMat));
      naan.rotation.set(-Math.PI / 2 + 0.2, 0, -0.42);
      naan.position.set(0.6, 0.21, -0.36);
      naan.castShadow = true;
      dish.add(naan);

      /* ── Coriander: three small flattened leaves ──────────────────── */
      const herbMat = new THREE.MeshStandardMaterial({
        color: 0x4f7c2a,
        roughness: 0.55,
        metalness: 0.0,
      });
      mats.push(herbMat);
      // Same reasoning as the paneer — these were sunk under the sauce and
      // rendered nothing at all.
      const herbPlaces: [number, number, number][] = [
        [0.26, 0.234, 0.2],
        [-0.06, 0.228, 0.3],
        [0.44, 0.221, 0.24],
      ];
      herbPlaces.forEach(([x, y, z]) => {
        // Was 0.055 and rendered sub-pixel — invisible in the frame.
        const g = new THREE.SphereGeometry(0.085, 12, 8);
        geos.push(g);
        const leaf = new THREE.Mesh(g, herbMat);
        leaf.scale.set(1.5, 0.34, 0.95);
        leaf.position.set(x, y, z);
        leaf.rotation.y = rnd() * Math.PI;
        dish.add(leaf);
      });

      /* ── Contact shadow catcher, so the plate sits on something ───── */
      const groundGeo = new THREE.PlaneGeometry(9, 9);
      const groundMat = new THREE.ShadowMaterial({ opacity: 0.42 });
      const ground = track(new THREE.Mesh(groundGeo, groundMat));
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.041;
      ground.receiveShadow = true;
      scene.add(ground);

      /* ── Sizing ───────────────────────────────────────────────────── */
      const resize = () => {
        const el = mountRef.current;
        if (!el) return;
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();

      const ro = new ResizeObserver(resize);
      ro.observe(container);

      /* ── Pointer parallax, clamped hard so it stays a nudge ───────── */
      let targetY = 0;
      let targetX = 0;
      const onPointer = (e: PointerEvent) => {
        const r = container.getBoundingClientRect();
        const nx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const ny = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        targetY = Math.max(-0.09, Math.min(0.09, nx * 0.22));
        targetX = Math.max(-0.05, Math.min(0.05, ny * 0.12));
      };
      if (!reduceMotion) window.addEventListener('pointermove', onPointer);

      /* ── Render ───────────────────────────────────────────────────── */
      setStatus('ready');

      let raf = 0;
      const baseTilt = 0.03;
      // THREE.Clock is deprecated in 0.185, and performance.now() is all this
      // needs anyway.
      const t0 = performance.now();

      /** Advance to time `t` (seconds) and draw one frame. */
      const drawAt = (t: number) => {
        // Slow drift: a full revolution takes ~80s.
        dish.rotation.y = -0.35 + t * 0.0785;
        // Shallow bob and the parallax nudge, both eased.
        dish.position.y = Math.sin(t * 0.55) * 0.012;
        dish.rotation.x += (baseTilt + targetX - dish.rotation.x) * 0.045;
        dish.rotation.z += (targetY * 0.35 - dish.rotation.z) * 0.045;
        renderer.render(scene, camera);
      };

      if (reduceMotion) {
        // One frame, held. Still composed, just not moving.
        dish.rotation.set(baseTilt, -0.35, 0);
        renderer.render(scene, camera);
      } else {
        const tick = () => {
          raf = requestAnimationFrame(tick);
          drawAt((performance.now() - t0) / 1000);
        };
        tick(); // draw frame zero synchronously, don't wait on rAF
      }

      // Dev-only seam: lets a test force a fresh draw and read the buffer back
      // in the same task, which matters because preserveDrawingBuffer is off
      // and rAF is throttled to zero in a hidden tab.
      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as Record<string, unknown>).__atlasDishProbe = () => {
          drawAt((performance.now() - t0) / 1000);
          return renderer.domElement.toDataURL('image/png');
        };
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        if (process.env.NODE_ENV !== 'production') {
          delete (window as unknown as Record<string, unknown>).__atlasDishProbe;
        }
        ro.disconnect();
        window.removeEventListener('pointermove', onPointer);
        geos.forEach((g) => g.dispose());
        mats.forEach((m) => m.dispose());
        // Canvas textures hold GPU memory too; materials don't free them.
        textures.forEach((t) => t.dispose());
        envMap.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    })().catch(() => {
      if (!disposed) setStatus('unsupported');
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      // Decorative. The headline carries the meaning.
      aria-hidden="true"
      data-scene-status={status}
    />
  );
}
