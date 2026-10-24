/* Штаб · моушн-система: пружины, параллакс, частицы, конфетти, счётчики, наклон карточек, шторки, морфинг таб-бара, pull-to-refresh, заставка эпохи. */
(function () {
  'use strict';
  const RM = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

  /* пружина → CSS linear() */
  function springCurve(stiff, damp, mass) {
    const pts = []; let x = 0, v = 0; const dt = 1 / 120; let t = 0;
    while (t < 1.2) { const f = -stiff * (x - 1) - damp * v; v += f / mass * dt; x += v * dt; t += dt; pts.push(x); if (t > .4 && Math.abs(x - 1) < .001 && Math.abs(v) < .01) break; }
    const step = Math.max(1, Math.floor(pts.length / 40)); const out = [];
    for (let i = 0; i < pts.length; i += step) out.push(pts[i].toFixed(3)); out.push('1');
    return { css: 'linear(' + out.join(',') + ')', ms: Math.round(pts.length * dt * 1000) };
  }
  const SP = springCurve(210, 17, 1), SPS = springCurve(320, 26, 1);
  const supportsLinear = (() => { try { return CSS.supports('transition-timing-function', 'linear(0,1)'); } catch (e) { return false; } })();
  const root = document.documentElement;
  root.style.setProperty('--spring', supportsLinear ? SP.css : 'cubic-bezier(.34,1.56,.64,1)');
  root.style.setProperty('--spring-ms', SP.ms + 'ms');
  root.style.setProperty('--spring-soft', supportsLinear ? SPS.css : 'cubic-bezier(.22,1.2,.36,1)');

  const CSS = `
  body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:200;opacity:.06;mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
  .fx-in{animation:fxIn .55s var(--spring-soft) both}
  @keyframes fxIn{from{opacity:0;transform:translateY(16px) scale(.985)}to{opacity:1;transform:none}}
  .fx-tilt{transition:transform .5s var(--spring);transform-style:preserve-3d}
  .fx-press{transition:transform .12s ease-out}
  .fx-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
  #fxConfetti{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:150}
  .tab-ind{position:absolute;left:0;top:6px;bottom:6px;border-radius:999px;background:var(--dock-on,#fff);z-index:0;
    transition:transform .55s var(--spring),width .55s var(--spring);box-shadow:0 4px 14px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.6)}
  .tabbar .in{position:relative}
  .tab{position:relative;z-index:1;background:transparent!important}
  .tab svg{transition:transform .45s var(--spring)}
  .tab[aria-current="page"] svg{transform:scale(1.12) rotate(-6deg)}
  .tab .tl{transition:opacity .3s}
  .row.fx-done{transition:opacity .25s ease .25s,transform .45s var(--spring-soft) .2s;opacity:0;transform:translateX(40px) scale(.96)}
  .row.fx-done .check span{background:var(--ok)!important;border-color:var(--ok)!important;transform:scale(1.15);transition:transform .3s var(--spring),background .15s}
  .row.fx-done .row-title{text-decoration:line-through;text-decoration-thickness:2px}
  .fx-tick{position:absolute;pointer-events:none}
  .fx-tick path{stroke-dasharray:24;stroke-dashoffset:24;animation:fxTick .35s ease-out forwards}
  @keyframes fxTick{to{stroke-dashoffset:0}}
  .sheet:not([hidden]) .panel{animation:fxSheet .55s var(--spring-soft)}
  .sheet:not([hidden]) .sheet-bg{animation:fxFade .3s ease-out}
  @keyframes fxSheet{from{transform:translateY(60%)}to{transform:none}}
  @keyframes fxFade{from{opacity:0}to{opacity:1}}
  .panel.fx-drag{transition:none!important}
  .panel.fx-back{transition:transform .5s var(--spring)}
  .ptr{position:fixed;left:50%;top:0;z-index:30;width:80px;margin-left:-40px;pointer-events:none;transform-origin:50% 0;opacity:0}
  .ptr .rope{width:2px;margin:0 auto;background:var(--muted)}
  .ptr .dos{width:62px;display:block;margin:0 auto}
  .ptr.swing{animation:fxSwing 1.2s ease-in-out infinite}
  @keyframes fxSwing{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(10deg)}}
  .ep-intro{position:fixed;inset:0;z-index:300;display:grid;place-items:center;overflow:hidden;background:#000;cursor:pointer}
  .ep-intro .ei-art{position:absolute;inset:0;opacity:0;transform:scale(1.15);animation:eiArt 2.4s cubic-bezier(.2,.7,.2,1) .5s forwards}
  .ep-intro .ei-art svg{width:100%;height:100%}
  .ep-intro .ei-old{position:absolute;inset:0;animation:eiOld 1s ease-in forwards}
  .ep-intro .ei-old svg{width:100%;height:100%}
  .ep-intro .ei-shade{position:absolute;inset:0;background:radial-gradient(80% 60% at 50% 45%,transparent,rgba(0,0,0,.65))}
  .ep-intro .ei-txt{position:relative;text-align:center;color:#fff;padding:0 24px;display:flex;flex-direction:column;align-items:center;gap:10px}
  .ep-intro .ei-k{font:700 12px var(--f-body,system-ui);letter-spacing:.3em;text-transform:uppercase;opacity:0;animation:fxFade .6s 1.1s forwards;color:var(--gold,#E8C46A)}
  .ep-intro .ei-name{font-family:var(--f-display,Georgia);font-weight:var(--fw-d,400);font-size:clamp(34px,10vw,56px);line-height:1.05;text-shadow:0 4px 30px rgba(0,0,0,.6)}
  .ep-intro .ei-name span{display:inline-block;opacity:0;transform:translateY(18px);animation:eiCh .5s var(--spring-soft) forwards}
  .ep-intro .ei-era{opacity:0;animation:fxFade .6s 2.1s forwards;font-size:15px;color:rgba(255,255,255,.85)}
  .ep-intro .ei-dos{width:110px;opacity:0;animation:eiDos .8s var(--spring) 2.2s forwards}
  .ep-intro .ei-skip{position:absolute;bottom:calc(24px + env(safe-area-inset-bottom,0px));font-size:13px;color:rgba(255,255,255,.6);opacity:0;animation:fxFade .5s 1.6s forwards}
  .ep-intro.out{animation:eiOut .5s ease-in forwards}
  @keyframes eiArt{to{opacity:1;transform:scale(1)}}
  @keyframes eiOld{0%{opacity:1;filter:none}100%{opacity:0;filter:blur(12px) saturate(0);transform:scale(.92)}}
  @keyframes eiCh{to{opacity:1;transform:none}}
  @keyframes eiDos{from{opacity:0;transform:translateY(30px) scale(.6)}to{opacity:1;transform:none}}
  @keyframes eiOut{to{opacity:0;transform:scale(1.04)}}
  .fact-deck{position:fixed;inset:0;z-index:120;display:grid;place-items:center;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:fxFade .25s}
  .fact-deck .fd-card{width:min(340px,86vw);min-height:300px;border-radius:28px;padding:26px 22px;background:var(--surface);color:var(--ink);border:1px solid var(--line);
    box-shadow:0 30px 60px rgba(0,0,0,.4);display:flex;flex-direction:column;gap:14px;animation:fdIn .6s var(--spring);position:relative}
  .fact-deck .fd-k{font-size:11.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
  .fact-deck .fd-n{font-family:var(--f-display);font-weight:var(--fw-d,400);font-size:54px;line-height:1;color:var(--gold)}
  .fact-deck .fd-t{font-size:17px;line-height:1.55;margin:0}
  .fact-deck .fd-dots{display:flex;gap:6px;margin-top:auto}.fact-deck .fd-dots i{width:22px;height:4px;border-radius:2px;background:var(--line)}.fact-deck .fd-dots i.on{background:var(--gold)}
  .fact-deck .fd-hint{position:absolute;bottom:calc(30px + env(safe-area-inset-bottom,0px));left:0;right:0;text-align:center;color:#fff;font-size:13px;opacity:.75}
  .fact-deck .fd-out{animation:fdOut .35s ease-in forwards}
  @keyframes fdIn{from{opacity:0;transform:rotateY(-70deg) translateX(60px) scale(.9)}to{opacity:1;transform:none}}
  @keyframes fdOut{to{opacity:0;transform:rotateY(70deg) translateX(-60px) scale(.9)}}
  @media (prefers-reduced-motion:reduce){body::after{display:none}.fx-in,.panel,.ep-intro *,.fact-deck *{animation:none!important;opacity:1!important;transform:none!important}}`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  /* ---------- каскад появления ---------- */
  function enter(container) {
    if (RM || !container) return;
    [...container.children].forEach((el, i) => { el.classList.remove('fx-in'); void el.offsetWidth; el.style.animationDelay = Math.min(i * 40, 360) + 'ms'; el.classList.add('fx-in'); });
  }

  /* ---------- счётчики и кольца ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); play(e.target); } }), { threshold: .3 }) : null;
  function play(el) {
    if (el.dataset.count != null) {
      const to = parseFloat(el.dataset.count) || 0, fmt = el.dataset.fmt || '', t0 = performance.now(), dur = 900;
      const tick = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmtNum(to * e, fmt) + (el.dataset.suf || ''); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    if (el.matches && el.matches('svg.ring')) {
      const c = el.querySelectorAll('circle')[1]; if (!c) return; const len = parseFloat((c.getAttribute('stroke-dasharray') || '0').split(' ')[0]) || 0;
      c.style.strokeDashoffset = len; c.getBoundingClientRect(); c.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)'; c.style.strokeDashoffset = 0;
    }
  }
  function fmtNum(v, fmt) { if (fmt === 'km') { return v >= 1e6 ? (Math.round(v / 1e5) / 10).toString().replace('.', ',') + 'м' : Math.round(v / 1000) + 'к'; } return Math.round(v).toLocaleString('ru-RU'); }
  function counters(root) {
    if (!root) return;
    root.querySelectorAll('[data-count]:not([data-fx]),svg.ring:not([data-fx])').forEach(el => { el.dataset.fx = 1; if (RM || !io) { return; } if (el.dataset.count != null) el.textContent = fmtNum(0, el.dataset.fmt) + (el.dataset.suf || ''); io.observe(el); });
  }

  /* ---------- наклон карточек к пальцу ---------- */
  const TILT = '.pcard,.bt,.chr,.wtile,.dpill,.btn,.mood,.ep-item,.ncard';
  let tilted = null;
  addEventListener('pointerdown', e => {
    if (RM) return; const el = e.target.closest && e.target.closest(TILT); if (!el) return;
    tilted = el; const r = el.getBoundingClientRect(); const big = r.width > 120;
    const rx = big ? ((e.clientY - r.top) / r.height - .5) * -8 : 0, ry = big ? ((e.clientX - r.left) / r.width - .5) * 8 : 0;
    el.classList.remove('fx-tilt'); el.classList.add('fx-press');
    el.style.transform = 'perspective(700px) rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg) scale(' + (big ? .975 : .94) + ')';
  }, { passive: true });
  const release = () => { if (!tilted) return; const el = tilted; tilted = null; el.classList.remove('fx-press'); el.classList.add('fx-tilt'); el.style.transform = ''; setTimeout(() => el.classList.remove('fx-tilt'), 600); };
  addEventListener('pointerup', release, { passive: true }); addEventListener('pointercancel', release, { passive: true }); addEventListener('scroll', release, { passive: true });

  /* ---------- конфетти ---------- */
  let cf = null, parts = [], cfRaf = 0;
  function confetti(x, y, colors, n) {
    if (RM) return;
    if (!cf) { cf = document.createElement('canvas'); cf.id = 'fxConfetti'; document.body.appendChild(cf); }
    const dpr = Math.min(2, devicePixelRatio || 1); cf.width = innerWidth * dpr; cf.height = innerHeight * dpr;
    colors = colors && colors.length ? colors : ['#E2B456', '#3445E0', '#2FB27A', '#E5372A', '#F2A7B8'];
    for (let i = 0; i < (n || 70); i++) { const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.1, sp = 5 + Math.random() * 9;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .4, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, c: colors[i % colors.length], life: 0 }); }
    if (!cfRaf) cfRaf = requestAnimationFrame(cfTick);
  }
  function cfTick() {
    const ctx = cf.getContext('2d'), dpr = cf.width / innerWidth; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life < 140 && p.y < innerHeight + 20);
    parts.forEach(p => { p.life++; p.vy += .32; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - p.life / 140); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life / 6))); ctx.restore(); });
    if (parts.length) cfRaf = requestAnimationFrame(cfTick); else { cfRaf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  /* ---------- частицы сцены ---------- */
  function particles(host, cfg) {
    if (RM || !host || !cfg) return null;
    const c = document.createElement('canvas'); c.className = 'fx-canvas'; host.appendChild(c);
    const ctx = c.getContext('2d'); let W = 0, H = 0, ps = [], raf = 0, vis = true, t = 0;
    const size = () => { const r = host.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const mk = (init) => { const k = cfg.kind; return { x: Math.random() * W, y: init ? Math.random() * H : (k === 'ember' || k === 'firefly' || k === 'sparkle' ? H * (.5 + Math.random() * .4) : -10), s: k === 'petal' ? 3 + Math.random() * 3 : k === 'snow' ? 1 + Math.random() * 2.2 : .8 + Math.random() * 1.8,
      vx: (Math.random() - .5) * (k === 'petal' ? .8 : .3), vy: k === 'ember' ? -(.3 + Math.random() * .6) : k === 'snow' ? .4 + Math.random() * .6 : k === 'petal' ? .5 + Math.random() * .5 : (Math.random() - .5) * .25,
      ph: Math.random() * 6.28, a: Math.random() }; };
    for (let i = 0; i < cfg.n; i++) ps.push(mk(true));
    function frame() {
      raf = 0; if (!vis || document.hidden) return; t += 1; ctx.clearRect(0, 0, W, H); ctx.fillStyle = cfg.color;
      ps.forEach((p, i) => {
        p.x += p.vx + Math.sin((t + p.ph * 50) / 60) * (cfg.kind === 'petal' ? .6 : .15); p.y += p.vy;
        if (p.y > H + 12 || p.y < -14 || p.x < -14 || p.x > W + 14) ps[i] = mk(false);
        let al = cfg.kind === 'sparkle' || cfg.kind === 'firefly' ? (Math.sin(t / 22 + p.ph) + 1) / 2 : cfg.kind === 'ember' ? Math.max(0, Math.min(1, (p.y / H - .1) * 1.5)) : .75;
        ctx.globalAlpha = al * (cfg.kind === 'dust' ? .55 : .9);
        if (cfg.kind === 'petal') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(t / 30 + p.ph) * 1.2); ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .55, 0, 0, 6.28); ctx.fill(); ctx.restore(); }
        else { if (cfg.kind === 'firefly' || cfg.kind === 'ember') { ctx.shadowBlur = 8; ctx.shadowColor = cfg.color; } ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0; }
      });
      ctx.globalAlpha = 1; raf = requestAnimationFrame(frame);
    }
    const ob = 'IntersectionObserver' in window ? new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(frame); }) : null; if (ob) ob.observe(host);
    const onVis = () => { if (!document.hidden && !raf) raf = requestAnimationFrame(frame); }; document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(frame);
    return { stop() { cancelAnimationFrame(raf); raf = 0; vis = false; if (ob) ob.disconnect(); document.removeEventListener('visibilitychange', onVis); c.remove(); }, size };
  }

  /* ---------- параллакс: скролл + наклон телефона ---------- */
  let tiltX = 0, tiltY = 0, orientAsked = false, pRaf = 0;
  function parallax() {
    pRaf = 0; const hero = document.querySelector('.hero.scene'); if (!hero) return;
    const r = hero.getBoundingClientRect(); if (r.bottom < 0) return; const sc = Math.max(-80, Math.min(400, -r.top));
    hero.querySelectorAll('.scene-bg .lay').forEach(g => { const d = +g.dataset.d || 0; g.setAttribute('transform', 'translate(' + (tiltX * d * 14).toFixed(2) + ' ' + (sc * d * .18 + tiltY * d * 6).toFixed(2) + ')'); });
    const dos = hero.querySelector('.hero-dos'); if (dos) dos.style.transform = 'translate(' + (tiltX * 10).toFixed(1) + 'px,' + (sc * .12).toFixed(1) + 'px)';
  }
  const reqP = () => { if (!pRaf && !RM) pRaf = requestAnimationFrame(parallax); };
  addEventListener('scroll', reqP, { passive: true });
  function onOrient(e) { if (e.gamma == null) return; tiltX = Math.max(-1, Math.min(1, e.gamma / 30)); tiltY = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30)); reqP(); }
  function askOrient() {
    if (orientAsked || RM) return; orientAsked = true;
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(s => { if (s === 'granted') addEventListener('deviceorientation', onOrient); }).catch(() => {});
      } else if (window.DeviceOrientationEvent) addEventListener('deviceorientation', onOrient);
    } catch (e) {}
  }

  /* ---------- таб-бар: перетекающая «таблетка» ---------- */
  function tabIndicator() {
    const bar = document.querySelector('.tabbar .in'); if (!bar) return;
    let ind = bar.querySelector('.tab-ind'); if (!ind) { ind = document.createElement('span'); ind.className = 'tab-ind'; bar.prepend(ind); }
    const move = () => { const a = bar.querySelector('.tab[aria-current="page"]'); if (!a) return; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = 'translateX(' + a.offsetLeft + 'px)'; };
    move(); if (window.ResizeObserver) { const ro = new ResizeObserver(move); bar.querySelectorAll('.tab').forEach(t => ro.observe(t)); }
    new MutationObserver(move).observe(bar, { attributes: true, subtree: true, attributeFilter: ['aria-current'] });
  }

  /* ---------- шторка тянется пальцем ---------- */
  function sheetDrag(panel, onClose) {
    let y0 = null, dy = 0;
    panel.addEventListener('touchstart', e => { if (panel.scrollTop > 0) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
    panel.addEventListener('touchmove', e => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy <= 0) { panel.style.transform = ''; return; } panel.classList.add('fx-drag'); panel.style.transform = 'translateY(' + (dy < 160 ? dy : 160 + (dy - 160) * .35).toFixed(0) + 'px)'; }, { passive: true });
    panel.addEventListener('touchend', () => { if (y0 == null) return; panel.classList.remove('fx-drag'); y0 = null;
      if (dy > 120) { panel.style.transition = 'transform .25s ease-in'; panel.style.transform = 'translateY(110%)'; setTimeout(() => { panel.style.transition = ''; panel.style.transform = ''; onClose(); }, 230); }
      else { panel.classList.add('fx-back'); panel.style.transform = ''; setTimeout(() => panel.classList.remove('fx-back'), 520); } dy = 0; }, { passive: true });
  }

  /* ---------- pull-to-refresh с Досом на верёвке ---------- */
  function pullToRefresh(onRefresh, makeDos) {
    if (RM) return; let y0 = null, d = 0, el = null;
    addEventListener('touchstart', e => { if (scrollY > 0 || document.querySelector('.sheet:not([hidden])')) { y0 = null; return; } y0 = e.touches[0].clientY; d = 0; }, { passive: true });
    addEventListener('touchmove', e => { if (y0 == null) return; d = e.touches[0].clientY - y0; if (d < 10) return;
      if (!el) { el = document.createElement('div'); el.className = 'ptr'; el.innerHTML = '<div class="rope"></div><div class="pd"></div>'; document.body.appendChild(el); makeDos(el.querySelector('.pd')); }
      const h = Math.min(110, d * .5); el.style.opacity = Math.min(1, d / 80); el.querySelector('.rope').style.height = (h + 10) + 'px'; el.style.transform = 'rotate(' + Math.sin(d / 30) * 8 + 'deg)'; }, { passive: true });
    addEventListener('touchend', () => { if (y0 == null || !el) { y0 = null; return; } const go = d > 150; y0 = null;
      if (go) { el.classList.add('swing'); Promise.resolve(onRefresh()).finally(() => setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = 0; setTimeout(() => { el && el.remove(); el = null; }, 300); }, 900)); }
      else { el.remove(); el = null; } }, { passive: true });
  }

  /* ---------- заставка новой эпохи ---------- */
  function epochIntro(oldArt, ep, art, makeDos) {
    if (RM) return Promise.resolve();
    return new Promise(res => {
      const o = document.createElement('div'); o.className = 'ep-intro'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Новая эпоха: ' + ep.name);
      const letters = [...ep.name].map((ch, i) => '<span style="animation-delay:' + (1.25 + i * .045).toFixed(2) + 's">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>').join('');
      o.innerHTML = (oldArt ? '<div class="ei-old">' + oldArt + '</div>' : '') + '<div class="ei-art">' + art + '</div><div class="ei-shade"></div>' +
        '<div class="ei-txt"><div class="ei-k">Новая эпоха</div><div class="ei-name">' + letters + '</div><div class="ei-era">' + ep.era + '</div><div class="ei-dos"></div></div><div class="ei-skip">Тапни, чтобы войти</div>';
      document.body.appendChild(o); const d = makeDos(o.querySelector('.ei-dos')); setTimeout(() => d && d.react && d.react('poof'), 2300); setTimeout(() => d && d.react && d.react('wave'), 3000);
      let done = false; const end = () => { if (done) return; done = true; o.classList.add('out'); setTimeout(() => { o.remove(); res(); }, 480); };
      o.addEventListener('click', end); setTimeout(end, 4600);
    });
  }

  /* ---------- колода фактов (долгий тап по Досу) ---------- */
  function factDeck(cards) {
    let i = 0; const o = document.createElement('div'); o.className = 'fact-deck';
    const draw = () => { o.innerHTML = '<div class="fd-card"><span class="fd-k">' + cards[i].k + '</span><span class="fd-n">' + cards[i].n + '</span><p class="fd-t">' + cards[i].t + '</p><div class="fd-dots">' + cards.map((_, j) => '<i class="' + (j === i ? 'on' : '') + '"></i>').join('') + '</div></div><div class="fd-hint">Тапни — дальше</div>'; };
    draw(); document.body.appendChild(o);
    o.addEventListener('click', () => { const c = o.querySelector('.fd-card'); if (i >= cards.length - 1) { o.style.transition = 'opacity .25s'; o.style.opacity = 0; setTimeout(() => o.remove(), 250); return; } c.classList.add('fd-out'); setTimeout(() => { i++; draw(); }, 300); });
  }

  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms || 12); } catch (e) {} };

  window.FX = { RM, enter, counters, confetti, particles, parallax: reqP, askOrient, tabIndicator, sheetDrag, pullToRefresh, epochIntro, factDeck, buzz };
})();
