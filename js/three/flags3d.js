/* Flag Festival 3D — flags: true colours and proportions painted onto canvas, shown on
   cloth that really waves; 3D shapes for jigsaw pieces and Build-a-Flag felt parts.    */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;
  const FL = F3.flags = {};
  const data = id => FF.C.flags[id];

  /* ---------- 2D drawing of a flag (flag units) ---------- */
  const EAGLE = [
    'M-6 -16 C -16 -26, -30 -28, -36 -22 C -34 -14, -32 -6, -29 2 C -25 9, -16 13, -9 12 Z',
    'M6 -16 C 16 -26, 30 -28, 36 -22 C 34 -14, 32 -6, 29 2 C 25 9, 16 13, 9 12 Z',
    'M-9 -18 L9 -18 L10 10 L0 19 L-10 10 Z',
    'M-8 -26 L-14 -23.5 L-8 -21 Z',
    'M-8 18 L8 18 L12 27 L-12 27 Z',
    'M-19 27 L19 27 L19 34 L-19 34 Z'
  ].map(d => new Path2D(d));
  const EAGLE_LINES = new Path2D('M-5 -12 V8 M0 -12 V12 M5 -12 V8 M-28 -16 L-14 -4 M-30 -8 L-16 2 M28 -16 L14 -4 M30 -8 L16 2');
  function drawEagle(ctx, sh, fill, line) {
    ctx.save();
    ctx.translate(sh.cx, sh.cy); ctx.scale(sh.s, sh.s);
    ctx.fillStyle = fill; ctx.strokeStyle = line; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    EAGLE.forEach(p => { ctx.fill(p); ctx.stroke(p); });
    ctx.beginPath(); ctx.arc(-2, -24, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1.3; ctx.stroke(EAGLE_LINES);
    ctx.restore();
  }
  const EMB = {};   // emblem Path2Ds, made once
  function emblemPaths(kind) {
    if (!EMB[kind]) { const E = FF.flags.EMBLEMS[kind]; EMB[kind] = { E, paths: E.paths.map(d => new Path2D(d)), lines: new Path2D(E.lines) }; }
    return EMB[kind];
  }
  function drawEmblem(ctx, sh, fill, line) {
    const P = emblemPaths(sh.kind);
    ctx.save();
    ctx.translate(sh.cx, sh.cy); ctx.scale(sh.s, sh.s);
    ctx.fillStyle = fill; ctx.strokeStyle = line; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    P.paths.forEach(p => { ctx.fill(p); ctx.stroke(p); });
    P.E.dots.forEach(c => { ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    ctx.lineWidth = 1.4; ctx.stroke(P.lines);
    ctx.restore();
  }
  FL.isPic = sh => sh.t === 'eagle' || sh.t === 'emblem' || sh.t === 'picture';     // drawn as one sticker picture
  /* a picture part in its own colours, or tinted with another colour (grey before painting,
     or the colour a child painted it) — the artwork's lines stay visible */
  const tints = {};
  function drawPicture(ctx, part, fill) {
    const sh = part.shape, im = FF.flags.pic(sh.src);
    if (!(im.complete && im.naturalWidth)) return;
    if (!fill || fill.toUpperCase() === part.hex.toUpperCase()) { ctx.drawImage(im, sh.x, sh.y, sh.w, sh.h); return; }
    const k = sh.src + fill;
    if (!tints[k]) {
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const x = c.getContext('2d');
      x.drawImage(im, 0, 0);
      x.globalCompositeOperation = 'source-in'; x.fillStyle = fill; x.fillRect(0, 0, c.width, c.height);
      x.globalCompositeOperation = 'multiply'; x.drawImage(im, 0, 0);
      x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0);
      tints[k] = c;
    }
    ctx.drawImage(tints[k], sh.x, sh.y, sh.w, sh.h);
  }
  FL.outlinePath = fd => fd.outline ? new Path2D(FF.flags.outlineD(fd)) : null;
  FL.path = function (sh) { // Path2D in flag units (hit tests + clipping)
    const p = new Path2D();
    switch (sh.t) {
      case 'rect': p.rect(sh.x, sh.y, sh.w, sh.h); return p;
      case 'poly': sh.pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); return p;
      case 'circle': case 'wheel': p.arc(sh.cx, sh.cy, sh.r, 0, Math.PI * 2); return p;
      case 'star': return new Path2D(FF.flags.starD(sh.cx, sh.cy, sh.R, sh.rot, sh.n));
      case 'crescent': return new Path2D(FF.flags.crescentD(sh.cx, sh.cy, sh.R, sh.d, sh.r, sh.rot));
      case 'eagle': p.rect(sh.cx - 36 * sh.s, sh.cy - 31 * sh.s, 72 * sh.s, 66 * sh.s); return p;
      case 'picture': (sh.hit || [[[sh.x, sh.y], [sh.x + sh.w, sh.y], [sh.x + sh.w, sh.y + sh.h], [sh.x, sh.y + sh.h]]]).forEach(poly => { poly.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); }); return p;
      case 'emblem': {                // the real drawing, so the flag around it can still be tapped
        const P = emblemPaths(sh.kind);
        const m = new DOMMatrix().translate(sh.cx, sh.cy).scale(sh.s, sh.s);
        P.paths.forEach(q => p.addPath(q, m));
        P.E.dots.forEach(c => { const d = new Path2D(); d.arc(c[0], c[1], c[2], 0, Math.PI * 2); p.addPath(d, m); });
        return p;
      }
    }
    return p;
  };
  FL.drawPart = function (ctx, part, fill, o) {
    o = o || {};
    const sh = part.shape;
    if (sh.t === 'eagle') { drawEagle(ctx, sh, fill, o.line || (fill === '#C09300' ? '#7A5E00' : 'rgba(0,0,0,.35)')); return; }
    if (sh.t === 'emblem') { drawEmblem(ctx, sh, fill, o.line || 'rgba(0,0,0,.35)'); return; }
    if (sh.t === 'picture') { drawPicture(ctx, part, fill); return; }
    if (sh.t === 'wheel') {
      ctx.save(); ctx.strokeStyle = fill; ctx.lineWidth = sh.r * 0.12;
      ctx.beginPath(); ctx.arc(sh.cx, sh.cy, sh.r, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = sh.r * 0.05; ctx.beginPath();
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; ctx.moveTo(sh.cx, sh.cy); ctx.lineTo(sh.cx + Math.cos(a) * sh.r * 0.92, sh.cy + Math.sin(a) * sh.r * 0.92); }
      ctx.stroke(); ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(sh.cx, sh.cy, sh.r * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      return;
    }
    ctx.fillStyle = fill;
    ctx.fill(FL.path(sh));
  };
  /* soft cloth finish: weave, sheen bands and a stitched hem */
  FL.clothFinish = function (ctx, w, h, strength) {
    const k = strength === undefined ? 1 : strength;
    ctx.save();
    ctx.globalAlpha = 0.05 * k; ctx.strokeStyle = '#000'; ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let x = 0; x < w; x += 3) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y < h; y += 3) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    ctx.globalAlpha = 0.5 * k;
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.setLineDash([]);
    ctx.restore();
  };
  FL.draw = function (ctx, id, mode) {
    const fd = data(id);
    const op = FL.outlinePath(fd);
    if (op) { ctx.save(); ctx.clip(op); }       // Nepal: only inside the flag's own shape
    if (mode === 'grey') {
      const greys = ['#a9a4b4', '#c4bfcd', '#8f8a9c', '#b6b1c0', '#9d98aa'];
      fd.parts.forEach((p, i) => FL.drawPart(ctx, p, greys[i % greys.length], { line: 'rgba(0,0,0,.25)' }));
      ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#6f6a80'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 60; i++) { const x = (i * 37) % fd.w, y = (i * 53) % fd.h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 9); ctx.stroke(); }
      ctx.restore();
    } else fd.parts.forEach(p => FL.drawPart(ctx, p, p.hex));
    FL.clothFinish(ctx, fd.w, fd.h);
    if (op) { ctx.restore(); ctx.save(); ctx.strokeStyle = '#3B2A20'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke(op); ctx.restore(); }
  };
  /* canvas sized for a flag; ctx already scaled to flag units */
  FL.canvas = function (id, px) {
    const fd = data(id);
    const W = px || 1024, H = Math.round(W * fd.h / fd.w);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.scale(W / fd.w, H / fd.h);
    return { c, ctx, W, H };
  };
  const cache = {};
  FL.tex = function (id, mode) {
    mode = mode || 'full';
    const k = id + ':' + mode;
    if (!cache[k]) {
      const { c, ctx } = FL.canvas(id, 1024);
      FL.draw(ctx, id, mode);
      const t = new T.CanvasTexture(c);
      t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
      cache[k] = t;
    }
    return cache[k];
  };

  /* ---------- a cloth flag that waves ---------- */
  class Flag3D {
    constructor(id, height, o) {
      o = o || {};
      const fd = data(id);
      this.id = id;
      this.H = height; this.W = height * fd.w / fd.h;
      if (o.maxW && this.W > o.maxW) { this.W = o.maxW; this.H = this.W * fd.h / fd.w; }
      this.group = new T.Group();
      this.strength = o.still ? 0 : 1;
      this.amp = o.amp || 0.07;
      this.speed = o.speed || 4;
      this.t = Math.random() * 10;
      const segX = o.segX || 28, segY = o.segY || 10;
      const geo = new T.PlaneGeometry(this.W, this.H, segX, segY);
      geo.translate(this.W / 2, -this.H / 2, 0);
      this.base = geo.attributes.position.array.slice();
      this.mat = F3.ownMat(new T.MeshStandardMaterial({ map: o.tex || FL.tex(id, o.mode), side: T.DoubleSide, roughness: 0.7, metalness: 0, envMapIntensity: 0.35, alphaTest: 0.5 }));   // alphaTest: Nepal's shape
      this.mat.map.userData.keep = true;
      this.cloth = new T.Mesh(geo, this.mat);
      this.cloth.castShadow = true;
      this.cloth.receiveShadow = true;
      this.cloth.userData.flag = this;
      const pr = o.poleR || Math.max(0.035, this.H * 0.035);
      if (o.pole !== false) {
        const len = o.poleLen || this.H * 2.2;
        this.poleLen = len;
        const pole = F3.Cy(this.group, pr, len, F3.toy('#c98a4b', { rough: 0.35 }), 0, len / 2, 0);
        pole.castShadow = true;
        F3.S(this.group, pr * 1.9, F3.toy('#ffcf3a', { rough: 0.15 }), 0, len + pr * 1.2, 0);
        this.cloth.position.set(pr, len - pr * 1.5, 0);
      }
      this.group.add(this.cloth);
      this.update(0);
    }
    setTex(t) { this.mat.map = t; this.mat.needsUpdate = true; }
    setMode(mode) { this.setTex(FL.tex(this.id, mode)); }
    update(dt) {
      this.t += dt * this.speed;
      const pos = this.cloth.geometry.attributes.position;
      const a = pos.array, b = this.base;
      const amp = this.amp * this.H * 1.4 * this.strength;
      for (let i = 0; i < a.length; i += 3) {
        const u = b[i] / this.W;
        const ph = u * 9 - this.t + b[i + 1] * 0.8;
        a[i + 2] = Math.sin(ph) * amp * (0.15 + u);
        a[i + 1] = b[i + 1] + Math.cos(ph) * amp * 0.12 * u;
        a[i] = b[i] - Math.abs(Math.sin(ph)) * amp * 0.1 * u;
      }
      pos.needsUpdate = true;
      this.cloth.geometry.computeVertexNormals();
    }
  }
  FL.Flag3D = Flag3D;
  /* add a flag to a world, updated every frame */
  FL.add = function (w, parent, id, height, o) {
    const f = new Flag3D(id, height, o);
    (parent || w.scene).add(f.group);
    w.onUpdate(dt => f.update(dt));
    return f;
  };

  /* ---------- shapes: flag-unit outlines as THREE.Shape (y up) ---------- */
  function ptsOf(sh) {
    const P = [];
    switch (sh.t) {
      case 'rect': return [[sh.x, sh.y], [sh.x + sh.w, sh.y], [sh.x + sh.w, sh.y + sh.h], [sh.x, sh.y + sh.h]];
      case 'poly': return sh.pts.map(p => [p[0], p[1]]);
      case 'circle': case 'wheel': for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; P.push([sh.cx + Math.cos(a) * sh.r, sh.cy + Math.sin(a) * sh.r]); } return P;
      case 'star': {
        const n = sh.n || 5, rot = sh.rot === undefined ? -90 : sh.rot, r = sh.R * (n === 5 ? 0.382 : 0.5);
        for (let i = 0; i < n * 2; i++) { const a = (rot + i * 180 / n) * Math.PI / 180; const rr = i % 2 ? r : sh.R; P.push([sh.cx + Math.cos(a) * rr, sh.cy + Math.sin(a) * rr]); }
        return P;
      }
      case 'crescent': {
        const a0 = (sh.rot || 0) * Math.PI / 180;
        const ix = (sh.d * sh.d + sh.R * sh.R - sh.r * sh.r) / (2 * sh.d);
        const iy = Math.sqrt(Math.max(0, sh.R * sh.R - ix * ix));
        const outA = Math.atan2(-iy, ix), outB = Math.atan2(iy, ix);   // outer arc goes the long way round (left)
        const inA = Math.atan2(iy, ix - sh.d), inB = Math.atan2(-iy, ix - sh.d);
        const N = 40;
        const local = [];
        let s = outA, e = outB; if (e > s) e -= Math.PI * 2;      // counter-clockwise (through the left)
        for (let i = 0; i <= N; i++) { const a = s + (e - s) * i / N; local.push([Math.cos(a) * sh.R, Math.sin(a) * sh.R]); }
        let s2 = inA, e2 = inB; if (e2 < s2) e2 += Math.PI * 2;
        for (let i = 1; i < N; i++) { const a = s2 + (e2 - s2) * i / N; local.push([sh.d + Math.cos(a) * sh.r, Math.sin(a) * sh.r]); }
        return local.map(p => [sh.cx + p[0] * Math.cos(a0) - p[1] * Math.sin(a0), sh.cy + p[0] * Math.sin(a0) + p[1] * Math.cos(a0)]);
      }
    }
    return P;
  }
  FL.shape = function (sh, fh) {
    const pts = ptsOf(sh);
    return new T.Shape(pts.map(p => new T.Vector2(p[0], fh - p[1])));
  };
  FL.box = sh => FF.flags.shapeBox(sh);

  /* A felt part for Build a Flag: glossy extruded shape, centred on its own box.
     Returns a group in FLAG UNITS (scale it to the cloth). */
  FL.partMesh = function (fd, part) {
    const g = new T.Group();
    const b = FL.box(part.shape);
    const cx = b.x + b.w / 2, cy = fd.h - (b.y + b.h / 2);
    if (part.shape.t === 'eagle') {
      const S = 256;
      const tex = F3.canvasTex(S, S, (ctx) => {
        ctx.translate(S / 2, S / 2); ctx.scale(S / 80, S / 80); ctx.translate(-part.shape.cx, -part.shape.cy + 1.5);
        FL.drawPart(ctx, Object.assign({}, part, { shape: Object.assign({}, part.shape, { s: 1 }) }), part.hex);
      });
      const m = new T.Mesh(new T.PlaneGeometry(80 * part.shape.s, 80 * part.shape.s), F3.ownMat(new T.MeshPhysicalMaterial({ map: tex, transparent: true, alphaTest: 0.3, roughness: 0.2, metalness: 0.5, clearcoat: 1, side: T.DoubleSide })));
      m.position.z = 2; m.castShadow = true;
      g.add(m);
    } else if (part.shape.t === 'wheel') {            // India's wheel: the real wheel with spokes, as a sticker
      const sh = part.shape, S = 256;
      const tex = F3.canvasTex(S, S, (ctx) => { ctx.scale(S / (sh.r * 2.2), S / (sh.r * 2.2)); ctx.translate(sh.r * 1.1 - sh.cx, sh.r * 1.1 - sh.cy); FL.drawPart(ctx, part, part.hex); });
      const m = new T.Mesh(new T.PlaneGeometry(sh.r * 2.2, sh.r * 2.2), F3.ownMat(new T.MeshPhysicalMaterial({ map: tex, transparent: true, alphaTest: 0.3, roughness: 0.3, clearcoat: 1, side: T.DoubleSide })));
      m.position.z = 2; m.castShadow = true;
      g.add(m);
    } else if (part.shape.t === 'picture') {          // real artwork (Bhutan's dragon): a glossy sticker
      const sh = part.shape, SW = 512, SH = Math.round(SW * sh.h / sh.w);
      const tex = F3.canvasTex(SW, SH, (ctx) => { ctx.scale(SW / sh.w, SH / sh.h); ctx.translate(-sh.x, -sh.y); FL.drawPart(ctx, part, part.hex); });
      const m = new T.Mesh(new T.PlaneGeometry(sh.w, sh.h), F3.ownMat(new T.MeshPhysicalMaterial({ map: tex, transparent: true, alphaTest: 0.3, roughness: 0.3, metalness: 0.05, clearcoat: 1, side: T.DoubleSide })));
      m.position.z = 2; m.castShadow = true;
      g.add(m);
    } else if (part.shape.t === 'emblem') {           // Afghanistan's emblem: a glossy sticker
      const E = FF.flags.EMBLEMS[part.shape.kind];
      const SW = 384, SH = Math.round(SW * E.h / E.w);
      const tex = F3.canvasTex(SW, SH, (ctx) => {
        ctx.translate(SW / 2, SH / 2); ctx.scale(SW / (E.w + 4), SW / (E.w + 4));
        FL.drawPart(ctx, Object.assign({}, part, { shape: Object.assign({}, part.shape, { cx: 0, cy: 0, s: 1 }) }), part.hex);
      });
      const m = new T.Mesh(new T.PlaneGeometry((E.w + 4) * part.shape.s, (E.w + 4) * part.shape.s * SH / SW), F3.ownMat(new T.MeshPhysicalMaterial({ map: tex, transparent: true, alphaTest: 0.3, roughness: 0.25, metalness: 0.1, clearcoat: 1, side: T.DoubleSide })));
      m.position.z = 2; m.castShadow = true;
      g.add(m);
    } else {
      const shape = FL.shape(part.shape, fd.h);
      const geo = new T.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.0, bevelSegments: 2, curveSegments: 24 });
      geo.translate(-cx, -cy, 0);
      const light = part.hex.toUpperCase() === '#FFFFFF';
      const m = new T.Mesh(geo, F3.toy(light ? '#fbfbf6' : part.hex, { rough: 0.35 }));
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
    }
    g.userData.center = { x: cx, y: cy };
    return g;
  };

  /* Jigsaw pieces: a grid cut with real tabs, never along the stripes */
  FL.cutGrid = function (fd, cols, rows, seed) {
    const r = FF.rng(seed);
    const w = fd.w, h = fd.h, cw = w / cols, ch = h / rows, t = 0.22 * Math.min(cw, ch);
    const sV = [], sH = [];
    for (let i = 0; i < cols; i++) { sV[i] = []; sH[i] = []; for (let j = 0; j < rows; j++) { sV[i][j] = r() < 0.5 ? 1 : -1; sH[i][j] = r() < 0.5 ? 1 : -1; } }
    const Y = y => h - y; // flip to y-up
    const edge = (s, ax, ay, bx, by, vx, vy) => {
      if (!vx && !vy) { s.lineTo(bx, Y(by)); return; }
      const P = (u, v) => [ax + (bx - ax) * u + vx * v, Y(ay + (by - ay) * u + vy * v)];
      const L = (u, v) => { const p = P(u, v); s.lineTo(p[0], p[1]); };
      const C = (a, b2, c) => { const p1 = P(a[0], a[1]), p2 = P(b2[0], b2[1]), p3 = P(c[0], c[1]); s.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]); };
      L(0.36, 0);
      C([0.40, 0], [0.40, 0.3], [0.36, 0.55]);
      C([0.30, 0.95], [0.42, 1], [0.5, 1]);
      C([0.58, 1], [0.70, 0.95], [0.64, 0.55]);
      C([0.60, 0.3], [0.60, 0], [0.64, 0]);
      s.lineTo(bx, Y(by));
    };
    const pieces = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x0 = i * cw, y0 = j * ch, x1 = x0 + cw, y1 = y0 + ch;
      const s = new T.Shape();
      s.moveTo(x0, Y(y0));
      edge(s, x0, y0, x1, y0, 0, j > 0 ? sH[i][j - 1] * t : 0);
      edge(s, x1, y0, x1, y1, i < cols - 1 ? sV[i][j] * t : 0, 0);
      edge(s, x1, y1, x0, y1, 0, j < rows - 1 ? sH[i][j] * t : 0);
      edge(s, x0, y1, x0, y0, i > 0 ? sV[i - 1][j] * t : 0, 0);
      pieces.push({ i, j, shape: s, cx: x0 + cw / 2, cy: h - (y0 + ch / 2), pw: cw + 2 * t, ph: ch + 2 * t });
    }
    return pieces;
  };
  /* one jigsaw piece mesh in FLAG UNITS, centred on its cell; front shows flag `texId` */
  FL.pieceMesh = function (fd, pc, texId) {
    const fw = fd.w, fh = fd.h;
    const uv = {
      generateTopUV(geo, v, a, b, c) { return [new T.Vector2(v[a * 3] / fw, v[a * 3 + 1] / fh), new T.Vector2(v[b * 3] / fw, v[b * 3 + 1] / fh), new T.Vector2(v[c * 3] / fw, v[c * 3 + 1] / fh)]; },
      generateSideWallUV() { return [new T.Vector2(0, 0), new T.Vector2(1, 0), new T.Vector2(1, 1), new T.Vector2(0, 1)]; }
    };
    const geo = new T.ExtrudeGeometry(pc.shape, { depth: 6, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.2, bevelSegments: 2, curveSegments: 18, UVGenerator: uv });
    geo.translate(-pc.cx, -pc.cy, 0);
    const front = F3.ownMat(new T.MeshPhysicalMaterial({ map: FL.tex(texId), roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 0.4, alphaTest: 0.5 }));
    front.map.userData.keep = true;
    const m = new T.Mesh(geo, [front, F3.toy('#fff6e0', { rough: 0.5 })]);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  /* stretch another flag's texture over this flag's grid (for the stranger piece) */
})(window.FF);
