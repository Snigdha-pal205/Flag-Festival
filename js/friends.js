/* Flag Festival — the animal friends of the story (two of: Ellie the elephant, Andy the ant,
   Donny the donkey — a different pair each PLAY), from the artist's frame sheet in assets/chars/friends/.

   Every frame carries a yellow flag. Until the real flag is won back, the "?" on it is
   covered and the country's NAME is written on the yellow cloth instead. <kind>-<n>-flag.png marks exactly where that flag
   cloth is (alpha) and how its folds are shaded (grey), so once a child wins the real flag
   back we paint the real flag onto the same cloth, keeping the folds.

   Moods (one step per finished game):  0 asleep · 1 awake · 2 smiling · 3 bouncing · 4 dancing */
(function (FF) {
  'use strict';
  const DIR = 'assets/chars/friends/';
  const META = {
    elephant: [[283, 300, 184, 11, 86, 75], [283, 300, 195, 22, 83, 70], [283, 300, 194, 12, 82, 69], [283, 300, 191, 7, 83, 71], [283, 300, 193, 24, 83, 69], [283, 300, 158, 4, 89, 75]],
    ant: [[242, 291, 115, 9, 94, 82], [242, 291, 142, 6, 97, 86], [242, 291, 147, 10, 91, 78], [242, 291, 139, 5, 93, 80], [242, 291, 143, 9, 93, 82], [242, 291, 140, 4, 91, 80]],
    donkey: [[265, 322, 146, 22, 86, 70], [265, 322, 170, 8, 92, 73], [265, 322, 166, 18, 90, 70], [265, 322, 167, 17, 91, 71], [265, 322, 169, 17, 91, 69], [265, 322, 159, 3, 93, 75]],
    lion: [[293, 314, 152, 16, 116, 83], [293, 314, 180, 25, 109, 85], [293, 314, 159, 14, 112, 86], [293, 314, 154, 11, 110, 86], [293, 314, 151, 9, 111, 79], [293, 314, 139, 19, 110, 85]],
    giraffe: [[266, 317, 123, 19, 114, 82], [266, 317, 153, 21, 110, 83], [266, 317, 142, 19, 108, 82], [266, 317, 139, 18, 105, 81], [266, 317, 130, 16, 106, 81], [266, 317, 124, 19, 104, 82]],
    deer: [[280, 312, 140, 16, 108, 83], [280, 312, 170, 14, 107, 83], [280, 312, 166, 14, 107, 85], [280, 312, 156, 14, 110, 82], [280, 312, 162, 13, 107, 84], [280, 312, 149, 13, 103, 84]]
  };
  const Fr = FF.friends = {
    KINDS: [{ kind: 'elephant', name: 'Ellie' }, { kind: 'ant', name: 'Andy' }, { kind: 'donkey', name: 'Donny' },
            { kind: 'lion', name: 'Leo' }, { kind: 'giraffe', name: 'Gigi' }, { kind: 'deer', name: 'Hiru' }],
    imgs: {}, urls: {}, team: []
  };
  Fr.meta = (kind, n) => { const m = META[kind][n - 1]; return { w: m[0], h: m[1], fx: m[2], fy: m[3], fw: m[4], fh: m[5] }; };

  /* ---------- loading ---------- */
  const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  /* load only what is needed: the shared flag pictures once, and the frames of the friends
     who are actually playing (not all six) */
  const kindJobs = {};
  Fr.preload = function (kinds) {
    const jobs = [Fr.common()];
    (kinds || []).forEach(k => {
      if (!kindJobs[k]) {
        const js = [];
        for (let n = 1; n <= 6; n++) {
          js.push(load(DIR + `${k}-${n}.webp`).then(im => { Fr.imgs[`${k}-${n}`] = im; }));
          js.push(load(DIR + `${k}-${n}-flag.webp`).then(im => { Fr.imgs[`${k}-${n}-flag`] = im; }));
        }
        kindJobs[k] = Promise.all(js);
      }
      jobs.push(kindJobs[k]);
    });
    return Promise.all(jobs);
  };
  Fr.common = function () {
    if (Fr.ready) return Fr.ready;
    const jobs = [];
    jobs.push(load('assets/bg/name-flag.png').then(im => { Fr.imgs.nameflag = im; }));   // the glossy "?" flag cloth
    jobs.push(load('assets/bg/flag-shade.png').then(im => { Fr.imgs.flagshade = im; }));  // its folds (for real flags)
    jobs.push(load('assets/bg/flag-shine.png').then(im => { Fr.imgs.flagshine = im; }));  // its shine
    // flags that have their own ready-made artwork (Nepal: not a rectangle, so not on the cloth)
    Object.keys(FLAG_ART).forEach(id => jobs.push(load(FLAG_ART[id]).then(im => { Fr.imgs['art-' + id] = im; })));
    // the names on the flags use the game's title font: wait for it before drawing any
    if (document.fonts && document.fonts.load) jobs.push(document.fonts.load('40px "Lilita One"').catch(() => {}));
    Fr.ready = Promise.all(jobs);
    return Fr.ready;
  };

  /* the picture of one frame: a yellow flag with the country's name on it (flagId null),
     or the real flag painted onto the cloth. Drawn at 2× so the name stays sharp. */
  const Q = 2;
  const FLAG_ART = { nepal: 'assets/flags/nepal-cloth.png' };
  // the flag is drawn bigger than in the artwork: much wider (grows right, away from the
  // friend) and a bit taller (grows down the pole) — so it never covers the friend's face.
  // Every friend gets the same flag size for its height (some artworks have bigger flags).
  const FLAG_W = 0.57, FLAG_H = 0.36;       // flag width / height as a share of the friend's height
  const grow = m => ({ bx: FLAG_W * m.h / m.fw, by: FLAG_H * m.h / m.fh });
  const EX = 175;           // extra room on the right of every picture for the bigger flag
  /* Where each flag's hoist edge (the side that meets the pole) is in its own picture:
     x = h0 + hs * y (picture pixels). Measured from the pictures. */
  const HOIST = {
    cloth: { h0: -2.7, hs: 0.0446 },          // the glossy cloth (name flag + real flags), 420 px wide
    nepal: { h0: -0.76, hs: 0.0438 }          // the artist's Nepal flag, 420 px wide
  };
  /* the friend's pole, from the artwork: the left edge of the small flag in each frame,
     as a line x = A0 + As * (y - fy) in frame pixels (poles are tilted, every frame differently) */
  const poleCache = {};
  function poleLine(kind, n, m, mask) {
    const k = kind + n;
    if (poleCache[k]) return poleCache[k];
    const cv = document.createElement('canvas'); cv.width = mask.naturalWidth; cv.height = mask.naturalHeight;
    const cx = cv.getContext('2d'); cx.drawImage(mask, 0, 0);
    const d = cx.getImageData(0, 0, cv.width, cv.height).data;
    const ys = [], xs = [];
    for (let y = Math.round(m.fy + m.fh * 0.12); y < Math.round(m.fy + m.fh * 0.88); y++) {
      for (let x = Math.max(0, m.fx - 2); x < Math.min(cv.width, m.fx + m.fw); x++) { if (d[(y * cv.width + x) * 4 + 3] > 128) { ys.push(y); xs.push(x); break; } }
    }
    let A0 = m.fx, As = 0;
    if (ys.length > 4) {
      const my = ys.reduce((a, b) => a + b, 0) / ys.length, mx = xs.reduce((a, b) => a + b, 0) / xs.length;
      let sxy = 0, syy = 0; ys.forEach((y, i) => { sxy += (y - my) * (xs[i] - mx); syy += (y - my) * (y - my); });
      As = syy ? sxy / syy : 0; A0 = mx + As * (m.fy - my);
    }
    poleCache[k] = { A0, As };
    return poleCache[k];
  }
  const keyOf = (kind, n, flagId, label) => `${kind}-${n}-${flagId || 'name:' + (label || '')}`;
  /* the picture of one frame, ready: from the cache, or drawn right now (only if it wasn't made ahead) */
  Fr.url = function (kind, n, flagId, label) {
    const key = keyOf(kind, n, flagId, label);
    if (Fr.urls[key]) return Fr.urls[key];
    const c = compose(kind, n, flagId, label);
    if (!c) return DIR + `${kind}-${n}.webp`;
    Fr.urls[key] = c.toDataURL();
    return Fr.urls[key];
  };
  /* make one frame's picture ahead of time, as a light WebP — without freezing the screen */
  Fr.make = function (kind, n, flagId, label) {
    const key = keyOf(kind, n, flagId, label);
    if (Fr.urls[key]) return Promise.resolve();
    const c = compose(kind, n, flagId, label);
    if (!c) return Promise.resolve();
    return new Promise(res => {
      if (!c.toBlob) { Fr.urls[key] = c.toDataURL(); res(); return; }
      c.toBlob(bl => { if (!Fr.urls[key]) Fr.urls[key] = bl ? URL.createObjectURL(bl) : c.toDataURL(); res(); }, 'image/webp', 0.92);
    });
  };
  function compose(kind, n, flagId, label) {
    const base = Fr.imgs[`${kind}-${n}`], mask = Fr.imgs[`${kind}-${n}-flag`];
    const cloth = Fr.imgs.nameflag, shade = Fr.imgs.flagshade, shine = Fr.imgs.flagshine;
    if (!base || !mask || !cloth || !shade || !shine) return null;
    const m = Fr.meta(kind, n);
    const c = document.createElement('canvas'); c.width = (m.w + EX) * Q; c.height = m.h * Q;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    const { by: BY } = grow(m);
    const ch = m.fh * BY, top = m.fy - 2;                     // flag height and top, in frame pixels
    const pl = poleLine(kind, n, m, mask);
    /* draw a flag picture so that its hoist edge runs exactly along the friend's tilted pole */
    const place = (src, W0, H0, hz, H) => {
      const s = H / H0, cc = s * (pl.As - hz.hs), e = pl.A0 + pl.As * (top - m.fy) - s * hz.h0 - 1;
      ctx.save(); ctx.scale(Q, Q); ctx.transform(s, 0, cc, s, e, top);
      ctx.drawImage(src, 0, 0, W0, H0);
      ctx.restore();
      return (u, v) => ({ x: (s * u + cc * v + e) * Q, y: (s * v + top) * Q, s: s * Q });   // picture point → canvas
    };
    const fd = flagId ? FF.flags.data(flagId) : null;
    const CW = cloth.naturalWidth, CH = cloth.naturalHeight;
    let at = null;
    if (!fd) {
      at = place(cloth, CW, CH, HOIST.cloth, ch);                              // the glossy "?" cloth
    } else if (Fr.imgs['art-' + flagId]) {
      const art = Fr.imgs['art-' + flagId];                                    // Nepal: the artist's flag
      place(art, art.naturalWidth, art.naturalHeight, HOIST.nepal, ch * 1.3);
    } else {
      // the real flag on the SAME glossy cloth: its shape, folds (multiply) and shine
      const fc = document.createElement('canvas'); fc.width = CW; fc.height = CH;
      const fx = fc.getContext('2d');
      fx.imageSmoothingQuality = 'high';
      fx.save(); fx.scale(CW / fd.w, CH / fd.h); FF.three.flags.draw(fx, flagId, 'full'); fx.restore();
      fx.globalCompositeOperation = 'destination-in'; fx.drawImage(shade, 0, 0, CW, CH);
      fx.globalCompositeOperation = 'multiply'; fx.drawImage(shade, 0, 0, CW, CH);
      fx.globalCompositeOperation = 'source-atop'; fx.drawImage(shine, 0, 0, CW, CH);
      place(fc, CW, CH, HOIST.cloth, ch);
    }
    // the friend on top (its pole and hand in front of the flag), with the artwork's small flag cut out
    const body = document.createElement('canvas'); body.width = m.w * Q; body.height = m.h * Q;
    const bx = body.getContext('2d');
    bx.imageSmoothingQuality = 'high';
    bx.drawImage(base, 0, 0, body.width, body.height);
    bx.globalCompositeOperation = 'destination-out'; bx.drawImage(mask, 0, 0, body.width, body.height);
    ctx.drawImage(body, 0, 0);
    if (!fd) {
      const text = (str, p, size, maxW, fill, stroke) => {
        ctx.font = `${size}px "Lilita One", "Fredoka", sans-serif`;
        const tw = ctx.measureText(str).width;
        if (tw > maxW) { size *= maxW / tw; ctx.font = `${size}px "Lilita One", "Fredoka", sans-serif`; }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(3, size * 0.2); ctx.strokeStyle = stroke; ctx.strokeText(str, p.x, p.y);
        ctx.fillStyle = fill; ctx.fillText(str, p.x, p.y);
      };
      const q = at(CW * 0.48, CH * 0.36), nm = at(CW * 0.48, CH * 0.72);
      text('?', q, CH * 0.44 * q.s, CW * q.s, '#ffffff', '#e2700a');                       // the big "?"
      if (label) text(label, nm, CH * 0.26 * nm.s, CW * 0.78 * nm.s, '#ffffff', '#7a4a10'); // the country
    }
    return c;
  }

  /* ---------- the team for one PLAY: one friend per country, each carrying that country's flag ---------- */
  Fr.makeTeam = function (countryIds) {
    const ids = FF.shuffle(countryIds.slice());
    Fr.team = FF.shuffle(Fr.KINDS.slice()).slice(0, ids.length).map((k, i) => {
      const country = FF.C.countries.find(c => c.id === ids[i]);
      return { i, kind: k.kind, name: k.name, country, flag: country.flag, games: 0, revealed: false };
    });
    return Fr.team;
  };
  Fr.ctx = m => ({ friend: m.name, country: m.country.name });
  /* draw every picture the team will need (name flag + real flag, all 6 frames) ahead of time,
     a few at a time, so nothing stutters the first time a picture appears */
  Fr.warm = function (team, real) {
    const jobs = [];
    (team || Fr.team).forEach(m => { for (let n = 1; n <= 6; n++) jobs.push(real ? [m.kind, n, m.flag, m.country.name] : [m.kind, n, null, m.country.name]); });
    return new Promise(done => {
      const step = () => { const j = jobs.shift(); if (!j) { done(); return; } Fr.make(j[0], j[1], j[2], j[3]).then(() => setTimeout(step, 0)); };
      step();
    });
  };
  /* the real-flag pictures are only needed after a reveal: make them quietly while the child plays */
  Fr.warmLater = function (team) {
    const go = () => Fr.warm(team, true);
    if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 1500);
  };


  /* ---------- an animal on screen (SVG) ----------
     o: {h (height px), x, y (feet), mood 0–4, walk (march frames), flag: flagId or null ("?")} */
  let sleepyDef = false;
  class Sprite {
    constructor(parent, member, o) {
      o = o || {};
      if (!sleepyDef) {
        sleepyDef = true;
        FF.defs.insertAdjacentHTML('beforeend', `<filter id="ff-sleepy"><feColorMatrix type="saturate" values="0.35"/></filter>`);
      }
      this.m = member;
      this.h = o.h || 200;
      const m1 = Fr.meta(member.kind, 1);
      this.w = this.h * m1.w / m1.h;
      this.g = FF.el('g', { class: 'no-hit' }, parent);
      this.inner = FF.el('g', {}, this.g);
      // all 6 poses are ready as separate pictures; moving only shows/hides them, so nothing
      // has to load or redraw mid-animation (that caused flicker and stutter)
      const wImg = this.h * (m1.w + EX) / m1.h;   // the picture includes room on the right for the big flag
      this.imgs = [1, 2, 3, 4, 5, 6].map(() => FF.el('image', { x: (-this.w / 2).toFixed(1), y: (-this.h).toFixed(1), width: wImg.toFixed(1), height: this.h.toFixed(1), visibility: 'hidden', preserveAspectRatio: 'none' }, this.inner));
      this.zz = FF.el('g', { class: 'no-hit' }, this.g);
      this.x = o.x || 0; this.y = o.y || 0; this.s = 1;
      this.mood = o.mood || 0; this.walk = !!o.walk;
      this.flag = o.flag || null;
      this.t = Math.random() * 4; this.n = 0; this.jump = 0;
      this.loadPics();
      this.setFrame(1);
      this.update(0);
    }
    loadPics() { this.imgs.forEach((im, i) => im.setAttribute('href', Fr.url(this.m.kind, i + 1, this.flag, this.m.country.name))); }
    setFrame(n) {
      if (n === this.n) return;
      if (this.n) this.imgs[this.n - 1].setAttribute('visibility', 'hidden');
      this.imgs[n - 1].setAttribute('visibility', 'visible');
      this.n = n;
    }
    setFlag(flagId) { this.flag = flagId; this.loadPics(); }
    setMood(mood) { this.mood = mood; }
    hop() { this.jump = 0.45; }
    /* where the flag cloth is on screen (stage px) */
    flagStage() {
      const m = Fr.meta(this.m.kind, this.n || 1), k = this.h / m.h * this.s, g = grow(m);
      return { x: this.x + (m.fx + m.fw * g.bx / 2 - m.w / 2) * k, y: this.y + (m.fy + m.fh * g.by / 2 - m.h) * k };
    }
    update(dt) {
      this.t += dt;
      const t = this.t;
      this.jump = Math.max(0, this.jump - dt);
      // Calm, smooth motion for small children: few picture changes, soft sine curves
      // (no sharp bounces), slow sways. "soft(f)" goes 0 → 1 → 0 smoothly, f times a second.
      const soft = f => (1 - Math.cos(t * f * Math.PI * 2)) / 2;
      let n = 1, bob = 0, rot = 0, sx = 1, sy = 1, sleepy = false;
      if (this.walk) {                                          // marching: 4 steps a second
        n = [1, 2, 3, 5][Math.floor(t * 4) % 4];
        bob = soft(2) * 0.025;
        if (this.mood >= 4) { n = Math.floor(t * 2) % 2 ? 6 : 4; rot = Math.sin(t * Math.PI) * 3; }
      } else if (this.mood <= 0) {                              // asleep: grey-ish, drooping, z z z
        n = 1; sleepy = true; rot = -6; sy = 1 + Math.sin(t * 1.6) * 0.015;
      } else if (this.mood === 1) {                             // awake: little breaths, a blink now and then
        n = (t % 3.6) < 0.3 ? 4 : 1; sy = 1 + Math.sin(t * 2) * 0.015;
      } else if (this.mood === 2) {                             // smiling
        n = (t % 3) < 2 ? 4 : 1; sy = 1 + Math.sin(t * 2) * 0.02;
      } else if (this.mood === 3) {                             // bouncing happily (slow, soft hops)
        n = (t % 2) < 1 ? 4 : 1; bob = soft(1.2) * 0.05; sy = 1 + Math.sin(t * 2.4 * Math.PI) * 0.015;
      } else {                                                  // dancing, ready for the flag: gentle sway
        n = (t % 1.6) < 0.8 ? 4 : 6; bob = soft(1.25) * 0.05; rot = Math.sin(t * Math.PI * 0.8) * 4;
      }
      bob += Math.sin(this.jump / 0.45 * Math.PI) * 0.25;
      this.setFrame(n);
      if (sleepy !== this._sleepy) { this._sleepy = sleepy; if (sleepy) this.inner.setAttribute('filter', 'url(#ff-sleepy)'); else this.inner.removeAttribute('filter'); }
      const H = this.h * this.s;
      this.g.setAttribute('transform', `translate(${this.x.toFixed(1)} ${(this.y - bob * H).toFixed(1)})`);
      this.inner.setAttribute('transform', `rotate(${rot.toFixed(1)}) scale(${(this.s * sx).toFixed(3)} ${(this.s * sy).toFixed(3)})`);
      // floating z's while asleep
      if (sleepy) {
        const zs = H / 250;                                       // z's scale with the friend's size
        if (!this.zz.childNodes.length) for (let i = 0; i < 3; i++) { const z = FF.el('text', { 'font-size': ((20 + i * 6) * zs).toFixed(1), class: 'title-font', fill: '#ffffff', stroke: '#5a6b9a', 'stroke-width': Math.max(1.5, 3 * zs).toFixed(1), 'paint-order': 'stroke' }, this.zz); z.textContent = 'z'; }
        [...this.zz.childNodes].forEach((z, i) => {
          const k = ((t * 0.5 + i / 3) % 1);
          z.setAttribute('x', (-this.w * 0.1 * this.s + k * 24 * zs).toFixed(1));
          z.setAttribute('y', (-H * 0.62 - k * 30 * zs).toFixed(1));
          z.setAttribute('opacity', Math.sin(k * Math.PI).toFixed(2));
        });
      } else if (this.zz.childNodes.length) this.zz.innerHTML = '';
    }
    remove() { this.g.remove(); }
  }
  Fr.Sprite = Sprite;

  /* ---------- the progress strip: the friends, always visible between steps ---------- */
  const strip = Fr.strip = { g: null, slots: [], on: false };
  strip.show = function () {
    strip.hide();
    const team = Fr.team;
    if (!team.length) return;
    const W = 156, PW = W * team.length + 16, x0 = 640 - PW / 2;
    const g = strip.g = FF.el('g', { class: 'no-hit', 'data-strip': '1' }, FF.layers.ui);
    FF.hud.panel(g, x0, 4, PW, 72, { stroke: '#3d9bff', r: 20 });   // short, so titles below never touch it
    strip.slots = team.map((m, i) => {
      const cx = x0 + 8 + W * i + W / 2;
      const glow = FF.el('rect', { x: cx - W / 2 + 4, y: 9, width: W - 8, height: 62, rx: 16, fill: '#ffe14d', opacity: 0 }, g);
      const sp = new Sprite(g, m, { h: 62, x: cx - 50, y: 72, mood: m.games, flag: m.revealed ? m.flag : null });
      const dots = FF.el('g', { transform: `translate(${cx + 23} 22)` }, g);
      const nm = FF.hud.text(g, m.name, cx + 34, 67, 15, { fill: '#2a1f3d' });
      const slot = { m, sp, dots, glow, nm };
      strip.drawDots(slot);
      return slot;
    });
    strip.on = true;
    if (!strip.stopTick) strip.stopTick = FF.addTick(dt => { if (strip.on) strip.slots.forEach(s => s.sp.update(dt)); });
  };
  strip.drawDots = function (slot) {
    const n = slot.m.games;
    slot.dots.innerHTML = [0, 1, 2, 3].map(i => {
      const x = (i % 2) * 20, y = Math.floor(i / 2) * 19;
      return i < n
        ? `<circle cx="${x}" cy="${y}" r="8" fill="${FF.hud.grad('#3fcf5a')}" stroke="#ffffff" stroke-width="2.5"/>`
        : `<circle cx="${x}" cy="${y}" r="7" fill="#e8f2ff" stroke="#3d9bff" stroke-width="2.5"/>`;
    }).join('');
  };
  strip.hide = function () { if (strip.g) strip.g.remove(); strip.g = null; strip.slots = []; strip.on = false; };
  /* which friend this step is for: a soft yellow glow behind them */
  strip.focus = function (i) { strip.slots.forEach((s, k) => s.glow.setAttribute('opacity', k === i ? 0.75 : 0)); };
  /* a friend finished a game: one more dot, a livelier mood, a little hop and sparkle */
  strip.refresh = function (i, pop) {
    const s = strip.slots[i]; if (!s) return;
    s.sp.setMood(s.m.games);
    if (s.m.revealed) s.sp.setFlag(s.m.flag);
    strip.drawDots(s);
    if (pop) {
      s.sp.hop();
      FF.audio.sfx('sparkle');
      const sg = FF.el('g', { class: 'no-hit' }, strip.g);
      const c = { x: s.sp.x, y: 40 };
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2;
        const st = FF.el('path', { d: FF.flags.starD(0, 0, 7, -90), fill: ['#ffe14d', '#ff4d6d', '#3d9bff', '#3fcf5a'][k % 4] }, sg);
        FF.tween(0.7, kk => { st.setAttribute('transform', `translate(${(c.x + Math.cos(a) * 46 * kk).toFixed(1)} ${(c.y + Math.sin(a) * 34 * kk).toFixed(1)})`); st.setAttribute('opacity', (1 - kk).toFixed(2)); });
      }
      setTimeout(() => sg.remove(), 800);
    }
  };
})(window.FF);
