/* ── Preloader ── */
function hideLoader() {
  document.getElementById('loader').classList.add('off');
  document.getElementById('heroBg').classList.add('go');
}
if (location.search.indexOf('noloader') > -1) {
  document.getElementById('loader').style.display = 'none';
  document.getElementById('heroBg').classList.add('go');
} else {
  document.addEventListener('DOMContentLoaded', () => setTimeout(hideLoader, 600));
  setTimeout(hideLoader, 3500); /* failsafe: never trap the user behind the loader */
}

/* ── Marquee: duplicate track for seamless loop ── */
const mq = document.getElementById('mqTrack');
mq.innerHTML += mq.innerHTML;

/* ── Navbar scroll + active link + back-to-top ── */
const nav = document.getElementById('nav');
const toTop = document.getElementById('toTop');
const sections = ['home','about','products','location','contact'];
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 50);
  toTop.classList.toggle('show', y > 700);
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const on = r.top <= 120 && r.bottom > 120;
    document.querySelectorAll(`.nav-links a[href="#${id}"]`).forEach(a => a.classList.toggle('active', on));
  });
}, { passive: true });

/* ── Mobile menu ── */
const mmenu = document.getElementById('mmenu');
const ham = document.getElementById('ham');
function toggleNav() {
  const open = mmenu.classList.toggle('open');
  ham.classList.toggle('x', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
mmenu.querySelectorAll('a').forEach(a => a.addEventListener('click', toggleNav));

/* ── Language toggle (persists) ── */
function setLang(l) {
  document.body.classList.toggle('fr', l === 'fr');
  document.documentElement.lang = l;
  document.getElementById('btnEN').classList.toggle('on', l === 'en');
  document.getElementById('btnFR').classList.toggle('on', l === 'fr');
  try { localStorage.setItem('grv-lang', l); } catch (e) {}
}
try { if (localStorage.getItem('grv-lang') === 'fr') setLang('fr'); } catch (e) {}

/* ── Product filter ── */
function filterProd(btn, cat) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t === btn));
  document.querySelectorAll('.pcard').forEach(c => {
    const show = cat === 'all' || c.dataset.c === cat;
    if (show) {
      c.classList.remove('hide');
      c.classList.remove('vis');
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('vis')));
    } else {
      c.classList.add('hide');
    }
  });
}

/* ── Product image sliders (2 images per product, crossfade + arrows) ── */
document.querySelectorAll('.pslider').forEach((sl, si) => {
  const imgs = sl.querySelectorAll('.ps-img');
  if (imgs.length < 2) return;
  let i = 0, timer;
  const go = n => {
    imgs[i].classList.remove('on');
    i = (n + imgs.length) % imgs.length;
    imgs[i].classList.add('on');
  };
  const auto = () => { timer = setInterval(() => { if (!document.hidden) go(i + 1); }, 4600 + si * 350); };
  auto();
  sl.addEventListener('mouseenter', () => clearInterval(timer));
  sl.addEventListener('mouseleave', auto);
  sl.querySelector('.ps-prev').addEventListener('click', e => { e.preventDefault(); go(i - 1); });
  sl.querySelector('.ps-next').addEventListener('click', e => { e.preventDefault(); go(i + 1); });
});

/* ── Scroll reveal ── */
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.rv, .rv-l, .rv-r').forEach(el => obs.observe(el));

/* ── Animated counters ── */
const cObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    cObs.unobserve(e.target);
    const end = +e.target.dataset.n, dur = 1400, t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.cnt').forEach(el => cObs.observe(el));

/* ── Contact form: validate, then POST via FormSubmit → marketing@grvertiq.com (table template, reply-to customer) ── */
function sendForm(e) {
  e.preventDefault();
  const f = e.target;
  const get = id => f.querySelector('#' + id);
  let ok = true;
  const mark = (el, bad) => { el.closest('.fg').classList.toggle('err', bad); if (bad) ok = false; };

  mark(get('f-first'), get('f-first').value.trim().length < 2);
  mark(get('f-last'), get('f-last').value.trim().length < 2);
  mark(get('f-email'), !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(get('f-email').value.trim()));
  const ph = get('f-phone').value.trim();
  mark(get('f-phone'), ph !== '' && !/^[+0-9 ()\-]{7,20}$/.test(ph));
  mark(get('f-prod'), get('f-prod').value === ''); /* placeholder is not a product — selection required */
  mark(get('f-msg'), get('f-msg').value.trim().length < 10);

  if (!ok) {
    const first = f.querySelector('.fg.err input, .fg.err select, .fg.err textarea');
    if (first) first.focus();
    return false;
  }

  const btn = document.getElementById('fsubBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span class="en-only">Sending…</span><span class="fr-only">Envoi en cours…</span>';
  f.submit();
  return false;
}
/* clear field errors as the user types/selects */
document.querySelectorAll('#quoteForm input, #quoteForm textarea, #quoteForm select').forEach(el => {
  const clear = () => { const g = el.closest('.fg'); if (g) g.classList.remove('err'); };
  el.addEventListener('input', clear);
  el.addEventListener('change', clear);
});

/* if the server could not send the email, let the visitor know */
if (location.search.indexOf('mailerr') > -1) {
  alert('Sorry — your message could not be sent. Please try again or email us at marketing@grvertiq.com.\n\nDésolé — votre message n\'a pas pu être envoyé. Veuillez réessayer ou nous écrire à marketing@grvertiq.com.');
}

/* ── Footer year ── */
document.getElementById('year').textContent = new Date().getFullYear();

/* ════════════════════════════════════════════════════════════════
   PDF LEAD CAPTURE MODAL
   Flow: click Download → modal → fill name+mobile+email →
   submit → AJAX to download-lead.php → email sent → PDF
   force-downloads → redirect to thank-you.html
   ════════════════════════════════════════════════════════════════ */
(function () {
  const modal   = document.getElementById('dlModal');
  const dlClose = document.getElementById('dlClose');
  const dlForm  = document.getElementById('dlForm');
  const dlSub   = document.getElementById('dlModalProduct');
  const dlBtn   = document.getElementById('dlSubmit');
  if (!modal) return;

  let activePdf = '', activeProduct = '';

  function openModal(pdf, product) {
    activePdf = pdf; activeProduct = product;
    dlSub.textContent = product;
    dlForm.reset();
    dlForm.querySelectorAll('.fg').forEach(g => g.classList.remove('err'));
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('dl-name').focus(), 80);
  }
  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  dlClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  document.querySelectorAll('.dl-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.pdf, btn.dataset.product));
  });

  /* clear error on input */
  dlForm.querySelectorAll('input').forEach(el => {
    el.addEventListener('input', () => el.closest('.fg').classList.remove('err'));
  });

  dlForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name   = document.getElementById('dl-name').value.trim();
    const mobile = document.getElementById('dl-mobile').value.trim();
    const email  = document.getElementById('dl-email').value.trim();
    let ok = true;
    if (name.length < 2) { document.getElementById('dl-name').closest('.fg').classList.add('err'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('dl-email').closest('.fg').classList.add('err'); ok = false; }
    if (!ok) return;

    /* spinner */
    dlBtn.disabled = true;
    dlBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span class="en-only">Sending…</span><span class="fr-only">Envoi…</span>';

    const fd = new FormData();
    const ccodeEl = document.getElementById('dl-ccode');
    const ccode = ccodeEl ? ccodeEl.value : '';
    fd.append('name', name); fd.append('mobile', mobile ? (ccode + ' ' + mobile).trim() : '');
    fd.append('email', email); fd.append('product', activeProduct);
    fd.append('pdf', activePdf);

    fetch('download-lead.php', { method: 'POST', body: fd })
      .then(r => r.json())
      .catch(() => ({ ok: true }))  /* if PHP not available, still allow download */
      .then(() => {
        /* force-download the PDF */
        const a = document.createElement('a');
        a.href = activePdf;
        a.download = activePdf.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        /* redirect to thank-you after a short pause so download starts */
        setTimeout(() => { window.location.href = 'thank-you.html'; }, 1200);
      });
  });
})();

/* ════════════════════════════════════════════════════════════════
   ENGINEERING 3D SHOWCASE — self-playing cinematic loop
   No scroll pinning: the section scrolls like any normal block,
   so it can never overlap the hero or leave white space.
   The camera auto-frames the WHOLE model into the free screen area
   on every screen size; knowledge points light up one at a time,
   the active component itself turns gold, and the leader line is
   projected onto that part's true 3D position every frame.
   Tries elevator.glb (DRACO-ready); falls back to a procedural
   PBR model with the same named components.
   ════════════════════════════════════════════════════════════════ */
(function () {
  const sec = document.getElementById('engineering');
  if (!sec) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) { sec.classList.add('eng-static'); return; }

  const CDN = {
    three: 'https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js',
    gltf: 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js',
    draco: 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/DRACOLoader.js',
    env: 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/environments/RoomEnvironment.js'
  };
  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

  let booted = false;
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !booted) {
      booted = true; io.disconnect();
      loadScript(CDN.three)
        .then(() => Promise.all([
          loadScript(CDN.gltf), loadScript(CDN.draco),
          loadScript(CDN.env).catch(() => null)
        ]))
        .then(init)
        .catch(() => sec.classList.add('eng-static'));
    }
  }, { rootMargin: '900px 0px' });
  io.observe(sec);

  function init() {
    try {
      const isMobile = window.innerWidth < 768;   /* performance tier only (DPR, shadows, antialias) */
      const canvas = document.getElementById('engCanvas');
      const stage = document.getElementById('engPin');

      /* ── renderer / scene / camera ── */
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.4 : 2));
      renderer.outputEncoding = THREE.sRGBEncoding;
      const scene = new THREE.Scene();
      if (THREE.RoomEnvironment) {
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(renderer), 0.04).texture;
      }
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);

      scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0a1330, 0.65));
      const key = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(5, 9, 6); scene.add(key);
      if (!isMobile) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.left = -6; key.shadow.camera.right = 6;
        key.shadow.camera.top = 9; key.shadow.camera.bottom = -2;
      }
      const rim = new THREE.DirectionalLight(0xf5c200, 0.5); rim.position.set(-6, 3, -5); scene.add(rim);
      const fill = new THREE.PointLight(0x4a6cc7, 0.7, 30); fill.position.set(-4, 1, 5); scene.add(fill);

      /* ── realistic materials (fallback model) ── */
      const M = {
        steel: new THREE.MeshStandardMaterial({ color: 0xb9bec7, metalness: 0.85, roughness: 0.38 }),   /* brushed stainless */
        steelDark: new THREE.MeshStandardMaterial({ color: 0x878d96, metalness: 0.8, roughness: 0.42 }),
        iron: new THREE.MeshStandardMaterial({ color: 0x3a3f46, metalness: 0.55, roughness: 0.62 }),    /* cast iron */
        machine: new THREE.MeshStandardMaterial({ color: 0x2b4a8c, metalness: 0.45, roughness: 0.42 }), /* machine blue */
        cabinet: new THREE.MeshStandardMaterial({ color: 0xd6d8dc, metalness: 0.1, roughness: 0.5 }),   /* RAL7035 powder coat */
        safety: new THREE.MeshStandardMaterial({ color: 0xc6342e, metalness: 0.3, roughness: 0.5 }),    /* safety red */
        rope: new THREE.MeshStandardMaterial({ color: 0x8d939c, metalness: 0.9, roughness: 0.3 }),
        floor: new THREE.MeshStandardMaterial({ color: 0x474c55, metalness: 0.1, roughness: 0.8 }),     /* stone floor */
        navy: new THREE.MeshStandardMaterial({ color: 0x1d2c5a, metalness: 0.4, roughness: 0.55 }),
        gold: new THREE.MeshStandardMaterial({ color: 0xf5c200, metalness: 0.7, roughness: 0.3 }),
        glass: new THREE.MeshStandardMaterial({ color: 0x9fc2dd, metalness: 0.2, roughness: 0.06, transparent: true, opacity: 0.26 }),
        light: new THREE.MeshStandardMaterial({ color: 0xfff7df, emissive: 0xfff3c4, emissiveIntensity: 0.9 }),
        black: new THREE.MeshStandardMaterial({ color: 0x14171c, metalness: 0.4, roughness: 0.55 })
      };
      const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
      const cyl = (r, h, m, x, y, z, rz) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), m); o.position.set(x, y, z); if (rz) o.rotation.z = rz; return o; };

      function buildFallback() {
        const g = new THREE.Group();
        const parts = {};
        const LIFT = 0.55; /* car rides mid-shaft, above the pit buffers */

        /* — cabin — */
        const cabin = new THREE.Group();
        cabin.add(box(1.7, 0.1, 1.5, M.steelDark, 0, 0.05, 0));
        cabin.add(box(1.58, 0.02, 1.38, M.floor, 0, 0.11, 0));
        cabin.add(box(1.7, 0.08, 1.5, M.steel, 0, 2.16, 0));
        cabin.add(box(1.45, 0.02, 1.25, M.light, 0, 2.11, 0));
        cabin.add(box(0.06, 2.1, 1.5, M.steel, -0.82, 1.1, 0));
        cabin.add(box(0.06, 2.1, 1.5, M.steel, 0.82, 1.1, 0));
        cabin.add(box(1.7, 2.1, 0.06, M.steel, 0, 1.1, -0.72));
        cabin.add(box(1.58, 1.9, 0.03, M.glass, 0, 1.12, -0.68));
        cabin.add(box(1.5, 0.05, 0.05, M.gold, 0, 1.0, -0.63));
        cabin.add(box(0.16, 0.7, 0.04, M.navy, 0.72, 1.25, 0.69));   /* COP panel */
        cabin.add(box(0.08, 0.5, 0.05, M.gold, 0.72, 1.25, 0.7));
        cabin.position.y = LIFT; parts.cabin = cabin;

        /* — landing door system with frame + floor indicator — */
        const doors = new THREE.Group();
        doors.add(box(0.1, 2.25, 0.1, M.steelDark, -0.95, 1.12, 0.78));  /* jambs */
        doors.add(box(0.1, 2.25, 0.1, M.steelDark, 0.95, 1.12, 0.78));
        doors.add(box(2.0, 0.14, 0.12, M.steelDark, 0, 2.32, 0.78));     /* header */
        doors.add(box(0.5, 0.18, 0.06, M.black, 0, 2.55, 0.78));         /* indicator */
        doors.add(box(0.16, 0.07, 0.065, M.light, 0, 2.55, 0.785));
        doors.add(box(0.84, 2.05, 0.05, M.steel, -0.43, 1.1, 0.76));     /* panels */
        doors.add(box(0.84, 2.05, 0.05, M.steel, 0.43, 1.1, 0.76));
        doors.add(box(0.015, 2.0, 0.06, M.black, 0, 1.1, 0.77));         /* seam */
        doors.add(box(1.9, 0.04, 0.1, M.gold, 0, 0.06, 0.78));           /* sill */
        doors.position.y = LIFT; parts.doors = doors;

        /* — guide rails with mounting brackets — */
        const railGeo = () => {
          const r = new THREE.Group();
          r.add(box(0.1, 5.6, 0.1, M.iron, 0, 2.8, 0));
          r.add(box(0.24, 5.6, 0.05, M.steel, 0, 2.8, -0.06));
          for (let i = 0; i < 4; i++) r.add(box(0.3, 0.1, 0.16, M.steelDark, 0, 0.7 + i * 1.45, -0.04));
          return r;
        };
        parts.railL = railGeo(); parts.railL.position.set(-1.18, 0, -0.1);
        parts.railR = railGeo(); parts.railR.position.set(1.18, 0, -0.1);

        /* — counterweight: steel frame + cast iron fillers — */
        const cw = new THREE.Group();
        cw.add(box(0.84, 1.9, 0.06, M.steelDark, 0, 0.95, -0.14));
        cw.add(box(0.06, 1.9, 0.24, M.steelDark, -0.42, 0.95, 0));
        cw.add(box(0.06, 1.9, 0.24, M.steelDark, 0.42, 0.95, 0));
        for (let i = 0; i < 6; i++) cw.add(box(0.72, 0.26, 0.2, M.iron, 0, 0.28 + i * 0.29, 0));
        cw.position.set(0, 1.55, -1.15); parts.counterweight = cw;

        /* — traction machine: blue gearless motor + gold sheave + deflector — */
        const motor = new THREE.Group();
        motor.add(box(1.7, 0.16, 1.0, M.iron, 0, 0, 0));                       /* bedplate */
        motor.add(cyl(0.32, 0.8, M.machine, -0.25, 0.42, 0, Math.PI / 2));     /* machine body */
        motor.add(cyl(0.36, 0.1, M.machine, 0.22, 0.42, 0, Math.PI / 2));      /* end shield */
        motor.add(box(0.3, 0.26, 0.3, M.black, -0.62, 0.42, 0));               /* encoder/brake hood */
        motor.add(cyl(0.44, 0.12, M.gold, 0.42, 0.42, 0, Math.PI / 2));        /* traction sheave */
        motor.add(cyl(0.12, 0.16, M.black, 0.42, 0.42, 0, Math.PI / 2));       /* hub */
        motor.add(cyl(0.22, 0.08, M.steelDark, -0.3, 0.18, -0.55, Math.PI / 2)); /* deflector */
        motor.position.set(0, 5.6, -0.35); parts.motor = motor;

        /* — suspension ropes: car side + counterweight side — */
        const ropes = new THREE.Group();
        [-0.06, 0, 0.06].forEach(off => {
          const r1 = cyl(0.014, 2.6, M.rope, 0.42 + off, 4.05, -0.35, 0); ropes.add(r1);     /* to car   */
          const r2 = cyl(0.014, 2.15, M.rope, -0.3 + off, 4.4, -0.95, 0); ropes.add(r2);     /* to cw    */
        });
        parts.ropes = ropes;

        /* — control cabinet: powder-coat grey with vents + status light — */
        const cab = new THREE.Group();
        cab.add(box(0.74, 1.25, 0.42, M.cabinet, 0, 0, 0));
        cab.add(box(0.015, 1.15, 0.43, M.steelDark, 0.12, 0, 0));            /* door seam */
        for (let i = 0; i < 3; i++) cab.add(box(0.4, 0.025, 0.43, M.steelDark, -0.08, -0.42 + i * 0.09, 0));
        cab.add(box(0.3, 0.2, 0.02, M.black, -0.08, 0.36, 0.215));           /* HMI display */
        cab.add(cyl(0.025, 0.025, M.gold, 0.22, 0.5, 0.215, Math.PI / 2));   /* status lamp */
        cab.position.set(2.05, 5.3, -0.35); parts.cabinet = cab;

        /* — safety gear (under the car) — */
        const brake = new THREE.Group();
        brake.add(box(1.6, 0.14, 0.5, M.steelDark, 0, 0.1, 0));
        brake.add(box(0.22, 0.34, 0.3, M.safety, -0.78, -0.05, 0));
        brake.add(box(0.22, 0.34, 0.3, M.safety, 0.78, -0.05, 0));
        brake.add(box(0.5, 0.2, 0.34, M.iron, 0, -0.06, 0));
        brake.position.set(0, LIFT - 0.28, 0); parts.brake = brake;

        /* — overspeed governor at the top of the left rail — */
        const gov = new THREE.Group();
        gov.add(box(0.3, 0.38, 0.22, M.safety, 0, 0, 0));
        gov.add(cyl(0.14, 0.06, M.steelDark, 0, 0.05, 0.13, Math.PI / 2));
        gov.add(cyl(0.008, 4.6, M.rope, 0, -2.32, 0.13, 0));                 /* governor rope */
        gov.position.set(-1.45, 5.15, -0.1); parts.governor = gov;

        /* — pit buffers: yellow energy absorbers — */
        const buf = new THREE.Group();
        const spring = (x, z) => { const s = new THREE.Group(); s.add(box(0.3, 0.05, 0.3, M.iron, x, 0.03, z)); s.add(cyl(0.085, 0.4, M.gold, x, 0.27, z, 0)); s.add(cyl(0.11, 0.04, M.black, x, 0.49, z, 0)); return s; };
        buf.add(spring(-0.45, 0.1)); buf.add(spring(0.45, 0.1)); buf.add(spring(0, -1.15));
        parts.buffer = buf;

        /* — shaft structure — */
        const shaft = new THREE.Group();
        const colMat = new THREE.MeshStandardMaterial({ color: 0x1c2950, metalness: 0.3, roughness: 0.7, transparent: true, opacity: 0.5 });
        [[-1.6, -1.4], [1.6, -1.4], [-1.6, 1.2], [1.6, 1.2]].forEach(p => shaft.add(box(0.1, 6.6, 0.1, colMat, p[0], 3.1, p[1])));
        [0.1, 6.1].forEach(y => { shaft.add(box(3.3, 0.08, 0.08, colMat, 0, y, -1.4)); shaft.add(box(3.3, 0.08, 0.08, colMat, 0, y, 1.2)); shaft.add(box(0.08, 0.08, 2.7, colMat, -1.6, y, -0.1)); shaft.add(box(0.08, 0.08, 2.7, colMat, 1.6, y, -0.1)); });
        parts.shaft = shaft;

        Object.values(parts).forEach(p => g.add(p));
        if (!isMobile) g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
        return { group: g, parts };
      }

      /* map named nodes from a professional GLB if present */
      function mapGlb(root) {
        const names = ['cabin', 'doors', 'railL', 'railR', 'counterweight', 'motor', 'cabinet', 'brake', 'ropes', 'governor', 'buffer', 'shaft'];
        const parts = {};
        root.traverse(n => { const k = names.find(nm => n.name.toLowerCase().indexOf(nm.toLowerCase()) === 0); if (k && !parts[k]) parts[k] = n; });
        return Object.keys(parts).length >= 5 ? { group: root, parts } : null;
      }

      function start(model) {
        const { group, parts } = model;
        scene.add(group);

        /* ground: glow disc + soft shadow catcher */
        const disc = new THREE.Mesh(new THREE.CircleGeometry(2.3, 48), new THREE.MeshBasicMaterial({ color: 0x0b1532, transparent: true, opacity: 0.55 }));
        disc.rotation.x = -Math.PI / 2; disc.position.y = -0.02; scene.add(disc);
        if (!isMobile) {
          const sh = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.32 }));
          sh.rotation.x = -Math.PI / 2; sh.position.y = -0.01; sh.receiveShadow = true; scene.add(sh);
        }

        /* compact explode offsets; the exploded extents are MEASURED below, so nothing can ever leave the frame */
        const EXPLODE = {
          cabin: [0, 0, 0], doors: [0, 0, 1.3], railL: [-1.0, 0, 0], railR: [1.0, 0, 0],
          counterweight: [0, 0.15, -1.1], motor: [0, 0.7, 0], ropes: [0, 0.7, 0],
          cabinet: [0.9, 0.45, 0], brake: [0, -0.4, 1.0], governor: [-1.0, 0.5, 0], buffer: [-0.55, 0, 0.9]
        };
        const home = {};
        Object.keys(parts).forEach(k => { home[k] = parts[k].position.clone(); });

        const pts = Array.from(document.querySelectorAll('.eng-pt'));

        /* collect fit points once: every part's box corners in BOTH assembled and exploded
           states, so any in-between explode amount is covered too */
        const FIT = [];
        const pushCorners = () => {
          group.updateMatrixWorld(true);
          Object.keys(parts).forEach(k => {
            const b = new THREE.Box3().setFromObject(parts[k]);
            if (b.isEmpty()) return;
            for (let ci = 0; ci < 8; ci++) FIT.push(new THREE.Vector3(
              ci & 1 ? b.max.x : b.min.x, ci & 2 ? b.max.y : b.min.y, ci & 4 ? b.max.z : b.min.z));
          });
        };
        pushCorners(); /* assembled */
        Object.keys(EXPLODE).forEach(k => { const p = parts[k]; if (p) p.position.set(home[k].x + EXPLODE[k][0], home[k].y + EXPLODE[k][1], home[k].z + EXPLODE[k][2]); });
        pushCorners(); /* exploded */
        const C = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
        const anchorLocal = {};
        pts.forEach(el => {
          const p = parts[el.dataset.part]; if (!p) return;
          const c = new THREE.Box3().setFromObject(p).getBoundingSphere(new THREE.Sphere()).center;
          anchorLocal[el.dataset.part] = p.worldToLocal(c.clone());
        });
        Object.keys(EXPLODE).forEach(k => { const p = parts[k]; if (p) p.position.copy(home[k]); });

        /* ── framing: solve the LARGEST camera distance where every corner stays inside the
           free screen area at every rotation the scrub uses — max size, zero clipping ── */
        const ROTS = [-0.18, -0.05, 0.1, 0.25, 0.4, 0.58].map(a => [Math.cos(a), Math.sin(a)]);
        const camDir = new THREE.Vector3(0.42, 0.24, 1).normalize();
        const target = new THREE.Vector3();
        const fitV = new THREE.Vector3();
        let w = 0, h = 0, mob = false, baseDist = 14;
        function allInside(dist, rect) {
          camera.position.set(target.x + camDir.x * dist, target.y + camDir.y * dist, target.z + camDir.z * dist);
          camera.lookAt(target);
          camera.updateMatrixWorld(true);
          for (let r = 0; r < ROTS.length; r++) {
            const co = ROTS[r][0], si = ROTS[r][1];
            for (let i = 0; i < FIT.length; i++) {
              const p = FIT[i];
              fitV.set(p.x * co + p.z * si, p.y, -p.x * si + p.z * co).project(camera);
              const sx = (fitV.x + 1) / 2, sy = (1 - fitV.y) / 2;
              if (sx < rect[0] || sx > rect[1] || sy < rect[2] || sy > rect[3]) return false;
            }
          }
          return true;
        }
        function size() {
          w = stage.clientWidth; h = stage.clientHeight;
          if (!w || !h) return;
          mob = w < 881; /* must match the CSS layout breakpoint */
          renderer.setSize(w, h, false);
          camera.aspect = w / h; camera.updateProjectionMatrix();
          const vT = Math.tan(camera.fov * Math.PI / 360), hT = vT * camera.aspect;
          /* screen space reserved by UI: fixed nav on top, points list left (desktop) / chips bottom (mobile) */
          const topFrac = Math.min(0.16, 84 / h);
          let leftFrac = 0, botFrac = 0.04;
          if (mob) {
            botFrac = Math.min(0.32, 170 / h);
          } else {
            const pr = document.getElementById('engPoints').getBoundingClientRect();
            const sr = stage.getBoundingClientRect();
            leftFrac = Math.max(0, Math.min(0.52, (pr.right - sr.left + 18) / w));
          }
          const rect = [leftFrac + 0.015, 0.985, topFrac + 0.01, 1 - botFrac - 0.01];
          const cx = (rect[0] + rect[1]) / 2, cy = (rect[2] + rect[3]) / 2;
          /* target and distance depend on each other — a couple of passes converge */
          for (let it = 0; it < 3; it++) {
            const visW = 2 * baseDist * hT, visH = 2 * baseDist * vT;
            target.set(C.x - (cx - 0.5) * visW, C.y + (cy - 0.5) * visH, C.z);
            let lo = 3, hi = 90;
            for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (allInside(mid, rect)) hi = mid; else lo = mid; }
            baseDist = hi;
          }
          cacheItemXY();
        }
        window.addEventListener('resize', size);
        window.addEventListener('orientationchange', () => setTimeout(size, 250));

        /* ── leader lines: drawn to each part's true projected 3D position every frame ── */
        const SVG_NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'eng-lines');
        stage.appendChild(svg);
        const lines = [], dots = [], lineOp = pts.map(() => 0);
        pts.forEach(() => {
          const l = document.createElementNS(SVG_NS, 'line');
          l.setAttribute('stroke', 'rgba(245,194,0,.55)'); l.setAttribute('stroke-width', '1.4');
          l.style.opacity = 0; svg.appendChild(l); lines.push(l);
          const c = document.createElementNS(SVG_NS, 'circle');
          c.setAttribute('r', '3.5'); c.setAttribute('fill', '#F5C200');
          c.style.opacity = 0; svg.appendChild(c); dots.push(c);
        });
        let itemXY = [];
        function cacheItemXY() {
          const sr = stage.getBoundingClientRect();
          itemXY = pts.map(el => {
            const r = el.getBoundingClientRect();
            /* mobile: line starts at the chip's top centre; desktop: at the label's right edge */
            return mob
              ? [r.left - sr.left + r.width / 2, r.top - sr.top - 6]
              : [r.right - sr.left + 6, r.top - sr.top + r.height / 2];
          });
        }
        window.addEventListener('load', cacheItemXY);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(cacheItemXY);

        /* ── the active component itself turns gold, so the part being described is unmistakable ── */
        const HL = new THREE.MeshStandardMaterial({ color: 0xF5C200, emissive: 0x8a6a00, emissiveIntensity: 0.55, metalness: 0.6, roughness: 0.32 });
        const savedMat = new Map();
        function litPart(p, on) {
          if (!p) return;
          p.traverse(o => {
            if (!o.isMesh) return;
            if (on) { if (!savedMat.has(o)) savedMat.set(o, o.material); o.material = HL; }
            else if (savedMat.has(o)) { o.material = savedMat.get(o); savedMat.delete(o); }
          });
        }
        let active = -1;
        function setActive(i) {
          if (i === active) return;
          if (active >= 0) { litPart(parts[pts[active].dataset.part], false); pts[active].classList.remove('on'); }
          active = i;
          if (i >= 0) { litPart(parts[pts[i].dataset.part], true); pts[i].classList.add('on'); }
          cacheItemXY();
        }

        const tmp = new THREE.Vector3();
        function placeLines() {
          pts.forEach((el, i) => {
            const tgt = i === active ? 1 : 0;
            lineOp[i] += (tgt - lineOp[i]) * 0.14;
            if (!tgt && lineOp[i] < 0.02) { lines[i].style.opacity = 0; dots[i].style.opacity = 0; return; }
            const k = el.dataset.part, p = parts[k];
            if (!p || !anchorLocal[k] || !itemXY[i]) return;
            tmp.copy(anchorLocal[k]); p.localToWorld(tmp); tmp.project(camera);
            const x2 = (tmp.x * 0.5 + 0.5) * w, y2 = (-tmp.y * 0.5 + 0.5) * h;
            lines[i].setAttribute('x1', itemXY[i][0]); lines[i].setAttribute('y1', itemXY[i][1]);
            lines[i].setAttribute('x2', x2); lines[i].setAttribute('y2', y2);
            lines[i].style.opacity = lineOp[i] * 0.9;
            dots[i].setAttribute('cx', x2); dots[i].setAttribute('cy', y2);
            dots[i].style.opacity = lineOp[i];
          });
        }

        /* ── scroll-driven scrub: the stage is CSS-sticky inside the tall .eng track, so
           native scrolling steps through explode → 10 points → reassemble. No pinning
           library — sticky cannot overlap other sections or leave white space. ── */
        const EX0 = 0.05, EX1 = 0.15, P0 = 0.17, P1 = 0.90, RE0 = 0.92, STEP = (P1 - P0) / pts.length;
        const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
        const hint = document.getElementById('engHint');
        let last = 0, vis = false, eAct = 0, rotAct = -0.12, progOv = NaN;
        /* ?engp=0..1 forces the scrub progress (testing aid) */
        const sm = location.search.match(/[?&]engp=([\d.]+)/);
        if (sm) progOv = parseFloat(sm[1]);
        new IntersectionObserver(en => { vis = en[0].isIntersecting; }, { rootMargin: '60px 0px' }).observe(sec);

        function update(now) {
          requestAnimationFrame(update);
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          if (!vis || !w) return;

          /* progress 0..1 = how far the sticky stage has travelled through the track */
          const track = sec.offsetHeight - h;
          let prog = track > 0 ? -sec.getBoundingClientRect().top / track : 0;
          prog = Math.max(0, Math.min(1, prog));
          if (!isNaN(progOv)) prog = progOv;

          /* explode amount follows the scroll with a short smoothing tail */
          let eT = 0;
          if (prog >= EX1) eT = 1;
          else if (prog > EX0) eT = ease((prog - EX0) / (EX1 - EX0));
          if (prog >= RE0) eT = 1 - ease(Math.min(1, (prog - RE0) / (1 - RE0)));
          eAct += (eT - eAct) * Math.min(1, dt * 7);
          Object.keys(EXPLODE).forEach(k => {
            const p = parts[k]; if (!p) return;
            p.position.set(home[k].x + EXPLODE[k][0] * eAct, home[k].y + EXPLODE[k][1] * eAct, home[k].z + EXPLODE[k][2] * eAct);
          });

          /* strictly ONE knowledge point at a time, stepping with the wheel */
          setActive(prog >= P0 && prog < P1 ? Math.min(pts.length - 1, Math.floor((prog - P0) / STEP)) : -1);

          /* rotation scrubs with the scroll (range matches the framing solver's ROTS) */
          rotAct += ((-0.12 + 0.65 * prog) - rotAct) * Math.min(1, dt * 5);
          group.rotation.y = rotAct;

          if (hint) hint.style.opacity = prog < 0.03 ? 1 : 0;

          /* tiny dolly-out while exploded (always ≥ the solved safe distance) */
          const dist = baseDist * (1 + 0.025 * eAct);
          camera.position.set(target.x + camDir.x * dist, target.y + camDir.y * dist, target.z + camDir.z * dist);
          camera.lookAt(target);

          placeLines();
          renderer.render(scene, camera);
        }
        size();
        requestAnimationFrame(ts => { last = ts; requestAnimationFrame(update); });
      }

      /* ── model: professional GLB first, procedural fallback ── */
      const loader = new THREE.GLTFLoader();
      const dl = new THREE.DRACOLoader();
      dl.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      loader.setDRACOLoader(dl);
      loader.load('elevator.glb',
        g => { const m = mapGlb(g.scene); start(m || buildFallback()); },
        undefined,
        () => start(buildFallback())
      );
    } catch (err) {
      sec.classList.add('eng-static');
    }
  }
})();
