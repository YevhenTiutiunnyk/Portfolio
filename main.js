/* =====================================================
   Atelier — 3D architectural gallery portfolio
   Three.js scene + Lenis smooth scroll + GSAP reveals
   ===================================================== */

(() => {
  const COLOR_INK = 0x111111;
  const COLOR_INK_SOFT = 0x4a4a4a;
  const COLOR_RULE = 0xb5afa3;
  const COLOR_BG = 0xefece6;
  const COLOR_ACCENT = 0xff4d1c;

  /* ---------- Renderer / scene / camera ---------- */
  const canvas = document.getElementById('scene');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLOR_BG);
  scene.fog = new THREE.Fog(COLOR_BG, 22, 80);

  const camera = new THREE.PerspectiveCamera(
    42, window.innerWidth / window.innerHeight, 0.1, 300
  );
  camera.position.set(0, 1.7, 12);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  /* ---------- Materials ---------- */
  const inkMat = new THREE.LineBasicMaterial({ color: COLOR_INK, transparent: true, opacity: 0.9 });
  const inkSoftMat = new THREE.LineBasicMaterial({ color: COLOR_INK_SOFT, transparent: true, opacity: 0.4 });
  const ruleMat = new THREE.LineBasicMaterial({ color: COLOR_RULE, transparent: true, opacity: 0.6 });
  const accentMat = new THREE.LineBasicMaterial({ color: COLOR_ACCENT });

  /* ---------- Gallery: long corridor with periodic arches ---------- */
  const Z_START = 10;
  const Z_END = -130;
  const WALL_X = 8;
  const WALL_Y = 6;

  // Floor grid
  const grid = new THREE.GridHelper(180, 36, COLOR_INK_SOFT, COLOR_RULE);
  grid.position.set(0, 0, (Z_START + Z_END) / 2);
  if (grid.material) {
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
  }
  scene.add(grid);

  // Continuous top rails along both walls
  const railL = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-WALL_X, WALL_Y, Z_START),
    new THREE.Vector3(-WALL_X, WALL_Y, Z_END),
  ]);
  const railR = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(WALL_X, WALL_Y, Z_START),
    new THREE.Vector3(WALL_X, WALL_Y, Z_END),
  ]);
  scene.add(new THREE.Line(railL, inkMat));
  scene.add(new THREE.Line(railR, inkMat));

  // Floor edge lines
  const floorEdgeL = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-WALL_X, 0, Z_START),
    new THREE.Vector3(-WALL_X, 0, Z_END),
  ]);
  const floorEdgeR = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(WALL_X, 0, Z_START),
    new THREE.Vector3(WALL_X, 0, Z_END),
  ]);
  scene.add(new THREE.Line(floorEdgeL, ruleMat));
  scene.add(new THREE.Line(floorEdgeR, ruleMat));

  // Pillars every 5 units, archway beams every 10
  for (let z = Z_START; z >= Z_END; z -= 5) {
    const pillarL = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-WALL_X, 0, z),
      new THREE.Vector3(-WALL_X, WALL_Y, z),
    ]);
    const pillarR = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(WALL_X, 0, z),
      new THREE.Vector3(WALL_X, WALL_Y, z),
    ]);
    scene.add(new THREE.Line(pillarL, inkSoftMat));
    scene.add(new THREE.Line(pillarR, inkSoftMat));

    if (z % 10 === 0) {
      const beam = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-WALL_X, WALL_Y, z),
        new THREE.Vector3(WALL_X, WALL_Y, z),
      ]);
      scene.add(new THREE.Line(beam, inkMat));

      // Floor crossbeam to mark room threshold
      const floorBeam = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-WALL_X, 0, z),
        new THREE.Vector3(WALL_X, 0, z),
      ]);
      scene.add(new THREE.Line(floorBeam, ruleMat));
    }
  }

  /* ---------- Sculptures (rotating wireframe artifacts) ---------- */
  const sculptures = [];

  const wire = (geo, color = COLOR_INK) =>
    new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color })
    );

  // ROOM I — Atrium centerpiece (z = 0)
  const atrium = new THREE.Group();
  const ico = wire(new THREE.IcosahedronGeometry(2.3, 1));
  const knot = wire(new THREE.TorusKnotGeometry(1.25, 0.32, 80, 10), COLOR_ACCENT);
  atrium.add(ico);
  atrium.add(knot);
  atrium.position.set(0, 2.7, 0);
  scene.add(atrium);
  sculptures.push({ obj: ico, axis: 'y', speed: 0.18 });
  sculptures.push({ obj: ico, axis: 'x', speed: 0.07 });
  sculptures.push({ obj: knot, axis: 'y', speed: -0.4 });
  sculptures.push({ obj: knot, axis: 'z', speed: 0.25 });

  // ROOM II — About: alternating stat plinths along corridor
  const aboutZs = [-15, -22, -29];
  const aboutGeos = [
    new THREE.OctahedronGeometry(0.85, 0),
    new THREE.TetrahedronGeometry(1.0, 0),
    new THREE.DodecahedronGeometry(0.8, 0),
  ];
  aboutZs.forEach((z, i) => {
    const x = i % 2 === 0 ? -3.8 : 3.8;
    // Plinth box
    const plinth = wire(new THREE.BoxGeometry(1.5, 1.6, 1.5));
    plinth.position.set(x, 0.8, z);
    scene.add(plinth);
    // Floating shape on top
    const shape = wire(aboutGeos[i]);
    shape.position.set(x, 2.7, z);
    scene.add(shape);
    sculptures.push({ obj: shape, axis: 'y', speed: 0.32 + i * 0.1 });
    sculptures.push({ obj: shape, axis: 'x', speed: 0.12 });
  });

  // ROOM III — Skills: three pedestals with discipline artifacts
  const skillRoom = [
    { z: -50, x: -4.5, geo: new THREE.TorusGeometry(1.05, 0.32, 10, 28), color: COLOR_INK },
    { z: -55, x: 0,    geo: new THREE.IcosahedronGeometry(1.3, 0),       color: COLOR_INK },
    { z: -60, x: 4.5,  geo: new THREE.OctahedronGeometry(1.3, 0),        color: COLOR_INK },
  ];
  skillRoom.forEach((d, i) => {
    const ped = wire(new THREE.CylinderGeometry(0.75, 0.95, 1.6, 14));
    ped.position.set(d.x, 0.8, d.z);
    scene.add(ped);
    const artifact = wire(d.geo, d.color);
    artifact.position.set(d.x, 2.85, d.z);
    scene.add(artifact);
    sculptures.push({ obj: artifact, axis: 'y', speed: 0.4 - i * 0.08 });
    sculptures.push({ obj: artifact, axis: 'z', speed: 0.15 });
  });

  // Accent ribbon connecting the three pedestals
  const ribbonPts = [
    new THREE.Vector3(-4.5, 4.4, -50),
    new THREE.Vector3(0,    4.7, -55),
    new THREE.Vector3(4.5,  4.4, -60),
  ];
  const ribbon = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ribbonPts),
    accentMat
  );
  scene.add(ribbon);

  // ROOM IV — Projects: four alcove exhibits
  const projectRoom = [
    { z: -78,  x: -5, geo: new THREE.BoxGeometry(1.7, 1.7, 1.7),                   color: COLOR_INK },
    { z: -86,  x: 5,  geo: new THREE.SphereGeometry(1.05, 16, 10),                 color: COLOR_INK },
    { z: -94,  x: -5, geo: new THREE.ConeGeometry(1.15, 1.9, 10),                  color: COLOR_ACCENT },
    { z: -102, x: 5,  geo: new THREE.TorusKnotGeometry(0.85, 0.26, 56, 8),         color: COLOR_INK },
  ];
  projectRoom.forEach((d, i) => {
    const plinth = wire(new THREE.BoxGeometry(2.2, 0.9, 2.2));
    plinth.position.set(d.x, 0.45, d.z);
    scene.add(plinth);
    const exhibit = wire(d.geo, d.color);
    exhibit.position.set(d.x, 2.05, d.z);
    scene.add(exhibit);
    sculptures.push({ obj: exhibit, axis: 'y', speed: 0.28 + i * 0.06 });
    sculptures.push({ obj: exhibit, axis: 'x', speed: 0.1 - i * 0.02 });
  });

  // ROOM V — Contact: nested gateway rings
  const gateway = new THREE.Group();
  const ringOuter = wire(new THREE.TorusGeometry(2.6, 0.06, 6, 80));
  const ringInner = wire(new THREE.TorusGeometry(1.7, 0.06, 6, 80), COLOR_ACCENT);
  const ringTiny  = wire(new THREE.TorusGeometry(0.9, 0.04, 6, 64));
  gateway.add(ringOuter);
  gateway.add(ringInner);
  gateway.add(ringTiny);
  gateway.position.set(0, 2.9, -122);
  scene.add(gateway);
  sculptures.push({ obj: ringOuter, axis: 'z', speed: 0.22 });
  sculptures.push({ obj: ringInner, axis: 'z', speed: -0.42 });
  sculptures.push({ obj: ringTiny,  axis: 'z', speed: 0.7 });

  /* ---------- Camera path along corridor ---------- */
  const cameraPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,    1.7, 10),
    new THREE.Vector3(0,    1.7, 4),
    new THREE.Vector3(0,    1.7, -8),
    new THREE.Vector3(0.5,  1.7, -22),
    new THREE.Vector3(-0.5, 1.7, -32),
    new THREE.Vector3(0,    1.7, -45),
    new THREE.Vector3(0,    1.7, -58),
    new THREE.Vector3(0,    1.7, -72),
    new THREE.Vector3(-0.6, 1.7, -86),
    new THREE.Vector3(0.6,  1.7, -96),
    new THREE.Vector3(0,    1.7, -112),
    new THREE.Vector3(0,    1.8, -119),
  ], false, 'catmullrom', 0.5);

  const lookPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,    2.2, 4),
    new THREE.Vector3(0,    2.4, -4),
    new THREE.Vector3(0,    2.2, -16),
    new THREE.Vector3(0,    2.2, -28),
    new THREE.Vector3(0,    2.2, -40),
    new THREE.Vector3(0,    2.6, -52),
    new THREE.Vector3(0,    2.2, -65),
    new THREE.Vector3(0,    2.2, -80),
    new THREE.Vector3(0,    2.2, -94),
    new THREE.Vector3(0,    2.2, -106),
    new THREE.Vector3(0,    2.7, -118),
    new THREE.Vector3(0,    2.9, -126),
  ], false, 'catmullrom', 0.5);

  /* ---------- Lenis smooth scroll ---------- */
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });

  let scrollProgress = 0;
  lenis.on('scroll', ({ scroll, limit }) => {
    scrollProgress = limit > 0 ? scroll / limit : 0;
    updateProgressUI(scrollProgress);
  });

  /* ---------- Progress / nav UI ---------- */
  const progressFill = document.querySelector('.progress-fill');
  const currentRoom  = document.querySelector('.current-room');
  const navLinks     = Array.from(document.querySelectorAll('.nav-links a'));
  const ROMANS = ['I', 'II', 'III', 'IV', 'V'];

  function updateProgressUI(p) {
    const pct = Math.max(0, Math.min(1, p));
    progressFill.style.height = (pct * 100).toFixed(2) + '%';
    const idx = Math.min(4, Math.floor(pct * 5 + 0.001));
    currentRoom.textContent = ROMANS[idx];
    navLinks.forEach((l, i) => l.classList.toggle('active', i === idx));
  }

  /* ---------- GSAP reveals + ScrollTrigger / Lenis bridge ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('.section .container > *').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    document.querySelectorAll('.stat-num').forEach((el) => {
      const target = +el.dataset.target;
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            v: target,
            duration: 2.2,
            ease: 'power2.out',
            onUpdate: () => { el.textContent = Math.floor(obj.v); },
          });
        },
      });
    });
  } else {
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- Anchor link smooth scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.8, offset: 0 });
    });
  });

  /* ---------- Form ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.textContent = 'Sent · thank you ✓';
      btn.disabled = true;
      form.querySelectorAll('input, textarea').forEach((el) => (el.disabled = true));
    });
  }

  /* ---------- Resize ---------- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------- Mouse parallax ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 0.5;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 0.25;
  });

  /* ---------- Loader ---------- */
  const loader = document.getElementById('loader');
  const loaderFill = document.querySelector('.loader-fill');
  let loadPct = 0;
  const loadInterval = setInterval(() => {
    loadPct += 8 + Math.random() * 6;
    loaderFill.style.width = Math.min(100, loadPct) + '%';
    if (loadPct >= 100) {
      clearInterval(loadInterval);
      setTimeout(() => loader.classList.add('hidden'), 350);
    }
  }, 70);

  /* ---------- Render loop ---------- */
  const tmpVec = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();
  const clock = new THREE.Clock();

  function render() {
    const dt = clock.getDelta();

    const p = Math.max(0, Math.min(1, scrollProgress));
    cameraPath.getPointAt(p, tmpVec);
    lookPath.getPointAt(p, tmpLook);

    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    camera.position.x += (tmpVec.x + mouse.x - camera.position.x) * 0.1;
    camera.position.y += (tmpVec.y + mouse.y - camera.position.y) * 0.1;
    camera.position.z += (tmpVec.z - camera.position.z) * 0.12;
    camera.lookAt(tmpLook);

    for (let i = 0; i < sculptures.length; i++) {
      const s = sculptures[i];
      s.obj.rotation[s.axis] += s.speed * dt;
    }

    // Atrium centerpiece slow drift
    atrium.position.y = 2.7 + Math.sin(clock.elapsedTime * 0.6) * 0.15;
    gateway.position.y = 2.9 + Math.sin(clock.elapsedTime * 0.4) * 0.12;

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();
})();
