/* Flag Festival — the flat HUD drawn over the 3D world, in a bright glossy cartoon style:
   shiny buttons, bubbly titles, speech bubbles, top bar, circle wipe — and Pip, a 3D
   character who lives in front of every scene.                                          */
(function (FF) {
  'use strict';
  const T = THREE;
  const DARK = '#5a3214';

  FF.line = function (key, ctx) {
    const v = FF.C.lines[key];
    const s = Array.isArray(v) ? FF.pick(v) : (v || key);
    return FF.fmt(s, ctx || {});
  };
  FF.ctxFor = function (country) {
    if (!country) return {};
    return { country: country.name, friend: country.friend.name, He: country.friend.he, he: country.friend.he.toLowerCase() };
  };

  /* ================= glossy HUD kit ================= */
  const H = FF.hud = {};
  const shade = (hex, k) => { const c = new T.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, Math.min(1, hsl.s * (k > 0 ? 0.9 : 1.05)), FF.clamp(hsl.l + k, 0, 1)); return '#' + c.getHexString(); };
  H.shade = shade;
  const grads = {};
  H.grad = function (hex) {
    if (grads[hex]) return grads[hex];
    const id = 'gl' + hex.replace('#', '');
    const g = FF.el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, FF.defs);
    FF.el('stop', { offset: '0', 'stop-color': shade(hex, 0.16) }, g);
    FF.el('stop', { offset: '0.55', 'stop-color': hex }, g);
    FF.el('stop', { offset: '1', 'stop-color': shade(hex, -0.1) }, g);
    grads[hex] = `url(#${id})`;
    return grads[hex];
  };
  const rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
  H.rr = rr;

  const BROWN = '#5a3214';
  H.BROWN = BROWN;
  /* candy gradient: bright top, rich bottom */
  const candy = {};
  H.candy = function (hex) {
    if (candy[hex]) return candy[hex];
    const id = 'cd' + hex.replace('#', '');
    const g = FF.el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, FF.defs);
    FF.el('stop', { offset: '0', 'stop-color': shade(hex, 0.2) }, g);
    FF.el('stop', { offset: '0.5', 'stop-color': hex }, g);
    FF.el('stop', { offset: '1', 'stop-color': shade(hex, -0.12) }, g);
    candy[hex] = `url(#${id})`;
    return candy[hex];
  };
  /* round button: brown outline, white rim, candy body, shine */
  H.round = function (parent, x, y, r, o) {
    o = o || {};
    const c = o.color || '#f2b83b';
    const g = FF.el('g', { transform: `translate(${x} ${y})` }, parent);
    const b = FF.el('g', { class: 'btn' + (o.bob ? ' btn-bob' : '') }, g);
    b.innerHTML = `
      <circle cx="0" cy="${r * 0.14 + 3}" r="${r + 7}" fill="rgba(40,20,5,.3)"/>
      <circle cx="0" cy="0" r="${r + 7}" fill="${BROWN}"/>
      <circle cx="0" cy="0" r="${r + 3}" fill="#ffffff"/>
      <circle cx="0" cy="${r * 0.08}" r="${r - 1}" fill="${shade(c, -0.2)}"/>
      <circle cx="0" cy="-2" r="${r - 3}" fill="${H.candy(c)}"/>
      <ellipse cx="0" cy="${-r * 0.42}" rx="${r * 0.62}" ry="${r * 0.3}" fill="#ffffff" opacity=".5"/>
      ${o.icon ? `<g filter="url(#hud-drop)">${FF.art.icon(o.icon, r * 1.05, o.iconColor || '#ffffff')}</g>` : ''}
    `;
    return g;
  };
  /* chunky pill button */
  H.button = function (parent, x, y, w, h, o) {
    o = o || {};
    const c = o.color || '#5cc531';
    const g = FF.el('g', { transform: `translate(${x} ${y}) rotate(${o.rot || 0})` }, parent);
    const b = FF.el('g', { class: 'btn' + (o.bob ? ' btn-bob' : '') }, g);
    const r = Math.min(h / 2, o.radius || h * 0.5);
    b.innerHTML = `
      <path d="${rr(-w / 2 - 7, -h / 2 - 7 + 10, w + 14, h + 14, r + 7)}" fill="rgba(40,20,5,.3)"/>
      <path d="${rr(-w / 2 - 7, -h / 2 - 7, w + 14, h + 14, r + 7)}" fill="${BROWN}"/>
      <path d="${rr(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, r + 3)}" fill="#ffffff"/>
      <path d="${rr(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, r - 2)}" fill="${shade(c, -0.18)}"/>
      <path d="${rr(-w / 2 + 2, -h / 2 + 2, w - 4, h - 10, r - 4)}" fill="${H.candy(c)}"/>
      <path d="${rr(-w / 2 + h * 0.3, -h / 2 + 8, w - h * 0.6, h * 0.3, h * 0.15)}" fill="#ffffff" opacity=".45"/>
    `;
    let lx = 0;
    if (o.icon) {
      const ix = o.label ? -w / 2 + h * 0.62 : 0;
      b.insertAdjacentHTML('beforeend', `<g transform="translate(${ix} -3)" filter="url(#hud-drop)">${FF.art.icon(o.icon, h * 0.52, '#ffffff')}</g>`);
      lx = o.label ? h * 0.28 : 0;
    }
    if (o.label) H.text(b, o.label, lx, h * 0.15, o.size || h * 0.52, { fill: '#ffffff', stroke: shade(c, -0.4) });
    return g;
  };
  /* bubbly outlined text */
  H.text = function (parent, str, x, y, size, o) {
    o = o || {};
    const g = FF.el('g', { class: 'no-hit' }, parent);
    const mk = (fill, stroke, sw, dy) => {
      const t = FF.el('text', { x, y: y + (dy || 0), 'text-anchor': o.anchor || 'middle', 'font-size': size, class: 'title-font', fill, stroke, 'stroke-width': sw, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, g);
      t.textContent = str;
      return t;
    };
    mk('rgba(40,20,5,.35)', 'rgba(40,20,5,.35)', size * 0.18, size * 0.07);
    mk(o.fill || '#ffffff', o.stroke || BROWN, size * 0.16);
    return g;
  };
  /* big candy title: per-letter colours, white rim, brown outline, shine */
  H.title = function (parent, str, x, y, size, o) {
    o = o || {};
    const colors = o.colors || ['#ff3b30', '#ff8a1f', '#ffc21f', '#46c23a', '#2f9cf0', '#ff3b30', '#ff8a1f', '#ffc21f', '#46c23a', '#2f9cf0', '#ff3b30'];
    const g = FF.el('g', { class: 'no-hit' }, parent);
    const rnd = FF.rng(o.seed || str.length * 7 + 3);
    const rot = [], dys = [];
    let ci = 0; const cols = [];
    for (let i = 0; i < str.length; i++) { rot.push(((rnd() - 0.5) * 7).toFixed(1)); dys.push(((rnd() - 0.5) * size * 0.06).toFixed(1)); cols.push(str[i] === ' ' ? '#fff' : colors[ci++ % colors.length]); }
    if (!H._shine) {
      H._shine = true;
      FF.defs.insertAdjacentHTML('beforeend', `<linearGradient id="candy-shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".42" stop-color="#fff" stop-opacity=".2"/><stop offset=".46" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
    }
    const layer = k => {
      const t = FF.el('text', { x, y: y + (k === 0 ? size * 0.1 : 0), 'text-anchor': o.anchor || 'middle', 'font-size': size, class: 'title-font', rotate: rot.join(' '), 'stroke-linejoin': 'round', 'letter-spacing': o.spacing || 1 }, g);
      let prev = 0;
      for (let i = 0; i < str.length; i++) {
        const ts = FF.el('tspan', {}, t);
        ts.setAttribute('dy', (+dys[i] - prev).toFixed(1)); prev = +dys[i];
        if (k === 0) { ts.setAttribute('fill', 'rgba(40,20,5,.4)'); ts.setAttribute('stroke', 'rgba(40,20,5,.4)'); ts.setAttribute('stroke-width', size * 0.3); }
        else if (k === 1) { ts.setAttribute('fill', BROWN); ts.setAttribute('stroke', BROWN); ts.setAttribute('stroke-width', size * 0.3); }
        else if (k === 2) { ts.setAttribute('fill', '#ffffff'); ts.setAttribute('stroke', '#ffffff'); ts.setAttribute('stroke-width', size * 0.17); }
        else if (k === 3) ts.setAttribute('fill', o.fill ? H.candy(o.fill) : H.candy(cols[i]));
        else ts.setAttribute('fill', 'url(#candy-shine)');
        ts.textContent = str[i];
      }
    };
    layer(0); layer(1); layer(2); layer(3); layer(4);
    return g;
  };
  /* a wooden sign board (for titles) */
  H.woodSign = function (parent, x, y, w, h, o) {
    o = o || {};
    const g = FF.el('g', { transform: `translate(${x} ${y}) rotate(${o.rot || 0})` }, parent);
    if (!H._wood) {
      H._wood = true;
      FF.defs.insertAdjacentHTML('beforeend', `<linearGradient id="wood-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98745"/><stop offset=".5" stop-color="#a8652e"/><stop offset="1" stop-color="#8a4f22"/></linearGradient>`);
    }
    const r = o.r || 22;
    let planks = '';
    const n = Math.max(1, Math.round(h / 46));
    for (let i = 1; i < n; i++) planks += `<path d="M${-w / 2 + 10} ${-h / 2 + i * h / n} H${w / 2 - 10}" stroke="#6e3c17" stroke-width="3" opacity=".6"/>`;
    for (let i = 0; i < n; i++) planks += `<path d="M${-w / 2 + 30} ${-h / 2 + (i + 0.5) * h / n} q${w * 0.2} -6 ${w * 0.4} 0 t${w * 0.35} 0" stroke="#7a4420" stroke-width="2" fill="none" opacity=".35"/>`;
    g.innerHTML = `
      <path d="${rr(-w / 2 - 6, -h / 2 - 6 + 10, w + 12, h + 12, r + 6)}" fill="rgba(40,20,5,.3)"/>
      <path d="${rr(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, r + 6)}" fill="${BROWN}"/>
      <path d="${rr(-w / 2, -h / 2, w, h, r)}" fill="url(#wood-g)"/>
      <path d="${rr(-w / 2 + 6, -h / 2 + 5, w - 12, 10, 5)}" fill="#e0a868" opacity=".55"/>
      ${planks}
      ${[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(q => `<circle cx="${q[0] * (w / 2 - 18)}" cy="${q[1] * (h / 2 - 15)}" r="5" fill="#5a3214"/><circle cx="${q[0] * (w / 2 - 18) - 1.5}" cy="${q[1] * (h / 2 - 15) - 1.5}" r="2" fill="#c98745"/>`).join('')}
    `;
    return g;
  };
  /* white rounded panel */
  H.panel = function (parent, x, y, w, h, o) {
    o = o || {};
    const g = FF.el('g', { transform: `translate(${x} ${y})` }, parent);
    g.innerHTML = `<path d="${rr(0, 8, w, h, o.r || 26)}" fill="rgba(20,10,40,.25)"/>
      <path d="${rr(0, 0, w, h, o.r || 26)}" fill="${o.color || '#ffffff'}" stroke="${o.stroke || '#5a3214'}" stroke-width="${o.sw || 6}"/>`;
    return g;
  };
  /* speech bubble */
  H.bubble = function (parent, text, o) {
    o = o || {};
    const size = o.size || 30;
    const maxChars = o.maxChars || 22;
    const words = text.split(' '); const lines = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) lines.push(cur);
    const lw = Math.max(...lines.map(l => l.length)) * size * 0.56 + 52;
    const lh = lines.length * size * 1.2 + 34;
    const g = FF.el('g', { class: 'bubble no-hit' }, parent);
    const inner = FF.el('g', { class: 'bubble-pop' }, g);
    const tail = o.tail || 'left';
    const tailD = tail === 'left' ? `M26 ${lh - 6} L4 ${lh + 30} L60 ${lh - 6} Z` : tail === 'right' ? `M${lw - 60} ${lh - 6} L${lw - 4} ${lh + 30} L${lw - 26} ${lh - 6} Z` : '';
    inner.innerHTML = `
      <path d="${rr(0, 7, lw, lh, 28)}" fill="rgba(20,10,40,.22)"/>
      ${tailD ? `<path d="${tailD}" fill="#ffffff" stroke="${DARK}" stroke-width="4" stroke-linejoin="round"/>` : ''}
      <path d="${rr(0, 0, lw, lh, 28)}" fill="#ffffff" stroke="${DARK}" stroke-width="4"/>
      ${tailD ? `<path d="${tail === 'left' ? `M28 ${lh - 2} L58 ${lh - 2}` : `M${lw - 58} ${lh - 2} L${lw - 28} ${lh - 2}`}" stroke="#ffffff" stroke-width="7"/>` : ''}
      <path d="${rr(10, 6, lw - 20, 12, 6)}" fill="#e8f6ff"/>
    `;
    lines.forEach((l, i) => {
      const t = FF.el('text', { x: lw / 2, y: 18 + size * 0.95 + i * size * 1.2, 'text-anchor': 'middle', 'font-size': size, class: 'body-font', fill: DARK, 'font-weight': 600 }, inner);
      t.textContent = l;
    });
    g._w = lw; g._h = lh;
    return g;
  };
  /* a white cartoon glove for hints */
  H.hand = function (parent) {
    const g = FF.el('g', { class: 'hint-hand' }, parent);
    g.innerHTML = `<g transform="translate(-6 40) rotate(-12)">
      <path d="M0 0 C -4 -10 -2 -38 6 -40 C 14 -42 15 -30 14 -20 L 16 -6 C 22 -10 30 -8 30 0 C 36 -2 42 2 40 10 C 46 10 49 18 45 26 L 37 46 C 30 58 6 60 0 46 L -12 22 C -17 13 -8 7 0 14 Z" transform="translate(3 6)" fill="rgba(20,10,40,.3)"/>
      <path d="M0 0 C -4 -10 -2 -38 6 -40 C 14 -42 15 -30 14 -20 L 16 -6 C 22 -10 30 -8 30 0 C 36 -2 42 2 40 10 C 46 10 49 18 45 26 L 37 46 C 30 58 6 60 0 46 L -12 22 C -17 13 -8 7 0 14 Z" fill="#ffffff" stroke="${DARK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M16 -6 L18 6 M30 0 L31 10" stroke="${DARK}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M2 50 q16 8 34 -2" stroke="#ff4d6d" stroke-width="9" fill="none" stroke-linecap="round"/>
    </g>`;
    return g;
  };
  // keep the older names working everywhere
  FF.art.letters = (p, s, x, y, size, o) => H.title(p, s, x, y, size, o);
  FF.art.bubble = (p, t, o) => H.bubble(p, t, o);
  FF.art.hand = p => H.hand(p);
  FF.art.sticker = (p, x, y, r, o) => H.round(p, x, y, r, o);

  /* ================= Pip (3D, in front of every scene) ================= */
  const pip = FF.pip = {
    char: null, bubble: null, last: null, visible: false, x: 90, y: 690, s: 1, _hideT: null, token: 0,
    init() {
      const F3 = FF.three;
      this.char = F3.chars.make('pip');
      this.char.root.visible = false;
      F3.hud.add(this.char.root);
      F3.hudUpdaters.add(dt => this.char.update(dt));
      this.bubbleLayer = FF.el('g', { class: 'no-hit' }, FF.layers.pip);
      // poke Pip
      FF.svg.addEventListener('pointerdown', e => {
        if (!this.visible) return;
        const p = FF.toLocal(e);
        if (Math.hypot(p.x - this.x, p.y - (this.y - 60 * this.s)) < 65 * this.s) this.char.poke();
      });
    },
    place() {
      const r = this.char.root;
      r.position.set(this.x, -this.y, 400);
      r.scale.setScalar(118 * this.s);
    },
    show(x, y, s) {
      this.x = x; this.y = y; this.s = (s || 1.1) * 0.95;
      this.char.root.visible = true; this.visible = true;
      this.char.flying = false;
      this.place();
    },
    hide() { this.char.root.visible = false; this.visible = false; this.clearBubble(); },
    clearBubble() { if (this.bubble) { this.bubble.remove(); this.bubble = null; } clearTimeout(this._hideT); },
    flyTo(x, y, dur, s) {
      dur = dur || 0.8;
      const sx = this.x, sy = this.y, ss = this.s, ts = s ? s * 0.95 : this.s;
      this.char.flying = true;
      FF.audio.sfx('flap');
      this.clearBubble();
      return FF.tween(dur, k => {
        this.x = FF.lerp(sx, x, k); this.y = FF.lerp(sy, y, k) - Math.sin(k * Math.PI) * 80; this.s = FF.lerp(ss, ts, k);
        this.place();
      }, FF.ease.inOut).then(() => { this.char.flying = false; this.char.play('hop'); });
    },
    say(text, o) {
      o = o || {};
      if (!this.visible && !o.noBubble) this.show(this.x, this.y, this.s / 0.95);
      this.last = { text, o };
      const my = ++this.token;
      this.clearBubble();
      if (!o.noBubble) {
        const b = H.bubble(this.bubbleLayer, text, { size: o.size || 28, maxChars: o.maxChars || 24, tail: this.x < 640 ? 'left' : 'right' });
        let bx = this.x < 640 ? this.x + 20 * this.s : this.x - 20 * this.s - b._w;
        let by = this.y - 128 * this.s - b._h - 10;
        bx = FF.clamp(bx, 12, FF.W - b._w - 12); by = FF.clamp(by, 96, FF.H - b._h - 34);
        b.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)})`);
        this.bubble = b;
      }
      this.char.talking = true;
      const p = o.noVoice ? Promise.resolve() : FF.audio.say(text, { who: o.who || 'pip', key: o.key });
      p.then(() => {
        if (my !== this.token) return;
        this.char.talking = false;
        this._hideT = setTimeout(() => { if (my === this.token) this.clearBubble(); }, o.hold || 1600);
      });
      return p;
    },
    repeat() { if (this.last) this.say(this.last.text, this.last.o); },
    cheer() { this.char.play('happy'); },
    tip(color) { this.char.tip(color); }
  };
  FF.say = function (key, ctx, o) { o = o || {}; o.key = o.key || key; return pip.say(FF.line(key, ctx), o); };

  /* ================= top bar ================= */
  const ui = FF.ui = {};
  ui.init = function () {
    // soft drop shadow for icons
    FF.defs.insertAdjacentHTML('beforeend', `<filter id="hud-drop" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="0" flood-color="#2a1f3d" flood-opacity=".45"/></filter>`);
    const L = FF.layers.ui;
    ui.top = FF.el('g', { class: 'topbar' }, L);
    ui.top.style.display = 'none';
    const home = H.round(ui.top, 54, 52, 32, { color: '#5cc531', icon: 'home' });
    FF.onTap(home, () => { FF.audio.sfx('tap'); FF.app && FF.app.home(); });
    const sp = H.round(ui.top, 1224, 52, 32, { color: '#2f9cf0', icon: 'speaker' });
    FF.onTap(sp, () => { FF.audio.sfx('tap'); pip.repeat(); });
    ui.makeMusic = function () {
      if (ui.musicBtn) ui.musicBtn.remove();
      const on = FF.audio.isMusicOn();
      const m = H.round(ui.top, 1142, 52, 28, { color: on ? '#ffb21f' : '#b5aa98', icon: on ? 'music' : 'musicOff' });
      ui.musicBtn = m;
      FF.onTap(m, () => { const v = !FF.audio.isMusicOn(); FF.audio.setMusicOn(v); FF.app && FF.app.saveSetting('music', v); ui.makeMusic(); });
    };
    ui.makeMusic();
    ui.buntingG = FF.el('g', {}, ui.top);
  };
  ui.showTop = function (show) { ui.top.style.display = show ? '' : 'none'; };
  ui.refreshMusic = function () { ui.makeMusic(); };

  ui.setBunting = function (slots, filled) {
    const g = ui.buntingG; g.innerHTML = '';
    ui.filled = [];
    const x0 = 120, x1 = 1090, y0 = 24, sag = 28;
    const pt = t => [FF.lerp(x0, x1, t), y0 + Math.sin(t * Math.PI) * sag];
    let d = '';
    for (let i = 0; i <= 30; i++) { const p = pt(i / 30); d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
    FF.el('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
    FF.el('path', { d, fill: 'none', stroke: DARK, 'stroke-width': 2.5 }, g);
    ui.slotPos = [];
    for (let i = 0; i < slots; i++) {
      const p = pt((i + 1) / (slots + 1));
      ui.slotPos.push(p);
      const sg = FF.el('g', { transform: `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})` }, g);
      sg.innerHTML = `<path d="M-20 0 L20 0 L0 42 Z" fill="#ffffff" fill-opacity=".55" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" stroke-dasharray="5 4"/>`;
    }
    (filled || []).forEach(f => ui.addPennant(f, true));
  };
  ui.addPennant = function (flagId, quiet) {
    const i = ui.filled.length;
    if (!ui.slotPos || i >= ui.slotPos.length) return;
    ui.filled.push(flagId);
    const p = ui.slotPos[i];
    const sg = FF.el('g', { transform: `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})` }, ui.buntingG);
    const inner = FF.el('g', { class: quiet ? 'pennant-sway' : 'pennant-pop' }, sg);
    const cid = FF.uid('pn');
    const fd = FF.flags.data(flagId);
    const s = 46 / fd.h;
    inner.innerHTML = `<clipPath id="${cid}"><path d="M-21 0 L21 0 L0 44 Z"/></clipPath>
      <g clip-path="url(#${cid})"><use href="#${FF.flags.def(flagId)}" transform="translate(${(-fd.w * s / 2).toFixed(1)} 0) scale(${s.toFixed(3)})"/></g>
      <path d="M-21 0 L21 0 L0 44 Z" fill="none" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-21 0 L21 0 L0 44 Z" fill="none" stroke="${DARK}" stroke-width="1.5" stroke-linejoin="round"/>`;
    if (!quiet) { FF.audio.sfx('pop'); setTimeout(() => inner.setAttribute('class', 'pennant-sway'), 700); }
  };

  /* ================= circle-wipe transition ================= */
  ui.wipe = function (middle) {
    return new Promise(resolve => {
      const g = FF.el('g', { class: 'wipe' }, FF.layers.top);
      const p = FF.el('path', { fill: '#ffcf3a', 'fill-rule': 'evenodd', stroke: '#ffffff', 'stroke-width': 10 }, g);
      const ring = FF.el('path', { fill: 'none', stroke: '#ff4d6d', 'stroke-width': 18 }, g);
      const set = r => {
        const c = `M640 ${360 - r} a${r} ${r} 0 1 0 0.01 0 Z`;
        p.setAttribute('d', `M-40 -40 H1320 V760 H-40 Z ${r > 1 ? c : ''}`);
        ring.setAttribute('d', r > 1 ? `M640 ${360 - r - 14} a${r + 14} ${r + 14} 0 1 0 0.01 0 Z` : '');
      };
      set(760);
      FF.audio.sfx('whoosh');
      FF.tween(0.38, k => set(760 * (1 - k)), FF.ease.in).then(() => {
        try { middle && middle(); } catch (e) { console.error(e); }
        setTimeout(() => {
          FF.tween(0.45, k => set(760 * k), FF.ease.out).then(() => { g.remove(); resolve(); });
        }, 160);
      });
    });
  };

  /* ================= surprise: Grumble sneezes bubbles (pop them!) ================= */
  ui.bubbleSurprise = function (scene) {
    const F3 = FF.three;
    const L = FF.el('g', {}, FF.layers.fx);
    const gr = F3.chars.make('grumble');
    gr.setBase('float');
    gr.root.scale.setScalar(150);
    F3.hud.add(gr.root);
    const up = dt => gr.update(dt);
    F3.hudUpdaters.add(up);
    const cleanup = () => { L.remove(); F3.hud.remove(gr.root); F3.hudUpdaters.delete(up); };
    scene.onCleanup(cleanup);
    const at = (x, y) => gr.root.position.set(x, -y, 300);
    at(1400, 170);
    scene.tween(1.0, k => at(FF.lerp(1400, 1110, k), 170), FF.ease.out).then(() => {
      if (!scene.alive) return;
      gr.setFace('sneeze');
      FF.audio.sfx('sneeze');
      scene.after(520, () => {
        gr.setFace('giggle');
        const bubbles = [];
        for (let i = 0; i < 9; i++) {
          const r = FF.rand(22, 36);
          const b = FF.el('g', {}, L);
          b.innerHTML = `<circle r="${r}" fill="#bfe9ff" fill-opacity=".35" stroke="#ffffff" stroke-width="3.5"/><circle r="${r}" fill="none" stroke="#7fd0ff" stroke-width="1.5"/><ellipse cx="${-r * 0.35}" cy="${-r * 0.4}" rx="${r * 0.3}" ry="${r * 0.18}" fill="#ffffff" opacity=".9"/>`;
          const bb = { g: b, x: 1060 + FF.rand(-20, 20), y: 180 + FF.rand(-20, 30), vx: FF.rand(-190, -90), vy: FF.rand(-30, 40), ph: FF.rand(0, 6), alive: true };
          FF.onTap(b, () => {
            if (!bb.alive) return; bb.alive = false; FF.audio.sfx('bubble');
            b.innerHTML = `<path d="M-12 0 L-26 0 M12 0 L26 0 M0 -12 L0 -26 M0 12 L0 26 M-9 -9 L-18 -18 M9 9 L18 18 M9 -9 L18 -18 M-9 9 L-18 18" stroke="#7fd0ff" stroke-width="5" stroke-linecap="round"/>`;
            scene.after(200, () => b.remove());
          }, scene);
          bubbles.push(bb);
        }
        FF.say('bubbles', {}, { hold: 800 });
        const stop = scene.tick(dt => {
          let any = false;
          bubbles.forEach(b => {
            if (!b.alive) return;
            b.x += b.vx * dt; b.ph += dt * 2; b.y += (b.vy + Math.sin(b.ph) * 40) * dt;
            if (b.x < -60) { b.alive = false; b.g.remove(); return; }
            any = true;
            b.g.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`);
          });
          if (!any) stop();
        });
        scene.after(1600, () => {
          gr.setFace('sulk');
          scene.tween(1.0, k => at(FF.lerp(1110, 1420, k), 170 - k * 40), FF.ease.in).then(() => { F3.hud.remove(gr.root); F3.hudUpdaters.delete(up); });
        });
      });
    });
  };
})(window.FF);
