/* Flag Festival — tiny engine: SVG helpers, ticker, tweens, scenes, drag, hints, noise */
window.FF = window.FF || {};
(function (FF) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  FF.NS = NS;
  FF.W = 1280; FF.H = 720;
  /* Wide screens (phones are often 19.5:9 or 20:9): the game area stays 1280×720 in the
     middle, and the picture is stretched out sideways to fill the whole screen.
     FF.VW = full visible width in stage units, FF.OX = extra width on each side.        */
  FF.VW = 1280; FF.OX = 0;
  FF.onLayout = new Set();
  FF.layout = function () {
    const iw = window.innerWidth, ih = window.innerHeight;
    const a = iw / Math.max(1, ih);
    FF.VW = Math.max(1280, Math.round(720 * a));
    FF.OX = (FF.VW - 1280) / 2;
    if (FF.svg) {
      FF.svg.setAttribute('viewBox', `${(-FF.OX).toFixed(2)} 0 ${FF.VW} 720`);
      FF.svg.style.width = iw + 'px'; FF.svg.style.height = ih + 'px';
    }
    FF.onLayout.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  };
  FF.INK = '#3B2A20';
  FF.C = FF_CONTENT;

  /* ---------- DOM helpers ---------- */
  FF.el = function (tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  FF.g = function (markup, attrs, parent) {
    const e = FF.el('g', attrs, parent);
    if (markup) e.innerHTML = markup;
    return e;
  };
  FF.place = function (node, x, y, s, r) {
    s = s === undefined ? 1 : s; r = r || 0;
    node.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})` + (r ? ` rotate(${r.toFixed(2)})` : '') + (s !== 1 ? ` scale(${(+s).toFixed(4)})` : ''));
  };
  FF.fmt = function (str, ctx) {
    return String(str).replace(/\{(\w+)\}/g, (m, k) => (ctx && ctx[k] !== undefined ? ctx[k] : m));
  };
  FF.esc = function (s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); };
  let uidN = 0;
  FF.uid = function (p) { return (p || 'u') + (++uidN); };

  /* ---------- random + noise ---------- */
  FF.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  FF.rand = (a, b) => a + Math.random() * (b - a);
  FF.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  FF.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  function hash2(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  FF.noise2 = function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };

  /* Densify a polygon and nudge every point by smooth noise of its POSITION:
     shared borders get the same wobble, so pieces fit their holes exactly. */
  FF.jitterPoly = function (pts, o) {
    o = o || {};
    const step = o.step || 7, amp = o.amp === undefined ? 1.8 : o.amp, f = o.freq || 0.06, seed = o.seed || 0;
    const closed = o.closed !== false;
    const out = [];
    const n = pts.length;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const k = Math.max(1, Math.ceil(len / step));
      for (let j = 0; j < k; j++) {
        const t = j / k;
        const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        const jx = (FF.noise2(x * f + seed, y * f) - 0.5) * 2 * amp;
        const jy = (FF.noise2(x * f, y * f + seed + 71.3) - 0.5) * 2 * amp;
        out.push([x + jx, y + jy]);
      }
    }
    if (!closed) {
      const z = pts[n - 1];
      out.push([z[0] + (FF.noise2(z[0] * f + seed, z[1] * f) - 0.5) * 2 * amp, z[1] + (FF.noise2(z[0] * f, z[1] * f + seed + 71.3) - 0.5) * 2 * amp]);
    }
    return out;
  };
  FF.pathD = function (pts, closed) {
    let d = '';
    for (let i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
    return d + (closed === false ? '' : 'Z');
  };
  /* Hand-drawn rectangle / circle outlines */
  FF.wobRect = function (x, y, w, h, amp, seed) {
    return FF.pathD(FF.jitterPoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { amp: amp === undefined ? 2 : amp, step: 9, freq: 0.045, seed: seed || 3 }));
  };
  FF.wobRoundRect = function (x, y, w, h, r, amp, seed) {
    const pts = [];
    const seg = 5;
    const corners = [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]];
    corners.forEach(c => { for (let i = 0; i <= seg; i++) { const a = (c[2] + i * 90 / seg) * Math.PI / 180; pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); } });
    return FF.pathD(FF.jitterPoly(pts, { amp: amp === undefined ? 2 : amp, step: 9, freq: 0.05, seed: seed || 5 }));
  };
  FF.wobCircle = function (cx, cy, r, amp, seed) {
    const pts = [];
    const n = Math.max(14, Math.round(r * 0.6));
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return FF.pathD(FF.jitterPoly(pts, { amp: amp === undefined ? 1.6 : amp, step: 6, freq: 0.07, seed: seed || 9 }));
  };
  /* smooth closed blob through points (Catmull-Rom → Bézier) */
  FF.smoothD = function (pts, closed) {
    closed = closed !== false;
    const n = pts.length;
    if (n < 3) return FF.pathD(pts, closed);
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    const cnt = closed ? n : n - 1;
    for (let i = 0; i < cnt; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const q0 = closed || i > 0 ? p0 : p1, q3 = closed || i < n - 2 ? p3 : p2;
      const c1 = [p1[0] + (p2[0] - q0[0]) / 6, p1[1] + (p2[1] - q0[1]) / 6];
      const c2 = [p2[0] - (q3[0] - p1[0]) / 6, p2[1] - (q3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + (closed ? 'Z' : '');
  };
  FF.blobD = function (cx, cy, rx, ry, seed, wob) {
    const r = FF.rng(seed || 1); const pts = []; const n = 9; wob = wob === undefined ? 0.18 : wob;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const k = 1 + (r() - 0.5) * 2 * wob; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return FF.smoothD(pts, true);
  };

  /* ---------- easing ---------- */
  FF.ease = {
    linear: t => t,
    inOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    out: t => 1 - Math.pow(1 - t, 3),
    in: t => t * t * t,
    back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    backBig: t => { const c1 = 2.6, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    elastic: t => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
    bounce: t => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  };
  FF.lerp = (a, b, t) => a + (b - a) * t;
  FF.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- ticker ---------- */
  const ticks = new Set();
  let lastT = performance.now();
  FF.now = 0;
  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t; FF.now = t / 1000;
    ticks.forEach(fn => { try { fn(dt, FF.now); } catch (e) { console.error(e); ticks.delete(fn); } });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  FF.addTick = fn => { ticks.add(fn); return () => ticks.delete(fn); };

  /* Global (scene-independent) tween */
  FF.tween = function (dur, fn, ease, owner) {
    ease = ease || FF.ease.out;
    return new Promise(resolve => {
      let t = 0;
      const stop = FF.addTick(dt => {
        if (owner && !owner.alive) { stop(); return; }
        t += dt;
        const k = Math.min(1, t / dur);
        fn(ease(k), k);
        if (k >= 1) { stop(); resolve(); }
      });
      if (owner) owner._stops.push(stop);
    });
  };

  /* ---------- Scene base ---------- */
  class Scene {
    constructor(args) {
      this.args = args || {};
      this.alive = true;
      this._stops = [];
      this._timers = [];
      this._cleanup = [];
      this.root = FF.el('g', { class: 'scene' });
    }
    tick(fn) { const s = FF.addTick((dt, t) => { if (this.alive) fn(dt, t); }); this._stops.push(s); return s; }
    after(ms, fn) { const id = setTimeout(() => { if (this.alive) fn(); }, ms); this._timers.push(id); return id; }
    every(ms, fn) { const id = setInterval(() => { if (this.alive) fn(); }, ms); this._timers.push(id); return id; }
    wait(ms) { return new Promise(res => this.after(ms, res)); }
    tween(dur, fn, ease) { return FF.tween(dur, fn, ease, this); }
    onCleanup(fn) { this._cleanup.push(fn); }
    listen(target, type, fn, opts) { target.addEventListener(type, fn, opts); this.onCleanup(() => target.removeEventListener(type, fn, opts)); }
    destroy() {
      this.alive = false;
      this._stops.forEach(s => s());
      this._timers.forEach(id => { clearTimeout(id); clearInterval(id); });
      this._cleanup.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
      if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
      FF.drag.cancelAll();
    }
  }
  FF.Scene = Scene;

  /* ---------- stage + layers ---------- */
  FF.initStage = function () {
    const svg = document.getElementById('stage');
    FF.svg = svg;
    FF.defs = FF.el('defs', {}, svg);
    FF.layers = {
      bg: FF.el('g', { id: 'L-bg' }, svg),
      scene: FF.el('g', { id: 'L-scene' }, svg),
      ui: FF.el('g', { id: 'L-ui' }, svg),
      pip: FF.el('g', { id: 'L-pip' }, svg),
      fx: FF.el('g', { id: 'L-fx' }, svg),
      top: FF.el('g', { id: 'L-top' }, svg)
    };
    svg.addEventListener('contextmenu', e => e.preventDefault());
    FF.layout();
    window.addEventListener('resize', () => FF.layout());
    window.addEventListener('orientationchange', () => setTimeout(() => FF.layout(), 250));
    document.addEventListener('fullscreenchange', () => FF.layout());
    document.addEventListener('webkitfullscreenchange', () => FF.layout());
  };

  FF.toLocal = function (evt, node) {
    const pt = FF.svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const m = (node || FF.svg).getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  FF.current = null;
  FF.show = function (scene) {
    if (FF.current) FF.current.destroy();
    FF.current = scene;
    FF.layers.scene.appendChild(scene.root);
    if (scene.start) scene.start();
    return scene;
  };

  /* ---------- tap helper (fast, one finger) ---------- */
  FF.onTap = function (node, fn, owner) {
    node.classList.add('tappable');
    const h = e => {
      if (FF.drag.active && FF.drag.active.node !== node) return;
      e.stopPropagation();
      fn(e);
    };
    node.addEventListener('pointerdown', h);
    if (owner) owner.onCleanup(() => node.removeEventListener('pointerdown', h));
    return h;
  };

  /* ---------- drag manager: pointer events, one finger at a time ---------- */
  FF.drag = {
    active: null,
    make(node, h) {
      node.classList.add('draggable');
      const down = e => {
        if (FF.drag.active) return;
        if (h.enabled && !h.enabled()) return;
        e.preventDefault(); e.stopPropagation();
        const p = FF.toLocal(e);
        const st = { node, id: e.pointerId, sx: p.x, sy: p.y, x: p.x, y: p.y, moved: false, t0: performance.now(), h };
        FF.drag.active = st;
        node.classList.add('dragging');
        if (h.start) h.start(p, st);
        const move = ev => {
          if (ev.pointerId !== st.id) return;
          ev.preventDefault();
          const q = FF.toLocal(ev);
          st.x = q.x; st.y = q.y;
          if (Math.hypot(q.x - st.sx, q.y - st.sy) > 8) st.moved = true;
          if (h.move) h.move(q, st);
        };
        const up = ev => {
          if (ev.pointerId !== st.id) return;
          finish(ev.type === 'pointercancel');
        };
        const finish = (cancelled, silent) => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          node.classList.remove('dragging');
          if (FF.drag.active === st) FF.drag.active = null;
          st.cancel = null;
          if (h.end && !silent) h.end({ x: st.x, y: st.y }, st, cancelled);
        };
        st.cancel = () => finish(true, true);
        window.addEventListener('pointermove', move, { passive: false });
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      };
      node.addEventListener('pointerdown', down);
      return () => node.removeEventListener('pointerdown', down);
    },
    cancelAll() { if (FF.drag.active && FF.drag.active.cancel) FF.drag.active.cancel(); FF.drag.active = null; }
  };

  /* ---------- stepped hints (GDD §9: point → glow → show) ---------- */
  class Hints {
    constructor(scene, o) {
      this.scene = scene; this.o = o; this.timers = []; this.level = 0; this.stopped = false;
      this.reset();
    }
    reset() {
      this.clear();
      if (this.stopped) return;
      const o = this.o;
      const t1 = o.first || 12000, t2 = o.second || 21000, t3 = o.third || 30000;
      this.timers.push(this.scene.after(t1, () => { this.level = 1; o.point && o.point(); }));
      this.timers.push(this.scene.after(t2, () => { this.level = 2; o.glow && o.glow(); }));
      this.timers.push(this.scene.after(t3, () => { this.level = 3; o.show && o.show(); }));
      this.timers.push(this.scene.after(t3 + 14000, () => { this.level = 3; o.show && o.show(); }));
    }
    clear() {
      this.timers.forEach(clearTimeout); this.timers = [];
      if (this.level && this.o.clear) this.o.clear();
      this.level = 0;
    }
    stop() { this.stopped = true; this.clear(); }
  }
  FF.Hints = Hints;

  /* ---------- canvas-made textures (paper grain, watercolour blotch) ---------- */
  FF.makeTexture = function (kind, size) {
    size = size || 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const cx = cv.getContext('2d');
    const img = cx.createImageData(size, size);
    const d = img.data;
    const r = FF.rng(kind === 'grain' ? 7 : 19);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        let v;
        if (kind === 'grain') {
          // fine paper grain + a few fibres (tileable via wrapped noise)
          const n = r();
          const fib = FF.noise2((x % size) * 0.35, (y % size) * 0.06) * 0.5;
          v = n * 0.7 + fib * 0.6;
          d[i] = 90; d[i + 1] = 62; d[i + 2] = 40;
          d[i + 3] = Math.max(0, (v - 0.55)) * 70;
        } else {
          // watercolour blotches: low-frequency tileable noise
          const s = size;
          const f = (a, b, sc) => {
            const u = x / s, w = y / s;
            // tile by blending 4 shifted samples
            const n1 = FF.noise2(u * sc + a, w * sc + b);
            const n2 = FF.noise2((u - 1) * sc + a, w * sc + b);
            const n3 = FF.noise2(u * sc + a, (w - 1) * sc + b);
            const n4 = FF.noise2((u - 1) * sc + a, (w - 1) * sc + b);
            return n1 * (1 - u) * (1 - w) + n2 * u * (1 - w) + n3 * (1 - u) * w + n4 * u * w;
          };
          v = f(3, 7, 4) * 0.55 + f(11, 2, 9) * 0.3 + f(5, 5, 22) * 0.15;
          d[i] = 120; d[i + 1] = 80; d[i + 2] = 50;
          d[i + 3] = Math.max(0, v - 0.38) * 150;
        }
      }
    }
    cx.putImageData(img, 0, 0);
    return cv.toDataURL('image/png');
  };
})(window.FF);
