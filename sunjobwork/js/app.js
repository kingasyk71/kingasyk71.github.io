(function(){
'use strict';
var PHONE='77751661365';
var KK=window.SJ_KK||{}, L=window.SJ_L;
var G=window.gsap;
var RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine=window.matchMedia('(pointer:fine)').matches;
var lang='ru';
try{var q=new URLSearchParams(location.search).get('lang');lang=(q==='kk'||q==='ru')?q:(localStorage.getItem('sj_lang')||'ru')}catch(e){}
if(lang!=='kk')lang='ru';
function wa(t){return 'https://wa.me/'+PHONE+'?text='+encodeURIComponent(t)}
function path(o,p){return p.split('.').reduce(function(a,k){return a==null?a:a[k]},o)}
function $(s,c){return (c||document).querySelector(s)}
function $$(s,c){return [].slice.call((c||document).querySelectorAll(s))}

/* ---------- render lists (once, with i18n paths) ---------- */
// hero wall of visas (3 columns, duplicated for seamless loop)
var rot=[-2.5,1.8,-1.2,2.4,-1.8,1.2,-2.2,1.5];
function pol(i){return '<figure class="polaroid" style="transform:rotate('+rot[i%8]+'deg)"><img src="img/visa'+i+'.webp" data-l-alt="visaAlt" alt="" loading="eager"><figcaption class="mono"><span data-l="visaCap"></span><b>TÜRKİYE ✓</b></figcaption></figure>'}
$('#wall').innerHTML=[[1,8,4,11,7],[2,10,5,9],[3,12,6,1]].map(function(c,k){var h=c.map(pol).join('');return '<div class="wcol c'+(k+1)+'">'+h+h+'</div>'}).join('');
// filters + jobs
var deptIds=['all','anim','rest','front','house','sport'];
var jobDept=['anim','anim','anim','rest','rest','rest','front','front','house','sport','sport'];
var icons={
 anim:'<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
 rest:'<path d="M5 3v7a3 3 0 0 0 6 0V3M8 13v8M16 3c-2 0-3 2-3 5s1 4 3 4v9"/>',
 front:'<path d="M3 21h18M5 21V10h14v11M9 10V6a3 3 0 0 1 6 0v4M12 14v3"/>',
 house:'<path d="M3 11l9-7 9 7M5 9v11h14V9M10 20v-5h4v5"/>',
 sport:'<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'
};
$('#filters').innerHTML=deptIds.map(function(d,i){return '<button type="button" data-d="'+d+'" aria-pressed="'+(i?'false':'true')+'" data-l="depts.'+i+'"></button>'}).join('');
$('#jobs').innerHTML=jobDept.map(function(d,i){return '<div class="job" data-d="'+d+'"><div class="in"><div class="jhead"><div class="jic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1667D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[d]+'</svg></div><span class="badge mono" style="font-size:11px;font-weight:700" data-l="jobs.'+i+'.3"></span></div><div class="mono" style="font-size:11px;font-weight:700;color:var(--ink3)" data-l="jobs.'+i+'.0"></div><h3 class="h" data-l="jobs.'+i+'.1"></h3><p data-l="jobs.'+i+'.2"></p></div><div class="perf"></div><div class="go"><a target="_blank" rel="noopener" data-job="'+i+'" data-l="jobBtn"></a></div></div>'}).join('');

// steps
var tick='<svg style="flex:none;margin-top:2px" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFC531" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
$('#steps').insertAdjacentHTML('beforeend',[0,1,2,3,4,5,6,7].map(function(i){var key=i===1;return '<div class="step'+(key?' key':'')+'" data-i="'+i+'"><div class="num mono">0'+(i+1)+'</div><div class="box"><div class="row"><h3 class="h" data-l="steps.'+i+'.0"></h3><span class="gate mono" data-l="steps.'+i+'.2"></span></div><p data-l="steps.'+i+'.1"></p>'+(key?'<div class="clist">'+[0,1,2,3,4,5].map(function(c){return '<div>'+tick+'<span data-l="contract.'+c+'"></span></div>'}).join('')+'</div>':'')+'</div></div>'}).join(''));

// reels
var reelIds=['team','show','food','chef','club','fire','marina'];
$('#reels').innerHTML=reelIds.map(function(r,i){return '<div class="reel"><video muted loop playsinline preload="none" poster="img/'+r+'.webp" data-src="vid/'+r+'.mp4"></video><div class="bars"><i></i><i></i><i></i></div><div class="cap"><b class="h" data-l="reels.'+i+'.0"></b><span class="mono" data-l="reels.'+i+'.1"></span></div></div>'}).join('')+'<a class="reel reel-cta" href="https://instagram.com/sembaevnaaaaa" target="_blank" rel="noopener"><span class="mono" style="font-size:11px;font-weight:700;color:var(--sun)">Instagram</span><span class="h" style="font-size:24px;line-height:1.15" data-l="reelCta"></span><span style="font-weight:700">@sembaevnaaaaa →</span></a>';

// faq
$('#faqList').innerHTML=[0,1,2,3,4,5,6,7,8,9].map(function(i){return '<div class="qa" data-reveal><button type="button" aria-expanded="false" aria-controls="a'+i+'" id="q'+i+'"><span data-l="faq.'+i+'.0"></span><span class="pm" aria-hidden="true">+</span></button><div class="ans" id="a'+i+'" role="region" aria-labelledby="q'+i+'"><p data-l="faq.'+i+'.1"></p></div></div>'}).join('');

/* ---------- i18n ---------- */
var RU={};
$$('[data-i18n]').forEach(function(el){RU[el.dataset.i18n]=el.innerHTML});

function splitEl(el){
 if(RM||!G)return;
 var tmp=document.createElement('div');tmp.innerHTML=el.innerHTML;var out='';
 function wrap(t){return t.split(/([ \t\n\r]+)/).map(function(p){return (!p||/^[ \t\n\r]+$/.test(p))?p:'<span class="line" style="display:inline-block"><span class="w">'+p+'</span></span>'}).join('')}
 tmp.childNodes.forEach(function(n){if(n.nodeType===3)out+=wrap(n.textContent);else if(n.nodeType===1){if(n.tagName==='BR'){out+='<br>';return}var c=n.cloneNode(false);c.innerHTML=wrap(n.textContent);out+=c.outerHTML}});
 el.innerHTML=out;
}
function applyLang(lg,animate){
 lang=lg;var D=L[lg];
 document.documentElement.lang=lg==='kk'?'kk':'ru';
 $$('[data-i18n]').forEach(function(el){var k=el.dataset.i18n;var h=lg==='kk'&&KK[k]!=null?KK[k]:RU[k];if(h==null)return;
  if(el.namespaceURI==='http://www.w3.org/2000/svg')el.textContent=h;else el.innerHTML=h;
  if(el.hasAttribute('data-split'))splitEl(el)});
 $$('[data-l]').forEach(function(el){var v=path(D,el.dataset.l);if(v!=null)el.textContent=v});
 $$('[data-l-alt]').forEach(function(el){el.alt=path(D,el.dataset.lAlt)||''});
 $$('[data-wa]').forEach(function(a){a.href=wa(D.wa[a.dataset.wa]||D.wa.header)});
 $$('[data-job]').forEach(function(a){a.href=wa(D.wa.job.replace('{t}',D.jobs[+a.dataset.job][1]))});
 var mq=D.mq.map(function(m){return '<span>'+m+'<i>✦</i></span>'}).join('');$('#mq').innerHTML=mq+mq;
 $$('.lang button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.lang===lg)});
 moveKnob();
 setRouteCap(curStep);
 renderQuiz(0,true);
 // counters already done keep their final value
 $$('[data-count]').forEach(function(el){if(el.dataset.done)el.textContent=fmt(el)});
 try{localStorage.setItem('sj_lang',lg)}catch(e){}
 if(animate&&G&&!RM){
  var vis=$$('[data-split] .w').filter(function(w){var r=w.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0});
  G.fromTo(vis,{yPercent:110},{yPercent:0,duration:.8,ease:'expo.out',stagger:.02});
 }
 if(window.ScrollTrigger)ScrollTrigger.refresh();
}
function moveKnob(){var b=$('.lang button[aria-pressed="true"]'),k=$('#knob');if(!b||!k)return;k.style.width=b.offsetWidth+'px';k.style.transform='translateX('+(b.offsetLeft-4)+'px)'}
$$('.lang button').forEach(function(b){b.addEventListener('click',function(){if(b.dataset.lang===lang)return;
 if(G&&!RM){document.body.classList.add('switching');setTimeout(function(){applyLang(b.dataset.lang,true);document.body.classList.remove('switching')},230)}else applyLang(b.dataset.lang,false)})});
addEventListener('resize',moveKnob);

/* ---------- counters ---------- */
function fmt(el){var n=+el.dataset.count;return el.dataset.format==='money'?n.toLocaleString('ru-RU'):String(n)}

/* ---------- route side ---------- */
var curStep=0;
function setRouteCap(i){curStep=i;var D=L[lang];var n=$('#rsNum'),t=$('#rsTxt');if(n)n.textContent='0'+(i+1);if(t)t.textContent=D.steps[i][0];
 $$('#rsFrame img').forEach(function(im,k){im.classList.toggle('on',k===i)})}

/* ---------- header ---------- */
var hdr=$('#hdr'),lastY=0;
addEventListener('scroll',function(){var y=scrollY;hdr.classList.toggle('scrolled',y>20);hdr.classList.toggle('hide',y>lastY&&y>400);lastY=y},{passive:true});

/* ---------- reels autoplay ---------- */
var io=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting){if(!v.getAttribute('src')&&v.dataset.src)v.src=v.dataset.src;var p=v.play();if(p&&p.catch)p.catch(function(){})}else v.pause()})},{threshold:.35});
$$('.reel video').forEach(function(v){io.observe(v)});

/* ---------- video modal ---------- */
var modal=$('#modal'),mv=$('#mVid');
function openVid(src,from){mv.src=src;modal.classList.add('open');document.body.style.overflow='hidden';var p=mv.play();if(p&&p.catch)p.catch(function(){});
 if(G&&!RM){var box=$('.box',modal);var r=from.getBoundingClientRect(),b=box.getBoundingClientRect();
  G.fromTo(modal,{backgroundColor:'rgba(7,26,46,0)'},{backgroundColor:'rgba(7,26,46,.86)',duration:.4});
  G.fromTo(box,{x:(r.left+r.width/2)-(b.left+b.width/2),y:(r.top+r.height/2)-(b.top+b.height/2),scale:Math.min(r.width/b.width,1),opacity:.4},{x:0,y:0,scale:1,opacity:1,duration:.7,ease:'expo.out'})}}
function closeVid(){mv.pause();function done(){modal.classList.remove('open');mv.removeAttribute('src');mv.load();document.body.style.overflow='';if(G)G.set($('.box',modal),{clearProps:'all'})}
 if(G&&!RM)G.to($('.box',modal),{scale:.85,opacity:0,duration:.3,ease:'power2.in',onComplete:done});else done()}
$$('[data-video]').forEach(function(b){b.addEventListener('click',function(){openVid(b.dataset.video,$('.media',b.closest('.review')))})});
$('#mClose').onclick=closeVid;
modal.addEventListener('click',function(e){if(e.target===modal)closeVid()});
addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('open'))closeVid()});

/* ---------- FAQ ---------- */
$$('.qa button').forEach(function(btn){btn.addEventListener('click',function(){
 var qa=btn.parentNode,ans=$('.ans',qa),open=!qa.classList.contains('open');
 $$('.qa.open').forEach(function(o){if(o!==qa){o.classList.remove('open');$('button',o).setAttribute('aria-expanded','false');if(G)G.to($('.ans',o),{height:0,duration:.45,ease:'power3.inOut'});else $('.ans',o).style.height='0'}});
 qa.classList.toggle('open',open);btn.setAttribute('aria-expanded',open);
 if(G&&!RM){G.to(ans,{height:open?'auto':0,duration:.55,ease:'power3.inOut'});if(open)G.from($('p',ans),{y:-10,opacity:0,duration:.5,delay:.1})}else ans.style.height=open?'auto':'0';
})});

/* ---------- filters (FLIP) ---------- */
var fEl=$('#filters'),jEl=$('#jobs');
fEl.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var d=b.dataset.d;
 $$('button',fEl).forEach(function(x){x.setAttribute('aria-pressed',x===b)});
 var cards=[].slice.call(jEl.children);
 function show(){cards.forEach(function(c){c.style.display=(d==='all'||c.dataset.d===d)?'':'none'})}
 if(G&&window.Flip&&!RM){var st=Flip.getState(cards);show();jEl.scrollLeft=0;
  Flip.from(st,{duration:.6,ease:'expo.out',absolute:true,scale:true,onEnter:function(el){return G.fromTo(el,{opacity:0,scale:.85,y:20},{opacity:1,scale:1,y:0,duration:.6,ease:'expo.out',stagger:.04})},onLeave:function(el){return G.to(el,{opacity:0,scale:.85,duration:.3})}})}
 else show();
});

/* ---------- quiz ---------- */
var st={step:0,ans:[],name:''},qb=$('#qBody');
function D(){return L[lang]}
function TOT(){return D().Q.length+1}
function prog(){var tot=TOT(),p=Math.min(st.step,tot)/tot,u=D().ui;
 $('#qLabel').textContent=st.step<tot?u.step.replace('{n}',st.step+1).replace('{t}',tot):u.done;
 var tr=$('.qtrack').clientWidth;
 if(G){G.to('#qFill',{width:(p*100)+'%',duration:.7,ease:'expo.out'});G.to('#qPlane',{x:p*(tr-24),duration:.9,ease:'expo.out'})}
 else{$('#qFill').style.width=(p*100)+'%';$('#qPlane').style.transform='translateX('+p*(tr-24)+'px)'}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function quizHtml(){var d=D(),u=d.ui,Q=d.Q;
 if(st.step<Q.length){var q=Q[st.step];return '<h3 class="qq h">'+q[1]+'</h3><div class="opts">'+q[2].map(function(o,i){return '<button type="button" class="opt'+(st.ans[st.step]===i?' picked':'')+'" data-o="'+i+'">'+o+'</button>'}).join('')+'</div>'+(st.step?'<button type="button" class="back" data-back>'+u.back+'</button>':'')}
 if(st.step===Q.length)return '<h3 class="qq h">'+u.nameQ+'</h3><label class="mono" for="qn" style="font-size:11px;font-weight:700;color:var(--ink3)">'+u.nameL+'</label><input class="qin" id="qn" type="text" autocomplete="given-name" placeholder="'+u.nameP+'" value="'+esc(st.name)+'"><button type="button" class="btn btn-sun" id="qGo" style="width:100%">'+u.get+'</button><br><button type="button" class="back" data-back>'+u.back+'</button>';
 var ans=function(i){return st.ans[i]==null?'—':Q[i][2][st.ans[i]]};
 var msg=u.msgA.replace('{n}',st.name)+'\n'+Q.map(function(q,i){return q[0]+': '+ans(i)}).join('\n')+'\n'+u.msgB;
 return '<div class="approved" id="appr"><span class="mono">SunJob</span><b class="h">APPROVED</b><span class="mono">2027</span></div><h3 class="qq h" style="max-width:68%">'+(st.name?u.ready1.replace('{n}',esc(st.name)):u.ready0)+'</h3><div class="sumgrid mono">'+Q.map(function(q,i){return '<div><span>'+q[0]+'</span><b style="text-transform:none;letter-spacing:0;font-family:Onest,system-ui,sans-serif">'+ans(i)+'</b></div>'}).join('')+'</div><a class="btn btn-navy" style="width:100%" target="_blank" rel="noopener" href="'+wa(msg)+'">'+u.send+'</a><br><button type="button" class="back" data-restart>'+u.again+'</button>'}
function renderQuiz(dir,instant){
 function swap(){qb.innerHTML=quizHtml();bind();prog();
  if(G&&!RM&&!instant){G.fromTo(qb.children,{x:dir*40,opacity:0},{x:0,opacity:1,duration:.55,ease:'expo.out',stagger:.05});var o=$$('.opt',qb);if(o.length)G.fromTo(o,{y:16,opacity:0},{y:0,opacity:1,duration:.5,ease:'expo.out',stagger:.05,delay:.08});
   var a=$('#appr');if(a)G.fromTo(a,{scale:2.4,rotate:-40,opacity:0},{scale:1,rotate:-12,opacity:1,duration:.55,ease:'back.out(2.2)',delay:.25,onComplete:burst})}}
 if(G&&!RM&&!instant&&qb.children.length)G.to(qb.children,{x:-dir*40,opacity:0,duration:.25,ease:'power2.in',onComplete:swap});else swap()}
function burst(){var cols=['#FFC531','#1667D9','#12A150','#0A2540','#7FB2F0'],a=$('#appr');if(!a)return;var r=a.getBoundingClientRect(),b=qb.getBoundingClientRect();
 for(var i=0;i<26;i++){var p=document.createElement('i');p.className='confetti';p.style.background=cols[i%5];p.style.left=(r.left-b.left+r.width/2)+'px';p.style.top=(r.top-b.top+r.height/2)+'px';qb.appendChild(p);
  G.to(p,{x:(Math.random()-.5)*360,y:(Math.random()-.2)*-260+120,rotation:Math.random()*720,opacity:0,duration:1.4+Math.random(),ease:'power3.out',onComplete:function(){this.targets()[0].remove()}})}}
function bind(){
 $$('.opt',qb).forEach(function(b){b.onclick=function(){b.classList.add('picked');st.ans[st.step]=+b.dataset.o;st.step++;setTimeout(function(){renderQuiz(1)},RM?0:180)}});
 var bk=$('[data-back]',qb);if(bk)bk.onclick=function(){st.step--;renderQuiz(-1)};
 var rs=$('[data-restart]',qb);if(rs)rs.onclick=function(){st={step:0,ans:[],name:''};renderQuiz(-1)};
 var go=$('#qGo'),inp=$('#qn');
 if(inp){inp.oninput=function(){st.name=inp.value.trim()};inp.onkeydown=function(e){if(e.key==='Enter')go.click()}}
 if(go)go.onclick=function(){st.step++;renderQuiz(1)};
}

/* ---------- first apply ---------- */
applyLang(lang,false);

// smooth anchors
$$('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var t=document.querySelector(a.getAttribute('href'));if(!t)return;e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'})})});

// route side without GSAP: IntersectionObserver
var sio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)setRouteCap(+e.target.dataset.i)})},{rootMargin:'-45% 0px -45% 0px'});
$$('.step').forEach(function(s){sio.observe(s)});

var loader=$('#loader');
if(!G||RM){if(loader)loader.remove();$$('.step').forEach(function(s){s.classList.add('on')});$$('[data-count]').forEach(function(el){el.dataset.done=1;el.textContent=fmt(el)});return}

/* ---------- GSAP choreography ---------- */
G.registerPlugin(ScrollTrigger);
if(window.Flip)G.registerPlugin(Flip);
if(window.MotionPathPlugin)G.registerPlugin(MotionPathPlugin);
G.defaults({ease:'expo.out'});

var tl=G.timeline();
tl.from('#loader .ldmark',{scale:.6,opacity:0,duration:.7})
 .from('#loader .lsun',{y:30,duration:.9,ease:'expo.out'},'-=.3')
 .from('#loader .ll',{scaleX:0,transformOrigin:'50% 50%',duration:.5,stagger:.08},'-=.6')
 .from('#loader .word .wordmark',{yPercent:110,duration:.7},'-=.5')
 .to('#loader',{yPercent:-100,duration:.8,ease:'expo.inOut'},'+=.25')
 .add(function(){loader.remove()})
 .fromTo('#hdr',{yPercent:-100,opacity:0},{yPercent:0,opacity:1,duration:.9,clearProps:'transform,opacity'},'-=.45')
 .from('.hero h1 .w',{yPercent:110,rotate:4,duration:1.1,stagger:.05},'<')
 .from('[data-hero]',{y:28,opacity:0,duration:1,stagger:.08},'-=.85')
 .from('#arch',{clipPath:'inset(100% 0% 0% 0% round 40px)',duration:1.5,ease:'expo.inOut'},'-=1.3')
 .from('#wall',{y:120,scale:1.15,duration:1.8},'<')
 .from('#sunrise',{yPercent:100,duration:1.4,ease:'expo.out'},'-=.9')
 .from('.refl i',{scaleX:0,duration:.8,stagger:.1},'-=1')
 .from('#seal',{scale:0,rotate:-120,duration:1,ease:'back.out(1.8)'},'-=.8');
$$('[data-count]').forEach(function(el){var n=+el.dataset.count,o={v:0},money=el.dataset.format==='money';
 ScrollTrigger.create({trigger:el,start:'top 92%',once:true,onEnter:function(){G.to(o,{v:n,duration:2.2,delay:el.closest('.hero')?2.6:0,ease:'power3.out',onUpdate:function(){el.textContent=money?(Math.round(o.v/1000)*1000).toLocaleString('ru-RU'):Math.round(o.v)},onComplete:function(){el.dataset.done=1;el.textContent=fmt(el)}})}})});

G.to('#arch',{yPercent:8,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
G.to('#seal',{yPercent:-60,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

// marquee + scroll velocity
var mqT=$('#mq'),mqX=0,boost=0;
G.ticker.add(function(){mqX-=.6+boost;boost*=.92;var w=mqT.scrollWidth/2;if(w&&-mqX>=w)mqX+=w;G.set(mqT,{x:mqX})});
ScrollTrigger.create({onUpdate:function(s){boost=Math.min(Math.abs(s.getVelocity())/300,8)}});

// headings / reveals
$$('[data-split]').forEach(function(el){if(el.closest('.hero'))return;G.from($$('.w',el),{yPercent:110,rotate:3,duration:1.1,stagger:.04,scrollTrigger:{trigger:el,start:'top 88%'}})});
$$('.eyebrow').forEach(function(el){if(el.closest('.hero'))return;G.from(el,{opacity:0,x:-20,duration:.9,scrollTrigger:{trigger:el,start:'top 90%'}})});
$$('[data-reveal]').forEach(function(el){G.from(el,{y:40,opacity:0,duration:1.1,clearProps:'transform',scrollTrigger:{trigger:el,start:'top 90%'}})});
$$('[data-stagger]').forEach(function(el){G.from(el.children,{y:60,opacity:0,duration:1.1,stagger:.09,clearProps:'transform',scrollTrigger:{trigger:el,start:'top 85%'}})});

// perk photos: curtain reveal
$$('.card .pclip').forEach(function(p){G.from(p,{clipPath:'inset(0 0 100% 0)',duration:1.2,ease:'expo.inOut',scrollTrigger:{trigger:p,start:'top 88%'}});G.from($('img',p),{scale:1.4,duration:1.6,scrollTrigger:{trigger:p,start:'top 88%'}})});
// money rings + zero chips
G.from('.money .rings',{scale:.4,opacity:0,duration:1.6,scrollTrigger:{trigger:'.money',start:'top 80%'}});
G.from('.money .zero div',{y:20,opacity:0,duration:.8,stagger:.1,delay:.4,scrollTrigger:{trigger:'.money',start:'top 80%'}});

// map: arcs draw + planes fly
var arcs=$$('#mapbox .arcs path'),planes=$$('#mapbox .mplane');
arcs.forEach(function(a){var len=a.getTotalLength();G.set(a,{strokeDasharray:len,strokeDashoffset:len})});
G.set(planes,{opacity:0});
var mtl=G.timeline({scrollTrigger:{trigger:'#mapbox',start:'top 75%'}});
mtl.to(arcs,{strokeDashoffset:0,duration:1.8,ease:'power2.inOut',stagger:.18});
if(window.MotionPathPlugin)planes.forEach(function(pl,i){var a=arcs[i];
 mtl.add(function(){G.set(pl,{opacity:1});G.to(pl,{motionPath:{path:a,align:a,alignOrigin:[.5,.5],autoRotate:true,start:0,end:1},duration:4+i*.6,ease:'none',repeat:-1,delay:i*.5})},1.2)});
G.from('#mapbox .maptitle',{y:30,opacity:0,duration:1,delay:.2,scrollTrigger:{trigger:'#mapbox',start:'top 75%'}});
G.from('#mapbox .legend span',{y:20,opacity:0,duration:.8,stagger:.1,delay:.6,scrollTrigger:{trigger:'#mapbox',start:'top 75%'}});

// flags + stamps
$$('.flag').forEach(function(f){G.from(f,{rotateY:-90,transformPerspective:600,transformOrigin:'left center',opacity:0,duration:1.2,ease:'expo.out',scrollTrigger:{trigger:f,start:'top 88%'}})});
$$('.stamp').forEach(function(s){G.from(s,{scale:2.2,rotate:-40,opacity:0,duration:.7,ease:'back.out(2)',delay:.3,scrollTrigger:{trigger:s,start:'top 85%'}})});

// jobs
G.from('#jobs .job',{y:50,opacity:0,duration:1,stagger:.06,clearProps:'transform',scrollTrigger:{trigger:'#jobs',start:'top 85%'}});
G.from('#jobs .jic',{scale:0,rotate:-90,duration:.8,ease:'back.out(2)',stagger:.06,delay:.3,scrollTrigger:{trigger:'#jobs',start:'top 85%'}});

// route
var stepsEl=$('#steps');
G.to('#railFill',{scaleY:1,ease:'none',scrollTrigger:{trigger:stepsEl,start:'top 60%',end:'bottom 60%',scrub:.6}});
G.fromTo('#railPlane',{y:0},{y:function(){return stepsEl.clientHeight-30},ease:'none',scrollTrigger:{trigger:stepsEl,start:'top 60%',end:'bottom 60%',scrub:.6}});
$$('.step').forEach(function(s){ScrollTrigger.create({trigger:s,start:'top 62%',onEnter:function(){s.classList.add('on')},onLeaveBack:function(){s.classList.remove('on')}});
 G.from($('.box',s),{x:60,opacity:0,duration:1,scrollTrigger:{trigger:s,start:'top 88%'}})});
G.from('#rsFrame',{clipPath:'inset(100% 0 0 0 round 32px)',duration:1.4,ease:'expo.inOut',scrollTrigger:{trigger:'#rsFrame',start:'top 85%'}});

// founder
var mm=G.matchMedia();
mm.add('(min-width:901px)',function(){G.fromTo('#founderSec',{clipPath:'inset(0% 6% 0% 6% round 48px)'},{clipPath:'inset(0% 0% 0% 0% round 0px)',ease:'none',scrollTrigger:{trigger:'#founderSec',start:'top 90%',end:'top 20%',scrub:true}})});
G.fromTo('#portraitImg',{yPercent:-6},{yPercent:4,ease:'none',scrollTrigger:{trigger:'#founderSec',start:'top bottom',end:'bottom top',scrub:true}});
G.from('.portrait .ph',{clipPath:'inset(100% 0 0 0 round 32px)',duration:1.4,ease:'expo.inOut',scrollTrigger:{trigger:'.portrait',start:'top 80%'}});
G.from('#since',{scale:0,rotate:-180,duration:1,ease:'back.out(1.8)',delay:.6,scrollTrigger:{trigger:'.portrait',start:'top 80%'}});

$$('.review .media img').forEach(function(img){G.from(img,{scale:1.3,duration:1.6,scrollTrigger:{trigger:img,start:'top 85%'}})});
G.from('.qcard',{y:80,rotate:-2,opacity:0,duration:1.2,scrollTrigger:{trigger:'.qcard',start:'top 90%'}});

if(fine){
 $$('.magnet').forEach(function(b){b.addEventListener('mousemove',function(e){var r=b.getBoundingClientRect();G.to(b,{x:(e.clientX-r.left-r.width/2)*.25,y:(e.clientY-r.top-r.height/2)*.35,duration:.5})});b.addEventListener('mouseleave',function(){G.to(b,{x:0,y:0,duration:.8,ease:'elastic.out(1,.4)'})})});
 $$('.country').forEach(function(c){c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect();G.to(c,{rotateY:(e.clientX-r.left-r.width/2)/r.width*8,rotateX:-(e.clientY-r.top-r.height/2)/r.height*8,transformPerspective:800,duration:.6})});c.addEventListener('mouseleave',function(){G.to(c,{rotateX:0,rotateY:0,duration:.8})})});
}
addEventListener('load',function(){ScrollTrigger.refresh();moveKnob()});
})();
