/* Штаб: вход через Supabase + хранилище в формате коллекций.
   Даёт приложению тот же интерфейс, что был в claude.ai:
   db.collection(col).onSnapshot / .doc(id).set / .delete, db.doc('col/id').onSnapshot,
   assets.upload / delete / url, downloads.save. */
(function () {
  'use strict';
  const BUCKET = 'files';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function readCfg() {
    const c = window.SHTAB_CONFIG || {};
    if (c.url && c.key) return c;
    try { const l = JSON.parse(localStorage.getItem('shtab_cfg') || 'null'); if (l && l.url && l.key) return l; } catch (e) {}
    return null;
  }

  /* ---------- экран входа ---------- */
  const GATE_CSS = `
  .gate{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:24px 14px calc(18px + env(safe-area-inset-bottom,0px));
    background:#0E0B22;color:#fff;overflow:auto}
  .gate-scene{position:fixed;inset:0;z-index:-1}.gate-scene svg{width:100%;height:100%;display:block}
  .gate-bot{width:120px;height:150px;align-self:center;margin-bottom:-6px;filter:drop-shadow(0 14px 16px rgba(0,0,0,.35))}
  .gate-card{background:rgba(14,10,46,.42);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(18px) saturate(1.4);-webkit-backdrop-filter:blur(18px) saturate(1.4);border-radius:30px;padding:22px 18px 14px}
  .gate[hidden]{display:none!important}
  .gate-card{width:100%;max-width:380px;display:flex;flex-direction:column;gap:14px}
  .gate h1{font-family:Unbounded,Onest,system-ui,sans-serif;font-weight:700;font-size:32px;margin:0;text-align:center;letter-spacing:-.01em}
  .gate p.sub{margin:0;text-align:center;color:#C9D4FF;font-size:15px;line-height:1.4}
  .gate form{display:flex;flex-direction:column;gap:10px;margin-top:6px}
  .gate label{font-size:13px;color:#C9D4FF;display:flex;flex-direction:column;gap:6px}
  .gate input{font:inherit;font-size:17px;padding:13px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:#fff;outline:none;min-height:48px;box-sizing:border-box;width:100%}
  .gate input::placeholder{color:#9FB0EE}
  .gate input:focus{border-color:#FFD84D;background:rgba(255,255,255,.16)}
  .gate .go{font:inherit;font-weight:700;font-size:17px;min-height:52px;border:0;border-radius:999px;background:#FFD84D;color:#0D1326;cursor:pointer;margin-top:4px}
  .gate .go:disabled{opacity:.6}
  .gate .lnk{font:inherit;font-size:15px;background:none;border:0;color:#fff;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:8px;min-height:40px}
  .gate .row{display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px}
  .gate .msg{font-size:14px;line-height:1.4;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.12)}
  .gate .msg.err{background:rgba(255,77,77,.22)}
  .gate .msg[hidden]{display:none}
  .gate small{color:#9FB0EE;font-size:12.5px;text-align:center;line-height:1.4}`;

  function gateHTML() {
    return '<div class="gate" id="gate" hidden><div class="gate-scene" aria-hidden="true">' + (window.SHTAB_SCENE ? window.SHTAB_SCENE() : '') + '</div>' +
      '<div class="gate-bot" aria-hidden="true">' + (window.SHTAB_BOT ? window.SHTAB_BOT('happy') : '') + '</div><div class="gate-card">' +
      '<h1>Штаб</h1><p class="sub" id="gSub"></p>' +
      '<div class="msg" id="gMsg" role="status" aria-live="polite" hidden></div>' +
      '<form id="gForm" novalidate></form>' +
      '<div class="row" id="gLinks"></div>' +
      '<small>Каждый видит только свои данные. Даже владелец штаба не видит твои дела.</small>' +
      '</div></div>';
  }

  function msg(text, err) { const m = $('#gMsg'); m.hidden = !text; m.textContent = text || ''; m.classList.toggle('err', !!err); }
  const field = (id, label, type, ph, extra) => '<label for="' + id + '">' + label + '<input id="' + id + '" type="' + type + '" placeholder="' + ph + '" ' + (extra || '') + '></label>';

  function ruErr(e) {
    const m = String((e && (e.message || e.error_description)) || e || '');
    if (/Invalid login credentials/i.test(m)) return 'Почта или пароль не подходят.';
    if (/Email not confirmed/i.test(m)) return 'Почта ещё не подтверждена. Открой письмо от Штаба и нажми ссылку.';
    if (/already registered|already exists/i.test(m)) return 'Эта почта уже зарегистрирована. Войди.';
    if (/Password should be at least/i.test(m)) return 'Пароль слишком короткий: минимум 6 символов.';
    if (/rate limit|too many/i.test(m)) return 'Слишком много попыток. Подожди минуту.';
    if (/invalid.*email|valid email/i.test(m)) return 'Проверь адрес почты.';
    if (/Signups not allowed/i.test(m)) return 'Регистрация закрыта. Попроси владельца штаба открыть её.';
    if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Нет связи. Проверь интернет.';
    return m || 'Что-то пошло не так. Попробуй ещё раз.';
  }

  /* ---------- первичная настройка (если config.js пустой) ---------- */
  function setupScreen() {
    return new Promise(res => {
      $('#gSub').textContent = 'Первый запуск: вставь адрес и публичный ключ проекта Supabase (Settings → API).';
      $('#gLinks').innerHTML = '';
      $('#gForm').innerHTML = field('gUrl', 'Project URL', 'url', 'https://xxxx.supabase.co', 'autocomplete="off" required') +
        field('gKey', 'anon public key', 'text', 'eyJhbGciOi…', 'autocomplete="off" required') +
        '<button class="go" type="submit">Подключить</button>';
      $('#gate').hidden = false;
      $('#gForm').onsubmit = e => {
        e.preventDefault();
        const url = $('#gUrl').value.trim().replace(/\/+$/, ''), key = $('#gKey').value.trim();
        if (!/^https:\/\/.+/.test(url) || key.length < 20) { msg('Проверь адрес и ключ.', true); return; }
        try { localStorage.setItem('shtab_cfg', JSON.stringify({ url, key })); } catch (_) {}
        res({ url, key });
      };
    });
  }

  /* ---------- вход / регистрация ---------- */
  function authScreen(sb, mode) {
    return new Promise(res => {
      const show = m => {
        mode = m; msg('');
        const sub = { in: 'Твои дела, спорт, настроение и заметки в одном месте.', up: 'Создай свой штаб. Займёт полминуты.', reset: 'Пришлём на почту ссылку для нового пароля.', newpass: 'Придумай новый пароль.' }[m];
        $('#gSub').textContent = sub;
        let f = '';
        if (m === 'up') f += field('gName', 'Как тебя называть', 'text', 'Имя', 'autocomplete="given-name" maxlength="40" required');
        if (m !== 'newpass') f += field('gEmail', 'Почта', 'email', 'you@mail.com', 'autocomplete="email" inputmode="email" autocapitalize="off" required');
        if (m !== 'reset') f += field('gPass', m === 'newpass' ? 'Новый пароль' : 'Пароль', 'password', 'минимум 6 символов', 'autocomplete="' + (m === 'in' ? 'current-password' : 'new-password') + '" minlength="6" required');
        f += '<button class="go" type="submit">' + { in: 'Войти', up: 'Создать штаб', reset: 'Отправить ссылку', newpass: 'Сохранить пароль' }[m] + '</button>';
        $('#gForm').innerHTML = f;
        $('#gLinks').innerHTML = m === 'in'
          ? '<button class="lnk" type="button" data-m="up">Нет аккаунта? Создать</button><button class="lnk" type="button" data-m="reset">Забыл пароль</button>'
          : m === 'newpass' ? '' : '<button class="lnk" type="button" data-m="in">У меня уже есть аккаунт</button>';
        $('#gLinks').querySelectorAll('[data-m]').forEach(b => b.onclick = () => show(b.dataset.m));
        $('#gate').hidden = false;
        const first = $('#gForm input'); if (first && matchMedia('(pointer:fine)').matches) first.focus();
        $('#gForm').onsubmit = submit;
      };
      async function submit(e) {
        e.preventDefault();
        const btn = $('#gForm .go'); const email = ($('#gEmail') || {}).value, pass = ($('#gPass') || {}).value;
        const name = (($('#gName') || {}).value || '').trim();
        if (mode === 'up' && !name) { msg('Впиши имя.', true); return; }
        if (mode !== 'newpass' && !/^\S+@\S+\.\S+$/.test((email || '').trim())) { msg('Проверь адрес почты.', true); return; }
        if (mode !== 'reset' && (!pass || pass.length < 6)) { msg('Пароль: минимум 6 символов.', true); return; }
        btn.disabled = true;
        try {
          if (mode === 'in') {
            const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pass });
            if (error) throw error; $('#gate').hidden = true; res(data.session);
          } else if (mode === 'up') {
            const { data, error } = await sb.auth.signUp({ email: email.trim(), password: pass, options: { data: { name }, emailRedirectTo: location.origin + location.pathname } });
            if (error) throw error;
            if (data.session) { $('#gate').hidden = true; res(data.session); }
            else { show('in'); msg('Готово! Мы отправили письмо на ' + email.trim() + '. Нажми ссылку в нём, потом войди здесь.'); }
          } else if (mode === 'reset') {
            const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + location.pathname });
            if (error) throw error; show('in'); msg('Ссылка отправлена. Открой письмо на этом телефоне.');
          } else if (mode === 'newpass') {
            const { data, error } = await sb.auth.updateUser({ password: pass });
            if (error) throw error; $('#gate').hidden = true;
            const s = (await sb.auth.getSession()).data.session; res(s);
          }
        } catch (err) { msg(ruErr(err), true); }
        finally { const b = $('#gForm .go'); if (b) b.disabled = false; }
      }
      show(mode || 'in');
    });
  }

  /* ---------- хранилище: коллекции поверх таблицы docs ---------- */
  function makeDb(sb, uid) {
    const cache = {};           // col -> {id: data}
    const colSubs = {};         // col -> Set(cb)
    const docSubs = {};         // col -> Set({id, cb})
    const localTs = {};         // 'col/id' -> ms последней своей записи
    const LS = 'shtab_cache_' + uid;
    let ready = false;

    try { const c = JSON.parse(localStorage.getItem(LS) || 'null'); if (c && typeof c === 'object') Object.assign(cache, c); } catch (e) {}
    let saveT = null;
    const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(LS, JSON.stringify(cache)); } catch (e) {} }, 400); };

    const snap = col => ({ docs: Object.entries(cache[col] || {}).map(([id, d]) => ({ id, exists: true, data: () => d })) });
    const dsnap = (col, id) => { const d = (cache[col] || {})[id]; return { id, exists: d != null, data: () => d }; };
    function emit(col) {
      (colSubs[col] || new Set()).forEach(cb => { try { cb(snap(col)); } catch (e) { console.error(e); } });
      (docSubs[col] || new Set()).forEach(s => { try { s.cb(dsnap(col, s.id)); } catch (e) { console.error(e); } });
    }
    const emitAll = () => { const cols = new Set([...Object.keys(colSubs), ...Object.keys(docSubs)]); cols.forEach(emit); };

    async function loadAll() {
      const fresh = {}; let from = 0; const N = 1000;
      for (;;) {
        const { data, error } = await sb.from('docs').select('col,id,data').order('col').order('id').range(from, from + N - 1);
        if (error) throw error;
        data.forEach(r => { (fresh[r.col] = fresh[r.col] || {})[r.id] = r.data; });
        if (data.length < N) break; from += N;
      }
      // свои записи последних секунд важнее того, что пришло с сервера
      const now = Date.now();
      for (const k in localTs) if (now - localTs[k] < 5000) {
        const [c, i] = k.split('/'); const v = (cache[c] || {})[i];
        if (v == null) { if (fresh[c]) delete fresh[c][i]; } else (fresh[c] = fresh[c] || {})[i] = v;
      }
      for (const k of Object.keys(cache)) delete cache[k];
      Object.assign(cache, fresh); ready = true; persist(); emitAll();
    }

    function onChange(p) {
      const row = p.eventType === 'DELETE' ? p.old : p.new; if (!row || !row.col) return;
      const k = row.col + '/' + row.id;
      if (p.eventType !== 'DELETE') {
        const ts = Date.parse(row.updated_at || '') || 0;
        if (localTs[k] && ts && ts < localTs[k] - 1000) return;   // старое эхо своей же записи
        (cache[row.col] = cache[row.col] || {})[row.id] = row.data;
      } else {
        if (localTs[k] && Date.now() - localTs[k] < 3000 && (cache[row.col] || {})[row.id] != null) return;
        if (cache[row.col]) delete cache[row.col][row.id];
      }
      persist(); emit(row.col);
    }

    let channel = null;
    function connect() {
      if (channel) { try { sb.removeChannel(channel); } catch (e) {} }
      channel = sb.channel('docs-' + uid)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'docs', filter: 'user_id=eq.' + uid }, onChange)
        .subscribe();
    }

    const first = loadAll().catch(e => { console.error(e); ready = true; emitAll(); throw e; });
    connect();
    let lastSync = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || Date.now() - lastSync < 15000) return;
      lastSync = Date.now(); loadAll().catch(() => {}); connect();
    });
    window.addEventListener('online', () => { loadAll().catch(() => {}); connect(); });

    async function setDoc(col, id, data) {
      const k = col + '/' + id; const ts = Date.now(); localTs[k] = ts;
      (cache[col] = cache[col] || {})[id] = data; persist(); emit(col);
      const { error } = await sb.from('docs').upsert({ user_id: uid, col, id, data, updated_at: new Date(ts).toISOString() });
      if (error) throw error;
    }
    async function delDoc(col, id) {
      const k = col + '/' + id; localTs[k] = Date.now();
      if (cache[col]) delete cache[col][id]; persist(); emit(col);
      const { error } = await sb.from('docs').delete().match({ user_id: uid, col, id });
      if (error) throw error;
    }
    function subCol(col, cb) {
      (colSubs[col] = colSubs[col] || new Set()).add(cb);
      if (ready || cache[col]) setTimeout(() => cb(snap(col)), 0);
      return () => colSubs[col].delete(cb);
    }
    function subDoc(col, id, cb) {
      const s = { id, cb }; (docSubs[col] = docSubs[col] || new Set()).add(s);
      if (ready || cache[col]) setTimeout(() => cb(dsnap(col, id)), 0);
      return () => docSubs[col].delete(s);
    }
    const docRef = (col, id) => ({ set: d => setDoc(col, id, d), delete: () => delDoc(col, id), onSnapshot: (cb) => subDoc(col, id, cb) });
    return {
      first,
      hasCache: Object.keys(cache).length > 0,
      collection: col => ({ doc: id => docRef(col, id), onSnapshot: (cb) => subCol(col, cb) }),
      doc: path => { const [c, i] = path.split('/'); return docRef(c, i); },
      all: () => JSON.parse(JSON.stringify(cache)),
      async importAll(dump, onProgress) {
        const rows = [];
        for (const col in dump) for (const id in dump[col]) rows.push({ user_id: uid, col, id, data: dump[col][id], updated_at: new Date().toISOString() });
        for (let i = 0; i < rows.length; i += 200) {
          const { error } = await sb.from('docs').upsert(rows.slice(i, i + 200)); if (error) throw error;
          if (onProgress) onProgress(Math.min(rows.length, i + 200), rows.length);
        }
        const now = Date.now();
        rows.forEach(r => { (cache[r.col] = cache[r.col] || {})[r.id] = r.data; localTs[r.col + '/' + r.id] = now; });
        await loadAll(); return rows.length;
      },
      clearCache() { try { localStorage.removeItem(LS); } catch (e) {} }
    };
  }

  function makeAssets(sb, uid) {
    return {
      async upload(file, opt) {
        if (file.size > 20 * 1024 * 1024) throw { code: 'too_large' };
        const safe = (file.name || 'file').replace(/[^\w.\-]+/g, '_').slice(-60);
        const path = uid + '/' + Date.now().toString(36) + '-' + safe;
        const type = (opt && opt.type) || file.type || 'application/octet-stream';
        const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: type, upsert: false });
        if (error) throw { code: /exceeded|quota/i.test(error.message) ? 'quota_or_state' : 'failed', message: error.message };
        return { id: path, contentType: type, sizeBytes: file.size };
      },
      async delete(id) { await sb.storage.from(BUCKET).remove([id]); },
      async url(id) { const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(id, 3600); if (error) throw error; return data.signedUrl; }
    };
  }

  const downloads = {
    async save({ filename, data, type }) {
      const mime = type || (/\.csv$/i.test(filename) ? 'text/csv;charset=utf-8' : /\.json$/i.test(filename) ? 'application/json' : 'text/plain;charset=utf-8');
      const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
      try {
        const f = new File([blob], filename, { type: mime });
        if (navigator.canShare && navigator.canShare({ files: [f] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
          await navigator.share({ files: [f], title: filename }); return;
        }
      } catch (e) { if (e && e.name === 'AbortError') throw { code: 'declined' }; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    }
  };

  /* ---------- запуск ---------- */
  async function start() {
    const st = document.createElement('style'); st.textContent = GATE_CSS; document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend', gateHTML());
    let cfg = readCfg(); if (!cfg) cfg = await setupScreen();
    const sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'shtab-auth' } });

    let recovery = /type=recovery/.test(location.hash);
    sb.auth.onAuthStateChange((ev) => {
      if (ev === 'PASSWORD_RECOVERY') recovery = true;
      if (ev === 'SIGNED_OUT') { location.reload(); }
    });
    let session = (await sb.auth.getSession()).data.session;
    if (recovery) { await new Promise(r => setTimeout(r, 300)); session = await authScreen(sb, 'newpass'); }
    if (!session) session = await authScreen(sb, 'in');
    if (location.hash && /access_token|type=/.test(location.hash)) history.replaceState(null, '', location.pathname);
    const user = session.user;
    const db = makeDb(sb, user.id);
    return {
      db, assets: makeAssets(sb, user.id), downloads,
      user: { id: user.id, email: user.email, name: (user.user_metadata && user.user_metadata.name) || '' },
      async signOut() { db.clearCache(); await sb.auth.signOut(); location.reload(); }
    };
  }

  window.SHTAB = { start };
})();
