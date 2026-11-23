(function () {
  const root = document.documentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let reduced = localStorage.getItem('riq-motion') ? localStorage.getItem('riq-motion') === 'off' : prefersReduced;
  const toggle = document.getElementById('motionToggle');
  function applyMotionPref() {
    root.classList.toggle('reduce-motion', reduced);
    root.classList.toggle('force-motion', !reduced);
    toggle.textContent = reduced ? 'Turn motion on' : 'Reduce motion';
    toggle.setAttribute('aria-pressed', String(reduced));
  }
  applyMotionPref();
  toggle.addEventListener('click', () => { reduced = !reduced; localStorage.setItem('riq-motion', reduced ? 'off' : 'on'); location.reload(); });

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = id === '#top' ? document.body : document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    document.body.classList.remove('nav-open');
    if (lenis) lenis.scrollTo(el, { offset: -88, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));

  /* ---------- burger ---------- */
  const burger = document.querySelector('.burger');
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  /* ---------- load-in ---------- */
  document.querySelectorAll('.display .word').forEach((w, i) => { w.style.transitionDelay = (0.12 + i * 0.07) + 's'; });
  const ready = () => requestAnimationFrame(() => root.classList.add('loaded'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else ready();
  setTimeout(ready, 1200);

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => reduced ? el.classList.add('in') : io.observe(el));

  /* ---------- scroll-linked: progress, nav, parallax ---------- */
  const bar = document.querySelector('.progress');
  const nav = document.querySelector('.nav');
  const para = [...document.querySelectorAll('[data-speed]')];
  let lastY = -1;
  function onFrame() {
    const y = window.scrollY;
    if (y !== lastY) {
      lastY = y;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      nav.classList.toggle('scrolled', y > 12);
      if (!reduced) para.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        el.style.transform = `translate3d(0, ${(-r.top) * parseFloat(el.dataset.speed)}px, 0)`;
      });
    }
    requestAnimationFrame(onFrame);
  }
  requestAnimationFrame(onFrame);

  /* ---------- custom cursor ---------- */
  const fine = window.matchMedia('(pointer: fine)').matches;
  if (fine && !reduced) {
    root.classList.add('has-cursor', 'cur-hidden');
    const dot = document.querySelector('.cur-dot'), ring = document.querySelector('.cur-ring'), label = ring.querySelector('.cur-label');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`; root.classList.remove('cur-hidden'); }, { passive: true });
    document.addEventListener('mouseleave', () => root.classList.add('cur-hidden'));
    addEventListener('mousedown', () => ring.classList.add('is-down'));
    addEventListener('mouseup', () => ring.classList.remove('is-down'));
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)` + (ring.classList.contains('is-down') ? ' scale(.85)' : '');
      requestAnimationFrame(loop);
    })();
    const hoverSel = 'a, button, summary, select, [role=tab], [data-cursor], video';
    document.addEventListener('mouseover', e => {
      const t = e.target;
      if (t.closest('input, textarea')) { ring.classList.add('is-text'); ring.classList.remove('is-hover'); label.textContent = ''; return; }
      ring.classList.remove('is-text');
      const h = t.closest(hoverSel);
      if (h) { ring.classList.add('is-hover'); label.textContent = h.dataset.cursor || ''; }
      else { ring.classList.remove('is-hover'); label.textContent = ''; }
    });
    /* magnetic buttons */
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    /* card tilt */
    document.querySelectorAll('.tilt').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${-py * 7}deg) rotateY(${px * 9}deg) translateY(-6px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- hero n8n replay ---------- */
  const mock = document.getElementById('mock');
  const canvas = document.getElementById('mCanvas');
  const wire = document.getElementById('wire');
  const packet = document.getElementById('mPacket');
  const nodes = [...canvas.querySelectorAll('.node')];
  const chips = [...document.querySelectorAll('#mOuts .chip')];
  const status = document.getElementById('mStatus');
  const review = document.getElementById('mReview');
  const num = document.getElementById('mNum');
  const approve = document.getElementById('mApprove');
  const cursor = document.getElementById('mCursor');
  const clickRing = document.getElementById('mClick');
  const VW = 520, VH = 250;
  nodes.forEach(n => { n.style.left = (n.dataset.x / VW * 100) + '%'; n.style.top = (n.dataset.y / VH * 100) + '%'; });
  const L = wire.getTotalLength();
  wire.style.setProperty('--len', L);
  const pts = nodes.map(n => [+n.dataset.x, +n.dataset.y]);
  const at = [0]; for (let i = 1; i < pts.length; i++) at[i] = at[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.15 }).observe(mock);
  const sleep = ms => new Promise(res => {
    let left = ms, last = performance.now();
    (function tick(now) {
      if (visible && !document.hidden) left -= now - last;
      last = now;
      left <= 0 ? res() : requestAnimationFrame(tick);
    })(last);
  });
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function setStatus(text, cls) { status.textContent = text; status.className = 'status' + (cls ? ' ' + cls : ''); }
  function drawTo(s) {
    wire.style.strokeDashoffset = L - s;
    const p = wire.getPointAtLength(s);
    packet.style.left = (p.x / VW * 100) + '%';
    packet.style.top = (p.y / VH * 100) + '%';
  }
  function travel(i, j, ms) {
    return new Promise(res => {
      const s0 = at[i], s1 = at[j]; let t = 0, last = performance.now();
      packet.style.opacity = 1;
      (function tick(now) {
        if (visible && !document.hidden) t += (now - last) / ms;
        last = now;
        drawTo(s0 + (s1 - s0) * ease(Math.min(t, 1)));
        t >= 1 ? res() : requestAnimationFrame(tick);
      })(last);
    });
  }
  function local(el) {
    const r = el.getBoundingClientRect(), m = mock.getBoundingClientRect();
    const tr = getComputedStyle(mock).transform;
    let a = 0; if (tr && tr !== 'none') { const v = tr.match(/matrix\(([^)]+)\)/); if (v) { const [ma, mb] = v[1].split(',').map(parseFloat); a = Math.atan2(mb, ma); } }
    const vx = r.left + r.width / 2 - (m.left + m.width / 2), vy = r.top + r.height / 2 - (m.top + m.height / 2);
    const c = Math.cos(-a), s = Math.sin(-a);
    return [mock.offsetWidth / 2 + vx * c - vy * s, mock.offsetHeight / 2 + vx * s + vy * c];
  }
  function moveCursor(el, ox = 6, oy = 8) { const [x, y] = local(el); cursor.style.transform = `translate(${x + ox - 3}px, ${y + oy - 2}px)`; return [x + ox, y + oy]; }
  function park() { cursor.style.transform = `translate(${mock.offsetWidth - 60}px, ${mock.offsetHeight - 40}px)`; }
  async function click(el) {
    const [x, y] = moveCursor(el); await sleep(950);
    clickRing.style.left = x + 'px'; clickRing.style.top = y + 'px';
    clickRing.classList.remove('go'); void clickRing.offsetWidth; clickRing.classList.add('go');
  }
  function reset() {
    nodes.forEach(n => n.classList.remove('active', 'done', 'err'));
    chips.forEach(c => c.className = 'chip');
    setStatus('Ready'); review.classList.remove('show'); num.textContent = '61%'; num.classList.remove('edited'); approve.classList.remove('press');
    packet.style.opacity = 0; drawTo(0); wire.style.strokeDashoffset = L;
  }
  function finalState() {
    nodes.forEach((n, i) => n.classList.add('done', ...(i === 5 ? ['err'] : [])));
    chips.forEach((c, i) => c.className = 'chip on ' + (i === 0 ? 'block' : 'pass'));
    setStatus('Succeeded · 6 ok, 1 blocked', 'ok'); wire.style.strokeDashoffset = 0; packet.style.opacity = 0;
  }
  async function step(i, j, ms = 650, hold = 380) {
    await travel(i, j, ms); nodes[j].classList.add('active'); await sleep(hold);
  }
  function done(j, err) { nodes[j].classList.remove('active'); nodes[j].classList.add('done'); if (err) nodes[j].classList.add('err'); }
  async function run() {
    reset(); park(); await sleep(900);
    await click(nodes[0].querySelector('.ico'));
    nodes[0].classList.add('active'); setStatus('Running', 'run'); await sleep(450); done(0);
    await step(0, 1); done(1);
    await step(1, 2, 650, 150);
    for (const c of chips) { c.classList.add('on'); await sleep(110); }
    done(2);
    await step(2, 3, 650, 150);
    for (const c of chips) { c.classList.add('pass'); await sleep(90); }
    done(3);
    await step(3, 4, 600, 250);
    setStatus('Waiting for editor', 'wait'); review.classList.add('show'); await sleep(600);
    await click(num);
    await sleep(250);
    for (const t of ['6%', '%', '7%', '71%']) { num.textContent = t; await sleep(140); }
    num.classList.add('edited'); await sleep(450);
    await click(approve); approve.classList.add('press'); await sleep(320);
    review.classList.remove('show'); done(4); setStatus('Running', 'run'); park();
    await step(4, 5, 600, 650);
    chips[0].classList.remove('pass'); chips[0].classList.add('block'); done(5, true); await sleep(500);
    await step(5, 6); done(6);
    await step(6, 7, 600, 250); done(7); packet.style.opacity = 0;
    setStatus('Succeeded · 6 ok, 1 blocked', 'ok');
    await sleep(3200);
  }
  if (reduced) { finalState(); cursor.style.display = 'none'; }
  else (async () => { await sleep(1300); for (;;) await run(); })();

  /* ---------- workflow sticky ---------- */
  const steps = [...document.querySelectorAll('.wf-step')];
  const wfNodes = [...document.querySelectorAll('.wf-node')];
  const fill = document.getElementById('wfFill');
  const wfStatus = document.getElementById('wfStatus');
  function setActive(k) {
    steps.forEach((s, i) => s.classList.toggle('active', i === k));
    wfNodes.forEach((n, i) => {
      n.classList.toggle('done', i <= k);
      n.classList.toggle('current', i === k);
      n.classList.toggle('blocked', i === 6 && k === 6);
    });
    fill.style.transform = `scaleY(${k / (wfNodes.length - 1)})`;
    wfStatus.textContent = k === 6 ? 'Succeeded · 6 ok, 1 blocked' : `Step ${k + 1} of 7`;
    wfStatus.className = 'status ' + (k === 6 ? 'ok' : k === 5 ? 'wait' : 'run');
  }
  setActive(0);
  const wio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(+e.target.dataset.step); }), { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => wio.observe(s));
})();
