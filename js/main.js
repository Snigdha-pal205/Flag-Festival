/* Flag Festival — app: profiles (saved in this browser only),
   the session planner (GDD §3) and the game loop: 8–10 minutes, ending with the parade.  */
(function (FF) {
  'use strict';
  const KEY = 'flagFestival.v1';
  /* Every game is always available — no locking or unlocking. */
  const GAMES = ['map', 'jigsaw', 'paint', 'catch', 'build'];
  const PLAN_LEN = 8; // + the parade

  const app = FF.app = {};

  /* ---------- storage (wrapped: private windows may block it) ---------- */
  function blankProfile(id) { return { id, day: 0, lastDate: null, seenIntro: false, flags: {}, plays: {}, announced: {} }; }
  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    if (!s || typeof s !== 'object') s = {};
    s.profiles = s.profiles || {};
    s.settings = Object.assign({ music: true }, s.settings || {});
    delete s.settings.unlockAll;
    ['kite', 'sun', 'drum', 'boat'].forEach(id => { if (!s.profiles[id]) s.profiles[id] = blankProfile(id); });
    return s;
  }
  app.store = load();
  app.save = function () { try { localStorage.setItem(KEY, JSON.stringify(app.store)); } catch (e) { /* storage unavailable */ } };
  app.saveSetting = function (k, v) { app.store.settings[k] = v; app.save(); };
  app.getProfile = id => app.store.profiles[id];
  app.resetAll = function () { Object.keys(app.store.profiles).forEach(id => { app.store.profiles[id] = blankProfile(id); }); app.save(); };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  /* ---------- scene switching ---------- */
  app.go = function (scene, wipe) {
    const doIt = () => { FF.pip.clearBubble(); FF.audio.stopVoice(); FF.show(scene); };
    if (wipe === false || !FF.current) doIt();
    else FF.ui.wipe(doIt);
    return scene;
  };
  app.home = function () {
    app.token++;
    FF.ui.showTop(false);
    app.go(new FF.scenes.Title());
  };
  /* no "Who is playing?" page: PLAY goes straight into the game with one saved progress */
  app.toProfiles = function () { app.choose('kite'); };
  app.choose = function (id) { app.profile = app.store.profiles[id]; app.runSession(); };
  app.again = function () { if (app.profile) app.runSession(true); else app.home(); };
  app.token = 0;

  function levelFor(p, flag, game) {
    const n = (p.plays[flag] && p.plays[flag][game]) || 0;
    return ['easy', 'normal', 'hard'][Math.min(2, n)];
  }
  const learnedList = p => FF.C.countries.filter(c => p.flags[c.id] && p.flags[c.id].learned).map(c => c.id);

  /* ---------- the session plan (GDD §3 rules) ----------
     1 a new country starts with Map + Colour · 2 never the same game twice in a row
     3 review at least one older flag in a different game · 4 all five games are always open
     5 end with the parade after about 8 games or 10 minutes · never the same flag 3× in a row
     (Paint the Flag never comes right after Map + Colour of the same flag — that already ends in painting) */
  app.buildPlan = function (p) {
    const unlocked = GAMES;
    const order = FF.C.countries.map(c => c.id);
    const learned = learnedList(p);
    const fresh = order.filter(id => !learned.includes(id)).slice(0, 3);
    const others = unlocked.filter(g => g !== 'map');
    const plan = [];
    const seen = learned.slice();
    const useCount = {}, gameFlag = {}, gameCount = {};
    const mapSlots = { 0: [], 1: [0], 2: [0, 3], 3: [0, 2, 5] }[fresh.length];
    let ni = 0;
    for (let guard = 0; plan.length < PLAN_LEN && guard < 30; guard++) {
      const pos = plan.length;
      const last = plan[pos - 1];
      const noOther = last && last.game !== 'map' && others.filter(g => g !== last.game).length === 0;
      if (ni < fresh.length && (mapSlots.includes(pos) || noOther)) {
        const f = fresh[ni++];
        plan.push({ game: 'map', flag: f, isNew: true });
        seen.push(f); useCount[f] = (useCount[f] || 0) + 1; gameCount.map = (gameCount.map || 0) + 1;
        continue;
      }
      if (!seen.length) break;
      let flag;
      if (last && last.game === 'map') flag = last.flag;
      else {
        const cands = seen.filter(f => !(pos >= 2 && plan[pos - 1].flag === f && plan[pos - 2].flag === f));
        // older flags first (learned before, then met earlier this session), least practised
        cands.sort((a, b) => ((useCount[a] || 0) - (useCount[b] || 0)) || (fresh.indexOf(a) - fresh.indexOf(b)));
        flag = cands[0];
        if (!flag) break;
      }
      let games = others.filter(g => !last || (g !== last.game && !(last.game === 'map' && g === 'paint')));
      if (!games.length) {
        if (plan.length >= 6) break;
        games = unlocked.filter(g => !last || g !== last.game);
      }
      if (!games.length) break;
      games.sort((a, b) => ((gameFlag[a + ':' + flag] ? 1 : 0) - (gameFlag[b + ':' + flag] ? 1 : 0)) || ((gameCount[a] || 0) - (gameCount[b] || 0)));
      const g = games[0];
      plan.push({ game: g, flag });
      useCount[flag] = (useCount[flag] || 0) + 1; gameFlag[g + ':' + flag] = true; gameCount[g] = (gameCount[g] || 0) + 1;
    }
    return plan;
  };

  /* ---------- run one scene and wait for it to say "done" ---------- */
  function runScene(Cls, args) {
    return new Promise(resolve => { app.go(new Cls(Object.assign({}, args, { done: resolve }))); });
  }

  /* ---------- the game flow ----------
     PLAY → for one flag at a time:
       1 Map + Colour: put the missing country back → the flag says "Good job!" →
         Grumble washes the colour off → colour the flag again
       2–4 Flag Jigsaw, Catch the Flag, Build a Flag in a random order — all with the SAME flag
       5   Which flag? — pick the right flag from three, no help (revision)
     then the next flag, straight on — no time limit, no "come back tomorrow".
     When every flag is done, the parade plays and everyone celebrates. */
  app.runSession = async function () {
    const tok = ++app.token;
    const p = app.profile;
    p.lastDate = today();
    app.save();
    FF.audio.music('festival');
    // ALL 7 countries, in a new random order every time PLAY is tapped.
    // The last 3 countries played go to the back, so a new game never starts with one you just had.
    const recent = (p.recent || []).slice(-3);
    const fresh = FF.shuffle(FF.C.countries.map(c => c.id).filter(id => !recent.includes(id)));
    const order = fresh.concat(FF.shuffle(recent.filter(id => FF.C.countries.some(c => c.id === id))));
    app.surprise.start();
    for (let fi = 0; fi < order.length; fi++) {
      const id = order[fi];
      p.lastFlag = id;
      p.recent = (p.recent || []).filter(x => x !== id).concat([id]).slice(-3);
      app.save();
      const country = FF.C.countries.find(c => c.id === id);
      const steps = ['map'].concat(FF.shuffle(['jigsaw', 'catch', 'build']), ['quiz']);   // the quiz is always last
      FF.ui.setBunting(steps.length, []);
      for (const game of steps) {
        if (tok !== app.token) return;
        FF.ui.showTop(true);
        await runScene(FF.games[game], { country, level: levelFor(p, id, game), learned: learnedList(p) });
        if (tok !== app.token) return;
        p.plays[id] = p.plays[id] || {};
        p.plays[id][game] = (p.plays[id][game] || 0) + 1;
        if (game === 'map') p.flags[id] = Object.assign({}, p.flags[id], { learned: true });
        app.save();
        FF.ui.addPennant(country.flag);
      }
      p.flags[id] = Object.assign({}, p.flags[id], { learned: true, done: true });
      app.save();
    }
    app.surprise.stop();
    await app.paradeAndGoodbye(tok);
  };
  app.paradeAndGoodbye = async function (tok) {
    const p = app.profile;
    FF.ui.showTop(false);
    await runScene(FF.scenes.Parade, { learned: learnedList(p) });
    if (tok !== app.token) return;
    app.go(new FF.scenes.Goodbye({}));
  };

  /* ---------- surprises: one every couple of minutes, only during games ---------- */
  app.surprise = {
    timer: null, last: 0,
    start() {
      this.stop();
      this.last = performance.now();
      this.timer = setInterval(() => {
        const sc = FF.current;
        const now = performance.now();
        if (!sc || !(sc instanceof FF.games.GameBase) || sc.finished || FF.drag.active) return;
        if (now - this.last < FF.rand(105000, 135000)) return;
        this.last = now;
        FF.ui.bubbleSurprise(sc);
      }, 4000);
    },
    stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  };

  /* ---------- full screen on phones and tablets ----------
     Browsers only allow full screen after a tap, so the first tap (e.g. PLAY) hides the
     browser's address bar and tabs and turns the game sideways. If the child leaves full
     screen (back button / swipe), the next tap goes back in. Computers with a mouse are left alone.
     iPhone Safari has no full-screen switch for web pages: there, "Add to Home Screen"
     opens the game full screen (see manifest.json and the apple-* tags in index.html). */
  app.fullScreen = {
    isTouch: () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches,
    isOn: () => !!(document.fullscreenElement || document.webkitFullscreenElement),
    isApp: () => (window.matchMedia && window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) || window.navigator.standalone === true,
    enter() {
      if (this.isOn() || this.isApp() || !this.isTouch()) return;
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!req) return;                                   // iPhone Safari: not supported
      try {
        const r = req.call(el, { navigationUI: 'hide' });
        const lock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) { /* not allowed */ } };
        if (r && r.then) r.then(lock).catch(() => {}); else lock();
      } catch (e) { /* the browser said no: the game still works in the normal window */ }
    },
    watch() {
      const go = () => this.enter();
      // pointerup / touchend / click count as a real tap for the browser (pointerdown on touch does not)
      ['pointerup', 'touchend', 'click'].forEach(t => window.addEventListener(t, go, { capture: true, passive: true }));
    }
  };

  /* ---------- boot ---------- */
  function boot() {
    FF.initStage();
    FF.art.initDefs();
    FF.three.init();
    FF.three.preloadBg(['title.jpg', 'ocean.jpg', 'festival.jpg']);
    FF.three.chars.preload();
    FF.ui.init();
    FF.pip.init();
    FF.audio.setMusicOn(app.store.settings.music !== false);
    FF.ui.refreshMusic();
    // any first touch unlocks sound (browsers block audio until a tap)
    const unlock = () => { FF.audio.init(); window.removeEventListener('pointerdown', unlock, true); };
    window.addEventListener('pointerdown', unlock, true);
    app.fullScreen.watch();
    app.go(new FF.scenes.Title(), false);
    // wait for the fonts, then redraw the title so letters are measured right
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (FF.current instanceof FF.scenes.Title) app.go(new FF.scenes.Title(), false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.FF);
