/* Живые сцены эпох: 5–7 слоёв для параллакса + живые детали. Подменяют простые рисунки из epochs.js. */
(function () {
  'use strict';
  const L = (d, s) => '<g class="lay" data-d="' + d + '">' + s + '</g>';
  const pat = (id, w, h, body) => '<pattern id="' + id + '" width="' + w + '" height="' + h + '" patternUnits="userSpaceOnUse">' + body + '</pattern>';
  let U = 0;
  function frame(a, defs, body, cls) {
    const u = '_' + (++U);
    const s = '<svg class="scene-bg ' + (cls || '') + '" viewBox="0 0 400 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>' +
      '<linearGradient id="eSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a.sky[0] + '"/><stop offset=".6" stop-color="' + a.sky[1] + '"/><stop offset="1" stop-color="' + a.sky[2] + '"/></linearGradient>' +
      '<radialGradient id="eGlow"><stop offset="0" stop-color="' + a.disc + '" stop-opacity=".6"/><stop offset="1" stop-color="' + a.disc + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="eFog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a.sky[2] + '" stop-opacity="0"/><stop offset="1" stop-color="' + a.sky[2] + '" stop-opacity=".55"/></linearGradient>' +
      '<linearGradient id="eGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a.near + '"/><stop offset="1" stop-color="#000"/></linearGradient>' +
      defs + '</defs>' +
      '<rect width="400" height="400" fill="url(#eSky)"/>' + body + '</svg>';
    return s.replace(/\b(eSky|eGlow|eFog|eGround|p[A-Z][a-z]+)\b/g, m => m + u);
  }
  const disc = (a, x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + r * 3.4 + '" fill="url(#eGlow)" class="amb-pulse"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + a.disc + '"/>';
  const stars = (n, maxY, seed) => { let s = seed || 3, o = ''; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) o += '<circle class="star" cx="' + (r() * 400).toFixed(1) + '" cy="' + (r() * maxY).toFixed(1) + '" r="' + (r() * 1.1 + .35).toFixed(2) + '" fill="#fff" style="animation-delay:' + (r() * 3).toFixed(2) + 's"/>'; return o; };
  const cloud = (x, y, s, fill, op, cls) => '<g class="amb-cloud ' + (cls || '') + '" opacity="' + op + '" fill="' + fill + '"><g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><ellipse cx="0" cy="0" rx="40" ry="11"/><ellipse cx="-14" cy="-8" rx="18" ry="12"/><ellipse cx="12" cy="-11" rx="22" ry="15"/></g></g>';
  const birds = (x, y, c) => '<g class="amb-bird" fill="none" stroke="' + c + '" stroke-width="1.6" stroke-linecap="round"><g transform="translate(' + x + ' ' + y + ')"><path class="wing" d="M0 0q5-5 9 0q4-5 9 0"/><path class="wing" d="M24 10q4-4 7 0q3-4 7 0"/></g></g>';
  const grass = (y, c, n, seed) => { let s = seed || 5, o = ''; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) { const x = r() * 400, h = 10 + r() * 16, b = (r() - .5) * 8; o += '<path class="amb-grass" style="animation-delay:-' + (r() * 3).toFixed(2) + 's;transform-origin:' + x.toFixed(0) + 'px ' + y + 'px" d="M' + x.toFixed(1) + ' ' + y + ' q' + (b / 2).toFixed(1) + ' ' + (-h / 2).toFixed(1) + ' ' + b.toFixed(1) + ' ' + (-h).toFixed(1) + '" stroke="' + c + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>'; } return o; };
  const band = (id, y, a) => '<rect x="0" y="' + y + '" width="400" height="26" fill="' + a.near + '"/><rect class="amb-draw" x="0" y="' + y + '" width="400" height="26" fill="url(#' + id + ')"/>' +
    '<line x1="0" x2="400" y1="' + y + '" y2="' + y + '" stroke="' + a.line + '" stroke-width="1.2" opacity=".85"/><line x1="0" x2="400" y1="' + (y + 26) + '" y2="' + (y + 26) + '" stroke="' + a.line + '" stroke-width=".8" opacity=".5"/>';
  const ground = (a, d) => '<path d="' + d + ' V400 H0Z" fill="url(#eGround)"/>';
  const fog = y => '<rect x="0" y="' + (y - 60) + '" width="400" height="70" fill="url(#eFog)"/>';
  const flag = (x, y, c) => '<g transform="translate(' + x + ' ' + y + ')"><rect x="0" y="0" width="2" height="30" fill="#2A1A12"/><path class="amb-flag" d="M2 2 q8 -3 16 1 q6 3 12 0 v12 q-6 3 -12 0 q-8 -4 -16 -1z" fill="' + c + '"/></g>';
  const torch = (x, y) => '<g transform="translate(' + x + ' ' + y + ')"><rect x="-1.5" y="0" width="3" height="12" fill="#2A1A12"/><path class="amb-flame" d="M0 -12 q6 7 2 12 h-4 q-4 -5 2 -12z" fill="#FFB347"/><circle class="amb-pulse" cx="0" cy="-4" r="9" fill="#FFB347" opacity=".25"/></g>';

  const S = {
    kz(a) {
      const p = pat('pKz', 40, 26, '<path d="M8 20 C2 20 2 8 10 8 C16 8 16 15 11 15 M32 20 C38 20 38 8 30 8 C24 8 24 15 29 15 M20 22 V6" fill="none" stroke="' + a.line + '" stroke-width="1.6" stroke-linecap="round"/>');
      return frame(a, p,
        L(.05, disc(a, 286, 132, 30) + '<g transform="translate(286 132)" fill="none" stroke="' + a.near + '" stroke-width="2" opacity=".5" class="amb-spin"><circle r="30"/><circle r="21"/><path d="M-30 0H30M-26 -15L26 15M-26 15L26 -15M0 -30V30"/></g>') +
        L(.1, cloud(110, 70, 1, '#fff', .55) + cloud(330, 210, .7, '#fff', .35, 'c2')) +
        L(.18, '<path d="M0 214 L40 186 L70 198 L110 160 L150 192 L190 172 L230 196 L270 178 L320 202 L360 182 L400 196 V260 H0Z" fill="' + a.far + '" opacity=".9"/><path d="M110 160 L124 170 L116 169 L130 180Z M270 178 L281 186 L274 186Z M360 182 L370 189 L364 189Z" fill="#EEF3FB" opacity=".8"/>' + fog(220)) +
        L(.32, '<path d="M0 236 C90 220 170 228 250 224 C320 220 360 212 400 218 V270 H0Z" fill="' + a.mid + '"/>' +
          '<g transform="translate(64 226)"><path d="M-18 0 Q-6 -16 0 -17 Q6 -16 18 0Z" fill="#F7EEDF"/><rect x="-18" y="0" width="36" height="11" fill="#F7EEDF"/><rect x="-4" y="2" width="8" height="9" rx="1" fill="#B0402A"/><path d="M-18 4h36M-18 8h36" stroke="#CDB797" stroke-width=".6"/></g>' +
          '<path class="amb-smoke" d="M64 208 q-4 -10 2 -18 q6 -8 0 -18" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>') +
        L(.5, '<g fill="' + a.near + '" class="amb-ride"><path d="M150 236 c4-8 14-10 22-7 l6-6 2 2-4 6 c3 2 3 6 1 9 l-2 0 0-4 -10 0 -2 4 -2 0 0-4 c-5 0-9 0-11 0z"/><path d="M162 224 c0-5 4-8 7-6 l1 6z"/></g>' + birds(10, 96, a.near)) +
        L(.75, ground(a, 'M0 252 C110 244 220 254 400 246') + band('pKz', 252, a)) +
        L(1, grass(256, a.mid, 40, 7)), 'sc-kz');
    },
    sumer(a) {
      const p = pat('pSu', 24, 26, '<path d="M4 6 l6 3 -6 3z M14 14 l6 3 -6 3z M14 4 h6 M4 18 h6" fill="' + a.line + '" stroke="' + a.line + '" stroke-width="1.2"/>');
      return frame(a, p,
        L(.05, disc(a, 92, 116, 26)) + L(.1, cloud(300, 80, .8, '#FFE2C2', .4)) +
        L(.18, '<path d="M0 214 C80 204 160 210 240 206 C310 202 360 208 400 204 V260 H0Z" fill="' + a.far + '"/>' + fog(214)) +
        L(.36, '<g fill="' + a.mid + '"><rect x="190" y="196" width="170" height="30"/><rect x="214" y="170" width="122" height="28"/><rect x="238" y="146" width="74" height="26"/><rect x="258" y="126" width="34" height="22"/></g>' +
          '<path d="M268 226 L268 146 M282 226 L282 146" stroke="' + a.line + '" stroke-width="2" opacity=".6"/><g stroke="' + a.near + '" stroke-width="1" opacity=".35"><path d="M190 208H360M214 182H336M238 158H312"/></g>' +
          torch(250, 134) + torch(300, 134) + torch(205, 184) + torch(345, 184)) +
        L(.55, '<g fill="' + a.near + '"><path d="M60 228 q4-30 2-52 h3 q4 22 -1 52z"/><g class="amb-palm" style="transform-origin:64px 176px"><path d="M64 176 q-22-4 -30 8 q14-8 30-4z M64 176 q20-8 32 2 q-16-4 -32 0z M64 176 q-6-16 -20-18 q12 6 20 18z M64 176 q10-16 24-14 q-14 4 -24 14z"/></g>' +
          '<path d="M128 230 q3-22 1-40 h3 q3 18 -1 40z"/><g class="amb-palm" style="transform-origin:131px 190px;animation-delay:-1.3s"><path d="M131 190 q-16-3 -22 6 q10-6 22-3z M131 190 q15-6 24 1 q-12-3 -24-1z M131 190 q-4-12 -15-13 q9 4 15 13z"/></g></g>') +
        L(.7, '<path d="M0 238 C80 232 150 244 230 236 C300 230 350 240 400 234 L400 250 C340 254 300 246 230 252 C150 258 80 248 0 254Z" fill="#7FA9C9" opacity=".8"/><path class="amb-wave" d="M20 244 C80 238 140 250 210 242 C280 236 330 246 390 240" stroke="#DDEBF5" stroke-width="1.4" fill="none" opacity=".7"/>') +
        L(.85, ground(a, 'M0 254 C120 250 260 258 400 252') + band('pSu', 256, a)), 'sc-sumer');
    },
    egypt(a) {
      const p = pat('pEg', 20, 26, '<path d="M0 4 h20 M0 22 h20" stroke="' + a.line + '" stroke-width="1.2"/><path d="M4 18 l6-10 6 10z" fill="none" stroke="' + a.line + '" stroke-width="1.3"/><circle cx="10" cy="13" r="1.4" fill="' + a.line + '"/>');
      return frame(a, p,
        L(.05, disc(a, 300, 104, 24) + '<g transform="translate(300 104)" fill="' + a.disc + '" opacity=".6" class="amb-wings"><path d="M-46 -2 q-20 -6 -34 2 q16 0 34 4z M46 -2 q20 -6 34 2 q-16 0 -34 4z"/></g>') +
        L(.12, birds(30, 140, '#1E2436')) +
        L(.2, '<path d="M0 222 C100 216 300 224 400 218 V270 H0Z" fill="' + a.far + '" opacity=".7"/>' + fog(224)) +
        L(.38, '<g class="amb-heat"><path d="M150 230 L230 138 L310 230Z" fill="' + a.mid + '"/><path d="M230 138 L310 230 L262 230Z" fill="' + a.near + '" opacity=".28"/>' +
          '<path d="M60 230 L118 164 L176 230Z" fill="' + a.far + '"/><path d="M118 164 L176 230 L140 230Z" fill="' + a.near + '" opacity=".22"/>' +
          '<path d="M300 230 L340 184 L380 230Z" fill="' + a.far + '"/><path d="M340 184 L380 230 L356 230Z" fill="' + a.near + '" opacity=".22"/>' +
          '<path d="M226 142 L230 138 L234 142Z" fill="#FFF3C0"/></g>') +
        L(.6, '<g fill="' + a.near + '"><path d="M30 238 q2-26 0-44 h3 q2 20 -1 44z"/><g class="amb-palm" style="transform-origin:32px 194px"><path d="M32 194 q-16-3 -22 6 q10-6 22-3z M32 194 q15-6 24 1 q-12-3 -24-1z M32 194 q-4-12 -15-13 q9 4 15 13z"/></g></g>') +
        L(.72, '<path d="M0 238 C90 234 170 244 250 238 C320 233 360 240 400 236 L400 250 C340 254 300 246 230 252 C150 258 80 248 0 254Z" fill="#3E8FC4"/><path class="amb-wave" d="M10 245 C80 240 160 250 240 244 C300 240 350 246 396 242" stroke="#BFE3FA" stroke-width="1.3" fill="none" opacity=".75"/>' +
          '<g class="amb-boat"><path d="M120 244 q20 8 40 0 l-4 5 h-32z" fill="' + a.near + '"/><path d="M140 244 v-22 l12 18z" fill="#F4E7C9"/></g>') +
        L(.85, ground(a, 'M0 254 C120 250 260 258 400 252') + band('pEg', 256, a)), 'sc-egypt');
    },
    greece(a) {
      const p = pat('pGr', 26, 26, '<path d="M2 22 V4 H22 V18 H8 V10 H16 V14" fill="none" stroke="' + a.line + '" stroke-width="2"/>');
      let cols = ''; for (let i = 0; i < 6; i++) cols += '<rect x="' + (214 + i * 22) + '" y="164" width="11" height="54" fill="' + a.mid + '"/><path d="M' + (217 + i * 22) + ' 166 V216 M' + (221 + i * 22) + ' 166 V216" stroke="#C9C1B1" stroke-width=".8"/>';
      return frame(a, p,
        L(.05, disc(a, 96, 92, 20)) + L(.1, cloud(300, 74, .9, '#fff', .7) + cloud(80, 160, .6, '#fff', .45, 'c2') + birds(200, 110, '#13213A')) +
        L(.2, '<path d="M0 222 C70 200 140 206 200 214 C270 222 330 196 400 206 V270 H0Z" fill="' + a.far + '"/>' + fog(220)) +
        L(.4, '<path d="M206 162 L276 138 L346 162Z" fill="' + a.mid + '"/><rect x="204" y="160" width="144" height="6" fill="' + a.mid + '"/>' + cols +
          '<rect x="200" y="216" width="152" height="6" fill="' + a.mid + '"/><rect x="194" y="222" width="164" height="6" fill="' + a.mid + '"/><path d="M262 150 L276 145 L290 150" stroke="#C9C1B1" fill="none"/>' +
          '<g fill="#2C4A2A"><path d="M170 228 q-8-34 4-62 q10 28 4 62z"/><path d="M372 228 q-6-26 3-48 q8 22 3 48z"/></g>') +
        L(.65, '<path d="M0 236 C100 230 200 238 300 232 C340 230 370 232 400 230 V262 H0Z" fill="#1F5E9C"/>' +
          '<g class="amb-glints" fill="#E8F4FF">' + [30, 70, 120, 170, 240, 290, 340, 380].map((x, i) => '<rect class="glint" x="' + x + '" y="' + (240 + (i % 3) * 5) + '" width="' + (10 + (i % 2) * 8) + '" height="1.6" rx=".8" style="animation-delay:' + (i * .37).toFixed(2) + 's"/>').join('') + '</g>' +
          '<g class="amb-boat"><path d="M40 248 q16 6 32 0 l-3 4 h-26z" fill="#13213A"/><path d="M56 248 v-20 l11 16z" fill="#E9E3D6"/></g>') +
        L(.85, ground(a, 'M0 256 C120 252 260 258 400 254') + band('pGr', 256, a)), 'sc-greece');
    },
    rome(a) {
      const p = pat('pRo', 30, 26, '<ellipse cx="9" cy="13" rx="5" ry="7" fill="none" stroke="' + a.line + '" stroke-width="1.4"/><path d="M21 6 L24 13 L21 20 L18 13Z" fill="' + a.line + '"/>');
      let arc = ''; for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const x = 160 + i * 30, y = 138 + r * 30; arc += '<path d="M' + (x + 5) + ' ' + (y + 28) + ' V' + (y + 14) + ' a10 10 0 0 1 20 0 V' + (y + 28) + 'Z" fill="' + a.near + '" opacity=".75"/>'; }
      return frame(a, p,
        L(.05, disc(a, 84, 148, 28)) + L(.1, cloud(260, 70, 1, '#FFD9C0', .5) + cloud(120, 96, .7, '#FFD9C0', .35, 'c2')) +
        L(.2, '<path d="M0 220 C80 206 160 214 240 210 C320 206 360 214 400 210 V270 H0Z" fill="' + a.far + '" opacity=".6"/>' + fog(222)) +
        L(.4, '<path d="M150 228 V132 Q240 112 380 132 V228Z" fill="' + a.mid + '"/>' + arc + '<path d="M150 132 Q240 112 380 132" fill="none" stroke="' + a.line + '" stroke-width="2"/>' +
          flag(190, 92, '#9A1F2A') + flag(330, 92, '#9A1F2A')) +
        L(.62, '<g fill="' + a.near + '"><path d="M60 230 q-8-40 4-74 q10 34 4 74z"/><path d="M96 232 q-6-30 3-56 q8 26 3 56z"/><path d="M118 232 q-5-24 2-44 q7 20 2 44z"/></g>') +
        L(.85, ground(a, 'M0 250 C120 246 260 254 400 248') + band('pRo', 252, a)), 'sc-rome');
    },
    persia(a) {
      const p = pat('pPe', 26, 26, '<g transform="translate(13 13)" fill="none" stroke="' + a.line + '" stroke-width="1.3"><circle r="3"/><path d="M0-9V-4M0 4V9M-9 0H-4M4 0H9M-6-6L-3-3M3 3L6 6M-6 6L-3 3M3-3L6-6"/></g>');
      let cols = ''; [180, 214, 248, 282, 316].forEach((x, i) => { const h = [70, 92, 60, 92, 76][i]; cols += '<rect x="' + x + '" y="' + (228 - h) + '" width="9" height="' + h + '" fill="' + a.mid + '"/><path d="M' + (x - 8) + ' ' + (228 - h) + ' h25 l-4 -8 h-17z" fill="' + a.mid + '"/><path d="M' + (x - 4) + ' ' + (220 - h) + ' q8 -6 16 0" stroke="' + a.mid + '" stroke-width="3" fill="none"/>'; });
      return frame(a, p,
        L(.05, disc(a, 110, 110, 24)) + L(.1, cloud(300, 70, .8, '#FFF1D2', .45)) +
        L(.18, '<path d="M0 214 L60 176 L120 200 L170 160 L230 196 L290 170 L350 198 L400 182 V270 H0Z" fill="' + a.far + '" opacity=".85"/>' + fog(220)) +
        L(.4, '<rect x="160" y="226" width="190" height="8" fill="' + a.mid + '"/>' + cols + flag(170, 150, '#0E6E78') + torch(352, 210)) +
        L(.6, '<g fill="' + a.near + '" opacity=".9"><path d="M40 232 q-6-28 3-50 q8 22 3 50z"/><path d="M70 234 q-5-22 2-40 q7 18 2 40z"/></g>') +
        L(.85, ground(a, 'M0 250 C120 246 260 254 400 248') + band('pPe', 252, a)), 'sc-persia');
    },
    native(a) {
      const p = pat('pNa', 28, 26, '<path d="M14 3 L22 13 L14 23 L6 13Z M14 8 L18 13 L14 18 L10 13Z" fill="none" stroke="' + a.line + '" stroke-width="1.4"/><path d="M0 13h4M24 13h4" stroke="' + a.line + '" stroke-width="1.4"/>');
      return frame(a, p,
        L(0, stars(40, 130, 11) + '<line class="shoot" x1="40" y1="30" x2="170" y2="96" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>') + L(.05, disc(a, 300, 150, 22)) +
        L(.2, '<path d="M0 228 V176 h40 l6 -6 h54 l8 8 V228Z" fill="' + a.far + '"/><path d="M300 228 V190 h30 l6 -8 h44 l6 10 h14 V228Z" fill="' + a.far + '"/>' + fog(226)) +
        L(.36, '<path d="M150 228 V150 h18 l4 -6 h40 l6 8 h12 V228Z" fill="' + a.mid + '"/><g stroke="' + a.near + '" stroke-width="1" opacity=".3"><path d="M0 190h108M150 166h80M300 200h100"/></g>') +
        L(.55, '<path d="M0 232 C80 226 160 236 240 230 C310 225 360 232 400 228 V270 H0Z" fill="' + a.mid + '" opacity=".75"/>' +
          '<path class="amb-wave" d="M140 240 C190 236 230 248 300 242" fill="none" stroke="#7FB5C9" stroke-width="5" stroke-linecap="round" opacity=".7"/>' +
          '<g transform="translate(96 236)"><path d="M-6 0 l6 -4 6 4z" fill="#3A2A1E"/><path class="amb-flame" d="M0 -10 q5 6 1 9 h-2 q-4 -4 1 -9z" fill="#FFB347"/><circle class="amb-pulse" cx="0" cy="-4" r="12" fill="#FFB347" opacity=".22"/>' +
          '<path class="amb-smoke" d="M0 -14 q-4 -10 2 -18 q6 -8 0 -18" stroke="#fff" stroke-width="2.4" fill="none" opacity=".3"/></g>') +
        L(.85, ground(a, 'M0 252 C120 248 260 256 400 250') + band('pNa', 254, a)), 'sc-native');
    },
    vikings(a) {
      const p = pat('pVi', 26, 26, '<path d="M0 13 Q6.5 3 13 13 T26 13" fill="none" stroke="' + a.line + '" stroke-width="1.6"/><path d="M0 20 Q6.5 10 13 20 T26 20" fill="none" stroke="' + a.line + '" stroke-width="1" opacity=".6"/>');
      return frame(a, p,
        L(0, stars(50, 160, 5) + '<g class="amb-aurora"><path d="M-40 80 C60 40 120 110 200 70 C280 30 330 90 440 50" fill="none" stroke="#6CF2B8" stroke-width="18" opacity=".26" stroke-linecap="round"/>' +
          '<path d="M-40 104 C70 70 140 130 220 96 C300 62 350 112 440 84" fill="none" stroke="#7FD6FF" stroke-width="10" opacity=".2" stroke-linecap="round"/><path d="M-40 60 C60 30 150 80 230 50 C300 26 360 60 440 34" fill="none" stroke="#B48CFF" stroke-width="8" opacity=".14" stroke-linecap="round"/></g>') +
        L(.05, '<circle cx="320" cy="64" r="14" fill="' + a.disc + '" opacity=".9"/><circle cx="320" cy="64" r="44" fill="url(#eGlow)" class="amb-pulse"/>') +
        L(.22, '<path d="M0 232 L0 118 L30 138 L60 108 L90 170 L112 234Z" fill="' + a.far + '"/><path d="M400 234 L400 108 L370 128 L340 102 L310 160 L288 234Z" fill="' + a.far + '"/><path d="M58 110 l8 12 -8 -3z M340 104 l8 12 -8 -2z" fill="#DDEEF5" opacity=".6"/>') +
        L(.45, '<g class="amb-ship"><g fill="' + a.near + '"><path d="M140 228 Q200 244 270 228 L276 214 Q280 206 286 210 Q282 214 280 222 Z"/><path d="M140 228 L134 214 Q130 206 124 210 Q128 214 130 222Z"/><rect x="204" y="150" width="3" height="76"/></g>' +
          '<path class="amb-sail" d="M172 156 h68 l-6 56 h-56z" fill="#8C2F2F"/><path d="M172 170 h68 M174 186 h64 M176 200 h60" stroke="#E7DCC8" stroke-width="5" opacity=".9"/>' +
          '<g fill="#C9A15A">' + [158, 174, 190, 206, 222, 238, 254].map(x => '<circle cx="' + x + '" cy="226" r="4"/>').join('') + '</g></g>') +
        L(.7, '<path d="M0 232 C100 226 300 236 400 230 V270 H0Z" fill="' + a.mid + '"/><path class="amb-wave" d="M10 240 C90 234 170 246 250 238 C320 232 360 242 396 236" stroke="#A9D4E0" stroke-width="1.3" fill="none" opacity=".6"/>') +
        L(.85, ground(a, 'M0 252 C120 248 260 256 400 250') + band('pVi', 254, a)), 'sc-vikings');
    },
    medieval(a) {
      const p = pat('pMe', 26, 26, '<g transform="translate(13 13)" fill="none" stroke="' + a.line + '" stroke-width="1.3"><circle cx="0" cy="-5" r="4"/><circle cx="0" cy="5" r="4"/><circle cx="-5" cy="0" r="4"/><circle cx="5" cy="0" r="4"/></g>');
      return frame(a, p,
        L(0, stars(22, 100, 9)) + L(.05, disc(a, 86, 92, 16)) + L(.1, cloud(240, 60, .8, '#C9C3EE', .3) + birds(300, 110, a.near)) +
        L(.2, '<path d="M0 226 C60 196 120 210 170 214 C240 220 300 190 400 204 V270 H0Z" fill="' + a.far + '"/>' + fog(222)) +
        L(.4, '<g fill="' + a.mid + '"><rect x="200" y="140" width="34" height="90"/><path d="M200 140 L217 90 L234 140Z"/><rect x="296" y="140" width="34" height="90"/><path d="M296 140 L313 90 L330 140Z"/>' +
          '<rect x="234" y="160" width="62" height="70"/><path d="M234 160 L265 126 L296 160Z"/></g>' +
          '<g class="amb-window"><circle cx="265" cy="176" r="13" fill="' + a.disc + '"/><g stroke="' + a.mid + '" stroke-width="1.6"><path d="M265 163V189M252 176H278M256 167L274 185M256 185L274 167"/></g>' +
          '<g fill="' + a.disc + '"><path d="M212 200 v-12 a5 5 0 0 1 10 0 v12z"/><path d="M308 200 v-12 a5 5 0 0 1 10 0 v12z"/><path d="M212 160 v-10 a5 5 0 0 1 10 0 v10z"/><path d="M308 160 v-10 a5 5 0 0 1 10 0 v10z"/></g></g>' +
          flag(215, 70, '#9E2B2B')) +
        L(.6, '<g fill="' + a.near + '"><rect x="40" y="186" width="16" height="44"/><rect x="56" y="200" width="40" height="30"/><rect x="96" y="180" width="16" height="50"/><path d="M40 186h16v-6h-4v4h-4v-4h-4v4h-4z M96 180h16v-6h-4v4h-4v-4h-4v4h-4z"/></g>' + torch(76, 196)) +
        L(.85, ground(a, 'M0 248 C120 244 260 252 400 246') + band('pMe', 250, a)), 'sc-medieval');
    },
    mongol(a) {
      const p = pat('pMo', 26, 26, '<path d="M3 6 H23 V20 H9 V12 H17 M3 6 V20" fill="none" stroke="' + a.line + '" stroke-width="1.6"/>');
      return frame(a, p,
        L(.05, disc(a, 300, 92, 20)) + L(.12, cloud(100, 80, 1, '#fff', .85) + cloud(250, 150, .7, '#fff', .55, 'c2') + birds(180, 120, '#1A2232')) +
        L(.2, '<path d="M0 214 L50 192 L100 204 L160 178 L220 200 L280 186 L340 204 L400 190 V270 H0Z" fill="' + a.far + '"/>' + fog(218)) +
        L(.36, '<path d="M0 232 C100 220 200 230 300 224 C350 221 380 226 400 224 V270 H0Z" fill="' + a.mid + '"/>' +
          '<g transform="translate(110 226)"><path d="M-22 0 Q0 -22 22 0Z" fill="#F4EEE2"/><rect x="-22" y="0" width="44" height="12" fill="#F4EEE2"/><rect x="-5" y="2" width="10" height="10" fill="#B0402A"/></g>' +
          '<path class="amb-smoke" d="M110 200 q-4 -10 2 -18 q6 -8 0 -18" stroke="#fff" stroke-width="3" fill="none" opacity=".4"/>') +
        L(.55, '<g fill="' + a.near + '" class="amb-ride">' + [230, 262, 294].map((x, i) => '<path transform="translate(' + x + ' ' + (222 + i * 2) + ')" d="M0 0 c4-8 14-10 22-7 l6-6 2 2-4 6 c3 2 3 6 1 9 l-2 0 0-4 -10 0 -2 4 -2 0 0-4 c-5 0-9 0-11 0z M12 -8 c0-5 4-8 7-6 l1 6z"/>').join('') +
          '<rect x="246" y="168" width="2" height="48"/></g><path class="amb-flag" d="M248 170 q10 4 20 0 q-4 6 0 12 q-10 4 -20 0z" fill="#B0302A"/>') +
        L(.85, ground(a, 'M0 250 C120 246 260 254 400 248') + band('pMo', 252, a)) +
        L(1, grass(254, a.mid, 34, 13)), 'sc-mongol');
    },
    japan(a) {
      const p = pat('pJa', 28, 14, '<g fill="none" stroke="' + a.line + '" stroke-width="1.2"><path d="M0 14 a14 14 0 0 1 28 0"/><path d="M5 14 a9 9 0 0 1 18 0"/><path d="M10 14 a4 4 0 0 1 8 0"/><path d="M-14 7 a14 14 0 0 1 28 0 M14 7 a14 14 0 0 1 28 0" opacity=".7"/></g>');
      return frame(a, p,
        L(.04, '<circle cx="290" cy="106" r="46" fill="' + a.disc + '"/><circle cx="290" cy="106" r="110" fill="' + a.disc + '" opacity=".06" class="amb-pulse"/>') +
        L(.1, '<g class="amb-cloud" opacity=".85"><path d="M40 120 h90 q-6 -8 -18 -6 q-6 -10 -22 -4 q-12 -8 -24 2 q-14 -2 -14 8z" fill="#fff"/></g>' + birds(150, 80, '#2D4A66')) +
        L(.2, '<path d="M60 226 L170 118 Q180 110 190 118 L300 226Z" fill="' + a.far + '"/><path d="M152 136 L170 118 Q180 110 190 118 L208 136 L196 132 L188 140 L180 130 L170 140 L164 132Z" fill="#fff"/>' + fog(220)) +
        L(.42, '<g fill="' + a.near + '"><rect x="334" y="150" width="4" height="80"/>' + [0, 1, 2, 3].map(i => '<path d="M' + (312 + i * 4) + ' ' + (226 - i * 22) + ' Q336 ' + (216 - i * 22) + ' ' + (360 - i * 4) + ' ' + (226 - i * 22) + ' L' + (352 - i * 4) + ' ' + (222 - i * 22) + ' L' + (320 + i * 4) + ' ' + (222 - i * 22) + 'Z"/><rect x="' + (324 + i * 3) + '" y="' + (212 - i * 22) + '" width="' + (24 - i * 6) + '" height="10"/>').join('') + '</g>' +
          '<g fill="#3A1A22"><path d="M30 232 q2 -30 -6 -50 l4 0 q8 20 6 50z"/></g><g fill="#F2A7B8" class="amb-blossom"><circle cx="22" cy="180" r="16"/><circle cx="40" cy="172" r="14"/><circle cx="10" cy="168" r="11"/><circle cx="32" cy="160" r="12"/></g>') +
        L(.65, '<path d="M0 232 C60 220 110 238 170 230 C230 222 280 236 340 228 C370 224 390 228 400 226 V270 H0Z" fill="' + a.mid + '"/>' +
          '<path class="amb-wave" d="M0 240 q20-12 40 0 q20-12 40 0 q20-12 40 0 q20-12 40 0 q20-12 40 0 q20-12 40 0 q20-12 40 0 q20-12 40 0 q20-12 40 0 q20-12 40 0" fill="none" stroke="#fff" stroke-width="1.6" opacity=".55"/>') +
        L(.85, ground(a, 'M0 252 C120 248 260 256 400 250') + band('pJa', 254, a)), 'sc-japan');
    },
    maya(a) {
      const p = pat('pMa', 26, 26, '<path d="M2 22 H24 V4 H8 V16 H18 V10 H13" fill="none" stroke="' + a.line + '" stroke-width="1.8"/>');
      let steps = ''; for (let i = 0; i < 7; i++) steps += '<rect x="' + (190 + i * 9) + '" y="' + (220 - i * 12) + '" width="' + (150 - i * 18) + '" height="12" fill="' + a.mid + '"/>';
      return frame(a, p,
        L(.05, disc(a, 110, 118, 22)) + L(.1, cloud(300, 76, .8, '#FFF0C9', .4) + birds(40, 70, '#0C1A14')) +
        L(.18, '<g fill="' + a.far + '" opacity=".7"><circle cx="60" cy="214" r="40"/><circle cx="130" cy="220" r="34"/><circle cx="380" cy="214" r="40"/></g>' + fog(226)) +
        L(.38, steps + '<rect x="246" y="118" width="38" height="20" fill="' + a.mid + '"/><rect x="258" y="124" width="14" height="14" fill="' + a.near + '"/><rect x="242" y="112" width="46" height="6" fill="' + a.mid + '"/>' +
          '<rect x="259" y="138" width="12" height="94" fill="' + a.near + '" opacity=".25"/>' + torch(244, 106) + torch(286, 106)) +
        L(.58, '<g fill="' + a.far + '"><circle cx="40" cy="206" r="34"/><circle cx="90" cy="216" r="30"/><circle cx="140" cy="210" r="26"/><circle cx="370" cy="206" r="34"/><circle cx="330" cy="222" r="22"/></g>' +
          '<g fill="' + a.near + '" opacity=".6" class="amb-palm" style="transform-origin:40px 240px"><circle cx="20" cy="226" r="26"/><circle cx="64" cy="232" r="22"/></g><g fill="' + a.near + '" opacity=".6"><circle cx="390" cy="230" r="24"/></g>') +
        L(.72, '<path d="M0 236 C100 230 300 238 400 232 V270 H0Z" fill="' + a.far + '"/>') +
        L(.85, ground(a, 'M0 250 C120 246 260 254 400 248') + band('pMa', 252, a)), 'sc-maya');
    }
  };

  const CSS = `
  .scene-bg .star{animation:scTw 3s ease-in-out infinite}
  .scene-bg .shoot{stroke-dasharray:60 400;stroke-dashoffset:460;animation:scShoot 9s ease-in 3s infinite}
  .scene-bg .amb-cloud{animation:scDrift 70s linear infinite alternate}
  .scene-bg .amb-cloud.c2{animation-duration:95s;animation-direction:alternate-reverse}
  .scene-bg .amb-bird{animation:scFly 32s linear infinite}
  .scene-bg .amb-bird .wing{animation:scFlap .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
  .scene-bg .amb-grass{animation:scSway 3.2s ease-in-out infinite;transform-box:view-box}
  .scene-bg .amb-palm{animation:scPalm 5s ease-in-out infinite;transform-box:view-box}
  .scene-bg .amb-flame{animation:scFlame .45s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
  .scene-bg .amb-pulse{animation:scPulse 3.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  .scene-bg .amb-smoke{stroke-dasharray:4 6;animation:scSmoke 3s linear infinite}
  .scene-bg .amb-wave{stroke-dasharray:14 22;animation:scFlow 6s linear infinite}
  .scene-bg .amb-flag{animation:scFlag 1.4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:0 50%}
  .scene-bg .amb-aurora{animation:scAurora 9s ease-in-out infinite alternate}
  .scene-bg .amb-sail{animation:scSail 3s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:0 0}
  .scene-bg .amb-ship,.scene-bg .amb-boat{animation:scBob 4s ease-in-out infinite}
  .scene-bg .amb-heat{animation:scHeat 2.6s ease-in-out infinite}
  .scene-bg .amb-window{animation:scPulse 4s ease-in-out infinite}
  .scene-bg .amb-spin{animation:scSpin 60s linear infinite;transform-box:fill-box;transform-origin:center}
  .scene-bg .amb-wings{animation:scPulse 4s ease-in-out infinite}
  .scene-bg .amb-ride{animation:scRide 1.1s ease-in-out infinite}
  .scene-bg .glint{animation:scTw 2.2s ease-in-out infinite}
  .scene-bg .amb-draw{clip-path:inset(0 100% 0 0);animation:scDraw 1.6s cubic-bezier(.6,0,.2,1) .3s forwards}
  .scene-bg .lay{will-change:transform}
  @keyframes scTw{0%,100%{opacity:.2}50%{opacity:1}}
  @keyframes scShoot{0%,92%{stroke-dashoffset:460;opacity:0}93%{opacity:1}100%{stroke-dashoffset:0;opacity:0}}
  @keyframes scDrift{from{transform:translateX(-30px)}to{transform:translateX(40px)}}
  @keyframes scFly{from{transform:translateX(-80px) translateY(0)}50%{transform:translateX(200px) translateY(-12px)}to{transform:translateX(480px) translateY(4px)}}
  @keyframes scFlap{from{transform:scaleY(1)}to{transform:scaleY(.4)}}
  @keyframes scSway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}
  @keyframes scPalm{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(3deg)}}
  @keyframes scFlame{from{transform:scale(1,1) skewX(-4deg);opacity:.9}to{transform:scale(.85,1.15) skewX(5deg);opacity:1}}
  @keyframes scPulse{0%,100%{opacity:.75}50%{opacity:1}}
  @keyframes scSmoke{to{stroke-dashoffset:-40}}
  @keyframes scFlow{to{stroke-dashoffset:-72}}
  @keyframes scFlag{from{transform:skewY(-4deg) scaleX(1)}to{transform:skewY(5deg) scaleX(.9)}}
  @keyframes scAurora{0%{transform:translateX(-20px) scaleY(1);opacity:.7}100%{transform:translateX(20px) scaleY(1.25);opacity:1}}
  @keyframes scSail{from{transform:skewX(0)}to{transform:skewX(-4deg)}}
  @keyframes scBob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2px) rotate(-.6deg)}}
  @keyframes scHeat{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-.6px) scaleY(1.004)}}
  @keyframes scSpin{to{transform:rotate(360deg)}}
  @keyframes scRide{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
  @keyframes scDraw{to{clip-path:inset(0 0 0 0)}}
  @media (prefers-reduced-motion:reduce){.scene-bg *{animation:none!important;clip-path:none!important}}`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  /* частицы для каждой эпохи */
  const PART = {
    kz: { kind: 'dust', color: '#FFE7A8', n: 26 }, sumer: { kind: 'ember', color: '#FFB347', n: 26 }, egypt: { kind: 'dust', color: '#FFE3A0', n: 30 },
    greece: { kind: 'sparkle', color: '#FFFFFF', n: 18 }, rome: { kind: 'dust', color: '#FFD9A8', n: 22 }, persia: { kind: 'dust', color: '#F6D98A', n: 26 },
    native: { kind: 'ember', color: '#FFB067', n: 22 }, vikings: { kind: 'snow', color: '#FFFFFF', n: 46 }, medieval: { kind: 'snow', color: '#E9E4FF', n: 30 },
    mongol: { kind: 'dust', color: '#FFF4CF', n: 24 }, japan: { kind: 'petal', color: '#F7B6C6', n: 22 }, maya: { kind: 'firefly', color: '#D8FF8A', n: 22 }
  };

  window.SCENES = { draw: (ep) => (S[ep.id] ? S[ep.id](ep.art) : ep.draw(ep.art)), particles: id => PART[id] || PART.kz };
})();
