/* Flag Festival 3D — the North Africa map as a toy board: a glossy sea, raised countries
   with little 3D landmarks, name labels, and a glowing slot for the missing piece.     */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;
  const M = F3.mapkit = {};
  const GEO = () => FF.geo;
  M.COL = { algeria: '#ffb000', tunisia: '#1fbf3f', libya: '#ff5a1f', egypt: '#ffe100', sudan: '#ff3f8e', chad: '#1e90ff', niger: '#8f3fe0',
    afghanistan: '#8f3fe0', pakistan: '#1fbf3f', india: '#ff8a1f', nepal: '#1e90ff', bhutan: '#ffe100', bangladesh: '#ff3f8e', china: '#ff4b3a' };
  /* the glowing "?" flag picture (assets/bg/mystery-flag.png), loaded once */
  let mysteryTex = null;
  M.mysteryTex = function () {
    if (!mysteryTex) { mysteryTex = new T.TextureLoader().load('assets/bg/mystery-flag.png'); mysteryTex.colorSpace = T.SRGBColorSpace; mysteryTex.userData.keep = true; }
    return mysteryTex;
  };
  M.MYSTERY_ASPECT = 900 / 674;
  const DEPTH = 22;

  function shapeFrom(pts, clamp) {
    const W = GEO().W, H = GEO().H;
    const v = pts.map(p => new T.Vector2(clamp ? FF.clamp(p[0], 0, W) : p[0], -(clamp ? FF.clamp(p[1], 0, H) : p[1])));
    return new T.Shape(v);
  }
  function parseD(d) { // our own "M x y L x y ... Z" paths back to points
    return d.replace(/[MZ]/g, '').split('L').map(s => s.trim().split(/\s+/).map(Number)).filter(p => p.length === 2 && !isNaN(p[0]));
  }
  function extrude(shape, depth, mat, bevel) {
    const geo = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel !== false, bevelThickness: 3, bevelSize: 2.5, bevelSegments: 3, curveSegments: 6 });
    const m = new T.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  /* little landmarks, in map-pixel units (y up) */
  function decor(g, type, x, z, top) {
    const tm = (c, r) => F3.toy(c, { rough: r === undefined ? 0.35 : r });
    switch (type) {
      case 'dune': { const d = F3.mesh(F3.geo.hemi, tm('#f4c472', 0.6), x, top, z, 16, 6, 10, g); const d2 = F3.mesh(F3.geo.hemi, tm('#efb85e', 0.6), x + 12, top, z + 6, 11, 4.5, 8, g); d.castShadow = d2.castShadow = true; break; }
      case 'mount': { const m = new T.Mesh(new T.ConeGeometry(14, 26, 6), tm('#b98157', 0.5)); m.position.set(x, top + 13, z); m.castShadow = true; g.add(m); const s = new T.Mesh(new T.ConeGeometry(5.5, 10, 6), tm('#ffffff', 0.4)); s.position.set(x, top + 22, z); g.add(s); break; }
      case 'palm': { F3.Cy(g, 1.6, 22, tm('#a86a3a'), x, top + 11, z); for (let i = 0; i < 5; i++) { const l = F3.mesh(F3.geo.sphereLo, tm('#2fb24a'), x + Math.cos(i * 1.26) * 7, top + 22, z + Math.sin(i * 1.26) * 7, 8, 2, 3.5, g); l.rotation.y = -i * 1.26; } break; }
      case 'tree': { F3.Cy(g, 1.6, 14, tm('#a86a3a'), x, top + 7, z); F3.mesh(F3.geo.sphereLo, tm('#3fbf5a'), x, top + 16, z, 12, 5, 12, g); break; }
      case 'pyramids': {
        [[0, 0, 13], [17, 6, 10], [-12, 8, 7]].forEach(p => { const m = new T.Mesh(new T.ConeGeometry(p[2], p[2] * 1.4, 4), tm('#f2c14e', 0.3)); m.position.set(x + p[0], top + p[2] * 0.7, z + p[1]); m.rotation.y = Math.PI / 4; m.castShadow = true; g.add(m); });
        break;
      }
    }
  }

  /* One country as a world-aligned group in MAP PIXELS (x right, y up, z = map y). */
  const cmats = {};
  M.mat = function (hex) {
    if (!cmats[hex]) { cmats[hex] = new T.MeshLambertMaterial({ color: hex }); }
    return cmats[hex];
  };
  M.country = function (id, o) {
    o = o || {};
    const G = GEO();
    const c = G.countries[id];
    const g = new T.Group();
    const body = extrude(shapeFrom(c.pts), DEPTH, M.mat(M.COL[id]));
    g.add(body);
    const top = DEPTH + 3;
    (G.decor[id] || []).forEach(dc => { const p = G.P(dc[1], dc[2]); decor(g, dc[0], p[0], p[1], top); });
    // rivers & lakes painted on top
    const water = F3.toy('#2f9bff', { rough: 0.1 });
    if (id === 'egypt' || id === 'sudan') {
      const NILE = [[31.0, 31.5], [31.2, 30.6], [31.2, 30.0], [31.0, 29.0], [30.8, 28.2], [31.2, 27.2], [31.9, 26.6], [32.7, 25.9], [32.7, 25.2], [32.9, 24.1], [32.6, 23.3], [31.6, 22.2], [31.1, 21.7], [30.6, 20.6], [30.5, 19.3], [31.5, 18.6], [32.2, 18.6], [33.1, 19.2], [33.6, 18.6], [34.0, 17.6], [33.6, 16.6], [32.6, 15.6], [32.5, 14.0], [32.6, 12.8], [32.7, 12.0], [32.6, 10.5]];
      const part = id === 'egypt' ? NILE.filter(p => p[1] >= 22.2) : NILE.filter(p => p[1] <= 22.2 && p[1] > 10.2);
      const pts = part.map(p => { const q = G.P(p[0], p[1]); return new T.Vector3(q[0], top - 1, q[1]); });
      if (pts.length > 1) { const tb = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 60, 3.2, 8, false), water); g.add(tb); }
      if (id === 'sudan') {
        const bn = [[32.6, 15.6], [33.4, 14.6], [34.3, 13.0], [34.6, 11.6], [35.0, 11.1]].map(p => { const q = G.P(p[0], p[1]); return new T.Vector3(q[0], top - 1, q[1]); });
        g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(bn), 30, 2.6, 8, false), water));
      }
      if (id === 'egypt') { const q = G.P(32.4, 22.9); F3.mesh(F3.geo.sphereLo, water, q[0], top - 2, q[1] - 4, 6, 2, 11, g); }
    }
    if (id === 'chad') { const q = G.P(14.3, 13.4); F3.mesh(F3.geo.sphereLo, water, q[0], top - 2, q[1], 9, 2, 8, g); }
    g.userData.country = id;
    return g;
  };

  /* The whole board. o: {x, z, k, missing, labels, glow} → api */
  M.board = function (w, o) {
    o = o || {};
    const G = GEO();
    const k = o.k || 0.0105;
    const ox = (o.x || 0) - G.W * k / 2, oz = (o.z || 0) - G.H * k / 2;
    const root = F3.group(w.scene);
    // wooden frame + glossy sea
    const BW = G.W * k, BH = G.H * k;
    const sea = F3.B(root, BW, 0.2, BH, F3.ownMat(new T.MeshStandardMaterial({ color: '#4aa6dc', roughness: 0.3, envMapIntensity: 0.8 })), ox + BW / 2, -0.1, oz + BH / 2); sea.receiveShadow = true;
    const wood = F3.toy('#8a5a32');
    [[BW + 0.5, 0.36, 0.25, ox + BW / 2, oz - 0.125], [BW + 0.5, 0.36, 0.25, ox + BW / 2, oz + BH + 0.125], [0.25, 0.36, BH, ox - 0.125, oz + BH / 2], [0.25, 0.36, BH, ox + BW + 0.125, oz + BH / 2]]
      .forEach(b => F3.B(root, b[0], b[1], b[2], wood, b[3], 0, b[4]));
    // little white wave rings on the sea
    [[120, 40], [330, 25], [520, 45], [700, 80], [760, 210], [60, 80]].forEach(p => { const r = new T.Mesh(F3.geo.torus(0.12, 0.018, Math.PI), F3.toy('#ffffff', { rough: 0.2 })); r.position.set(ox + p[0] * k, 0.02, oz + p[1] * k); r.rotation.x = -Math.PI / 2; root.add(r); });
    // map space (pixels): world-aligned, scaled
    const mapG = F3.group(root, ox, 0, oz); mapG.scale.setScalar(k);
    // other lands, lower and pale
    Object.keys(G.other).forEach(key => { mapG.add(extrude(shapeFrom(parseD(G.other[key]), true), 9, M.mat('#efe6cf'))); });
    // o.missing: one country id, or a list of them (the 3-friend story uses three empty slots)
    const missing = [].concat(o.missing || []);
    const nodes = {};
    Object.keys(G.countries).forEach(id => { if (!missing.includes(id)) { nodes[id] = M.country(id); mapG.add(nodes[id]); } });
    // the empty slots
    const slots = {};
    missing.forEach(mid => {
      const c = G.countries[mid];
      const slot = F3.group(mapG);
      const floor = extrude(shapeFrom(c.pts), 17, M.mat('#243a73'), false);
      slot.add(floor);
      const curve = new T.CatmullRomCurve3(c.pts.filter((p, i) => i % 2 === 0).map(p => new T.Vector3(p[0], 19, p[1])), true);
      const gm = F3.ownMat(new T.MeshBasicMaterial({ color: '#ffe100' }));
      // the yellow ring: thinner around small countries, so their shape stays easy to see
      const tubeR = FF.clamp(Math.min(c.bbox.w, c.bbox.h) * 0.08, 1.6, 6.5);
      const ring = new T.Mesh(new T.TubeGeometry(curve, 300, tubeR, 8, true), gm);
      slot.add(ring);
      slot.userData.glowMat = gm;
      slot.userData.setGlow = () => {};
      // nothing floats over the hole: just the dark slot and its pulsing yellow ring
      const ph = Object.keys(slots).length * 1.3;
      w.onUpdate((dt, t) => {
        const pulse = 0.5 + 0.5 * Math.sin(t * 6 + ph);
        gm.color.setRGB(1, 0.78 + pulse * 0.17, pulse * 0.15);
        ring.scale.y = 1 + pulse * 0.4;
      });
      slots[mid] = slot;
    });
    const slot = missing.length ? slots[missing[0]] : null;
    // labels
    const labels = {};
    if (o.labels !== false) {
      FF.C.countries.forEach(cn => {
        if (missing.includes(cn.id)) return;
        labels[cn.id] = M.label(root, cn, ox, oz, k);
      });
    }
    const api = {
      root, mapG, k, ox, oz, nodes, slot, slots, labels,
      toWorld(px, py, y) { return new T.Vector3(ox + px * k, y || 0, oz + py * k); },
      center(id) { const c = G.countries[id]; return api.toWorld(c.cx, c.cy, 0); },
      fill(id) { nodes[id] = M.country(id); mapG.add(nodes[id]); if (slots[id]) { mapG.remove(slots[id]); delete slots[id]; } if (o.labels !== false) labels[id] = M.label(root, FF.C.countries.find(c => c.id === id), ox, oz, k); return nodes[id]; }
    };
    return api;
  };
  M.label = function (root, cn, ox, oz, k) {
    const p = GEO().P(cn.label[0], cn.label[1]);
    const sp = F3.label(cn.name, { height: cn.labelSize || (cn.id === 'tunisia' ? 0.26 : 0.34), size: 72, color: '#3b2a20' });
    sp.position.set(ox + p[0] * k, 0.75, oz + p[1] * k);
    root.add(sp);
    return sp;
  };

  /* a puzzle piece: the country on an outer group whose origin is the country centre */
  M.piece = function (w, id, k) {
    const c = GEO().countries[id];
    const outer = F3.group(w.scene);
    const inner = M.country(id);
    inner.scale.setScalar(k);
    inner.position.set(-c.cx * k, 0, -c.cy * k);
    outer.add(inner);
    outer.userData.inner = inner;
    return outer;
  };
})(window.FF);
