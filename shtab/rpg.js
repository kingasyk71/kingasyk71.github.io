/* ============================================================
   Штаб · RPG-слой
   Подключается после основного скрипта и надстраивает игру поверх логики:
   кат-сцена входа, создание героя (расы/классы), HUD, редкость квестов,
   рейды с боссами, лут, криты, level up, карта королевств.
   Данные не меняются: всё игровое хранится в settings.hero / settings.rpg.
   ============================================================ */
(function () {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- справочники ---------- */
  const RACES = {
    human:  { n: 'Человек',      acc: '#3D7BD9', d: '+5% опыта ко всему',              k: 'all' },
    elf:    { n: 'Эльф',         acc: '#1F9E6A', d: '+15% опыта за заметки и учёбу',   k: 'notes' },
    dwarf:  { n: 'Гном',         acc: '#C47A1C', d: '+15% опыта за деньги',            k: 'gold' },
    orc:    { n: 'Орк',          acc: '#CF432C', d: '+15% опыта за спорт',             k: 'sport' },
    dragon: { n: 'Драконид',     acc: '#C2870E', d: '+15% опыта за проекты',           k: 'tasks' },
    moon:   { n: 'Лунный народ', acc: '#7457E2', d: '+15% опыта за режим и настроение', k: 'moods' }
  };
  const CLASSES = {
    strat:   { n: 'Стратег',   d: 'маркетинг и планы' },
    bard:    { n: 'Бард',      d: 'контент и голос' },
    warrior: { n: 'Воин',      d: 'спорт и сила' },
    mage:    { n: 'Маг',       d: 'учёба и знания' },
    trader:  { n: 'Торговец',  d: 'деньги и клиенты' },
    keeper:  { n: 'Хранитель', d: 'семья и дом' }
  };
  const STATS = [['str', 'Сила', 'спорт'], ['int', 'Интеллект', 'учёба'], ['cha', 'Харизма', 'контент'], ['wis', 'Мудрость', 'режим']];
  const RAR = { common: 'Обычный', rare: 'Редкий', epic: 'Эпический', legend: 'Легендарный' };
  const LOOT = ['Перо летописца', 'Зелье фокуса', 'Свиток идей', 'Руна дисциплины', 'Компас стратега', 'Монета хана', 'Кристалл охвата', 'Плащ терпения', 'Амулет дедлайна', 'Кубок первого клиента'];
  const ICO = {
    today: '<path d="M12 3l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.3l5-.7z"/>',
    projects: '<path d="M4 20l6-6M7 17l-3 3M14 4l6 6-8 8-6-6z"/><path d="M14 4l2-1 5 5-1 2"/>',
    content: '<path d="M4 18h10M6 18l2-7h6l2 7"/><path d="M9 11V7l3-3 3 3v4"/><path d="M18 9l2-2M19 13h2"/>',
    sport: '<path d="M6 4l12 12M4 6l2-2M18 16l2 2-2 2-2-2"/><path d="M14 4l6 6M10 20l-6-6"/>',
    money: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
    notes: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/>'
  };
  const TABN = { today: 'Квесты', projects: 'Рейды', content: 'Кузница', sport: 'Арена', money: 'Казна', notes: 'Гримуар' };
  const svgI = k => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[k] + '</svg>';

  const hero = () => (S.settings && S.settings.hero) || null;
  const rpgS = () => (S.settings && S.settings.rpg) || {};
  const saveRpg = patch => put('settings', 'main', Object.assign({}, S.settings, { rpg: Object.assign({}, rpgS(), patch) }));
  const race = () => RACES[(hero() || {}).race] || RACES.human;
  const kM = n => n >= 1e6 ? (Math.round(n / 1e5) / 10).toString().replace('.', ',') + 'м' : Math.round(n / 1000) + 'к';

  /* ---------- шрифт и стили ---------- */
  {
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Forum&display=swap'; document.head.appendChild(l);
  }
  const CSS = `
html:root:root:root{--bg:#F5F0E6;--surface:#FFFDF8;--surface-2:#F3ECDD;--ink:#2A2230;--muted:#7A7064;--line:rgba(150,110,40,.18);--gold:#B8862F;--gold-2:#8A6420;--gold-hi:#E9C46A;--track:rgba(70,50,20,.1);--glass:rgba(255,253,248,.84);--f-rpg:"Forum","Geist",serif;--acc:var(--race,#3D7BD9);--accent:var(--race,#3D7BD9);--accent-soft:color-mix(in srgb,var(--race,#3D7BD9) 12%,#FFFDF8);--dock-ink:#2A2230;color-scheme:light}
html body{background:linear-gradient(180deg,#E7EEF8 0,#F5F0E6 420px) no-repeat,#F5F0E6!important;color:var(--ink)}
html body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.5;background:radial-gradient(60% 40% at 85% 0%,rgba(255,236,190,.55),transparent 70%),radial-gradient(50% 30% at 0% 30%,rgba(214,226,250,.5),transparent 70%)}
main,header,.tabbar{position:relative;z-index:1}
#title,.sec-head h2,.acc>summary,.g-name,.g-big,.chr h3,.sheet-top h3,.pc2-name{font-family:var(--f-rpg)!important;font-weight:400!important;letter-spacing:.02em}
#title{font-size:30px!important;text-transform:uppercase;letter-spacing:.08em!important;background:linear-gradient(180deg,#B8862F,#7A5214);-webkit-background-clip:text;background-clip:text;color:transparent!important}
.eyebrow{color:#7A6A50!important}
.sec-head h2{text-transform:uppercase;letter-spacing:.12em!important;font-size:15px!important;color:var(--gold-2)!important}
.acc>summary{text-transform:uppercase;letter-spacing:.1em!important;font-size:15px!important;color:var(--gold-2)!important}
.card,.acc,.sum.ai-card,.qt,.pcard,.ncard,.wk,.hb,.list>.row{background:linear-gradient(180deg,#FFFEFA,#FBF6EC)!important;border:1px solid rgba(184,134,47,.22)!important;box-shadow:inset 0 1px 0 #fff,0 10px 26px -18px rgba(90,60,20,.4)!important;color:var(--ink)}
.acc,.sum.ai-card,.card{position:relative}
.acc::before,.sum.ai-card::before{content:"";position:absolute;inset:4px;border:1px solid rgba(184,134,47,.1);border-radius:inherit;pointer-events:none}
.qt .ic,.hb .ic{background:color-mix(in srgb,var(--acc) 12%,#fff)!important;color:var(--acc)!important;border:1px solid color-mix(in srgb,var(--acc) 26%,transparent)}
.btn:not(.ghost):not(.plain){background:linear-gradient(180deg,#F0D27C,#C8902E)!important;color:#2A1A04!important;border:0!important;box-shadow:0 0 0 1px rgba(160,110,30,.35) inset,0 10px 22px -12px rgba(200,144,46,.75)!important}
.btn.ghost{border-color:rgba(184,134,47,.45)!important;color:var(--gold-2)!important;background:#FFFDF8!important}
.bubble,.bubble.vn{color:var(--ink)!important}
/* ===== сцена с героем ===== */
body.tab-today .top .ava,body.tab-today .top .lv{display:none!important}
.g-stage{position:relative;height:min(580px,76svh);min-height:480px;margin:0 calc(-1 * max(16px,env(safe-area-inset-left,0px)));border-radius:0 0 30px 30px;overflow:hidden;isolation:isolate;background:#DCE6F2;box-shadow:0 26px 50px -30px rgba(70,50,20,.55),0 1px 0 rgba(184,134,47,.35)}
@media (min-width:761px){.g-stage{margin:0;border-radius:28px}}
.g-bg{position:absolute;inset:0;z-index:-3;filter:saturate(1.05) brightness(1.06);transform:scale(1.08);animation:gDrift 26s ease-in-out infinite alternate}
.g-bg svg{width:100%;height:100%;display:block}
@keyframes gDrift{to{transform:scale(1.13) translate(-2%,1%)}}
.g-shade{position:absolute;inset:0;z-index:-2;background:linear-gradient(180deg,rgba(255,253,248,.82) 0,rgba(255,253,248,.15) 26%,rgba(255,253,248,0) 50%,rgba(250,244,232,.55) 74%,#F5F0E6 100%)}
.g-fog{position:absolute;left:-10%;right:-10%;bottom:10%;height:40%;z-index:-1;background:radial-gradient(50% 50% at 50% 70%,color-mix(in srgb,var(--acc) 26%,transparent),transparent 70%);filter:blur(12px);opacity:.8;animation:gFog 6s ease-in-out infinite alternate}
@keyframes gFog{to{opacity:.5;transform:translateY(-8px) scaleX(1.06)}}
.g-circle{position:absolute;left:50%;bottom:15%;width:240px;height:52px;transform:translateX(-50%);border-radius:50%;border:1.5px solid color-mix(in srgb,var(--acc) 50%,#fff);box-shadow:0 0 26px color-mix(in srgb,var(--acc) 35%,transparent),inset 0 0 18px rgba(255,255,255,.7);background:radial-gradient(closest-side,rgba(255,255,255,.55),transparent);z-index:-1}
.g-circle::after{content:"";position:absolute;inset:8px 22px;border-radius:50%;border:1px dashed rgba(184,134,47,.55);animation:gSpin 30s linear infinite}
@keyframes gSpin{to{transform:rotate(360deg)}}
.g-hero{position:absolute;left:0;right:0;top:152px;bottom:52px;z-index:1;touch-action:pan-y;cursor:pointer}
.g-hero-in{position:absolute;inset:0}
.g-hud{position:absolute;left:12px;right:96px;top:calc(76px + env(safe-area-inset-top,0px));z-index:3;display:flex;gap:10px;align-items:center;padding:8px 12px 9px 8px;border-radius:18px;background:var(--glass);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);border:1px solid rgba(184,134,47,.28);box-shadow:0 12px 28px -18px rgba(70,50,20,.6)}
.g-por{position:relative;flex:none;width:56px;height:56px;border-radius:50%;padding:0;border:0;background:conic-gradient(from 200deg,#F0D27C,#A9732A,#F0D27C,#A9732A,#F0D27C);box-shadow:0 0 0 2px #fff,0 6px 16px -6px rgba(90,60,20,.6)}
.g-por img,.g-por .ph{position:absolute;inset:3px;width:50px;height:50px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:radial-gradient(circle at 50% 30%,#fff,color-mix(in srgb,var(--acc) 30%,#F3ECDD));display:block}
.g-por .ph{display:grid;place-items:center;font:26px var(--f-rpg);color:var(--gold-2)}
.g-lv{position:absolute;right:-6px;bottom:-4px;min-width:24px;height:21px;padding:0 6px;border-radius:7px;background:linear-gradient(180deg,#FFFDF8,#F1E6CF);border:1px solid #C8902E;color:#7A5214;font:14px/19px var(--f-rpg);text-align:center}
.g-who{min-width:0;flex:1}
.g-name{font-size:19px;line-height:1.05;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g-cls{font:600 10.5px var(--f-ui,system-ui);letter-spacing:.06em;text-transform:uppercase;color:var(--acc);margin:2px 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g-bar{position:relative;height:7px;border-radius:4px;background:rgba(70,50,20,.1);box-shadow:inset 0 0 0 1px rgba(70,50,20,.06);margin-top:4px;overflow:hidden}
.g-bar i{position:absolute;inset:0 auto 0 0;border-radius:inherit;transition:width .9s cubic-bezier(.2,.9,.2,1)}
.g-bar i::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.55),transparent 60%)}
.g-bar.hp i{background:linear-gradient(90deg,#E0574A,#FF8A6A)}
.g-bar.mp i{background:linear-gradient(90deg,#3E7FE0,#76B4FF)}
.g-bar.xp i{background:linear-gradient(90deg,#C8902E,#F0D27C)}
.g-bar b{position:absolute;right:4px;top:-1px;font:600 7px/9px "Geist Mono",monospace;color:rgba(42,34,48,.72);letter-spacing:.04em}
.g-mini{position:absolute;right:12px;top:calc(76px + env(safe-area-inset-top,0px));z-index:3;width:74px;border:0;padding:6px 0 7px;background:var(--glass);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-radius:18px;border:1px solid rgba(184,134,47,.28);color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:0 12px 28px -18px rgba(70,50,20,.6)}
.g-mini .mm{position:relative;width:48px;height:48px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#FFFDF8,#EADFC6);box-shadow:0 0 0 2px #fff,0 0 0 3px #C8902E;overflow:hidden;display:grid;place-items:center;font-size:21px}
.g-mini .mm::before{content:"";position:absolute;inset:5px;border-radius:50%;border:1px dashed rgba(184,134,47,.45);animation:gSpin 40s linear infinite}
.g-mini small{font:600 9.5px "Geist Mono",monospace;color:#6E5A3A;white-space:nowrap;max-width:70px;overflow:hidden;text-overflow:ellipsis}
.g-gold{display:inline-flex;align-items:center;gap:4px;font:700 11px "Geist Mono",monospace;color:#8A6420}
.g-gold i{width:10px;height:10px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FFF6C8,#C8902E);box-shadow:0 0 6px rgba(200,144,46,.6)}
.g-plate{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:0 18px 16px;display:flex;align-items:flex-end;justify-content:space-between;gap:10px}
.g-big{font-size:30px;line-height:1;color:var(--ink);text-shadow:0 1px 0 #fff,0 0 18px rgba(255,253,248,.9)}
.g-big small{display:block;font:600 11px var(--f-ui,system-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--gold-2);margin-top:6px}
.g-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.g-chips span{font:600 11px "Geist Mono",monospace;padding:4px 8px;border-radius:7px;background:rgba(255,253,248,.9);border:1px solid rgba(184,134,47,.25);color:var(--ink)}
.g-chips .late{border-color:rgba(207,67,44,.45);color:#B8341F;background:#FFF3EF}
.g-chest{flex:none;width:58px;height:58px;border-radius:16px;border:1px solid rgba(184,134,47,.5);background:radial-gradient(circle at 50% 35%,#FFF6DC,#F1E1B8);display:grid;place-items:center;font-size:27px;animation:gBob 2.4s ease-in-out infinite;box-shadow:0 0 0 3px rgba(255,253,248,.7),0 10px 22px -10px rgba(200,144,46,.8)}
.g-chest span{font:9px var(--f-rpg);letter-spacing:.08em;color:var(--gold-2);margin-top:-6px}
@keyframes gBob{50%{transform:translateY(-4px) rotate(-3deg)}}
/* ===== панель умений ===== */
.tabbar{background:rgba(255,253,248,.9)!important;-webkit-backdrop-filter:blur(18px) saturate(1.4)!important;backdrop-filter:blur(18px) saturate(1.4)!important;border:1px solid rgba(184,134,47,.35)!important;border-radius:22px!important;box-shadow:0 18px 40px -18px rgba(70,50,20,.55)!important;padding:6px!important}
.tabbar .in{gap:4px!important}
.tab{flex-direction:column!important;gap:3px!important;border-radius:14px!important;min-height:58px!important;font:400 11px var(--f-rpg)!important;letter-spacing:.04em;color:#7A6A50!important;background:transparent!important;position:relative}
.tab svg{width:21px;height:21px;padding:5px;box-sizing:content-box;border-radius:10px;background:linear-gradient(180deg,#FFFFFF,#F2EADA);box-shadow:inset 0 0 0 1px rgba(184,134,47,.32);color:#6E5A3A;transition:transform .2s}
.tab::after{content:"";position:absolute;left:50%;top:5px;width:35px;height:35px;margin-left:-17.5px;border-radius:11px;background:conic-gradient(var(--acc) calc(var(--p,0) * 1%),transparent 0);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;padding:2px;opacity:.85;pointer-events:none}
.tab[aria-current=page]{color:var(--ink)!important}
.tab[aria-current=page] svg{background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 22%,#fff),#fff);color:var(--acc);box-shadow:inset 0 0 0 1.5px #C8902E,0 6px 14px -6px color-mix(in srgb,var(--acc) 60%,transparent);transform:translateY(-2px)}
.tab:active svg{transform:scale(.9)}
.tab .badge{top:2px!important}
html body .fab{background:linear-gradient(180deg,#F0D27C,#C8902E)!important;color:#2A1A04!important;font:400 17px var(--f-rpg)!important;letter-spacing:.04em;box-shadow:0 0 0 1px rgba(160,110,30,.4) inset,0 0 0 3px rgba(255,253,248,.85),0 14px 30px -12px rgba(160,110,30,.7)!important}
html body .fab::before,html body .fab::after{display:none!important}
header .ava{background:radial-gradient(circle at 40% 35%,#FFFDF8,#F1E6CF)!important;color:var(--gold-2)!important;box-shadow:0 0 0 2px #C8902E,0 0 0 4px #fff!important;font-family:var(--f-rpg)!important}
/* ===== редкость квестов ===== */
.row{--rc:#9A8F80;position:relative}
.row.rar-rare{--rc:#3D7BD9}.row.rar-epic{--rc:#8A4FE0}.row.rar-legend{--rc:#E07A10}
.list>.row{border-left:3px solid var(--rc)!important;margin-bottom:6px;border-radius:12px!important}
.row.rar-legend{box-shadow:0 0 0 1px rgba(224,122,16,.25),0 10px 24px -14px rgba(224,122,16,.65)!important;background:linear-gradient(180deg,#FFFBF2,#FFF2DD)!important}
.row.rar-epic{background:linear-gradient(180deg,#FFFEFF,#F7F1FF)!important}
.row .row-title::before{content:attr(data-rr);display:block;font:700 9px "Geist Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--rc);margin-bottom:2px}
.row .xp{color:var(--gold-2)!important;font-family:"Geist Mono",monospace!important}
.row.fx-done{animation:gFlash .5s ease}
@keyframes gFlash{30%{box-shadow:0 0 0 2px var(--rc),0 0 30px var(--rc)}}
/* ===== рейды ===== */
.pcard .pc2-foot{display:none!important}
.pcard .pc2-name{color:var(--ink)!important;font-size:19px!important}
.pcard .pc2-next{color:var(--muted)!important}
.boss{display:flex;flex-direction:column;gap:5px;margin-top:2px}
.boss-l{display:flex;justify-content:space-between;font:700 10px "Geist Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#B8341F}
.boss-hp{height:8px;border-radius:4px;background:rgba(70,50,20,.1);overflow:hidden}
.boss-hp i{display:block;height:100%;background:linear-gradient(90deg,#B8341F,#FF7A5A);box-shadow:0 0 10px rgba(240,96,74,.45)}
.boss.dead .boss-l{color:var(--gold-2)}
.habits .hb{grid-column:1/-1;flex:1 1 100%}
/* ===== эмоции маленьких аватарок ===== */
.dos.pic::after{position:absolute;right:-4px;top:-4px;z-index:2;min-width:16px;height:16px;padding:0 3px;border-radius:9px;background:#fff;color:#2A2230;font:800 10px/16px system-ui;text-align:center;box-shadow:0 2px 6px rgba(70,50,20,.35);display:none}
.dos.pic.e-happy::after{content:"♪";display:block;color:#C8902E}.dos.pic.e-proud::after{content:"★";display:block;color:#C8902E}
.dos.pic.e-think::after{content:"…";display:block}.dos.pic.e-alert::after{content:"!";display:block;color:#D9362B}
.dos.pic.e-cry::after{content:"💧";display:block;font-size:9px}.dos.pic.e-sleep::after{content:"z";display:block;color:#6A6CD8}
.dos.pic.e-sleep img{filter:brightness(.92) saturate(.85)}
/* ===== эффекты ===== */
.g-coin{position:fixed;z-index:90;width:14px;height:14px;margin:-7px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#FFF6C8,#D9A94A 55%,#8A5A1C);box-shadow:0 0 10px rgba(255,200,90,.9)}
.g-float{position:fixed;z-index:91;pointer-events:none;font:30px var(--f-rpg);color:#C8902E;text-shadow:0 0 14px rgba(255,220,140,.9),0 2px 0 #fff;white-space:nowrap;transform:translate(-50%,-50%)}
.g-float.crit{font-size:42px;color:#E07A10}
/* кат-сцена (светлая) */
.gx{position:fixed;inset:0;z-index:100;display:grid;place-items:center;background:radial-gradient(120% 80% at 50% 40%,#FFF9EC 0,#F3EADB 45%,#DCE6F4 100%);overflow:hidden;color:var(--ink);touch-action:none}
.gx canvas.fx{position:absolute;inset:0;width:100%;height:100%}
.gx .skip{position:absolute;bottom:calc(26px + env(safe-area-inset-bottom,0px));left:0;right:0;text-align:center;font:600 11px var(--f-ui,system-ui);letter-spacing:.2em;text-transform:uppercase;color:rgba(138,100,32,.55)}
.gx-rune{position:absolute;width:min(78vw,360px);aspect-ratio:1;opacity:0}
.gx-rune circle,.gx-rune path{fill:none;stroke:#B8862F;stroke-width:1.3;stroke-linecap:round}
.gx-map{position:absolute;left:50%;top:50%;width:min(130vw,640px);aspect-ratio:100/80;margin-left:calc(min(130vw,640px) / -2);margin-top:calc(min(130vw,640px) * -.4);opacity:0;-webkit-mask:radial-gradient(closest-side,#000 62%,transparent);mask:radial-gradient(closest-side,#000 62%,transparent)}
.gx-map svg{width:100%;height:100%}
.gx-host{position:absolute;left:0;right:0;top:9%;bottom:26%;opacity:0}
.gx-portal{position:absolute;left:50%;top:44%;width:min(86vw,420px);aspect-ratio:1;margin-left:calc(min(86vw,420px) / -2);margin-top:calc(min(86vw,420px) / -2);border-radius:50%;opacity:0;background:radial-gradient(circle,#fff 0,color-mix(in srgb,var(--acc) 30%,#fff) 40%,transparent 68%);box-shadow:0 0 0 2px rgba(200,144,46,.75),0 0 60px 8px color-mix(in srgb,var(--acc) 35%,transparent),inset 0 0 60px rgba(255,255,255,.9)}
.gx-portal::before{content:"";position:absolute;inset:-14px;border-radius:50%;border:2px dashed rgba(184,134,47,.6);animation:gSpin 6s linear infinite}
.gx-plate{position:absolute;left:0;right:0;bottom:calc(64px + env(safe-area-inset-bottom,0px));text-align:center;opacity:0}
.gx-plate .t{font:40px/1 var(--f-rpg);letter-spacing:.06em;background:linear-gradient(180deg,#B8862F,#6A4510);-webkit-background-clip:text;background-clip:text;color:transparent}
.gx-plate .s{font:600 12px var(--f-ui,system-ui);letter-spacing:.22em;text-transform:uppercase;color:var(--acc);margin-top:10px}
.gx-plate .l:empty{display:none}
.gx-plate .l{display:inline-block;margin-top:12px;padding:4px 12px;border:1px solid rgba(184,134,47,.5);border-radius:8px;font:15px var(--f-rpg);color:var(--gold-2);background:rgba(255,253,248,.8)}
.gx-lantern{position:absolute;left:64%;top:46%;width:18px;height:24px;border-radius:6px;background:radial-gradient(circle,#FFE6A0,#E08A2A 60%,#5A2A0A);box-shadow:0 0 40px 12px rgba(255,190,90,.45);opacity:0;animation:gBob 2s ease-in-out infinite}
/* создание героя */
.gc{position:fixed;inset:0;z-index:99;--race:#3D7BD9;background:radial-gradient(110% 60% at 50% 25%,#FFFFFF 0,#F5EEDF 55%,#E6EDF6 100%);display:flex;flex-direction:column;overflow:hidden;color:var(--ink)}
.gc-top{padding:calc(18px + env(safe-area-inset-top,0px)) 20px 0;text-align:center}
.gc-top .k{font:600 11px var(--f-ui,system-ui);letter-spacing:.24em;text-transform:uppercase;color:var(--gold-2)}
.gc-top h2{margin:4px 0 0;font:32px var(--f-rpg);letter-spacing:.06em;background:linear-gradient(180deg,#B8862F,#6A4510);-webkit-background-clip:text;background-clip:text;color:transparent}
.gc-stage{position:relative;flex:1 1 auto;min-height:250px}
.gc-stage .host{position:absolute;inset:0 0 28px}
.gc-glow{position:absolute;left:50%;bottom:22px;width:250px;height:54px;transform:translateX(-50%);border-radius:50%;border:1.5px solid color-mix(in srgb,var(--race) 55%,#fff);box-shadow:0 0 30px color-mix(in srgb,var(--race) 40%,transparent);background:radial-gradient(closest-side,rgba(255,255,255,.8),transparent)}
.gc-stage .bonus{position:absolute;left:16px;right:16px;bottom:4px;text-align:center;font:500 12.5px var(--f-ui,system-ui);color:var(--muted)}
.gc-stage .bonus b{font:400 15px var(--f-rpg);color:var(--race)}
.gc-panel{flex:none;background:linear-gradient(180deg,rgba(255,253,248,.7),#FFFDF8 24px);border-top:1px solid rgba(184,134,47,.3);padding:10px 0 calc(14px + env(safe-area-inset-bottom,0px));max-height:58svh;overflow:auto;box-shadow:0 -14px 30px -24px rgba(70,50,20,.5)}
.gc-row{display:flex;align-items:center;justify-content:space-between;padding-right:20px}
.gc-l{font:600 10px var(--f-ui,system-ui);letter-spacing:.2em;text-transform:uppercase;color:var(--muted);padding:6px 20px}
.gc-g{display:flex;background:#F2EADA;border-radius:10px;padding:3px;gap:2px}
.gc-g button{border:0;background:none;padding:6px 10px;border-radius:8px;font:500 12px var(--f-ui,system-ui);color:var(--muted)}
.gc-g button[aria-pressed=true]{background:#fff;color:var(--ink);box-shadow:0 2px 6px rgba(70,50,20,.18)}
.gc-races{display:flex;gap:8px;overflow-x:auto;padding:4px 20px 10px;scroll-snap-type:x mandatory;scrollbar-width:none}
.gc-races::-webkit-scrollbar{display:none}
.gc-r{flex:none;scroll-snap-align:center;width:92px;padding:9px 6px 8px;border-radius:16px;border:1px solid rgba(184,134,47,.2);background:#FFFDF8;color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:6px;transition:transform .2s,border-color .2s,box-shadow .2s}
.gc-r .gl{width:52px;height:52px;border-radius:50%;background-color:color-mix(in srgb,var(--c) 18%,#fff);background-repeat:no-repeat;box-shadow:0 0 0 2px #fff,0 0 0 3px color-mix(in srgb,var(--c) 45%,transparent)}
.gc-r b{font:400 14px var(--f-rpg);letter-spacing:.02em;white-space:nowrap}
.gc-r i{font:600 9px var(--f-ui,system-ui);font-style:normal;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:-4px}
.gc-r.soon .gl{filter:grayscale(1) opacity(.45)}
.gc-r[aria-pressed=true]{border-color:var(--c);box-shadow:0 0 0 1px var(--c),0 10px 22px -10px var(--c);transform:translateY(-3px);background:color-mix(in srgb,var(--c) 7%,#fff)}
.gc-cls{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:0 20px}
.gc-c{padding:9px 6px;border-radius:12px;border:1px solid rgba(184,134,47,.18);background:#FFFDF8;color:var(--ink);text-align:center}
.gc-c b{display:block;font:400 15px var(--f-rpg)}
.gc-c small{font-size:10px;color:var(--muted)}
.gc-c[aria-pressed=true]{border-color:#C8902E;background:linear-gradient(180deg,#FFF6DC,#FFFDF8);box-shadow:0 0 0 1px #C8902E}
.gc-name{margin:4px 20px 0;display:flex;gap:8px}
.gc-name input{flex:1;min-width:0;height:48px;border-radius:12px;border:1px solid rgba(184,134,47,.35);background:#fff;color:var(--ink);padding:0 14px;font:400 18px var(--f-rpg)}
.gc-go{flex:none;height:48px;padding:0 20px;border-radius:12px;border:0;font:400 17px var(--f-rpg);letter-spacing:.05em;color:#2A1A04;background:linear-gradient(180deg,#F0D27C,#C8902E);box-shadow:0 10px 22px -10px rgba(160,110,30,.8)}
/* level up */
.gl-up{position:fixed;inset:0;z-index:100;display:grid;place-items:center;background:rgba(255,250,238,.9);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);overflow:hidden}
.gl-up .pillar{position:absolute;left:50%;top:-10%;bottom:-10%;width:200px;margin-left:-100px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--acc) 25%,transparent),rgba(255,236,170,.95),color-mix(in srgb,var(--acc) 25%,transparent),transparent);filter:blur(8px);transform-origin:50% 100%;animation:gPillar 1.1s cubic-bezier(.2,.9,.2,1)}
@keyframes gPillar{from{transform:scaleX(.05) scaleY(0);opacity:0}to{transform:none;opacity:1}}
.gl-up .box{position:relative;text-align:center;padding:0 24px;animation:gPop .7s .25s both cubic-bezier(.3,1.5,.5,1)}
@keyframes gPop{from{opacity:0;transform:scale(.6)}}
.gl-up .k{font:600 12px var(--f-ui,system-ui);letter-spacing:.3em;text-transform:uppercase;color:var(--gold-2)}
.gl-up .n{font:88px/1 var(--f-rpg);background:linear-gradient(180deg,#E9B44A,#7A5214);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 16px rgba(233,180,74,.55))}
.gl-up .r{font:22px var(--f-rpg);color:var(--ink);margin:6px 0 18px}
.gl-up .st{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:320px;margin:0 auto}
.gl-up .st button{padding:12px 8px;border-radius:12px;border:1px solid rgba(184,134,47,.45);background:#FFFDF8;color:var(--ink);font:400 17px var(--f-rpg);box-shadow:0 8px 18px -12px rgba(70,50,20,.5)}
.gl-up .st button small{display:block;font:500 10px var(--f-ui,system-ui);color:var(--muted);margin-top:2px}
/* лист персонажа и лут */
.gsh{display:flex;flex-direction:column;gap:14px}
.gsh-top{display:flex;gap:14px;align-items:center}
.gsh-top img{width:104px;height:150px;object-fit:contain;object-position:50% 100%;border-radius:16px;border:1px solid rgba(184,134,47,.4);background:radial-gradient(circle at 50% 35%,#fff,color-mix(in srgb,var(--acc) 22%,#F3ECDD))}
.gsh-top b{display:block;font:26px var(--f-rpg);color:var(--ink)}
.gsh-top span{font-size:13px;color:var(--acc)}
.gsh-st{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gsh-st div{padding:10px 12px;border-radius:12px;background:#FBF6EC;border:1px solid rgba(184,134,47,.18)}
.gsh-st b{display:block;font:24px var(--f-rpg);color:var(--gold-2)}
.gsh-st small{color:var(--muted);font-size:11px}
.gsh-inv{display:flex;flex-wrap:wrap;gap:6px}
.gsh-inv span{font-size:12px;padding:6px 9px;border-radius:8px;background:#F4EEFF;border:1px solid rgba(138,79,224,.3);color:#5A34A8}
.g-loot{position:fixed;inset:0;z-index:100;display:grid;place-items:center;background:rgba(255,250,238,.9);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.g-loot .c{font-size:86px;animation:gChest 1s cubic-bezier(.3,1.5,.5,1)}
@keyframes gChest{0%{transform:scale(.4) rotate(-12deg)}40%{transform:scale(1.15) rotate(8deg)}60%{transform:rotate(-6deg)}}
.g-loot .t{text-align:center;margin-top:10px;font:28px var(--f-rpg);color:var(--ink);animation:gPop .6s .5s both}
.g-loot .t small{display:block;font:600 12px var(--f-ui,system-ui);letter-spacing:.14em;text-transform:uppercase;color:#8A4FE0;margin-top:8px}
.ai-k{color:var(--gold-2)!important;font-family:var(--f-rpg)!important;letter-spacing:.08em}
@media (prefers-reduced-motion:reduce){.g-bg,.g-fog,.g-circle::after,.g-chest,.g-mini .mm::before{animation:none!important}}
`;
  document.documentElement.setAttribute('data-theme', 'light'); // игровой интерфейс всегда светлый
  const st = document.createElement('style'); st.id = 'rpgCSS'; st.textContent = CSS; document.head.appendChild(st);
  const applyRace = () => document.documentElement.style.setProperty('--race', race().acc);
  document.querySelectorAll('meta[name=theme-color]').forEach(m => m.setAttribute('content', '#E7EEF8'));

  /* ---------- опыт с расовыми бонусами ---------- */
  xpInfo = function () {
    const R = (hero() || {}).race || 'human';
    const M = k => R === 'human' ? 1.05 : RACES[R] && RACES[R].k === k ? 1.15 : 1;
    let tasks = 0, sport = 0, notes = 0, moods = 0, videos = 0, gold = 0;
    Object.values(S.clients).forEach(c => { if (c.example) return; (c.tasks || []).forEach(t => { if (t.done) tasks += 10; }); });
    Object.values(S.workouts).forEach(w => { if (w && (w.cardio || w.done || w.squats)) sport += 15; if (w && w.squats) sport += 10; });
    moods = Object.keys(S.moods).length * 5; notes = Object.keys(S.notes || {}).length * 3;
    videos = Object.values(S.videos).filter(v => !v.example && ['pub', 'done'].includes(v.stage)).length * 20;
    if (FULL()) { const nw = new Date(); for (let i = 0; i < 24; i++) { const d = new Date(nw.getFullYear(), nw.getMonth() - i, 1); const mk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); try { monthPays(mk).forEach(p => { if (p.status === 'paid') gold += 25; }); } catch (e) {} } }
    const xp = Math.round(tasks * M('tasks') + sport * M('sport') + notes * M('notes') + moods * M('moods') + videos * M('tasks') + gold * M('gold') + (+rpgS().bonus || 0));
    let lvl = 1, need = 100, cur = xp; while (cur >= need) { cur -= need; lvl++; need = Math.round(need * 1.2 / 10) * 10; }
    return { lvl, cur, need, total: xp };
  };

  /* ---------- герой: картинка и бюст для маленьких аватарок ---------- */
  // рост рас относительно человека (картинки все во весь кадр)
  const HSCALE = { dwarf: .8, orc: 1.04, elf: 1, human: .97, dragon: 1, moon: .98 };
  const HMETA = /*HMETA*/{};
  Object.keys(HMETA).forEach(k => { HMETA[k].scale = HSCALE[k.split('-')[0]] || 1; if (k.endsWith('-f')) HMETA[k].scale *= .97; });
  const heroKey = h => ((h && h.race) || 'human') + '-' + ((h && h.g) || 'm');
  // если рисунка для расы/пола ещё нет — берём тот же народ другого пола, затем человека
  const artKey = h => { const k = heroKey(h); if (HMETA[k]) return k; const r = (h && h.race) || 'human'; for (const g of ['m', 'f']) if (HMETA[r + '-' + g]) return r + '-' + g; return HMETA['human-' + ((h && h.g) || 'm')] ? 'human-' + ((h && h.g) || 'm') : 'human-m'; };
  const hasArt = r => !!(HMETA[r + '-m'] || HMETA[r + '-f']);
  const heroSrc = h => (window.SHTAB_HEROES || 'heroes/') + artKey(h) + '.webp';
  const FALL = { happy: 'idle', proud: 'idle', sleep: 'idle', cry: 'alert', think: 'idle', alert: 'idle' };
  function refreshDosImgs() {
    const A = window.DOS_ART || {};
    document.querySelectorAll('.dos.pic img').forEach(im => { const k = (im.className.match(/p-(\w+)/) || [])[1]; const src = A[k] || A[FALL[k]] || A.idle; if (src && im.src !== src) im.src = src; });
    document.querySelectorAll('[data-por]').forEach(im => { if (A.idle && im.src !== A.idle) im.src = A.idle; });
  }
  const setArt = u => { window.DOS_ART = { idle: u, happy: u, proud: u, think: u, alert: u, cry: u, sleep: u }; refreshDosImgs(); };
  try { const c = JSON.parse(localStorage.getItem('shtab_bust') || 'null'); if (c && c.u) { window.DOS_ART = { idle: c.u, happy: c.u, proud: c.u, think: c.u, alert: c.u, cry: c.u, sleep: c.u }; } } catch (e) {}
  let bustKey = null;
  function makeBust() {
    const h = hero(); if (!h) return; const k = artKey(h); if (bustKey === k) return; bustKey = k;
    try { const c = JSON.parse(localStorage.getItem('shtab_bust') || 'null'); if (c && c.k === k && c.u) { setArt(c.u); return; } } catch (e) {}
    const im = new Image();
    im.onload = () => {
      const m = HMETA[artKey(h)] || { head: [.5, .14, .08] }, W = im.naturalWidth, H = im.naturalHeight, r = m.head[2] * W;
      const bw = Math.min(W, r * 5.2), bh = bw * 520 / 466, sx = Math.max(0, Math.min(W - bw, m.head[0] * W - bw / 2)), sy = Math.max(0, m.head[1] * H - r * 1.7);
      const c = document.createElement('canvas'); c.width = 466; c.height = 520; c.getContext('2d').drawImage(im, sx, sy, bw, bh, 0, 0, 466, 520);
      let u; try { u = c.toDataURL('image/webp', .88); } catch (e) { return; }
      setArt(u); try { localStorage.setItem('shtab_bust', JSON.stringify({ k, u })); } catch (e) {}
    };
    im.src = heroSrc(h);
  }
  // аватарка-лицо для карточек рас: фон-картинка, отцентрованная по голове
  function faceBg(h, px) {
    const m = HMETA[artKey(h)] || { head: [.5, .14, .08], ar: .5625 }, bw = px * .32 / m.head[2], bh = bw / (m.ar || .5625);
    return 'background-image:url(' + heroSrc(h) + ');background-size:' + bw.toFixed(0) + 'px ' + bh.toFixed(0) + 'px;background-position:' + (px / 2 - m.head[0] * bw).toFixed(0) + 'px ' + (px * .55 - m.head[1] * bh).toFixed(0) + 'px';
  }

  /* ---------- живой герой на сцене ---------- */
  let stageHero = null, stageEl = null;
  const RX = { flip: 'jump', jump: 'jump', dance: 'victory', pace: 'shake', wave: 'wave', salute: 'bow', shake: 'shake', poof: 'jump', run: 'jump', think: 'nod' };
  const proxy = {
    get el() { return stageEl || document.body; },
    get mood() { return stageHero ? stageHero.mood : 'idle'; },
    setMood(m) { if (stageHero) stageHero.setMood(m); },
    react(n) { if (stageHero) stageHero.react(RX[n] || n); }
  };
  function attachStage() {
    const host = document.getElementById('gHero'); if (!host) return;
    DOSX.hero = proxy;
    if (!window.Hero2D) return;
    const h = hero() || { race: 'human', g: 'm' };
    if (!stageEl) { stageEl = document.createElement('div'); stageEl.className = 'g-hero-in'; stageHero = Hero2D.mount(stageEl, { mood: dosMood(), acc: race().acc }); if (typeof bindDos === 'function') bindDos(stageEl, () => proxy); }
    const src = heroSrc(h); if (stageEl.dataset.src !== src) { stageEl.dataset.src = src; stageHero.setHero(src, HMETA[artKey(h)], race().acc); }
    else stageEl.style.setProperty('--hacc', race().acc);
    if (stageEl.parentNode !== host) { host.appendChild(stageEl); stageHero.wake(); }
    const dm = dosMood(); if (stageHero.mood !== dm && stageHero.mood !== 'surprised') stageHero.setMood(dm);
  }

  /* ---------- HUD: сцена «Квесты» ---------- */
  function energy() {
    const md = S.moods[today()] && S.moods[today()].mood;
    let v = { fire: 100, ok: 82, meh: 60, tired: 32, stress: 45 }[md] || 70;
    const hr = new Date().getHours(); if (hr >= 23 || hr < 5) v -= 18; return Math.max(8, v);
  }
  function stageHTML() {
    const it = computeItems(), left = it.burn.length + it.today.length, done = doneTodayCount(), tot = left + done;
    const X = xpInfo(), h = hero() || {}, R = race(), C = CLASSES[h.cls] || CLASSES.strat;
    const EPc = window.EPOCHS.current(), EP = EPc.epoch, A = window.DOS_ART || {};
    const mp = tot ? Math.round(done / tot * 100) : 100, hp = energy();
    let gold = '';
    if (FULL()) { const ps = monthPays(mKey(today())); const got = ps.filter(p => p.status === 'paid').reduce((a, p) => a + (+p.amount || 0), 0); gold = '<span class="g-gold"><i></i>' + kM(got) + '</span>'; }
    const chest = rpgS().chest !== today();
    const rank = (typeof RANKS !== 'undefined' ? RANKS[Math.min(RANKS.length - 1, Math.floor((X.lvl - 1) / 3))] : '');
    return '<section class="g-stage" aria-label="Герой">' +
      '<div class="g-bg" aria-hidden="true">' + window.EPOCHS.art(EP) + '</div><div class="g-shade" aria-hidden="true"></div><div class="g-fog" aria-hidden="true"></div><div class="g-circle" aria-hidden="true"></div>' +
      '<div class="g-hero" id="gHero" role="button" aria-label="Герой: тап — подсказка, удерживай — летопись эпохи"></div>' +
      '<div class="g-hud"><button class="g-por" data-gsheet aria-label="Лист персонажа">' + (A.idle ? '<img data-por src="' + A.idle + '" alt="">' : '<span class="ph">' + esc((S.settings.name || 'Г').charAt(0)) + '</span>') + '<span class="g-lv">' + X.lvl + '</span></button>' +
      '<div class="g-who"><div class="g-name">' + esc(S.settings.name || 'Герой') + '</div><div class="g-cls">' + esc(R.n + ' · ' + C.n + (rank ? ' · ' + rank : '')) + '</div>' +
      '<div class="g-bar hp" title="Энергия"><i style="width:' + hp + '%"></i><b>HP ' + hp + '</b></div>' +
      '<div class="g-bar mp" title="Фокус"><i style="width:' + mp + '%"></i><b>MP ' + mp + '</b></div>' +
      '<div class="g-bar xp" id="gXp" title="Опыт"><i style="width:' + (X.cur / X.need * 100).toFixed(1) + '%"></i><b>XP ' + X.cur + '/' + X.need + '</b></div></div></div>' +
      '<button class="g-mini" data-epochs aria-label="Карта королевств"><span class="mm" aria-hidden="true">' + ((typeof EPICON !== 'undefined' && EPICON[EP.id]) || '✦') + '</span><small>' + esc(EP.name) + '</small><small>ещё ' + (3 - EPc.day) + ' дн.</small>' + gold + '</button>' +
      '<div class="g-plate"><div><p class="g-big">' + (left ? left + ' ' + plural(left, 'квест', 'квеста', 'квестов') + '<small>' + greet() + '</small>' : 'Карта чиста<small>день закрыт</small>') + '</p>' +
      '<div class="g-chips">' + (it.burn.length ? '<span class="late">🔥 ' + it.burn.length + ' ' + plural(it.burn.length, 'горит', 'горят', 'горят') + '</span>' : '') + '<span>' + done + '/' + tot + ' сдано</span></div></div>' +
      (chest ? '<button class="g-chest" data-gchest aria-label="Ежедневный сундук">🧰<span>сундук</span></button>' : '') + '</div></section>';
  }
  const _renderToday = renderToday;
  renderToday = function () {
    let h = _renderToday();
    const a = h.indexOf('<section class="hero scene neo"');
    if (a >= 0) { const b = h.indexOf('</section>', a); h = h.slice(0, a) + stageHTML() + h.slice(b + 10); }
    const R = [['>Дела на сегодня<', '>Квесты дня<'], ['>Привычки<', '>Ежедневные<'], ['>Хроника эпохи<', '>Летопись королевства<'], ['>Неделя<', '>Журнал недели<'], ['<h2>Сегодня', '<h2>Активные квесты'], ['>+ Задача<', '>+ Квест<']];
    R.forEach(([x, y]) => { h = h.split(x).join(y); });
    return h;
  };
  const _qt = quickTiles;
  quickTiles = function (w) {
    let h = _qt(w);
    [['<b>Контент</b>', '<b>Кузница</b>'], ['<b>Спорт</b>', '<b>Арена</b>'], ['<b>Заметки</b>', '<b>Гримуар</b>'], ['<b>Деньги</b>', '<b>Казна</b>'], ['<b>Проекты</b>', '<b>Рейды</b>'], ['<b>Эпохи</b>', '<b>Королевства</b>']].forEach(([x, y]) => { h = h.split(x).join(y); });
    return h;
  };
  /* редкость квестов */
  function rarity(it, burn) {
    if (burn) return 'legend';
    if (it.kind === 'video' || /^rv/.test(it.key || '')) return 'epic';
    if (it.kind === 'sport' || it.results || / · в /.test(it.sub || '')) return 'rare';
    return 'common';
  }
  const _row = rowHTML;
  rowHTML = function (it, i, burn) {
    const r = rarity(it, burn);
    return _row(it, i, burn).replace('<li class="row ', '<li data-rar="' + r + '" class="row rar-' + r + ' ').replace('<span class="row-title">', '<span class="row-title" data-rr="' + RAR[r] + (it.kind === 'sport' ? ' · ежедневный' : '') + '">');
  };
  /* рейды: у проекта есть босс с полосой HP */
  const _pc = projCard;
  projCard = function (id, c, feat) {
    const s = pStats(c), left = s.total - s.done, hp = s.total ? left / s.total * 100 : 0;
    const boss = '<span class="boss' + (s.total && !left ? ' dead' : '') + '"><span class="boss-l"><span>' + (s.total && !left ? 'Босс повержен' : 'Босс рейда') + '</span><span>HP ' + left + '/' + s.total + '</span></span><span class="boss-hp"><i style="width:' + hp.toFixed(0) + '%"></i></span></span>';
    return _pc(id, c, feat).replace('<span class="pc2-foot">', boss + '<span class="pc2-foot">');
  };
  Object.assign(TITLES, TABN);

  /* ---------- после каждого рендера ---------- */
  const _render = render;
  render = function () {
    applyRace();
    _render();
    document.querySelectorAll('.tab').forEach(b => {
      const k = b.dataset.tab, tl = b.querySelector('.tl');
      if (tl && TABN[k] && tl.textContent !== TABN[k]) tl.textContent = TABN[k];
      const sv = b.querySelector('svg'); if (sv && !sv.dataset.g && ICO[k]) { sv.outerHTML = svgI(k).replace('<svg ', '<svg data-g="1" '); }
    });
    skillRings();
    const ready = S.offline || Object.values(S.ready).every(Boolean);
    if (!ready) return;
    if (S.tab === 'today') attachStage();
    makeBust();
    refreshDosImgs();
    if (S.ready.settings && !hero() && !gcOpen && !introOn) setTimeout(() => { if (!hero() && !gcOpen) openCreate(); }, 300);
  };
  function skillRings() {
    try {
      const t = today(), it = computeItems(), left = it.burn.length + it.today.length, done = doneTodayCount();
      const w = S.workouts[t] || {}, wk = weekInfo();
      let goalP = 0;
      if (FULL()) { const g = +S.settings.incomeGoal || 0; const ps = monthPays(mKey(t)); const got = ps.filter(p => p.status === 'paid').reduce((a, p) => a + (+p.amount || 0), 0); goalP = g ? got / g * 100 : 0; }
      const P = { today: left + done ? done / (left + done) * 100 : 100, projects: 0, content: wk.plan ? wk.fact / wk.plan * 100 : 0, sport: ((wdone(w) ? 1 : 0) + (w.squats ? 1 : 0)) * 50, money: goalP, notes: 0 };
      document.querySelectorAll('.tab').forEach(b => b.style.setProperty('--p', Math.min(100, P[b.dataset.tab] || 0).toFixed(0)));
    } catch (e) {}
  }

  /* ---------- клики: лист персонажа, сундук ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-gsheet],[data-gchest]'); if (!t) return;
    e.stopPropagation();
    if (t.hasAttribute('data-gsheet')) openHeroSheet(); else openChest(t);
  }, true);
  // квест сдан: монеты, крит, level up
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-done]'); if (!t || t.dataset.busy) return;
    const it = S.items && S.items[t.dataset.done]; if (!it || !it.done) return;
    const lv0 = xpInfo().lvl, r = t.getBoundingClientRect(), row = t.closest('.row');
    const rar = row && row.dataset.rar || 'common';
    coins(r, rar === 'legend' ? 14 : rar === 'epic' ? 11 : 8);
    const crit = Math.random() < .1;
    if (crit) {
      setTimeout(() => { floatText(r.left + r.width / 2 + 60, r.top - 20, 'КРИТ! ×2', true); proxy.react('surprised'); FX.buzz && FX.buzz([20, 40, 20]); }, 380);
      setTimeout(() => saveRpg({ bonus: (+rpgS().bonus || 0) + (typeof xpFor === 'function' ? xpFor(it) : 10) }), 900);
    }
    setTimeout(() => { proxy.react('victory'); }, 520);
    setTimeout(() => { const lv1 = xpInfo().lvl; if (lv1 > lv0) levelUp(lv1); }, 1400);
  }, true);

  function coins(r, n) {
    if (RM) return;
    const tgt = document.getElementById('gXp'); const tr = tgt ? tgt.getBoundingClientRect() : { left: innerWidth / 2, top: 20, width: 0, height: 0 };
    const tx = tr.left + tr.width * .8, ty = Math.max(10, tr.top + tr.height / 2);
    const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'); c.className = 'g-coin'; document.body.appendChild(c);
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40, mx = x0 + Math.cos(a) * d, my = y0 + Math.sin(a) * d - 30;
      c.animate([{ transform: `translate(${x0}px,${y0}px) scale(.4)`, opacity: 0 }, { transform: `translate(${mx}px,${my}px) scale(1.1)`, opacity: 1, offset: .35 }, { transform: `translate(${tx}px,${ty}px) scale(.5)`, opacity: .9 }],
        { duration: 900 + i * 45, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' }).onfinish = () => { c.remove(); const b = document.querySelector('#gXp'); if (b && !b._p) { b._p = 1; b.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(2.2)' }, { filter: 'brightness(1)' }], { duration: 380 }).onfinish = () => b._p = 0; } };
      c.style.left = '0'; c.style.top = '0';
    }
  }
  function floatText(x, y, txt, crit) {
    if (RM) return;
    const e = document.createElement('div'); e.className = 'g-float' + (crit ? ' crit' : ''); e.textContent = txt; e.style.left = x + 'px'; e.style.top = y + 'px'; document.body.appendChild(e);
    e.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-80%) scale(1.15)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-160%) scale(1)', opacity: 0 }], { duration: 1500, easing: 'cubic-bezier(.2,.9,.2,1)' }).onfinish = () => e.remove();
  }

  /* ---------- level up ---------- */
  function levelUp(lvl) {
    const ov = document.createElement('div'); ov.className = 'gl-up'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Новый уровень');
    const rank = typeof RANKS !== 'undefined' ? RANKS[Math.min(RANKS.length - 1, Math.floor((lvl - 1) / 3))] : '';
    ov.innerHTML = '<div class="pillar"></div><div class="box"><div class="k">Новый уровень</div><div class="n">' + lvl + '</div><div class="r">' + esc(rank) + '</div><div class="k" style="letter-spacing:.14em;margin-bottom:10px">Выбери +1 к характеристике</div><div class="st">' +
      STATS.map(([k, n, d]) => '<button data-stat="' + k + '">' + n + '<small>' + d + ' · ' + ((rpgS().stats || {})[k] || 0) + '</small></button>').join('') + '</div></div>';
    document.body.appendChild(ov);
    if (FX.confetti) FX.confetti(innerWidth / 2, innerHeight * .35, ['#E9C46A', '#FFFFFF', race().acc], 140);
    proxy.react('flip'); gong(.6);
    ov.addEventListener('click', e => {
      const b = e.target.closest('[data-stat]'); if (!b) return;
      const s = Object.assign({}, rpgS().stats || {}); s[b.dataset.stat] = (s[b.dataset.stat] || 0) + 1;
      saveRpg({ stats: s, lvlSeen: lvl }); ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => ov.remove();
      toast(STATS.find(x => x[0] === b.dataset.stat)[1] + ' +1');
    });
  }

  /* ---------- сундук ---------- */
  function openChest(btn) {
    const n = 10 + Math.floor(Math.random() * 21), item = LOOT[Math.floor(Math.random() * LOOT.length)];
    const inv = (rpgS().inv || []).slice(-23).concat([item]);
    const ov = document.createElement('div'); ov.className = 'g-loot';
    ov.innerHTML = '<div><div class="c" aria-hidden="true">🧰</div><div class="t">+' + n + ' XP<small>Эпический лут · ' + esc(item) + '</small></div></div>';
    document.body.appendChild(ov); gong(.35);
    setTimeout(() => { if (FX.confetti) FX.confetti(innerWidth / 2, innerHeight * .45, ['#F3D58A', '#B26BFF', '#FFFFFF'], 90); }, 380);
    const close = () => { ov.remove(); saveRpg({ chest: today(), bonus: (+rpgS().bonus || 0) + n, inv }); proxy.react('victory'); };
    ov.addEventListener('click', close); setTimeout(() => ov.isConnected && close(), 2600);
  }

  /* ---------- лист персонажа ---------- */
  function openHeroSheet() {
    const h = hero() || {}, R = race(), C = CLASSES[h.cls] || CLASSES.strat, X = xpInfo(), s = rpgS().stats || {}, A = window.DOS_ART || {};
    openSheet(sheetTop('Герой') + '<div class="gsh"><div class="gsh-top">' + '<img class="full" src="' + heroSrc(h) + '" alt="">' + '<div><b>' + esc(S.settings.name || 'Герой') + '</b><span>' + esc(R.n + ' · ' + C.n) + '</span><p class="note" style="padding:6px 0 0">Уровень ' + X.lvl + ' · всего ' + X.total + ' XP<br>' + esc(R.d) + '</p></div></div>' +
      '<div class="gsh-st">' + STATS.map(([k, n, d]) => '<div><b>' + (10 + (s[k] || 0)) + '</b><small>' + n + ' · ' + d + '</small></div>').join('') + '</div>' +
      ((rpgS().inv || []).length ? '<div><p class="flabel" style="padding:0 0 6px">Инвентарь</p><div class="gsh-inv">' + rpgS().inv.slice().reverse().map(x => '<span>' + esc(x) + '</span>').join('') + '</div></div>' : '') +
      '<div class="actions"><button class="btn ghost" data-gedit>Изменить героя</button></div></div>');
    const b = document.querySelector('[data-gedit]'); if (b) b.onclick = () => { closeSheet(); openCreate(true); };
  }

  /* ---------- создание героя ---------- */
  let gcOpen = false;
  function openCreate(edit) {
    if (gcOpen) return; gcOpen = true;
    const h0 = hero() || {};
    let sel = { race: h0.race || 'human', g: h0.g || 'm', cls: h0.cls || (FULL() ? 'strat' : 'keeper') };
    const ov = document.createElement('div'); ov.className = 'gc'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Создание героя');
    let prev = null;
    const draw = (swap) => {
      const R = RACES[sel.race];
      ov.style.setProperty('--race', R.acc); document.documentElement.style.setProperty('--race', R.acc);
      ov.querySelectorAll('[data-race]').forEach(b => { b.setAttribute('aria-pressed', b.dataset.race === sel.race); b.querySelector('.gl').setAttribute('style', faceBg({ race: b.dataset.race, g: sel.g }, 52)); });
      ov.querySelectorAll('[data-cls]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cls === sel.cls));
      ov.querySelectorAll('[data-g]').forEach(b => b.setAttribute('aria-pressed', b.dataset.g === sel.g));
      ov.querySelector('.bonus').innerHTML = '<b>' + esc(R.n) + '</b> · ' + esc(R.d);
      if (prev && swap) prev.setHero(heroSrc(sel), HMETA[artKey(sel)], R.acc);
    };
    ov.innerHTML = '<div class="gc-top"><div class="k">' + (edit ? 'Перерождение' : 'Новый путь') + '</div><h2>Создание героя</h2></div>' +
      '<div class="gc-stage"><div class="gc-glow"></div><div class="host" id="gcHost"></div><div class="bonus"></div></div>' +
      '<div class="gc-panel"><div class="gc-row"><div class="gc-l">Раса</div><div class="gc-g" role="group" aria-label="Пол"' + (Object.keys(HMETA).some(k => k.endsWith('-f')) ? '' : ' hidden') + '><button data-g="m">Мужчина</button><button data-g="f">Женщина</button></div></div><div class="gc-races">' +
      Object.entries(RACES).map(([k, r]) => '<button class="gc-r' + (hasArt(k) ? '' : ' soon') + '" data-race="' + k + '" style="--c:' + r.acc + '"><span class="gl"></span><b>' + r.n + '</b>' + (hasArt(k) ? '' : '<i>рисуется</i>') + '</button>').join('') + '</div>' +
      '<div class="gc-l">Класс</div><div class="gc-cls">' + Object.entries(CLASSES).filter(([k]) => FULL() || k !== 'trader').map(([k, c]) => '<button class="gc-c" data-cls="' + k + '"><b>' + c.n + '</b><small>' + c.d + '</small></button>').join('') + '</div>' +
      '<div class="gc-l">Имя</div><form class="gc-name"><input id="gcName" maxlength="24" autocomplete="given-name" placeholder="Имя героя" value="' + esc(S.settings.name || '') + '"><button class="gc-go" type="submit">' + (edit ? 'Готово' : 'В путь') + '</button></form></div>';
    document.body.appendChild(ov); document.body.style.overflow = 'hidden';
    const host = ov.querySelector('#gcHost');
    if (window.Hero2D) { prev = Hero2D.mount(host, { src: heroSrc(sel), meta: HMETA[artKey(sel)], acc: RACES[sel.race].acc, mood: 'happy' }); setTimeout(() => prev && prev.react('appear'), 120); }
    draw(false);
    ov.addEventListener('click', e => {
      const b = e.target.closest('[data-race],[data-cls],[data-g]'); if (!b) return;
      if (b.dataset.race) { if (sel.race === b.dataset.race) return; sel.race = b.dataset.race; draw(true); b.scrollIntoView({ inline: 'center', behavior: RM ? 'auto' : 'smooth', block: 'nearest' }); }
      else if (b.dataset.g) { if (sel.g === b.dataset.g) return; sel.g = b.dataset.g; draw(true); }
      else if (b.dataset.cls) { sel.cls = b.dataset.cls; draw(false); if (prev) prev.react('bow'); }
      FX.buzz && FX.buzz(8);
    });
    ov.querySelector('form').onsubmit = e => {
      e.preventDefault();
      const name = (ov.querySelector('#gcName').value || '').trim().slice(0, 24) || S.settings.name || 'Герой';
      put('settings', 'main', Object.assign({}, S.settings, { hero: sel, name, welcomed: true }));
      if (prev) prev.react('victory');
      setTimeout(() => ov.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(1.03)' }], { duration: RM ? 1 : 420, fill: 'forwards' }).onfinish = () => {
        if (prev) prev.destroy(); prev = null;
        ov.remove(); gcOpen = false; document.body.style.overflow = '';
        bustKey = null; try { localStorage.removeItem('shtab_bust'); } catch (e) {}
        applyRace(); render();
        if (!edit && FX.confetti) FX.confetti(innerWidth / 2, innerHeight * .3, ['#E9C46A', RACES[sel.race].acc, '#fff'], 120);
      }, RM ? 0 : 650);
    };
  }
  openWelcome = function () { if (!hero()) openCreate(); };
  { const _eim = epochIntroMaybe; epochIntroMaybe = function () { const go = () => (introOn || gcOpen) ? setTimeout(go, 500) : _eim(); go(); }; }

  /* ---------- звук «гонг» ---------- */
  let ac = null;
  function gong(vol) {
    try { if (localStorage.getItem('shtab_sound') === '0') return; } catch (e) {}
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime, g = ac.createGain(); g.connect(ac.destination);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18 * (vol || 1), t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
      [[98, 1], [196, .5], [293.7, .28], [392, .16], [523, .08]].forEach(([f, a]) => { const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .985, t + 2.5); og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + 2.7); });
    } catch (e) {}
  }

  /* ---------- карта королевств (для кат-сцены) ---------- */
  const KPOS = { kz: [64, 34], sumer: [54, 46], egypt: [46, 52], greece: [42, 40], rome: [36, 38], persia: [58, 50], native: [14, 36], vikings: [38, 20], medieval: [30, 30], mongol: [74, 28], japan: [88, 38], maya: [20, 58] };
  function mapSVG(cur) {
    const ids = window.EPOCHS.list.map(e => e.id);
    let s = '<svg viewBox="0 0 100 80" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><radialGradient id="gxSea"><stop offset="0" stop-color="#E4EEF7"/><stop offset="1" stop-color="#C9DAEA"/></radialGradient><filter id="gxRough"><feTurbulence baseFrequency=".9" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="1.6"/></filter></defs>' +
      '<rect width="100" height="80" fill="url(#gxSea)"/>' +
      '<g fill="#F1E4C6" stroke="#A9803C" stroke-width=".35" filter="url(#gxRough)">' +
      '<path d="M26 14 C34 8 52 9 62 12 C72 10 86 14 94 22 C97 30 92 40 90 46 C84 50 74 48 66 56 C58 60 50 62 44 58 C38 52 30 50 26 44 C22 36 20 22 26 14Z"/>' +
      '<path d="M6 26 C12 20 22 24 22 32 C24 42 18 50 20 58 C22 66 16 70 12 64 C8 56 4 44 6 26Z"/>' +
      '<path d="M84 34 C88 32 92 36 90 42 C88 44 84 42 84 34Z"/><path d="M34 16 C38 12 44 14 42 20 C38 24 33 22 34 16Z"/></g>' +
      '<g stroke="rgba(140,100,40,.18)" stroke-width=".2" fill="none">' + Array.from({ length: 9 }, (_, i) => '<path d="M0 ' + (i * 10 + 4) + 'H100"/>').join('') + Array.from({ length: 11 }, (_, i) => '<path d="M' + (i * 10) + ' 0V80"/>').join('') + '</g>';
    ids.forEach(id => {
      const p = KPOS[id] || [50, 40], on = id === cur, ep = window.EPOCHS.list.find(e => e.id === id);
      s += '<g transform="translate(' + p[0] + ' ' + p[1] + ')">' + (on ? '<circle r="4" fill="none" stroke="#C8902E" stroke-width=".5"><animate attributeName="r" values="2;6;2" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="1.6s" repeatCount="indefinite"/></circle>' : '') +
        '<circle r="' + (on ? 1.6 : 1) + '" fill="' + (on ? '#C8902E' : '#9C865E') + '"/><text y="-2.4" text-anchor="middle" font-size="' + (on ? 2.6 : 1.8) + '" fill="' + (on ? '#5A3A0E' : '#8A7454') + '" font-family="Forum,serif">' + esc(ep ? ep.name : id) + '</text></g>';
    });
    return s + '<g transform="translate(90 70)" stroke="#A9803C" stroke-width=".3" fill="none"><circle r="5"/><path d="M0 -6V6M-6 0H6"/><path d="M0 -5l1.2 5-1.2 5-1.2-5z" fill="#A9803C"/></g></svg>';
  }

  /* ---------- кат-сцена входа ---------- */
  let introOn = false;
  function intro() {
    let seen = ''; try { seen = localStorage.getItem('shtab_intro') || ''; } catch (e) {}
    const full = seen !== today0();
    try { localStorage.setItem('shtab_intro', today0()); } catch (e) {}
    if (RM) return;
    introOn = true;
    const ov = document.createElement('div'); ov.className = 'gx'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<canvas class="fx"></canvas><div class="gx-map"></div><svg class="gx-rune" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="78" stroke-dasharray="2 5"/><path d="M100 18 L171 141 L29 141 Z"/><path d="M100 182 L29 59 L171 59 Z"/><circle cx="100" cy="100" r="34"/><path d="M100 66 V134 M66 100 H134"/></svg>' +
      '<div class="gx-portal"></div><div class="gx-host"></div><div class="gx-lantern"></div><div class="gx-plate"><div class="t"></div><div class="s"></div><span class="l"></span></div><div class="skip">тап — пропустить</div>';
    document.body.appendChild(ov);
    const rune = ov.querySelector('.gx-rune'), portal = ov.querySelector('.gx-portal'), map = ov.querySelector('.gx-map'), host = ov.querySelector('.gx-host'), plate = ov.querySelector('.gx-plate'), lan = ov.querySelector('.gx-lantern');
    const cv = ov.querySelector('canvas'), cx = cv.getContext('2d'); const dpr = Math.min(2, devicePixelRatio || 1);
    const W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.scale(dpr, dpr);
    const P = Array.from({ length: 140 }, () => { const a = Math.random() * Math.PI * 2, d = Math.max(W, H) * (.5 + Math.random() * .6); return { a, d, s: .6 + Math.random() * 1.8, sp: .6 + Math.random() * .8 }; });
    let t0 = performance.now(), dead = false, raf = 0, ih = null;
    const night = (() => { const h = new Date().getHours(); return h >= 23 || h < 5; })();
    const T = full ? { rune: [0, 900], spark: [600, 1700], map: [1500, 2500], hero: [2400, 3500], plate: [2700, 3500], end: 3900 } : { rune: [0, 400], spark: [0, 600], map: [-1, -1], hero: [200, 1000], plate: [300, 1000], end: 1250 };
    const fx = () => {
      const t = performance.now() - t0; cx.clearRect(0, 0, W, H);
      const [s0, s1] = T.spark;
      if (t > s0 && t < T.end) {
        const k = Math.min(1, (t - s0) / (s1 - s0)), ac2 = getComputedStyle(document.documentElement).getPropertyValue('--race') || '#7FB8FF';
        P.forEach(p => {
          const r = p.d * (1 - Math.pow(k, .7) * .78) + Math.sin(t / 300 + p.a * 3) * 4, ang = p.a + k * p.sp * 2.2;
          const x = W / 2 + Math.cos(ang) * r, y = H / 2 + Math.sin(ang) * r * .96;
          cx.fillStyle = Math.random() < .55 ? 'rgba(200,144,46,' + (.35 + k * .6) + ')' : ac2.trim(); cx.globalAlpha = .45 + k * .5;
          cx.beginPath(); cx.arc(x, y, p.s, 0, 6.3); cx.fill();
        });
        cx.globalAlpha = 1;
      }
      if (!dead) raf = requestAnimationFrame(fx);
    };
    raf = requestAnimationFrame(fx);
    const A = (el, kf, o) => el.animate(kf, Object.assign({ fill: 'forwards', easing: 'cubic-bezier(.2,.8,.2,1)' }, o));
    A(rune, [{ opacity: 0, transform: 'scale(.6) rotate(-30deg)', filter: 'drop-shadow(0 0 0 #E9C46A)' }, { opacity: 1, transform: 'scale(1) rotate(0)', filter: 'drop-shadow(0 0 14px #E9C46A)', offset: .6 }, { opacity: 0, transform: 'scale(1.4) rotate(40deg)' }], { delay: T.rune[0], duration: T.rune[1] + 400 });
    if (full) { gong(1); map.innerHTML = mapSVG(window.EPOCHS.current().epoch.id); const kp = KPOS[window.EPOCHS.current().epoch.id] || [50, 40];
      map.style.transformOrigin = kp[0] + '% ' + (kp[1] / 80 * 100) + '%';
      A(map, [{ opacity: 0, transform: 'scale(.85) rotate(-4deg)' }, { opacity: 1, transform: 'scale(1) rotate(0)', offset: .25 }, { opacity: 1, transform: 'scale(2.1)', offset: .82 }, { opacity: 0, transform: 'scale(2.8)' }], { delay: T.map[0], duration: T.map[1] - T.map[0] + 200, easing: 'cubic-bezier(.45,0,.25,1)' }); }
    A(portal, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)', offset: .4 }, { opacity: .85, transform: 'scale(1.05)' }], { delay: T.hero[0] - 250, duration: 900 });
    setTimeout(() => {
      if (dead) return;
      const h = hero();
      if (h && window.Hero2D) { ih = Hero2D.mount(host, { src: heroSrc(h), meta: HMETA[artKey(h)], acc: race().acc, mood: night ? 'sleep' : 'happy' }); ih.react('appear'); }
      A(host, [{ opacity: 0, transform: 'translateY(30px) scale(.86)', filter: 'brightness(3) blur(6px)' }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 900 });
      if (night) A(lan, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 300 });
    }, Math.max(0, T.hero[0]));
    const fillPlate = () => {
      const h = hero() || {}, X = xpInfo();
      plate.querySelector('.t').textContent = S.settings.name || 'Штаб';
      plate.querySelector('.s').textContent = h.race ? RACES[h.race].n + ' · ' + (CLASSES[h.cls] || CLASSES.strat).n : 'Новый герой';
      plate.querySelector('.l').textContent = 'Уровень ' + X.lvl;
    };
    setTimeout(fillPlate, Math.max(0, T.plate[0] - 60));
    A(plate, [{ opacity: 0, transform: 'translateY(16px)', letterSpacing: '.3em' }, { opacity: 1, transform: 'none' }], { delay: T.plate[0], duration: 700 });
    const end = () => {
      if (dead) return; dead = true; cancelAnimationFrame(raf);
      ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards' }).onfinish = () => { if (ih) ih.destroy(); ov.remove(); introOn = false; if (S.tab === 'today') attachStage(); if (S.ready.settings && !hero()) openCreate(); };
    };
    ov.addEventListener('pointerdown', end);
    setTimeout(end, T.end);
  }
  function today0() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* ---------- старт ---------- */
  applyRace();
  intro();
  window.RPG = { openCreate, levelUp, openChest: () => openChest(), intro, RACES, CLASSES };
})();
