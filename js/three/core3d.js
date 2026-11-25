/* Flag Festival 3D — core: renderer, glossy materials, worlds (scene + camera + lights),
   picking from stage coordinates, the festival ground, particles and text labels.
   Stage coordinates (1280 × 720) are shared with the flat HUD drawn on top.             */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three = {};
  F3.active = null;

  /* ---------- renderer ---------- */
  F3.init = function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'gl';
    document.getElementById('wrap').insertBefore(canvas, FF.svg);
    const r = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputColorSpace = T.SRGBColorSpace;
    r.toneMapping = T.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = T.PCFSoftShadowMap;
    F3.r = r;
    F3.env = makeEnv(r);
    // HUD 3D scene (Pip lives here, in stage pixels)
    F3.hud = new T.Scene();
    F3.hud.environment = F3.env;
    F3.hudCam = new T.OrthographicCamera(0, 1280, 0, -720, -3000, 3000);
    F3.hud.add(new T.HemisphereLight(0xffffff, 0xb0d8ff, 1.1));
    const hd = new T.DirectionalLight(0xffffff, 1.9); hd.position.set(300, 600, 900); F3.hud.add(hd);
    F3.hudUpdaters = new Set();
    resize();
    FF.onLayout.add(resize);
    FF.addTick((dt, t) => F3.frame(dt, t));
  };
  /* the canvas fills the screen: same height as the 1280×720 stage, wider on wide phones */
  function resize() {
    const s = Math.min(window.innerWidth / FF.VW, window.innerHeight / 720);
    const w = Math.round(FF.VW * s), h = Math.round(720 * s);
    F3.r.setSize(w, h, false);
    const c = F3.r.domElement;
    c.style.width = w + 'px'; c.style.height = h + 'px';
    F3.hudCam.left = -FF.OX; F3.hudCam.right = 1280 + FF.OX; F3.hudCam.updateProjectionMatrix();
    if (F3.active) F3.active.fit();
  }
  F3.frame = function (dt, t) {
    const r = F3.r;
    r.autoClear = true;
    const w = F3.active;
    if (w) {
      try { w.update(dt, t); } catch (e) { console.error(e); }
      r.render(w.scene, w.camera);
    } else { r.setClearColor(0x8fd3ff); r.clear(); }
    r.autoClear = false;
    r.clearDepth();
    F3.hudUpdaters.forEach(fn => { try { fn(dt, t); } catch (e) { console.error(e); } });
    r.render(F3.hud, F3.hudCam);
  };

  /* ---------- environment map for the glossy look ---------- */
  function makeEnv(r) {
    const pm = new T.PMREMGenerator(r);
    const s = new T.Scene();
    const g = new T.SphereGeometry(50, 48, 24);
    const cols = [];
    const pos = g.attributes.position;
    const top = new T.Color('#5fb8ff'), mid = new T.Color('#ffffff'), bot = new T.Color('#86c95a');
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 50;
      const c = y > 0 ? mid.clone().lerp(top, Math.min(1, y * 1.6)) : mid.clone().lerp(bot, Math.min(1, -y * 3));
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    s.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    const lm = new T.MeshBasicMaterial({ color: new T.Color(1, 1, 1).multiplyScalar(2.2) });
    const p1 = new T.Mesh(new T.PlaneGeometry(18, 10), lm); p1.position.set(10, 30, 20); p1.lookAt(0, 0, 0); s.add(p1);
    const p2 = new T.Mesh(new T.PlaneGeometry(10, 6), lm); p2.position.set(-25, 15, 10); p2.lookAt(0, 0, 0); s.add(p2);
    const tex = pm.fromScene(s, 0.03).texture;
    pm.dispose();
    return tex;
  }

  /* ---------- materials (cached, never disposed) ---------- */
  const mats = {};
  F3.toy = function (color, o) { // soft matte "clay" look (only eyes/water stay a little shiny)
    o = o || {};
    const k = 'toy' + color + (o.rough || '') + (o.emissive || '') + (o.side || '') + (o.flat ? 'f' : '');
    const rough = o.rough === undefined ? 0.55 : (o.rough < 0.16 ? 0.22 : Math.min(0.9, o.rough + 0.3));
    if (!mats[k]) mats[k] = new T.MeshStandardMaterial({ color, roughness: rough, metalness: 0, envMapIntensity: 0.55, emissive: o.emissive || 0x000000, side: o.side || T.FrontSide, flatShading: !!o.flat });
    return mats[k];
  };
  F3.matte = function (color, rough) {
    const k = 'mat' + color + (rough || '');
    if (!mats[k]) mats[k] = new T.MeshStandardMaterial({ color, roughness: rough === undefined ? 0.75 : rough, metalness: 0 });
    return mats[k];
  };
  F3.basic = function (color) {
    const k = 'bas' + color;
    if (!mats[k]) mats[k] = new T.MeshBasicMaterial({ color });
    return mats[k];
  };

  /* ---------- shared unit geometries ---------- */
  const shared = new Set();
  const G = F3.geo = {};
  function keep(g) { shared.add(g); g.userData.shared = true; return g; }
  G.sphere = keep(new T.SphereGeometry(1, 32, 24));
  G.sphereLo = keep(new T.SphereGeometry(1, 14, 10));
  G.hemi = keep(new T.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2));
  G.cyl = keep(new T.CylinderGeometry(1, 1, 1, 28));
  G.cone = keep(new T.ConeGeometry(1, 1, 28));
  G.box = keep(new T.BoxGeometry(1, 1, 1));
  const capCache = {};
  G.capsule = function (r, len) {
    const k = r.toFixed(3) + ':' + len.toFixed(3);
    if (!capCache[k]) capCache[k] = keep(new T.CapsuleGeometry(r, len, 8, 20));
    return capCache[k];
  };
  const torCache = {};
  G.torus = function (r, t, arc) {
    const k = r + ':' + t + ':' + (arc || 0);
    if (!torCache[k]) torCache[k] = keep(new T.TorusGeometry(r, t, 14, 40, arc || Math.PI * 2));
    return torCache[k];
  };

  /* quick mesh helpers: S = sphere, Cy = cylinder, Co = cone, Ca = capsule, B = box */
  F3.mesh = function (geo, mat, x, y, z, sx, sy, sz, parent) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.scale.set(sx === undefined ? 1 : sx, sy === undefined ? (sx === undefined ? 1 : sx) : sy, sz === undefined ? (sx === undefined ? 1 : sx) : sz);
    m.castShadow = true;
    if (parent) parent.add(m);
    return m;
  };
  F3.S = (p, r, mat, x, y, z, sx, sy, sz) => F3.mesh(G.sphere, mat, x, y, z, r * (sx || 1), r * (sy || 1), r * (sz || 1), p);
  F3.Cy = (p, r, h, mat, x, y, z) => F3.mesh(G.cyl, mat, x, y, z, r, h, r, p);
  F3.Co = (p, r, h, mat, x, y, z) => F3.mesh(G.cone, mat, x, y, z, r, h, r, p);
  F3.Ca = (p, r, len, mat, x, y, z) => { const m = new T.Mesh(G.capsule(r, len), mat); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; };
  F3.B = (p, w, h, d, mat, x, y, z) => F3.mesh(G.box, mat, x, y, z, w, h, d, p);
  F3.group = function (parent, x, y, z) { const g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; };

  /* ---------- canvas textures ---------- */
  F3.canvasTex = function (w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  /* a painted background picture (cached) */
  /* On a wide screen the picture keeps its exact place in the middle (so the poster's
     PLAY button still lines up), and the sides are filled with a soft, blurred, zoomed-in
     copy of the same picture that blends into it — no empty bars.                        */
  const bgCache = {}, bgImgs = {};
  function bgCompose(img, VW) {
    const H = img.naturalHeight, IW = img.naturalWidth, W = Math.max(IW, Math.round(H * VW / 720));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    if (W <= IW + 1) { ctx.drawImage(img, 0, 0); return c; }
    // 1) blurred, zoomed copy that covers everything
    const k = W / IW * 1.08, bw = IW * k, bh = H * k;
    ctx.filter = 'blur(' + Math.round(H / 40) + 'px) saturate(1.1)';
    ctx.drawImage(img, (W - bw) / 2, (H - bh) / 2, bw, bh);
    ctx.filter = 'none';
    // 2) the sharp picture in the middle with feathered left/right edges
    const sc = document.createElement('canvas'); sc.width = IW; sc.height = H;
    const sx = sc.getContext('2d');
    sx.drawImage(img, 0, 0);
    const f = 0.06;
    const g = sx.createLinearGradient(0, 0, IW, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(f, 'rgba(0,0,0,1)');
    g.addColorStop(1 - f, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    sx.globalCompositeOperation = 'destination-in'; sx.fillStyle = g; sx.fillRect(0, 0, IW, H);
    ctx.drawImage(sc, (W - IW) / 2, 0);
    return c;
  }
  /* returns the finished texture, or null and calls ready(tex) once the picture has loaded */
  F3.bgTex = function (name, ready) {
    const VW = FF.VW, key = name + '@' + VW;
    if (bgCache[key]) return bgCache[key];
    let img = bgImgs[name];
    if (!img) { img = bgImgs[name] = new Image(); img.src = 'assets/bg/' + name; }
    const make = () => {
      if (!bgCache[key]) {
        const t = new T.CanvasTexture(bgCompose(img, VW));
        t.colorSpace = T.SRGBColorSpace; t.userData.keep = true;
        bgCache[key] = t;
      }
      return bgCache[key];
    };
    if (img.complete && img.naturalWidth) return make();
    img.addEventListener('load', () => { const t = make(); if (ready) ready(t); }, { once: true });
    return null;
  };
  F3.preloadBg = names => names.forEach(n => F3.bgTex(n));
  F3.skyTex = function (top, bottom) {
    return F3.canvasTex(4, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, top || '#1f86ea'); g.addColorStop(0.5, bottom || '#5db6f5'); g.addColorStop(1, '#bfe6ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
  };
  F3.stripeTex = function (cols, n) {
    return F3.canvasTex(256, 16, (ctx, w, h) => { const sw = w / n; for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(i * sw, 0, sw + 1, h); } });
  };

  /* Text label as a sprite (always faces the camera) */
  F3.label = function (text, o) {
    o = o || {};
    const size = o.size || 64;
    const font = `${o.weight || 700} ${size}px ${o.font || '"Fredoka", "Baloo 2", "Trebuchet MS", sans-serif'}`;
    const mc = document.createElement('canvas').getContext('2d');
    mc.font = font;
    const tw = Math.ceil(mc.measureText(text).width) + size * 0.8;
    const th = Math.ceil(size * 1.5);
    const tex = F3.canvasTex(tw, th, (ctx, w, h) => {
      ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      if (o.outline !== false) { ctx.lineWidth = size * 0.22; ctx.strokeStyle = o.outlineColor || '#ffffff'; ctx.strokeText(text, w / 2, h / 2 + size * 0.04); }
      ctx.fillStyle = o.color || '#3b2a20'; ctx.fillText(text, w / 2, h / 2 + size * 0.04);
    });
    const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: o.depthTest !== false, transparent: true }));
    const k = (o.height || 0.4) / th;
    sp.scale.set(tw * k, th * k, 1);
    sp.userData.ownTex = tex;
    sp.renderOrder = o.renderOrder || 0;
    return sp;
  };

  /* ---------- World ---------- */
  class World {
    constructor(o) {
      o = o || {};
      this.scene = new T.Scene();
      this.scene.environment = F3.env;
      this.bgName = o.bg || null;
      if (o.bg) {
        this.setBg();
      } else this.scene.background = F3.skyTex(o.skyTop, o.skyBottom);
      if (o.shadowGround !== undefined) {
        const sg = new T.Mesh(new T.PlaneGeometry(80, 80), F3.ownMat(new T.ShadowMaterial({ opacity: 0.22 })));
        sg.rotation.x = -Math.PI / 2; sg.position.y = o.shadowGround; sg.receiveShadow = true; this.scene.add(sg);
      }
      if (o.fog !== false && !o.bg) this.scene.fog = new T.Fog(o.fogColor || 0xbfe3fb, o.fogNear || 45, o.fogFar || 130);
      this.camera = new T.PerspectiveCamera(o.fov || 39.6, FF.VW / 720, 0.1, 300);
      const cp = o.cam || [0, 0, 10], lk = o.look || [0, 0, 0];
      this.camera.position.set(cp[0], cp[1], cp[2]);
      this.look = new T.Vector3(lk[0], lk[1], lk[2]);
      this.camera.lookAt(this.look);
      this.camera.updateMatrixWorld(true);
      this.scene.add(new T.HemisphereLight(0xd6efff, 0x6fbf3f, 1.05));
      const rim = new T.DirectionalLight(0xfff6e0, 1.3); rim.position.set(-6, 8, -12); this.scene.add(rim);
      const sun = new T.DirectionalLight(0xfff0d6, 2.5);
      const sp = o.sun || [9, 13, 7];
      sun.position.set(sp[0], sp[1], sp[2]);
      sun.target.position.set(lk[0], lk[1], lk[2]);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      const sc = sun.shadow.camera; const ext = o.shadowExt || 16;
      sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 60;
      sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
      this.scene.add(sun); this.scene.add(sun.target);
      this.sun = sun;
      const fill = new T.DirectionalLight(0xcfe6ff, 0.4); fill.position.set(-8, 5, 10); this.scene.add(fill);
      this.updaters = new Set();
      this.ray = new T.Raycaster();
      this.t = 0;
    }
    /* screen shape changed: wider view (same height), background redrawn to match */
    fit() {
      this.camera.aspect = FF.VW / 720; this.camera.updateProjectionMatrix();
      if (this.bgName) this.setBg();
    }
    setBg() {
      const name = this.bgName, VW = FF.VW;
      const t = F3.bgTex(name, tex => { if (this.bgName === name && FF.VW === VW) this.scene.background = tex; });
      if (t) this.scene.background = t;
      else if (!this.scene.background) this.scene.background = new T.Color('#8fd3ff');
    }
    add(o) { this.scene.add(o); return o; }
    onUpdate(fn) { this.updaters.add(fn); return () => this.updaters.delete(fn); }
    update(dt, t) { this.t += dt; this.updaters.forEach(fn => fn(dt, this.t)); }
    ndc(sx, sy) { return new T.Vector2((sx + FF.OX) / (FF.VW / 2) - 1, 1 - sy / 360); }
    rayFrom(sx, sy) { this.camera.updateMatrixWorld(true); this.ray.setFromCamera(this.ndc(sx, sy), this.camera); return this.ray; }
    pick(sx, sy, objects) {
      const hits = this.rayFrom(sx, sy).intersectObjects(objects, true);
      return hits.length ? hits[0] : null;
    }
    /* world point under stage pixel on plane z = const (front scenes) */
    atZ(sx, sy, z) { const p = new T.Vector3(); this.rayFrom(sx, sy).ray.intersectPlane(new T.Plane(new T.Vector3(0, 0, 1), -(z || 0)), p); return p; }
    /* ...or on plane y = const (table scenes) */
    atY(sx, sy, y) { const p = new T.Vector3(); this.rayFrom(sx, sy).ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -(y || 0)), p); return p; }
    toStage(v) { this.camera.updateMatrixWorld(true); const p = v.clone().project(this.camera); return { x: (p.x + 1) * FF.VW / 2 - FF.OX, y: (1 - p.y) * 360 }; }
    /* world units per stage pixel at depth z (front scenes) */
    pxAt(z) { const d = this.camera.position.z - (z || 0); return 2 * d * Math.tan(this.camera.fov * Math.PI / 360) / 720; }
    dispose() {
      this.updaters.clear();
      this.scene.traverse(o => {
        if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
        if (o.userData.ownTex) o.userData.ownTex.dispose();
        const ms = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
        ms.forEach(m => { if (m.userData && m.userData.own) { if (m.map && !m.map.userData.keep) m.map.dispose(); m.dispose(); } });
      });
      if (this.scene.background && this.scene.background.dispose && !this.scene.background.userData.keep) this.scene.background.dispose();
    }
  }
  F3.World = World;
  F3.ownMat = function (m) { m.userData.own = true; return m; };

  /* ---------- the festival ground: a cozy diorama ----------
     soft clay look: layered pines, puffy trees, yellow flower bushes, a winding river
     with grey stones, a wooden festival house with a striped roof, fluffy clouds.     */
  const FG = {};
  FG.rockGeo = keep(new T.DodecahedronGeometry(1, 0));
  FG.coneLo = keep(new T.ConeGeometry(1, 1, 16, 1));
  F3.grassTex = function () {
    if (F3._grass) return F3._grass;
    const r = FF.rng(31);
    const t = F3.canvasTex(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#6fc93a'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        const x = r() * w, y = r() * h, rr = 14 + r() * 46;
        ctx.fillStyle = ['#7fd648', '#62bb33', '#8ade52', '#74cf3e'][i % 4];
        ctx.beginPath();
        for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, q = rr * (0.7 + r() * 0.5); ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.7); }
        ctx.closePath(); ctx.fill();
      }
      for (let i = 0; i < 14; i++) { ctx.fillStyle = 'rgba(214,170,110,.55)'; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 8 + r() * 16, 5 + r() * 8, r() * 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(60,140,30,.35)'; ctx.lineWidth = 2;
      for (let i = 0; i < 160; i++) { const x = r() * w, y = r() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 6); ctx.stroke(); }
    });
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(14, 14); t.userData.keep = true;
    F3._grass = t;
    return t;
  };
  F3.woodTex = function (base, line) {
    const t = F3.canvasTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = base || '#9a6233'; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) {
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, y, w, 3);
        ctx.strokeStyle = line || 'rgba(60,30,10,.25)'; ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(0, y + 8 + k * 7); ctx.bezierCurveTo(w * 0.3, y + 4 + k * 7, w * 0.6, y + 14 + k * 7, w, y + 8 + k * 7); ctx.stroke(); }
      }
    });
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  };
  F3.pine = function (parent, x, y, z, h, i) {
    const g = F3.group(parent, x, y, z);
    F3.Cy(g, h * 0.06, h * 0.2, F3.toy('#7a4a26'), 0, h * 0.1, 0);
    const cols = [['#1f8a3a', '#2aa046'], ['#26963f', '#34ad4e'], ['#1d7f36', '#2b9a44'], ['#2fa24a', '#40b858']][i % 4];
    const tiers = 4;
    for (let k = 0; k < tiers; k++) {
      const r = h * (0.36 - k * 0.07), th = h * 0.36;
      const m = new T.Mesh(FG.coneLo, F3.toy(cols[k % 2]));
      m.position.set(0, h * (0.28 + k * 0.19) + th / 2, 0); m.scale.set(r, th, r);
      m.rotation.y = k * 0.6; m.castShadow = true; m.receiveShadow = true;
      g.add(m);
    }
    return g;
  };
  F3.puffTree = function (parent, x, y, z, s, i) {
    const g = F3.group(parent, x, y, z);
    F3.Cy(g, 0.14 * s, 1.1 * s, F3.toy('#7a4a26'), 0, 0.55 * s, 0);
    const cols = [['#4cc23d', '#3aab32', '#62d44c'], ['#58c943', '#45b236', '#6edb55']][i % 2];
    const r = FF.rng(i * 7 + 3);
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2;
      const m = F3.S(g, (0.42 + r() * 0.2) * s, F3.toy(cols[k % 3]), Math.cos(a) * 0.45 * s, (1.45 + r() * 0.5) * s, Math.sin(a) * 0.4 * s);
      m.receiveShadow = true;
    }
    F3.S(g, 0.62 * s, F3.toy(cols[0]), 0, 1.9 * s, 0).receiveShadow = true;
    return g;
  };
  F3.flowerBush = function (parent, x, y, z, s, i) {
    const g = F3.group(parent, x, y, z);
    const r = FF.rng(i * 13 + 5);
    const greens = ['#3fb83a', '#4fc944', '#36a832'];
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + r(), d = (0.2 + r() * 0.25) * s;
      F3.S(g, (0.34 + r() * 0.16) * s, F3.toy(greens[k % 3]), Math.cos(a) * d, (0.32 + r() * 0.2) * s, Math.sin(a) * d * 0.7);
    }
    F3.S(g, 0.45 * s, F3.toy(greens[1]), 0, 0.55 * s, 0);
    const fc = ['#ff6fb5', '#ffffff', '#ff8fd0', '#ffd23f'];
    for (let k = 0; k < 7; k++) {
      const a = r() * Math.PI * 2, d = (0.25 + r() * 0.3) * s;
      const fx = Math.cos(a) * d, fz = Math.abs(Math.sin(a)) * d * 0.7 + 0.15 * s, fy = (0.45 + r() * 0.45) * s;
      const c = fc[k % fc.length];
      for (let q = 0; q < 5; q++) { const qa = q / 5 * Math.PI * 2; F3.S(g, 0.055 * s, F3.toy(c), fx + Math.cos(qa) * 0.06 * s, fy + Math.sin(qa) * 0.06 * s, fz + 0.1 * s, 1, 1, 0.5).castShadow = false; }
      F3.S(g, 0.04 * s, F3.toy('#ffcc2e'), fx, fy, fz + 0.13 * s).castShadow = false;
    }
    return g;
  };
  F3.rock = function (parent, x, y, z, s, i) {
    const m = new T.Mesh(FG.rockGeo, F3.toy(['#b9b4ab', '#a29d95', '#cfcac1'][i % 3], { flat: true }));
    const r = FF.rng(i * 17 + 1);
    m.position.set(x, y, z); m.scale.set(s * (0.8 + r() * 0.6), s * (0.5 + r() * 0.4), s * (0.7 + r() * 0.5));
    m.rotation.set(r() * 3, r() * 3, r() * 3);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  F3.tinyFlowers = function (parent, gy, n, area, seed) {
    const r = FF.rng(seed || 9);
    for (let i = 0; i < n; i++) {
      const x = area.x0 + r() * (area.x1 - area.x0), z = area.z0 + r() * (area.z1 - area.z0);
      if (area.skip && area.skip(x, z)) continue;
      const c = ['#ff6fb5', '#ffffff', '#ffd23f', '#ff8fd0', '#ffffff'][i % 5];
      F3.Cy(parent, 0.018, 0.26, F3.toy('#2f9a35'), x, gy + 0.13, z).castShadow = false;
      for (let q = 0; q < 5; q++) { const qa = q / 5 * Math.PI * 2; F3.S(parent, 0.06, F3.toy(c), x + Math.cos(qa) * 0.07, gy + 0.28, z + Math.sin(qa) * 0.07, 1, 0.45, 1).castShadow = false; }
      F3.S(parent, 0.045, F3.toy('#ffcc2e'), x, gy + 0.3, z).castShadow = false;
    }
  };
  F3.river = function (w, parent, pts, gy, width) {
    const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], gy + 0.02, p[1])));
    const N = 120, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = curve.getPoint(t), tg = curve.getTangent(t);
      const nx = -tg.z, nz = tg.x, l = Math.hypot(nx, nz) || 1;
      const ww = width * (0.85 + Math.sin(t * 9) * 0.15);
      pos.push(p.x + nx / l * ww, p.y, p.z + nz / l * ww, p.x - nx / l * ww, p.y, p.z - nz / l * ww);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const water = new T.Mesh(geo, F3.ownMat(new T.MeshStandardMaterial({ color: '#2aa8f5', roughness: 0.15, metalness: 0, side: T.DoubleSide, envMapIntensity: 0.8 })));
    water.receiveShadow = true; parent.add(water);
    // foam dots that drift downstream
    const dots = [];
    for (let i = 0; i < 70; i++) {
      const m = F3.S(parent, 0.05 + Math.random() * 0.04, F3.toy('#ffffff'), 0, gy + 0.05, 0, 1, 0.3, 1); m.castShadow = false;
      dots.push({ m, t: Math.random(), off: (Math.random() - 0.5) * width * 1.4 });
    }
    w.onUpdate(dt => dots.forEach(d => {
      d.t = (d.t + dt * 0.012) % 1;
      const p = curve.getPoint(d.t), tg = curve.getTangent(d.t);
      d.m.position.set(p.x - tg.z * d.off, gy + 0.05, p.z + tg.x * d.off);
    }));
    // grey stones along both banks
    let k = 0;
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, p = curve.getPoint(t), tg = curve.getTangent(t);
      [-1, 1].forEach(sd => { if ((i + (sd > 0 ? 1 : 0)) % 2) return; const ww = width * (0.95 + Math.random() * 0.25); F3.rock(parent, p.x - tg.z * ww * sd, gy + 0.08, p.z + tg.x * ww * sd, 0.22 + Math.random() * 0.18, k++); });
    }
    return curve;
  };
  F3.house = function (parent, x, y, z, s, rot) {
    const g = F3.group(parent, x, y, z); g.scale.setScalar(s); g.rotation.y = rot || 0;
    const wt = F3.woodTex('#b8743a', 'rgba(70,30,8,.3)'); wt.repeat.set(2, 2);
    const wall = F3.ownMat(new T.MeshStandardMaterial({ map: wt, roughness: 0.85 }));
    const body = F3.B(g, 4, 2.4, 3, wall, 0, 1.5, 0); body.receiveShadow = true;
    F3.B(g, 4.6, 0.3, 3.8, F3.toy('#8a5a32'), 0, 0.15, 0.2).receiveShadow = true;
    // striped roof
    const rt = F3.woodTex('#8a4f24', 'rgba(50,20,5,.35)'); rt.repeat.set(2, 2);
    const roofMat = F3.ownMat(new T.MeshStandardMaterial({ map: rt, roughness: 0.75 }));
    const sh = new T.Shape([new T.Vector2(-2.5, 0), new T.Vector2(2.5, 0), new T.Vector2(0, 1.9)]);
    const roof = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 3.6, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1 }), roofMat);
    roof.position.set(0, 2.7, -1.8); roof.castShadow = true; g.add(roof);
    F3.B(g, 0.55, 1.2, 0.55, F3.toy('#b0614a', { flat: true }), 1.1, 4.0, -0.5);
    // windows + door
    const win = (wx, wy) => { F3.B(g, 0.7, 0.6, 0.06, F3.toy('#fff3d0'), wx, wy, 1.52); F3.B(g, 0.6, 0.5, 0.06, F3.toy('#ffd76a', { emissive: '#7a5a10' }), wx, wy, 1.55); F3.B(g, 0.05, 0.5, 0.08, F3.toy('#fff3d0'), wx, wy, 1.58); };
    win(-1.2, 1.7); win(1.2, 1.7);
    F3.B(g, 0.7, 1.3, 0.08, F3.toy('#7a4424'), 0, 1.0, 1.52);
    F3.S(g, 0.05, F3.toy('#ffd23f'), 0.22, 1.0, 1.58);
    // a festival flag on the roof
    F3.Cy(g, 0.05, 1.5, F3.toy('#7a4424'), 0, 5.35, 0);
    const ft = F3.canvasTex(256, 160, (ctx, w2, h2) => { ['#ff3b30', '#ffffff', '#3fc24a'].forEach((c2, k2) => { ctx.fillStyle = c2; ctx.fillRect(0, k2 * h2 / 3, w2, h2 / 3 + 1); }); });
    const rf = new T.Mesh(new T.PlaneGeometry(0.9, 0.56, 10, 3), F3.ownMat(new T.MeshStandardMaterial({ map: ft, side: T.DoubleSide, roughness: 0.7 })));
    rf.geometry.translate(0.45, -0.28, 0); rf.position.set(0.05, 6.05, 0); g.add(rf);
    const base = rf.geometry.attributes.position.array.slice();
    g.userData.wave = t => { const a = rf.geometry.attributes.position.array; for (let k2 = 0; k2 < a.length; k2 += 3) a[k2 + 2] = Math.sin(base[k2] * 6 - t * 5) * 0.08 * base[k2]; rf.geometry.attributes.position.needsUpdate = true; };
    // porch fence
    for (let i = 0; i < 9; i++) F3.B(g, 0.08, 0.55, 0.08, F3.toy('#8a5a32'), -2.2 + i * 0.55, 0.55, 1.95);
    F3.B(g, 4.6, 0.08, 0.08, F3.toy('#8a5a32'), 0, 0.8, 1.95);
    return g;
  };
  F3.bridge = function (parent, x, y, z, rot) {
    const g = F3.group(parent, x, y, z); g.rotation.y = rot || 0;
    const wood = F3.toy('#a8652e'), dark = F3.toy('#7a4424');
    for (let i = 0; i < 11; i++) { const t = i / 10, px = -2.2 + t * 4.4, py = Math.sin(t * Math.PI) * 0.6 + 0.15; const pl = F3.B(g, 0.38, 0.1, 1.5, wood, px, py, 0); pl.rotation.z = -Math.cos(t * Math.PI) * 0.45; pl.receiveShadow = true; }
    [-0.8, 0.8].forEach(side => {
      for (let i = 0; i <= 5; i++) { const t = i / 5; F3.Cy(g, 0.06, 0.75, dark, -2.2 + t * 4.4, Math.sin(t * Math.PI) * 0.6 + 0.5, side); }
      const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new T.Vector3(-2.2 + t * 4.4, Math.sin(t * Math.PI) * 0.6 + 0.85, side)); }
      const rail = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 30, 0.05, 6), dark); rail.castShadow = true; g.add(rail);
    });
    return g;
  };
  F3.post = function (parent, x, y, z, h) {
    const g = F3.group(parent, x, y, z);
    F3.Cy(g, 0.14, h, F3.toy('#9a5a2a'), 0, h / 2, 0);
    F3.Cy(g, 0.17, 0.12, F3.toy('#7a4424'), 0, h, 0);
    return g;
  };
  F3.cloud = function (parent, x, y, z, s) {
    const g = F3.group(parent, x, y, z);
    [[0, 0, 1.5], [1.6, -0.3, 1.15], [-1.6, -0.35, 1.1], [0.7, 0.75, 1.15], [-0.7, 0.55, 1.0], [2.6, -0.6, 0.8], [-2.6, -0.6, 0.75]]
      .forEach(c => { const m = F3.S(g, c[2] * s, F3.toy('#ffffff'), c[0] * s, c[1] * s, 0); m.castShadow = false; });
    return g;
  };

  F3.festival = function (w, o) {
    o = o || {};
    const gy = o.groundY === undefined ? -3.4 : o.groundY;
    const root = F3.group(w.scene, 0, 0, 0);
    const grass = new T.Mesh(new T.CircleGeometry(110, 64), F3.ownMat(new T.MeshStandardMaterial({ map: F3.grassTex(), roughness: 0.95 })));
    grass.rotation.x = -Math.PI / 2; grass.position.y = gy; grass.receiveShadow = true; root.add(grass);
    // a dirt path where the friends walk
    if (o.path !== false) {
      const pz = o.pathZ === undefined ? -1 : o.pathZ;
      const pw = o.pathW || 2.8;
      const path = new T.Mesh(new T.PlaneGeometry(120, pw, 60, 2), F3.toy('#d9b47c'));
      const pa = path.geometry.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); pa.setY(i, pa.getY(i) + Math.sin(x * 0.35) * 0.18 * Math.sign(pa.getY(i) || 1)); }
      path.rotation.x = -Math.PI / 2; path.position.set(0, gy + 0.01, pz); path.receiveShadow = true; root.add(path);
    }
    // the river winds across the meadow behind the action
    if (o.river !== false) { F3.river(w, root, [[-40, -9], [-22, -7], [-12, -10.5], [-3, -8], [6, -11], [14, -8.5], [24, -12], [40, -10]], gy, 1.15); F3.bridge(root, 10.2, gy, -9.9, 0.12); }
    // festival house (the stage)
    if (o.stage !== false) {
      const hx = o.stageX === undefined ? 5 : o.stageX, hz = o.stageZ || -16;
      const hs = F3.house(root, hx, gy, hz, 1.25, -0.35);
      w.onUpdate((dt, t) => hs.userData.wave && hs.userData.wave(t));
      [[-2.6, '#e8793a'], [2.6, '#4aa6dc']].forEach((d, i) => { const dx = hx + d[0] * 1.4; F3.Cy(root, 0.55, 0.8, F3.toy(d[1]), dx, gy + 0.4, hz + 3.6); F3.Cy(root, 0.57, 0.06, F3.toy('#fff3d6'), dx, gy + 0.82, hz + 3.6); });
    }
    // trees: layered pines at the back, puffy trees in the middle
    const r = FF.rng(77);
    const pines = [[-18, -22, 6], [-12, -26, 7.5], [-7, -21, 5], [-24, -17, 6.5], [10, -25, 7], [15, -21, 5.5], [21, -24, 7.5], [27, -19, 6], [-30, -26, 8], [33, -27, 8], [0, -30, 8], [-3, -24, 5]];
    pines.forEach((p, i) => F3.pine(root, p[0], gy, p[1], p[2], i));
    const puffs = (o.trees || [[-11, -6, 1.6], [-14.5, -9, 1.9], [12, -6.5, 1.7], [16, -9, 2.0], [-8.5, -14, 1.5], [9, -15, 1.6]]);
    puffs.forEach((p, i) => F3.puffTree(root, p[0], gy, p[1], p[2] || 1.6, i));
    // yellow flower bushes and stones scattered around (kept clear of the play area)
    const bushes = [[-9, -3.5, 1.2], [-11.5, -1.5, 1.4], [9.5, -3, 1.3], [12, -1, 1.5], [-6.5, -12.5, 1.1], [3, -13, 1.2], [-15, -4, 1.5], [15.5, -4.5, 1.4], [-4, -18, 1.3], [18, -13, 1.6]];
    bushes.forEach((b, i) => F3.flowerBush(root, b[0], gy, b[1], b[2], i));
    [[-7.8, -2.2, 0.35], [8.2, -1.6, 0.4], [-13, -7, 0.5], [13.5, -7.5, 0.45]].forEach((s, i) => F3.rock(root, s[0], gy + 0.1, s[1], s[2], i + 40));
    F3.tinyFlowers(root, gy, 90, { x0: -20, x1: 20, z0: -20, z1: 1, skip: (x, z) => Math.abs(x) < 7 && z > -6 }, 5);
    // big fluffy clouds
    const clouds = [];
    [[-15, 10, -34, 1.8], [3, 12.5, -42, 2.2], [19, 10.5, -33, 1.7], [-32, 12, -44, 2.2], [32, 13, -46, 2]].forEach(c => clouds.push(F3.cloud(root, c[0], c[1], c[2], c[3])));
    w.onUpdate(dt => clouds.forEach((c, i) => { c.position.x += dt * (0.15 + i * 0.04); if (c.position.x > 45) c.position.x = -45; }));
    // a little festival bunting between the trees
    if (o.bunting !== false) {
      F3.post(root, -9.5, gy, -4.5, 3.4); F3.post(root, 9.5, gy, -4.5, 3.4);
      F3.bunting(w, root, [-9.5, gy + 3.3, -4.5], [9.5, gy + 3.3, -4.5], 0.8, 24);
    }
    if (o.balloons !== false) {
      [[-7.6, -4.2, '#ff3b30'], [-6.9, -4.6, '#ffcc2e'], [7.6, -4.4, '#2f9cf0']].forEach((b, i) => {
        const bg = F3.group(root, b[0], gy + 3.2, b[1]);
        F3.S(bg, 0.42, F3.toy(b[2]), 0, 0, 0, 1, 1.18, 1);
        const st = F3.Cy(bg, 0.01, 2.8, F3.matte('#ffffff'), 0, -1.9, 0); st.castShadow = false;
        w.onUpdate((dt, t) => { bg.position.y = gy + 3.2 + Math.sin(t * 1.2 + i) * 0.12; });
      });
    }
    return root;
  };

  F3.bunting = function (w, parent, a, b, sag, n) {
    const A = new T.Vector3(...a), B = new T.Vector3(...b);
    const pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; const p = A.clone().lerp(B, t); p.y -= Math.sin(t * Math.PI) * sag; pts.push(p); }
    const curve = new T.CatmullRomCurve3(pts);
    const rope = new T.Mesh(new T.TubeGeometry(curve, 40, 0.03, 6, false), F3.matte('#7a4b2a'));
    parent.add(rope);
    const tri = new T.ShapeGeometry(new T.Shape([new T.Vector2(-0.32, 0), new T.Vector2(0.32, 0), new T.Vector2(0, -0.72)]));
    const cols = ['#ff3b30', '#ffcc2e', '#2f9cf0', '#3fc24a', '#ff8a1f', '#ff5fa8'];
    const flags = [];
    for (let i = 1; i < n; i++) {
      const p = curve.getPoint(i / n);
      const m = new T.Mesh(tri, F3.toy(cols[i % cols.length], { side: T.DoubleSide }));
      m.position.copy(p); m.castShadow = true;
      parent.add(m); flags.push(m);
    }
    w.onUpdate((dt, t) => flags.forEach((f, i) => { f.rotation.x = Math.sin(t * 2.2 + i * 0.7) * 0.25; }));
  };

  /* ---------- particles ---------- */
  F3.confetti = function (w, center, spread, dur, n) {
    const cols = ['#ff4d4d', '#ffd23f', '#3d9bff', '#7cdb5a', '#ff8ad8', '#ff9f1c', '#ffffff'];
    const geo = new T.PlaneGeometry(0.16, 0.1);
    const g = F3.group(w.scene);
    const bits = [];
    for (let i = 0; i < (n || 120); i++) {
      const m = new T.Mesh(geo, F3.toy(cols[i % cols.length], { side: T.DoubleSide }));
      m.position.set(center.x + (Math.random() - 0.5) * spread, center.y + Math.random() * 3, center.z + (Math.random() - 0.5) * 2);
      g.add(m);
      bits.push({ m, vy: -(0.8 + Math.random() * 1.2), sw: Math.random() * 6, ph: Math.random() * 6, vr: (Math.random() - 0.5) * 10 });
    }
    let t = 0;
    const stop = w.onUpdate(dt => {
      t += dt;
      bits.forEach(b => {
        b.ph += dt * 3; b.m.position.y += b.vy * dt; b.m.position.x += Math.sin(b.ph) * dt * 0.8;
        b.m.rotation.x += b.vr * dt; b.m.rotation.y += b.vr * dt * 0.7;
        if (b.m.position.y < center.y - 8 && t < dur) b.m.position.y = center.y + 3;
      });
      if (t > dur + 5) { stop(); w.scene.remove(g); geo.dispose(); }
    });
    return g;
  };
  F3.rain = function (w, x0, x1, top, bottom, z, dur, n) {
    const g = F3.group(w.scene);
    const mat = F3.toy('#5ab4ff', { rough: 0.1 });
    const drops = [];
    for (let i = 0; i < (n || 70); i++) {
      const m = F3.S(g, 0.045, mat, x0 + Math.random() * (x1 - x0), top - Math.random() * 3, z + (Math.random() - 0.5), 1, 2.2, 1);
      m.castShadow = false;
      drops.push({ m, v: 7 + Math.random() * 4 });
    }
    let t = 0;
    const stop = w.onUpdate(dt => {
      t += dt;
      drops.forEach(d => { d.m.position.y -= d.v * dt; if (d.m.position.y < bottom) { if (t < dur) d.m.position.y = top; else d.m.visible = false; } });
      if (t > dur + 1.5) { stop(); w.scene.remove(g); }
    });
  };
  F3.burst = function (w, pos, color, n, speed) { // small glossy balls popping out (sparkle-free celebration)
    const g = F3.group(w.scene);
    const parts = [];
    for (let i = 0; i < (n || 14); i++) {
      const m = F3.S(g, 0.07 + Math.random() * 0.06, F3.toy(Array.isArray(color) ? color[i % color.length] : color), pos.x, pos.y, pos.z);
      const a = Math.random() * Math.PI * 2, e = Math.random() * 0.8 + 0.2;
      parts.push({ m, v: new T.Vector3(Math.cos(a) * e, 1 + Math.random(), Math.sin(a) * e).multiplyScalar(speed || 3) });
    }
    let t = 0;
    const stop = w.onUpdate(dt => {
      t += dt;
      parts.forEach(p => { p.v.y -= 9 * dt; p.m.position.addScaledVector(p.v, dt); const s = Math.max(0.01, 1 - t / 1.1); p.m.scale.setScalar(p.m.scale.x * 0 + (0.1) * s); });
      if (t > 1.1) { stop(); w.scene.remove(g); }
    });
  };
})(window.FF);
