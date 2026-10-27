// Asmodeo · «Tinta viva»: un motor de trazos neotribales (grosor que se afila y espinas) para la portada y para dibujar el tuyo
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LI = () => ({ es: 0, ca: 1, en: 2 }[document.documentElement.lang] || 0);
  const T = (es, ca, en) => [es, ca, en][LI()];

  // ---------- motor de tribal ----------
  function smooth(p) {
    for (let k = 0; k < 2; k++) {
      const q = [p[0]];
      for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); }
      q.push(p[p.length - 1]); p = q;
    }
    return p;
  }
  function tribal(g, pts, wmax) {
    if (pts.length < 3) return;
    const p = smooth(pts), n = p.length, L = [0];
    for (let i = 1; i < n; i++) L[i] = L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    const total = L[n - 1] || 1, left = [], right = [], tan = [], ws = [];
    for (let i = 0; i < n; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const t = L[i] / total, w = wmax * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.06)), .85) * (.75 + .25 * Math.sin(t * 9));
      const nx = -ty, ny = tx;
      left.push([p[i][0] + nx * w / 2, p[i][1] + ny * w / 2]); right.push([p[i][0] - nx * w / 2, p[i][1] - ny * w / 2]);
      tan.push([tx, ty]); ws.push(w);
    }
    g.beginPath(); g.moveTo(left[0][0], left[0][1]);
    left.forEach((q) => g.lineTo(q[0], q[1])); for (let i = n - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
    g.closePath(); g.fill();
    // relleno central para tapar pliegues en curvas cerradas
    g.strokeStyle = g.fillStyle; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath();
    for (let i = 0, on = false; i < n; i++) { const t = L[i] / total; if (t < .14 || t > .86) continue; const w = ws[i] * .55; if (w < 1) continue; g.lineWidth = Math.min(wmax * .5, w); on ? g.lineTo(p[i][0], p[i][1]) : g.moveTo(p[i][0], p[i][1]); on = true; }
    g.stroke();
    // espinas: alternan de lado, barridas hacia delante
    const step = Math.max(26, wmax * 2.3); let next = step * .7, side = 1;
    for (let i = 2; i < n - 2; i++) {
      const t = L[i] / total; if (L[i] < next || t < .1 || t > .9) continue;
      next += step; side = -side;
      const edge = side > 0 ? left : right, [tx, ty] = tan[i], nx = -ty * side, ny = tx * side;
      const s = ws[i] * 1.15 + wmax * .55, k = Math.max(2, Math.round(n * (ws[i] * .9) / total));
      const P = edge[i], b1 = edge[Math.max(0, i - k)], b2 = edge[Math.min(n - 1, i + k)];
      const tip = [P[0] + nx * s + tx * s * .6, P[1] + ny * s + ty * s * .6];
      g.beginPath(); g.moveTo(b1[0], b1[1]);
      g.quadraticCurveTo(P[0] + nx * s * .25 - tx * s * .1, P[1] + ny * s * .25 - ty * s * .1, tip[0], tip[1]);
      g.quadraticCurveTo(P[0] + nx * s * .3 + tx * s * .35, P[1] + ny * s * .3 + ty * s * .35, b2[0], b2[1]);
      g.closePath(); g.fill();
    }
  }
  function drawAll(g, W, strokes, wmax, mirror) {
    g.fillStyle = '#0b0b0b';
    strokes.forEach((s) => { tribal(g, s, wmax); if (mirror) { g.save(); g.translate(W, 0); g.scale(-1, 1); tribal(g, s, wmax); g.restore(); } });
  }

  // ---------- portada: espinas que crecen alrededor del nombre ----------
  function hero() {
    const cv = document.getElementById('thorns'), g = cv.getContext('2d');
    const P = [
      [[.0, .06], [.1, .1], [.17, .2], [.2, .32], [.17, .44], [.22, .54], [.3, .58]],
      [[.04, .9], [.1, .78], [.2, .72], [.3, .74], [.38, .68], [.4, .6]],
      [[.33, .02], [.35, .12], [.31, .22], [.38, .28], [.45, .26]]
    ];
    let W, H, d, prog = reduce ? 1 : 0;
    const size = () => { const r = cv.getBoundingClientRect(); d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); draw(); };
    function draw() {
      g.clearRect(0, 0, W, H);
      const strokes = P.map((s) => { const pts = s.map(([x, y]) => [x * W, y * H]); const k = Math.max(2, Math.ceil(pts.length * prog)); return pts.slice(0, k); });
      drawAll(g, W, strokes, Math.min(W, H) * .045, true);
    }
    new ResizeObserver(size).observe(cv); size();
    if (reduce) return;
    const t0 = performance.now();
    const step = (now) => { prog = Math.min(1, (now - t0 - 200) / 1600); prog = prog < 0 ? 0 : 1 - Math.pow(1 - prog, 3); draw(); if (prog < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  // ---------- dibuja tu tribal ----------
  function pad() {
    const box = document.querySelector('.pad'), cv = document.getElementById('pad'), g = cv.getContext('2d');
    const symB = document.getElementById('dSym');
    let W, H, d, strokes = [], cur = null, mirror = true;
    const size = () => { const r = cv.getBoundingClientRect(); const oW = W; d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); if (oW && oW !== W) strokes = strokes.map((s) => s.map(([x, y]) => [x * W / oW, y * W / oW])); draw(); };
    const draw = () => { g.clearRect(0, 0, W, H); drawAll(g, W, cur ? strokes.concat([cur]) : strokes, Math.min(W, H) * .05, mirror); };
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = [pos(e)]; box.classList.add('used'); });
    cv.addEventListener('pointermove', (e) => { if (!cur) return; const p = pos(e), l = cur[cur.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 5) { cur.push(p); draw(); } });
    const end = () => { if (cur && cur.length > 2) strokes.push(cur); cur = null; draw(); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    document.getElementById('dClear').addEventListener('click', () => { strokes = []; box.classList.remove('used'); draw(); });
    const symTxt = () => (symB.textContent = mirror ? T('Simetría: sí', 'Simetria: sí', 'Mirror: on') : T('Simetría: no', 'Simetria: no', 'Mirror: off'));
    symB.addEventListener('click', () => { mirror = !mirror; symB.setAttribute('aria-pressed', String(mirror)); symTxt(); draw(); });
    document.addEventListener('langchange', symTxt);
    document.getElementById('dSave').addEventListener('click', () => {
      const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2; const x = c.getContext('2d');
      x.fillStyle = '#f2f0eb'; x.fillRect(0, 0, c.width, c.height); x.scale(2, 2); drawAll(x, W, strokes, Math.min(W, H) * .05, mirror);
      x.font = '500 12px "Martian Mono", monospace'; x.fillStyle = '#6d6a63'; x.fillText('ASMODEO TATTOO · GIRONA', 14, H - 14);
      c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'mi-tribal-asmodeo.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
    });
    new ResizeObserver(size).observe(cv); size();
  }

  function header() {
    const top = document.querySelector('.top'); let last = 0;
    addEventListener('scroll', () => {
      const y = scrollY; top.classList.toggle('solid', y > 40);
      if (y > 600 && y > last + 4) top.classList.add('hide'); else if (y < last - 4) top.classList.remove('hide');
      last = y;
    }, { passive: true });
  }

  function motion() {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.word', { opacity: 0, letterSpacing: '.2em', duration: 1.6, ease: 'expo.out' });
    gsap.from('.hero-in > *, .meta', { opacity: 0, y: 24, duration: 1, stagger: .07, ease: 'expo.out', delay: .5 });
    gsap.utils.toArray('h2.rv').forEach((h) => gsap.from(h, { opacity: 0, x: -40, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } }));
    gsap.utils.toArray('.t-grid figure').forEach((f, i) => gsap.from(f, { clipPath: 'inset(100% 0 0 0)', duration: 1.1, ease: 'expo.inOut', delay: (i % 4) * .06, scrollTrigger: { trigger: f, start: 'top 94%' } }));
    gsap.utils.toArray('.crew li, .serv article, .pad').forEach((el, i) => gsap.from(el, { opacity: 0, y: 30, duration: .9, ease: 'expo.out', delay: (i % 3) * .06, scrollTrigger: { trigger: el, start: 'top 94%' } }));
  }

  function init() {
    hero(); pad(); header();
    if (!reduce && typeof gsap !== 'undefined') motion();
    document.fonts && document.fonts.ready.then(() => typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
