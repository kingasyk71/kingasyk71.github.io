/* Дос — живой напарник Штаба.
   Объёмный SVG-робот: дыхание, моргание, взгляд за пальцем, эмоции, реакции, костюмы эпох. */
(function () {
  'use strict';
  const RM = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  let N = 0;

  const SKINS = {
    pearl: { s1: '#FFFFFF', s2: '#DCE2F0', s3: '#9AA6C4', v1: '#0A0F24', v2: '#1D2A5C', rim: '#FFFFFF' },
    brass: { s1: '#F6D9A0', s2: '#C8903F', s3: '#7A4E1C', v1: '#1A0E05', v2: '#3A2210', rim: '#FFE7B8' },
    holo: { s1: 'rgba(120,240,255,.22)', s2: 'rgba(60,170,255,.10)', s3: '#5FE3FF', v1: 'rgba(0,20,40,.55)', v2: 'rgba(0,60,90,.35)', rim: '#9FF4FF' }
  };

  /* костюмы эпох: рисуются в координатах головы (голова 18..102 × 22..86) */
  const ACC = {
    kz: '<path d="M22 44 Q20 10 60 9 Q100 10 98 44 Q82 32 60 32 Q38 32 22 44Z" fill="#6B4423"/><path d="M22 44 Q38 32 60 32 Q82 32 98 44 Q82 38 60 38 Q38 38 22 44Z" fill="#8E6236"/>' +
      '<path d="M20 40 q-8 20 3 34 q8-12 7-30z M100 40 q8 20 -3 34 q-8-12 -7-30z" fill="#6B4423"/><path d="M21 46 q-4 14 3 24 M99 46 q4 14 -3 24" stroke="#9C6E3E" stroke-width="2" fill="none"/>' +
      '<ellipse cx="60" cy="15" rx="20" ry="9" fill="#B0302A"/><path d="M44 15 q16 -10 32 0" stroke="#E2B456" stroke-width="1.6" fill="none"/>' +
      '<g fill="#fff"><circle cx="60" cy="4" r="4"/><circle cx="55" cy="6" r="3"/><circle cx="65" cy="6" r="3"/><circle cx="60" cy="0" r="2.6"/></g>',
    sumer: '<rect x="20" y="27" width="80" height="9" rx="4.5" fill="#1F4FA0"/><path d="M20 31.5h80" stroke="#7FA9E8" stroke-width="1" opacity=".6"/><circle cx="60" cy="31.5" r="7" fill="#E2B456"/><g stroke="#8C5A1C" stroke-width="1.2"><path d="M60 26v11M54.5 31.5h11M56 27.5l8 8M56 35.5l8-8"/></g>',
    egypt: '<path d="M18 50 Q14 14 60 12 Q106 14 102 50 L108 88 L92 88 L90 52 Q60 40 30 52 L28 88 L12 88Z" fill="#E2B456"/>' +
      '<g stroke="#1D4F8E" stroke-width="4"><path d="M24 26 Q60 10 96 26" fill="none"/><path d="M19 40 Q60 22 101 40" fill="none"/><path d="M14 60 L104 60" opacity="0"/><path d="M16 66h12M92 66h12M14 76h14M92 76h14"/></g>' +
      '<path d="M57 14 q3-8 6 0 l-1 8 h-4z" fill="#C8902A"/><circle cx="60" cy="12" r="2.4" fill="#B0302A"/>',
    greece: (() => { let s = ''; for (let i = 0; i < 9; i++) { const t = Math.PI * (0.08 + i * 0.105); const x = 60 - Math.cos(t) * 44, y = 36 - Math.sin(t) * 22; s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="7" ry="3.4" transform="rotate(' + (-(90 - t * 180 / Math.PI) + (i < 4 ? -35 : 35)).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="' + (i % 2 ? '#5E8A3A' : '#7BA84A') + '"/>'; } return '<path d="M16 36 Q60 4 104 36" fill="none" stroke="#B8862B" stroke-width="2"/>' + s; })(),
    rome: '<path d="M18 44 Q16 8 60 8 Q104 8 102 44 Q90 36 60 36 Q30 36 18 44Z" fill="url(#ID-steel)"/><path d="M18 44 L14 70 Q22 74 26 64 L28 46Z M102 44 L106 70 Q98 74 94 64 L92 46Z" fill="url(#ID-steel)"/>' +
      '<path d="M20 40 Q60 30 100 40" stroke="#C9A24A" stroke-width="2.4" fill="none"/>' +
      '<path d="M26 6 Q60 -16 94 6 L90 10 Q60 -8 30 10Z" fill="#B0262A"/><g stroke="#7E1820" stroke-width="1">' + Array.from({ length: 12 }, (_, i) => '<path d="M' + (32 + i * 5) + ' ' + (8 - Math.sin((i / 11) * Math.PI) * 10).toFixed(1) + 'v-6"/>').join('') + '</g>',
    persia: '<path d="M20 40 Q16 6 60 6 Q104 6 100 40 Q82 30 60 30 Q38 30 20 40Z" fill="#F1E6CF"/><path d="M22 30 Q60 12 98 30 M24 22 Q60 4 96 22 M30 14 Q60 0 90 14" stroke="#D8C49A" stroke-width="2.4" fill="none"/>' +
      '<path d="M20 40 Q38 30 60 30 Q82 30 100 40" stroke="#0E6E78" stroke-width="3" fill="none"/><circle cx="60" cy="26" r="5.5" fill="#0E6E78" stroke="#E2B456" stroke-width="2"/><path d="M60 20 q6-12 2-18" stroke="#E2B456" stroke-width="2" fill="none"/>',
    native: '<rect x="18" y="28" width="84" height="10" rx="5" fill="#1C7A75"/><g fill="#B4532A">' + Array.from({ length: 7 }, (_, i) => '<path d="M' + (24 + i * 12) + ' 33 l5-4 5 4 -5 4z"/>').join('') + '</g>' +
      '<g class="d-neck" fill="#5FC3BE" stroke="#2C6E6A" stroke-width=".8">' + Array.from({ length: 9 }, (_, i) => '<circle cx="' + (40 + i * 5) + '" cy="' + (90 + Math.sin(i / 8 * Math.PI) * 5).toFixed(1) + '" r="2.4"/>').join('') + '</g>',
    vikings: '<path d="M18 46 Q18 4 60 2 Q102 4 102 46 Q90 38 60 38 Q30 38 18 46Z" fill="url(#ID-steel)"/><path d="M60 2 V40 M22 30 Q60 18 98 30" stroke="#8C6A3C" stroke-width="4" fill="none"/>' +
      '<rect x="56" y="36" width="8" height="22" rx="3" fill="url(#ID-steel)"/><g fill="#C9A15A"><circle cx="60" cy="20" r="2"/><circle cx="40" cy="27" r="1.6"/><circle cx="80" cy="27" r="1.6"/></g>',
    medieval: '<path d="M8 40 Q60 26 112 40 Q60 34 8 40Z" fill="#8C96A8"/><path d="M22 40 Q22 8 60 8 Q98 8 98 40 Q60 30 22 40Z" fill="url(#ID-steel)"/>' +
      '<path d="M60 8 V34" stroke="#6E7890" stroke-width="2"/><path d="M60 8 q-4-14 8-20 q-2 10 6 14 q-8 0 -14 6z" fill="#B0262A"/>',
    mongol: '<path d="M22 40 Q22 12 60 10 Q98 12 98 40Z" fill="#B0302A"/><path d="M14 44 Q14 30 60 30 Q106 30 106 44 Q106 52 60 50 Q14 52 14 44Z" fill="#3A2A1E"/>' +
      '<path d="M18 42 Q60 34 102 42" stroke="#6B5640" stroke-width="2" fill="none"/><path d="M60 10 l-5 -6 h10z" fill="#E2B456"/><path d="M60 4 q-6 10 -12 14 M60 4 q6 10 12 14" stroke="#B0302A" stroke-width="2" fill="none"/>',
    japan: '<path d="M20 44 Q18 8 60 8 Q102 8 100 44 Q60 34 20 44Z" fill="#1A1A22"/><path d="M24 30 Q60 18 96 30 M22 38 Q60 28 98 38" stroke="#3A3A48" stroke-width="2" fill="none"/>' +
      '<path d="M16 44 Q8 34 4 46 L20 52Z M104 44 Q112 34 116 46 L100 52Z" fill="#B0262A"/>' +
      '<path d="M60 22 Q36 18 30 -6 Q44 10 60 12 Q76 10 90 -6 Q84 18 60 22Z" fill="#E2B456"/><circle cx="60" cy="24" r="4" fill="#E2B456"/>',
    maya: '<g>' + Array.from({ length: 7 }, (_, i) => { const a = -60 + i * 20; return '<path transform="rotate(' + a + ' 60 30)" d="M60 30 Q54 6 60 -16 Q66 6 60 30Z" fill="' + (i % 2 ? '#1C8A5A' : '#2FB27A') + '"/>'; }).join('') + '</g>' +
      '<rect x="20" y="26" width="80" height="11" rx="5" fill="#C8902A"/><circle cx="60" cy="31.5" r="7" fill="#2FB27A" stroke="#E2B456" stroke-width="2"/>'
  };

  const EYES =
    '<g class="d-eyes">' +
    '<g class="ey ey-idle"><rect class="eye" x="38" y="46" width="13" height="18" rx="6.5"/><rect class="eye" x="69" y="46" width="13" height="18" rx="6.5"/>' +
    '<circle cx="47" cy="50" r="2.2" fill="#fff" opacity=".9"/><circle cx="78" cy="50" r="2.2" fill="#fff" opacity=".9"/></g>' +
    '<g class="ey ey-happy"><path class="eline" d="M37 58 q7-11 14 0 M69 58 q7-11 14 0"/></g>' +
    '<g class="ey ey-alert"><rect class="eye" x="38" y="50" width="13" height="12" rx="4"/><rect class="eye" x="69" y="50" width="13" height="12" rx="4"/><path class="eline" d="M36 44 l15 5 M84 44 l-15 5"/></g>' +
    '<g class="ey ey-sleep"><path class="eline" d="M38 56 h13 M69 56 h13"/></g>' +
    '<g class="ey ey-think"><rect class="eye" x="42" y="44" width="11" height="13" rx="5.5"/><rect class="eye" x="71" y="44" width="11" height="13" rx="5.5"/></g>' +
    '<g class="ey ey-proud"><path class="eye" d="M44.5 46 l2.6 6 6.4 .6 -4.9 4.2 1.5 6.3 -5.6 -3.4 -5.6 3.4 1.5 -6.3 -4.9 -4.2 6.4 -.6z"/><path class="eye" d="M75.5 46 l2.6 6 6.4 .6 -4.9 4.2 1.5 6.3 -5.6 -3.4 -5.6 3.4 1.5 -6.3 -4.9 -4.2 6.4 -.6z"/></g>' +
    '</g>' +
    '<g class="d-mouth"><path class="m m-idle" d="M55 70 q5 4 10 0"/><path class="m m-happy" d="M52 68 q8 9 16 0z"/><path class="m m-alert" d="M54 72 q6 -5 12 0"/><path class="m m-sleep" d="M57 71 h6"/><path class="m m-think" d="M58 71 h5"/><path class="m m-proud" d="M52 68 q8 9 16 0z"/></g>';


  /* Чиби-Асылбек: тёмный квифф с фейдом, миндалевидные глаза, чёрный пуховик с высоким воротом */
  function svgChibi(id) {
    const I = 'dos' + id;
    const brows = (a) => '<path class="ln br" d="' + (a ? 'M35 27 L52 32 M85 27 L68 32' : 'M35 29 Q43 25 52 28 M68 28 Q77 25 85 29') + '"/>';
    const iris = (dx, dy) => [44, 76].map(cx => '<ellipse cx="' + (cx + dx) + '" cy="' + (41 + dy) + '" rx="6.2" ry="7.4" fill="url(#' + I + '-iris)"/>' +
      '<circle cx="' + (cx + dx + 2.2) + '" cy="' + (37.6 + dy) + '" r="2.3" fill="#fff"/><circle cx="' + (cx + dx - 2) + '" cy="' + (44 + dy) + '" r="1.1" fill="#fff" opacity=".85"/>').join('') +
      '<path class="ln lid" d="M35.5 36.5 Q44 30.5 53 35.5 M67 35.5 Q76 30.5 84.5 36.5"/>';
    const eyes =
      '<g class="d-eyes">' +
      '<g class="ey ey-idle">' + brows(0) + iris(0, 0) + '</g>' +
      '<g class="ey ey-happy">' + brows(0) + '<path class="ln" d="M37 42 Q44 34 51 42 M69 42 Q76 34 83 42"/></g>' +
      '<g class="ey ey-alert">' + brows(1) + iris(0, 1) + '<path d="M95 18 q4 7 0 10 q-4 -3 0 -10z" fill="#8FD3FF" opacity=".9"/></g>' +
      '<g class="ey ey-sleep">' + brows(0) + '<path class="ln" d="M37 41 Q44 46 51 41 M69 41 Q76 46 83 41"/></g>' +
      '<g class="ey ey-think">' + '<path class="ln br" d="M35 27 Q43 23 52 27 M68 28 Q77 26 85 29"/>' + iris(-2.2, -2.4) + '</g>' +
      '<g class="ey ey-proud">' + brows(0) + '<path class="ln" d="M37 41 Q44 37 51 41 M69 41 Q76 37 83 41"/><path d="M96 10 l1.6 3.6 3.8.4-2.9 2.5.9 3.8-3.4-2-3.4 2 .9-3.8-2.9-2.5 3.8-.4z" fill="#F5C451"/></g>' +
      '</g>' +
      '<g class="d-mouth"><path class="m m-idle" d="M55 58 q5 3.5 10 0"/><path class="m m-happy fillm" d="M53 56 q7 9 14 0z"/><path class="m m-alert" d="M55 60 q5 -3 10 0"/>' +
      '<path class="m m-sleep" d="M57 59 h6"/><path class="m m-think" d="M57 59 q3 -1.5 6 0"/><path class="m m-proud" d="M54 57 q7 5 13 -1"/></g>';
    return '<svg class="dos-svg" viewBox="-6 -24 132 166" aria-hidden="true"><defs>' +
      '<radialGradient id="' + I + '-skin" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FAD7B5"/><stop offset=".7" stop-color="#EDB68E"/><stop offset="1" stop-color="#D99A72"/></radialGradient>' +
      '<linearGradient id="' + I + '-hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3B2E31"/><stop offset=".55" stop-color="#1E1719"/><stop offset="1" stop-color="#120E10"/></linearGradient>' +
      '<linearGradient id="' + I + '-jk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2C2F37"/><stop offset="1" stop-color="#121418"/></linearGradient>' +
      '<radialGradient id="' + I + '-iris" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#7A4E36"/><stop offset=".55" stop-color="#3A2219"/><stop offset="1" stop-color="#160C08"/></radialGradient>' +
      '<radialGradient id="' + I + '-shadow"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<ellipse class="d-shadow" cx="60" cy="136" rx="34" ry="6" fill="url(#' + I + '-shadow)"/>' +
      '<g class="d-all"><g class="d-float"><g class="d-react">' +
      '<g class="d-arm l"><rect x="17" y="86" width="17" height="36" rx="8.5" fill="url(#' + I + '-jk)"/><path d="M19 100 h13 M19 111 h13" stroke="#363A44" stroke-width="1.2"/><circle cx="25.5" cy="124" r="5.6" fill="url(#' + I + '-skin)"/></g>' +
      '<g class="d-arm r"><rect x="86" y="86" width="17" height="36" rx="8.5" fill="url(#' + I + '-jk)"/><path d="M88 100 h13 M88 111 h13" stroke="#363A44" stroke-width="1.2"/><circle cx="94.5" cy="124" r="5.6" fill="url(#' + I + '-skin)"/>' +
      '<g class="d-bell"><rect x="84" y="122" width="22" height="4" rx="2" fill="#3A3F4E"/><rect x="80" y="116" width="6" height="16" rx="2" fill="#20242E"/><rect x="104" y="116" width="6" height="16" rx="2" fill="#20242E"/></g></g>' +
      '<rect x="52" y="64" width="16" height="14" rx="4" fill="#D99A72"/>' +
      '<path d="M30 94 Q31 78 60 76 Q89 78 90 94 L92 132 Q60 141 28 132Z" fill="url(#' + I + '-jk)"/>' +
      '<path d="M31 106 Q60 113 89 106 M30 120 Q60 127 90 120" stroke="#363A44" stroke-width="1.4" fill="none"/><path d="M60 82 V136" stroke="#0B0C0F" stroke-width="1.6"/>' +
      '<path d="M71 126 q3 -3 5 0 q2 3 5 -1" stroke="#E9ECF2" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<path d="M40 70 Q60 82 80 70 L82 88 Q60 99 38 88Z" fill="#1E2127"/><path d="M40 70 Q60 82 80 70" stroke="#3A3F4A" stroke-width="1.6" fill="none"/>' +
      '<circle class="d-core" cx="49" cy="92" r="2.4"/>' +
      '<g class="d-head">' +
      '<ellipse cx="25.5" cy="42" rx="6" ry="8" fill="url(#' + I + '-skin)"/><ellipse cx="94.5" cy="42" rx="6" ry="8" fill="url(#' + I + '-skin)"/>' +
      '<path d="M26 34 Q26 6 60 6 Q94 6 94 34 Q94 62 60 70 Q26 62 26 34Z" fill="url(#' + I + '-skin)"/>' +
            '<ellipse class="d-cheek" cx="36" cy="51" rx="5.5" ry="3"/><ellipse class="d-cheek" cx="84" cy="51" rx="5.5" ry="3"/>' +
      '<g class="d-face">' + eyes + '<path d="M60.5 44 q-2.6 5.6 .8 6.6" stroke="#C98763" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>' +
      '<g class="d-hair"><path d="M22 34 Q14 10 30 -4 Q46 -20 70 -18 Q96 -18 104 2 Q110 18 98 34 Q96 24 90 19 Q90 12 84 9 Q76 16 64 13 Q66 5 58 3 Q50 13 39 15 Q30 20 28 32Z" fill="url(#' + I + '-hair)"/>' +
      '<path d="M34 2 Q38 -26 66 -30 Q58 -22 58 -12Z M50 -10 Q64 -36 92 -26 Q78 -22 72 -12Z M68 -14 Q90 -32 110 -12 Q96 -14 88 -4Z M24 18 Q20 -2 36 -12 Q30 0 34 10Z" fill="url(#' + I + '-hair)"/>' +
      '<path d="M26 24 Q24.5 34 27.5 42 Q29 36 31 29Z M94 24 Q95.5 34 92.5 42 Q91 36 89 29Z" fill="#241B1E" opacity=".9"/>' +
      '<path d="M44 -10 Q56 -28 80 -24 M62 -12 Q80 -26 100 -14 M36 0 Q40 -14 54 -18" stroke="#6A5559" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".75"/></g>' +
      '</g>' +
      '</g></g></g>' +
      '<g class="d-zz"><text x="96" y="6">z</text><text x="106" y="-6">z</text></g>' +
      '<g class="d-dots"><circle cx="98" cy="10" r="3"/><circle cx="108" cy="4" r="3"/><circle cx="118" cy="-2" r="3"/></g>' +
      '</svg>';
  }

  function svg(id, skin, epoch) {
    const k = SKINS[skin] || SKINS.pearl, I = 'dos' + id;
    const acc = (ACC[epoch] || '').replace(/ID-/g, I + '-');
    return '<svg class="dos-svg" viewBox="-6 -24 132 166" aria-hidden="true">' +
      '<defs>' +
      '<radialGradient id="' + I + '-shell" cx=".32" cy=".26" r=".9"><stop offset="0" stop-color="' + k.s1 + '"/><stop offset=".55" stop-color="' + k.s2 + '"/><stop offset="1" stop-color="' + k.s3 + '"/></radialGradient>' +
      '<linearGradient id="' + I + '-visor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + k.v2 + '"/><stop offset="1" stop-color="' + k.v1 + '"/></linearGradient>' +
      '<linearGradient id="' + I + '-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9EDF3"/><stop offset=".5" stop-color="#A9B2C2"/><stop offset="1" stop-color="#6E788C"/></linearGradient>' +
      '<filter id="' + I + '-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<radialGradient id="' + I + '-shadow"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<ellipse class="d-shadow" cx="60" cy="134" rx="30" ry="6" fill="url(#' + I + '-shadow)"/>' +
      '<g class="d-all"><g class="d-float"><g class="d-react">' +
      // туловище и руки
      '<g class="d-arm l"><rect x="20" y="88" width="13" height="26" rx="6.5" fill="url(#' + I + '-shell)" stroke="' + k.s3 + '" stroke-width="1"/></g>' +
      '<g class="d-arm r"><rect x="87" y="88" width="13" height="26" rx="6.5" fill="url(#' + I + '-shell)" stroke="' + k.s3 + '" stroke-width="1"/>' +
      '<g class="d-bell"><rect x="84" y="112" width="20" height="4" rx="2" fill="#3A3F4E"/><rect x="80" y="106" width="6" height="16" rx="2" fill="#20242E"/><rect x="102" y="106" width="6" height="16" rx="2" fill="#20242E"/></g></g>' +
      '<rect x="36" y="84" width="48" height="36" rx="17" fill="url(#' + I + '-shell)" stroke="' + k.s3 + '" stroke-width="1"/>' +
      '<circle class="d-core" cx="60" cy="102" r="6" filter="url(#' + I + '-glow)"/>' +
      // голова
      '<g class="d-head">' +
      '<line x1="60" y1="24" x2="60" y2="8" stroke="' + k.s3 + '" stroke-width="3" stroke-linecap="round"/><circle class="d-orb" cx="60" cy="6" r="5.5" filter="url(#' + I + '-glow)"/>' +
      '<circle cx="15" cy="54" r="7" fill="url(#' + I + '-shell)" stroke="' + k.s3 + '" stroke-width="1"/><circle cx="105" cy="54" r="7" fill="url(#' + I + '-shell)" stroke="' + k.s3 + '" stroke-width="1"/>' +
      '<rect x="18" y="22" width="84" height="64" rx="30" fill="url(#' + I + '-shell)" stroke="' + k.s3 + '" stroke-width="1.2"/>' +
      '<path d="M30 30 Q44 24 60 24" stroke="' + k.rim + '" stroke-width="3" stroke-linecap="round" fill="none" opacity=".75"/>' +
      '<rect x="26" y="34" width="68" height="44" rx="20" fill="url(#' + I + '-visor)"/>' +
      '<ellipse class="d-cheek" cx="34" cy="70" rx="5" ry="3"/><ellipse class="d-cheek" cx="86" cy="70" rx="5" ry="3"/>' +
      '<g class="d-face" filter="url(#' + I + '-glow)">' + EYES + '</g>' +
      '<path d="M32 40 Q40 35 52 36 L36 64 Q30 56 32 40Z" fill="#fff" opacity=".1"/>' +
      '<g class="d-acc">' + acc + '</g>' +
      '</g>' +
      '</g></g></g>' +
      '<g class="d-zz"><text x="96" y="10">z</text><text x="106" y="-2">z</text></g>' +
      '<g class="d-dots"><circle cx="98" cy="14" r="3"/><circle cx="108" cy="8" r="3"/><circle cx="118" cy="2" r="3"/></g>' +
      '</svg>';
  }

  const CSS = `
  .dos{position:relative;display:inline-block;width:120px;aspect-ratio:132/166;--dg:#5CE6FF;touch-action:manipulation;-webkit-user-select:none;user-select:none;cursor:pointer}
  .dos .dos-svg{width:100%;height:100%;overflow:visible;display:block}
  .dos .d-core,.dos .d-orb{fill:var(--dg)}
  .dos .eye{fill:var(--dg)} .dos .eline,.dos .m{fill:none;stroke:var(--dg);stroke-width:3.2;stroke-linecap:round}
  .dos .m-happy,.dos .m-proud{fill:var(--dg)}
  .dos .d-cheek{fill:#FF8FB1;opacity:0;transition:opacity .3s}
  .dos .ey,.dos .m{display:none}
  .dos.e-idle .ey-idle,.dos.e-happy .ey-happy,.dos.e-alert .ey-alert,.dos.e-sleep .ey-sleep,.dos.e-think .ey-think,.dos.e-proud .ey-proud{display:inline}
  .dos.e-idle .m-idle,.dos.e-happy .m-happy,.dos.e-alert .m-alert,.dos.e-sleep .m-sleep,.dos.e-think .m-think,.dos.e-proud .m-proud{display:inline}
  .dos.e-happy .d-cheek,.dos.e-proud .d-cheek,.dos.e-idle .d-cheek{opacity:.55}
  .dos.e-alert{--dg:#FF9A3D}
  .dos .d-eyes{transform:translate(calc(var(--lx,0) * 4px),calc(var(--ly,0) * 3px));transition:transform .25s cubic-bezier(.3,1.4,.5,1)}
  .dos .d-head{transform-box:fill-box;transform-origin:50% 90%;transform:rotate(calc(var(--lx,0) * 4deg));transition:transform .4s cubic-bezier(.3,1.4,.5,1)}
  .dos .ey{transform-box:fill-box;transform-origin:center}
  .dos.blink .ey-idle,.dos.blink .ey-think{transform:scaleY(.08);transition:transform .07s}
  .dos .ey-idle,.dos .ey-think{transition:transform .12s}
  .dos .d-float{animation:dosFloat 3.6s ease-in-out infinite}
  .dos .d-shadow{transform-box:fill-box;transform-origin:center;animation:dosShadow 3.6s ease-in-out infinite}
  .dos .d-orb{animation:dosGlow 1.8s ease-in-out infinite}
  .dos .d-core{animation:dosGlow 2.6s ease-in-out infinite}
  .dos .d-arm{transform-box:fill-box;transform-origin:50% 8%}
  .dos .d-arm.l{animation:dosArmL 3.6s ease-in-out infinite}
  .dos .d-arm.r{animation:dosArmR 3.6s ease-in-out infinite}
  .dos .d-bell{display:none}
  .dos.sport .d-bell{display:inline}
  .dos.sport .d-arm.r{animation:dosCurl 1.1s ease-in-out infinite}
  .dos .d-zz,.dos .d-dots{display:none}
  .dos.e-sleep .d-zz{display:inline} .dos.e-think .d-dots{display:inline}
  .dos .d-zz text{fill:var(--dg);font:700 12px system-ui;animation:dosZz 2.4s infinite} .dos .d-zz text+text{animation-delay:1.2s}
  .dos .d-dots circle{fill:var(--dg);animation:dosDot 1.2s infinite} .dos .d-dots circle:nth-child(2){animation-delay:.2s} .dos .d-dots circle:nth-child(3){animation-delay:.4s}
  .dos.e-sleep .d-float{animation-duration:6s}
  .dos.e-sleep .d-head{transform:rotate(-8deg) translateY(2px)}
  .dos .d-react{transform-box:fill-box;transform-origin:50% 60%}
  .dos.r-flip .d-react{animation:dosFlip .9s cubic-bezier(.3,.9,.4,1)}
  .dos.r-jump .d-react{animation:dosJump .6s cubic-bezier(.3,1.6,.5,1) 2}
  .dos.r-run .d-react{animation:dosRun .32s ease-in-out 6}
  .dos.r-run .d-arm.l{animation:dosSwing .32s ease-in-out 6} .dos.r-run .d-arm.r{animation:dosSwing .32s ease-in-out 6 reverse}
  .dos.r-dance .d-react{animation:dosDance .5s ease-in-out 5}
  .dos.r-dance .d-arm.l{animation:dosWaveL .25s ease-in-out 10} .dos.r-dance .d-arm.r{animation:dosWaveR .25s ease-in-out 10}
  .dos.r-pace .d-react{animation:dosPace 2.4s ease-in-out 1}
  .dos.r-wave .d-arm.r{animation:dosWaveR .35s ease-in-out 4}
  .dos.r-salute .d-arm.r{animation:dosSalute 1.4s ease-in-out 1}
  .dos.r-shake .d-react{animation:dosShake .5s ease-in-out 1}
  .dos.r-poof .d-react{animation:dosPoof .7s cubic-bezier(.3,1.5,.5,1)}
  @keyframes dosFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes dosShadow{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.82);opacity:.65}}
  @keyframes dosGlow{0%,100%{opacity:1}50%{opacity:.55}}
  @keyframes dosArmL{0%,100%{transform:rotate(4deg)}50%{transform:rotate(-2deg)}}
  @keyframes dosArmR{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(2deg)}}
  @keyframes dosCurl{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(-120deg)}}
  @keyframes dosZz{0%{opacity:0;transform:translateY(4px)}50%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}
  @keyframes dosDot{0%,100%{opacity:.25}50%{opacity:1}}
  @keyframes dosFlip{0%{transform:translateY(0) rotate(0)}30%{transform:translateY(-34px) rotate(0) scale(1.04,.96)}70%{transform:translateY(-34px) rotate(360deg)}85%{transform:translateY(0) rotate(360deg) scale(1.08,.9)}100%{transform:translateY(0) rotate(360deg)}}
  @keyframes dosJump{0%,100%{transform:translateY(0)}40%{transform:translateY(-18px) scale(1.05,.95)}}
  @keyframes dosRun{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6px) rotate(3deg)}}
  @keyframes dosSwing{0%,100%{transform:rotate(40deg)}50%{transform:rotate(-40deg)}}
  @keyframes dosDance{0%,100%{transform:rotate(-10deg) translateX(-4px)}50%{transform:rotate(10deg) translateX(4px) translateY(-6px)}}
  @keyframes dosWaveL{0%,100%{transform:rotate(30deg)}50%{transform:rotate(150deg)}}
  @keyframes dosWaveR{0%,100%{transform:rotate(-30deg)}50%{transform:rotate(-150deg)}}
  @keyframes dosPace{0%,100%{transform:translateX(0)}20%{transform:translateX(-16px) rotate(-4deg)}45%{transform:translateX(16px) rotate(4deg)}70%{transform:translateX(-12px) rotate(-3deg)}}
  @keyframes dosSalute{0%,100%{transform:rotate(0)}25%,75%{transform:rotate(-155deg)}}
  @keyframes dosShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
  @keyframes dosPoof{0%{transform:scale(1)}30%{transform:scale(.6) rotate(-20deg);filter:blur(2px)}100%{transform:scale(1) rotate(0);filter:none}}

  .dos.chibi{--dg:var(--accent,#2EE6C9)}
  .dos.chibi .ln{fill:none;stroke:#1A1214;stroke-width:2.8;stroke-linecap:round}
  .dos.chibi .lid{stroke-width:2.6}
  .dos.chibi .br{stroke-width:3.4}
  .dos.chibi .m{fill:none;stroke:#6B2E24;stroke-width:2.2;stroke-linecap:round}
  .dos.chibi .fillm{fill:#8C3A2E;stroke:#6B2E24}
  .dos.chibi .d-cheek{fill:#FF8F80}
  .dos.chibi .d-face{filter:none!important}
  .dos.chibi .d-head{transform-origin:50% 95%}
  .dos.chibi .d-hair{transform-box:fill-box;transform-origin:50% 100%;animation:hairBob 3.6s ease-in-out infinite}
  @keyframes hairBob{0%,100%{transform:skewX(0)}50%{transform:skewX(-1.5deg)}}
  .dos.chibi .d-dots circle,.dos.chibi .d-zz text{fill:var(--dg)}
  .dos.chibi .d-core{fill:var(--dg)}
  @media (prefers-reduced-motion:reduce){.dos *{animation:none!important;transition:none!important}}`;

  const all = new Set();
  let lastAct = Date.now();

  function mount(el, opt) {
    opt = opt || {};
    const id = ++N;
    el.classList.add('dos', 'e-' + (opt.mood || 'idle'));
    if (opt.sport) el.classList.add('sport');
    el.classList.add('chibi');
    el.innerHTML = svgChibi(id);
    if (opt.glow) el.style.setProperty('--dg', opt.glow);
    const inst = {
      el, mood: opt.mood || 'idle', busy: false,
      setMood(m) { if (!m || m === this.mood) return; el.classList.remove('e-' + this.mood); this.mood = m; el.classList.add('e-' + m); },
      react(name, ms) {
        if (RM) return;
        const cls = 'r-' + name; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
        clearTimeout(this._rt); this._rt = setTimeout(() => el.classList.remove(cls), ms || { flip: 950, jump: 1250, run: 2000, dance: 2600, pace: 2500, wave: 1450, salute: 1450, shake: 520, poof: 720 }[name] || 1200);
      },
      setEpoch(ep) { return; const acc = el.querySelector('.d-acc'); if (acc) acc.innerHTML = (ACC[ep] || '').replace(/ID-/g, 'dos' + id + '-'); },
      destroy() { this.dead = true; all.delete(this); clearTimeout(this._bt); }
    };
    // моргание
    const blink = () => { if (inst.dead) return; if (el.isConnected && !RM && !document.hidden) { el.classList.add('blink'); setTimeout(() => el.classList.remove('blink'), 130); if (Math.random() < .25) setTimeout(() => { el.classList.add('blink'); setTimeout(() => el.classList.remove('blink'), 120); }, 260); } inst._bt = setTimeout(blink, 2200 + Math.random() * 3800); };
    inst._bt = setTimeout(blink, 1200 + Math.random() * 2000);
    all.add(inst);
    return inst;
  }

  // взгляд за пальцем / курсором
  let raf = 0, px = innerWidth / 2, py = innerHeight / 3;
  function look() {
    raf = 0;
    all.forEach(d => {
      if (!d.el.isConnected) return;
      const r = d.el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height * .4;
      const dx = Math.max(-1, Math.min(1, (px - cx) / 160)), dy = Math.max(-1, Math.min(1, (py - cy) / 200));
      d.el.style.setProperty('--lx', dx.toFixed(2)); d.el.style.setProperty('--ly', dy.toFixed(2));
    });
  }
  const onMove = e => { const p = e.touches ? e.touches[0] : e; if (!p) return; px = p.clientX; py = p.clientY; lastAct = Date.now(); wake(); if (!raf) raf = requestAnimationFrame(look); };
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('touchstart', onMove, { passive: true });
  addEventListener('scroll', () => { lastAct = Date.now(); py = innerHeight * .2; if (!raf) raf = requestAnimationFrame(look); }, { passive: true });

  // засыпает, если долго ничего не происходит
  function wake() { all.forEach(d => { if (d.mood === 'sleep' && !d.night) { d.setMood(d.awake || 'idle'); d.react('jump'); } }); }
  setInterval(() => { if (RM || document.hidden) return; if (Date.now() - lastAct > 45000) all.forEach(d => { if (d.mood !== 'sleep' && !d.busy) { d.awake = d.mood; d.setMood('sleep'); } }); }, 5000);

  /* звук «пик» при печати реплик */
  let ac = null;
  function beep(i) {
    try { if (localStorage.getItem('shtab_sound') === '0') return; } catch (e) {}
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = 620 + ((i * 53) % 260);
      g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.035, ac.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.06);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.07);
    } catch (e) {}
  }

  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  window.Dos = { mount, svg, beep, skins: Object.keys(SKINS), acc: Object.keys(ACC), reduced: RM };
})();
