/* Штаб · живой 2D-герой
   Нарисованный герой «оживает»: дыхание, колыхание волос и плаща, взгляд за пальцем (WebGL-шейдер),
   аура цвета расы, искры, эмоции-баблы над головой и реакции (прыжок, победа, тряска, поклон).
   Без WebGL — то же на CSS.
   API: Hero2D.mount(el, {src, meta, mood, acc}) → {setMood, react, setHero, destroy, el} */
(function () {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EMO = {
    idle: '', happy: '♪', proud: '★', think: '…', alert: '!', cry: '💧', sleep: 'z z', surprised: '!?'
  };
  const PAR = { // дыхание, колыхание, скорость
    idle: [1, 1, 1], happy: [1.1, 1.2, 1.15], proud: [.9, .9, .9], think: [.8, .7, .8],
    alert: [1.5, 1.4, 1.6], cry: [1.3, .8, 1.2], sleep: [1.2, .5, .55], surprised: [1.4, 1.3, 1.5]
  };
  const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;varying vec2 uv;uniform sampler2D img;uniform float t,br,sw,lx,ly,pad;
void main(){
  vec2 q=uv;
  // поле картинки с запасом по краям, чтобы колыхание не обрезалось
  q=(q-.5)*(1.+pad)+.5;
  float y=q.y;
  float chest=smoothstep(.16,.32,y)*(1.-smoothstep(.5,.66,y));
  float b=sin(t*1.9)*br;
  q.x=.5+(q.x-.5)*(1.-chest*.010*b);
  q.y+=chest*.0045*b-(1.-smoothstep(.0,.35,y))*.0035*b;
  float side=abs(q.x-.5)*2.;
  float cape=smoothstep(.35,.92,y)*(1.-smoothstep(.93,1.,y));
  float hair=(1.-smoothstep(.03,.42,y));
  q.x+=sin(t*1.25+y*7.)*.0055*sw*(cape*side*1.3+hair*side*.8);
  q.x+=sin(t*.7+y*3.)*.0018*sw*cape;
  float head=1.-smoothstep(.06,.28,y);
  q.x-=lx*.007*head;q.y+=ly*.004*head;
  vec4 c=(q.x<0.||q.x>1.||q.y<0.||q.y>1.)?vec4(0.):texture2D(img,q);
  gl_FragColor=c;
}`;
  let N = 0;
  const all = new Set();
  const ptr = { x: 0, y: 0 };
  addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  function glFor(cv) {
    const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    const sh = (ty, src) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS); if (!v || !f) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    const U = {}; ['t', 'br', 'sw', 'lx', 'ly', 'pad'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
    gl.clearColor(0, 0, 0, 0);
    return { gl, tex, U };
  }

  function mount(el, o) {
    o = o || {};
    const id = ++N;
    el.classList.add('h2d');
    el.innerHTML = '<div class="h2d-aura"></div><div class="h2d-floor"></div><div class="h2d-sp">' + '<i></i>'.repeat(9) + '</div>' +
      '<div class="h2d-fig"><div class="h2d-rx"><canvas class="h2d-cv"></canvas><img class="h2d-img" alt="" draggable="false"></div></div>' +
      '<div class="h2d-emo" aria-hidden="true"><span></span></div>';
    const fig = el.querySelector('.h2d-fig'), rx = el.querySelector('.h2d-rx'), cv = el.querySelector('canvas'), im = el.querySelector('img'), emo = el.querySelector('.h2d-emo'), emoS = emo.querySelector('span');
    let G = RM ? null : glFor(cv), raf = 0, vis = true, t0 = performance.now(), cur = [1, 1, 1], tgt = [1, 1, 1], lx = 0, ly = 0, img = null, meta = o.meta || null;
    el.classList.toggle('gl', !!G);
    const inst = {
      el, mood: 'idle', dead: false,
      setMood(m) {
        if (!EMO.hasOwnProperty(m)) m = 'idle';
        el.classList.remove('m-' + inst.mood); inst.mood = m; el.classList.add('m-' + m);
        tgt = PAR[m] || PAR.idle;
        const e = EMO[m];
        if (e) { emoS.textContent = e; emo.classList.remove('pop'); void emo.offsetWidth; emo.classList.add('on', 'pop'); }
        else emo.classList.remove('on');
      },
      react(name, ms) {
        if (RM) return;
        const k = 'r-' + name; rx.classList.remove(k); el.classList.remove(k); void rx.offsetWidth; rx.classList.add(k); el.classList.add(k);
        clearTimeout(inst._rt); inst._rt = setTimeout(() => { rx.classList.remove(k); el.classList.remove(k); }, ms || { jump: 700, victory: 1300, shake: 520, bow: 1000, spin: 1000, wave: 1000, surprised: 900, appear: 1200, nod: 700 }[name] || 900);
        if (name === 'surprised') { const m = inst.mood; inst.setMood('surprised'); setTimeout(() => inst.mood === 'surprised' && inst.setMood(m), 1100); }
      },
      setHero(src, mt, acc) {
        meta = mt || meta;
        if (acc) el.style.setProperty('--hacc', acc);
        if (!src) return;
        const n = new Image(); n.decoding = 'async';
        n.onload = () => {
          if (inst.dead) return;
          const first = !img; img = n; im.src = src;
          if (G) { const { gl, tex } = G; gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, n); }
          const ar = n.naturalWidth / n.naturalHeight; el.style.setProperty('--ar', ar.toFixed(4));
          fig.style.height = (92 * ((meta && meta.scale) || 1)).toFixed(1) + '%';
          if (meta && meta.head) { el.style.setProperty('--hx', (meta.head[0] * 100).toFixed(1) + '%'); el.style.setProperty('--hy', (meta.head[1] * 100).toFixed(1) + '%'); }
          size(); place();
          if (!first && !RM) { fig.classList.remove('swap'); void fig.offsetWidth; fig.classList.add('swap'); }
          el.classList.add('ready'); loop();
        };
        n.src = src;
      },
      dbg() { return { raf, vis, img: !!img, G: !!G, dc: inst._dc, conn: el.isConnected, cw: cv.width }; },
      wake() { vis = true; inst._dc = 0; size(); place(); loop(); },
      destroy() { inst.dead = true; cancelAnimationFrame(raf); all.delete(inst); if (ro) ro.disconnect(); if (io) io.disconnect(); try { const x = G && G.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) {} }
    };
    // размер холста по контейнеру фигуры
    const PAD = .06;
    function size() {
      if (!G) return;
      const r = fig.getBoundingClientRect(); if (!r.width) return;
      const d = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
      G.gl.viewport(0, 0, cv.width, cv.height);
    }
    // бабл эмоции — справа от головы, по координатам головы из метаданных
    function place() {
      if (!meta || !meta.head) return;
      const er = el.getBoundingClientRect(), fr = fig.getBoundingClientRect(); if (!fr.width) return;
      const k = 1 + (G ? PAD : .06), hx = .5 + (meta.head[0] - .5) / k, hy = .5 + (meta.head[1] - .5) / k, r = meta.head[2] / k * fr.width;
      emo.style.left = (fr.left - er.left + hx * fr.width + r * .75).toFixed(0) + 'px';
      emo.style.top = (fr.top - er.top + hy * fr.height - r * .7 - 40).toFixed(0) + 'px';
    }
    const ro = window.ResizeObserver ? new ResizeObserver(() => { size(); place(); }) : null; if (ro) ro.observe(fig);
    const io = null;
    function frame() {
      raf = 0;
      if (inst.dead || document.hidden) return;
      if (!el.isConnected) { if ((inst._dc = (inst._dc || 0) + 1) < 300) raf = requestAnimationFrame(frame); return; } // временно снят со страницы при перерисовке
      inst._dc = 0;
      { const r = el.getBoundingClientRect(); vis = r.bottom > 0 && r.top < innerHeight && r.width > 0; }
      if (!vis) { setTimeout(() => { raf = 0; loop(); }, 400); raf = -1; return; } // вне экрана — проверяем редко
      const t = (performance.now() - t0) / 1000;
      for (let i = 0; i < 3; i++) cur[i] += (tgt[i] - cur[i]) * .05;
      lx += (ptr.x - lx) * .06; ly += (ptr.y - ly) * .06;
      if (G && img) {
        const { gl, U } = G; gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(U.t, t * cur[2]); gl.uniform1f(U.br, cur[0]); gl.uniform1f(U.sw, cur[1]);
        gl.uniform1f(U.lx, lx); gl.uniform1f(U.ly, ly); gl.uniform1f(U.pad, PAD);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      fig.style.setProperty('--tx', (lx * 3).toFixed(2) + 'px');
      fig.style.setProperty('--rt', (lx * 1.2).toFixed(2) + 'deg');
      raf = requestAnimationFrame(frame);
    }
    function loop() { if (!raf && !RM) raf = requestAnimationFrame(frame); }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
    all.add(inst); el._h2d = inst;
    inst.setMood(o.mood || 'idle');
    if (o.acc) el.style.setProperty('--hacc', o.acc);
    if (o.src) inst.setHero(o.src, o.meta, o.acc);
    return inst;
  }

  const CSS = `
.h2d{position:relative;--hacc:#E0A43A;--ar:.5625;display:block;isolation:isolate;user-select:none;-webkit-user-select:none}
.h2d-fig{position:absolute;left:50%;bottom:4%;height:92%;aspect-ratio:calc(var(--ar) * 1.06)/1.06;transform:translateX(-50%) translateX(var(--tx,0)) rotate(var(--rt,0));transform-origin:50% 100%;transition:transform .2s ease-out}
.h2d-rx{position:absolute;inset:0;transform-origin:50% 100%}
.h2d-cv,.h2d-img{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.h2d-img{object-fit:contain;padding:3%;box-sizing:border-box;opacity:0}
.h2d.gl .h2d-img{display:none}
.h2d:not(.gl) .h2d-cv{display:none}
.h2d.ready .h2d-img,.h2d.ready .h2d-cv{opacity:1;transition:opacity .5s}
.h2d:not(.gl) .h2d-rx{animation:h2Breath 4s ease-in-out infinite}
@keyframes h2Breath{50%{transform:scale(1.008,1.012)}}
.h2d-aura{position:absolute;left:50%;bottom:6%;width:78%;height:70%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--hacc) 42%,transparent),color-mix(in srgb,var(--hacc) 12%,transparent) 60%,transparent);filter:blur(8px);animation:h2Aura 4.5s ease-in-out infinite;z-index:-2}
@keyframes h2Aura{50%{opacity:.65;transform:translateX(-50%) scale(1.05)}}
.h2d-floor{position:absolute;left:50%;bottom:3%;width:46%;height:5%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(40,28,10,.32),transparent);z-index:-1}
.h2d-sp{position:absolute;inset:8% 10% 4%;pointer-events:none;z-index:1}
.h2d-sp i{position:absolute;bottom:0;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px var(--hacc);opacity:0;animation:h2Spark 5s linear infinite}
.h2d-sp i:nth-child(1){left:8%;animation-delay:0s}.h2d-sp i:nth-child(2){left:22%;animation-delay:1.1s}.h2d-sp i:nth-child(3){left:36%;animation-delay:2.6s}
.h2d-sp i:nth-child(4){left:54%;animation-delay:.6s}.h2d-sp i:nth-child(5){left:70%;animation-delay:1.9s}.h2d-sp i:nth-child(6){left:86%;animation-delay:3.3s}
.h2d-sp i:nth-child(7){left:14%;animation-delay:3.9s}.h2d-sp i:nth-child(8){left:62%;animation-delay:4.4s}.h2d-sp i:nth-child(9){left:92%;animation-delay:.3s}
@keyframes h2Spark{0%{opacity:0;transform:translateY(0) scale(.6)}15%{opacity:.9}100%{opacity:0;transform:translateY(-320px) scale(1.1)}}
.h2d-emo{position:absolute;left:62%;top:4%;z-index:3;opacity:0;transform:scale(.4);transform-origin:0 100%;pointer-events:none}
.h2d-emo span{display:grid;place-items:center;min-width:42px;height:38px;padding:0 10px;border-radius:19px;background:#FFFDF7;color:#2A2230;font:800 20px/1 system-ui,sans-serif;box-shadow:0 6px 18px -6px rgba(60,40,10,.45),0 0 0 2px color-mix(in srgb,var(--hacc) 70%,#fff)}
.h2d-emo span::after{content:"";position:absolute;left:8px;bottom:-7px;width:12px;height:12px;background:#FFFDF7;transform:rotate(45deg);box-shadow:2px 2px 0 0 color-mix(in srgb,var(--hacc) 70%,#fff);border-radius:2px}
.h2d-emo.on{opacity:1;transform:scale(1);transition:opacity .25s,transform .45s cubic-bezier(.3,1.6,.5,1)}
.h2d-emo.pop span{animation:h2Pop .5s cubic-bezier(.3,1.6,.5,1)}
@keyframes h2Pop{0%{transform:scale(.3)}100%{transform:none}}
.h2d.m-alert .h2d-emo span{color:#D9362B}.h2d.m-sleep .h2d-emo span{color:#6A6CD8;font-size:15px;letter-spacing:.1em}
.h2d.m-think .h2d-emo span{letter-spacing:.05em}.h2d.m-happy .h2d-emo span,.h2d.m-proud .h2d-emo span{color:#C8902E}
.h2d.m-alert{--hacc:#F05A3E}.h2d.m-cry .h2d-fig{filter:saturate(.8) hue-rotate(-8deg)}
.h2d.m-sleep .h2d-fig{filter:brightness(.88) saturate(.85)}.h2d.m-sleep .h2d-aura{opacity:.4}
.h2d.m-happy .h2d-rx{animation:h2Hop 2.6s ease-in-out infinite}
@keyframes h2Hop{0%,70%,100%{transform:none}78%{transform:translateY(-3.5%) scaleY(1.01)}86%{transform:translateY(0) scaleY(.985)}}
.h2d.m-proud .h2d-aura{background:radial-gradient(closest-side,rgba(255,214,120,.65),rgba(255,214,120,.18) 60%,transparent)}
.h2d-rx.r-jump{animation:h2Jump .7s cubic-bezier(.3,1.4,.5,1)}
@keyframes h2Jump{0%{transform:scaleY(.94)}35%{transform:translateY(-9%) scaleY(1.04)}70%{transform:translateY(0) scaleY(.96)}100%{transform:none}}
.h2d-rx.r-victory{animation:h2Vic 1.3s cubic-bezier(.3,1.3,.5,1)}
@keyframes h2Vic{0%{transform:none}20%{transform:translateY(-12%) scale(1.04)}40%{transform:translateY(0) scale(.98)}55%{transform:translateY(-5%)}75%,100%{transform:none}}
.h2d.r-victory .h2d-aura{animation:h2Flash 1.3s ease-out}
@keyframes h2Flash{15%{opacity:1;transform:translateX(-50%) scale(1.5);filter:blur(4px) brightness(1.6)}}
.h2d.r-victory .h2d-fig::after,.h2d.r-appear .h2d-fig::after{content:"";position:absolute;inset:-10% -20%;background:radial-gradient(closest-side,rgba(255,255,255,.9),transparent);mix-blend-mode:screen;animation:h2Glow 1.1s ease-out forwards;pointer-events:none}
@keyframes h2Glow{0%{opacity:0}20%{opacity:.85}100%{opacity:0}}
.h2d-rx.r-shake{animation:h2Shake .5s ease-in-out}
@keyframes h2Shake{20%,60%{transform:translateX(-2.5%) rotate(-1deg)}40%,80%{transform:translateX(2.5%) rotate(1deg)}}
.h2d-rx.r-bow,.h2d-rx.r-nod{animation:h2Bow 1s ease-in-out}
@keyframes h2Bow{40%{transform:scaleY(.95) translateY(1.5%) skewX(-1deg)}}
.h2d-rx.r-spin,.h2d-rx.r-wave{animation:h2Turn 1s cubic-bezier(.4,1.4,.5,1)}
@keyframes h2Turn{30%{transform:translateY(-6%) scaleX(-1)}60%{transform:translateY(0) scaleX(1)}}
.h2d-rx.r-surprised{animation:h2Jump .6s cubic-bezier(.3,1.6,.5,1)}
.h2d-rx.r-appear{animation:h2Appear 1.2s cubic-bezier(.2,1.2,.3,1)}
@keyframes h2Appear{0%{transform:translateY(8%) scale(.86);filter:brightness(2.5) blur(6px);opacity:0}60%{filter:brightness(1.3) blur(0);opacity:1}100%{transform:none;filter:none}}
.h2d-fig.swap{animation:h2Swap .55s cubic-bezier(.2,1,.3,1)}
@keyframes h2Swap{0%{filter:brightness(2.4) blur(5px);opacity:.2;transform:translateX(-50%) scale(.92)}100%{filter:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.h2d *{animation:none!important;transition:none!important}}`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  window.Hero2D = { mount, EMO };
})();
