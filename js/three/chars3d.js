/* Flag Festival — characters made from the illustrated art in assets/chars/.
   Each one is a cut-out picture standing in the 3D scene, brought to life with the
   moves from the animation sheet: idle breathing, jump, happy wave, dance, celebrate,
   march, plus a giggle/spin when poked. Feet at y = 0, facing the camera.             */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;
  const CH = F3.chars = {};

  /* which picture each character uses, and where its "hand" is (fraction of width/height) */
  const ART = {
    elephant: { img: 'elephant', hand: [0.42, 0.42] },
    cow: { img: 'cow', hand: [0.4, 0.45] },
    bird: { img: 'bird', hand: [0.36, 0.45] },
    kitten: { img: 'kitten', hand: [0.4, 0.4] },
    camel: { img: 'camel', hand: [0.42, 0.5] },
    mouse: { img: 'mouse', hand: [0.4, 0.45] },
    ant: { img: 'ant', hand: [0.42, 0.45] },
    pip: { img: 'pip', hand: [0.4, 0.45] },
    grumble: { img: 'grumble', hand: [0, -0.1] }
  };
  const texCache = {};
  const loader = new T.TextureLoader();
  CH.texture = function (name) {
    if (!texCache[name]) {
      const t = loader.load('assets/chars/' + name + '.png', tx => { tx.userData.ready = true; (tx.userData.onReady || []).forEach(f => f(tx)); tx.userData.onReady = []; });
      t.colorSpace = T.SRGBColorSpace;
      t.anisotropy = 8;
      t.userData.keep = true;
      t.userData.onReady = [];
      texCache[name] = t;
    }
    return texCache[name];
  };
  CH.preload = function () { Object.keys(ART).forEach(k => CH.texture(ART[k].img)); };
  let blobTex = null;
  function blob() {
    if (!blobTex) {
      blobTex = F3.canvasTex(128, 128, (ctx) => {
        const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
        g.addColorStop(0, 'rgba(30,40,20,.55)'); g.addColorStop(1, 'rgba(30,40,20,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      });
      blobTex.userData.keep = true;
    }
    return blobTex;
  }

  const DUR = { hop: 0.6, happy: 1.8, spin: 0.8, giggle: 1.0, wave: 1.4, celebrate: 1.2, stomp: 1.3, wobble: 1.5, bonk: 1.2 };

  class Char {
    constructor(kind, o) {
      o = o || {};
      this.kind = kind;
      this.friend = o.friend;
      const art = ART[kind] || ART.elephant;
      this.art = art;
      this.root = new T.Group();
      this.rig = F3.group(this.root);
      this.h = 1;                       // local units: the picture is 1 unit tall
      this.scale = 1;
      this.aspect = 1;
      this.flip = false;
      const tex = CH.texture(art.img);
      this.mat = F3.ownMat(new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.08, side: T.DoubleSide }));
      this.mat.toneMapped = false;
      const geo = new T.PlaneGeometry(1, 1);
      geo.translate(0, 0.5, 0);
      this.mesh = new T.Mesh(geo, this.mat);
      this.rig.add(this.mesh);
      // soft round shadow on the ground
      if (kind !== 'grumble' && o.shadow !== false) {
        const sh = new T.Mesh(new T.PlaneGeometry(1, 1), F3.ownMat(new T.MeshBasicMaterial({ map: blob(), transparent: true, depthWrite: false })));
        sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; sh.scale.set(0.9, 0.32, 1);
        this.root.add(sh); this.shadow = sh;
      }
      this.hand = new T.Object3D(); this.rig.add(this.hand);
      const fit = tx => { this.aspect = tx.image.width / tx.image.height; this.mesh.scale.x = this.aspect * (this.flip ? -1 : 1); this.placeHand(); if (this.shadow) this.shadow.scale.set(0.9 * this.aspect, 0.3, 1); };
      if (tex.userData.ready) fit(tex); else tex.userData.onReady.push(fit);
      this.placeHand();
      this.root.traverse(n => { if (n.isMesh) n.userData.char = this; });
      this.base = 'idle'; this.one = null;
      this.t = Math.random() * 10;
      this.busy = 0; this.walk = false; this.talking = false; this.flying = false;
    }
    placeHand() { this.hand.position.set(this.aspect * this.art.hand[0] * (this.flip ? -1 : 1), this.art.hand[1], 0.05); }
    setHeight(h) { this.scale = h; this.root.scale.setScalar(h); return this; }
    place(x, y, z) { this.root.position.set(x, y, z); return this; }
    /* pictures don't rotate in 3D: a strong turn to the left mirrors the picture instead */
    turn(a) {
      const f = a < -0.6 && a > -2.6;
      if (f !== this.flip) { this.flip = f; this.mesh.scale.x = this.aspect * (f ? -1 : 1); this.placeHand(); }
      return this;
    }
    setBase(n) { this.base = n; return this; }
    play(n, dur) { this.one = { n, t: 0, dur: dur || DUR[n] || 1 }; return this; }
    walking(on) { this.walk = !!on; return this; }
    setFace(n) {
      this._face = n;
      if (this.kind !== 'grumble') return;
      this.mat.color.set(n === 'happy' ? '#f0f4ff' : '#ffffff');
      if (n === 'happy') this.play('celebrate'); else if (n === 'giggle') this.play('giggle'); else if (n === 'sneeze') this.play('hop');
    }
    tip() { /* Pip's brush colour isn't part of the picture */ }
    sound() { if (this.friend) FF.audio.sfx(this.friend.sound); }
    handWorld() { return this.hand.getWorldPosition(new T.Vector3()); }
    headWorld() { return this.rig.localToWorld(new T.Vector3(0, 0.85, 0.1)); }
    update(dt) {
      this.t += dt; const t = this.t; const r = this.rig;
      this.busy = Math.max(0, this.busy - dt);
      r.position.set(0, 0, 0); r.rotation.set(0, 0, 0); r.scale.set(1, 1, 1);
      const b = this.base;
      if (b === 'idle') { const s = Math.sin(t * 2.6) * 0.025; r.scale.set(1 + s * 0.6, 1 - s, 1); r.rotation.z = Math.sin(t * 1.3) * 0.015; }
      else if (b === 'march' || this.walk) { r.position.y = Math.abs(Math.sin(t * 7)) * 0.08; r.rotation.z = Math.sin(t * 7) * 0.06; }
      else if (b === 'dance') { r.rotation.z = Math.sin(t * 6) * 0.14; r.position.y = Math.abs(Math.sin(t * 6)) * 0.14; r.position.x = Math.sin(t * 3) * 0.05; }
      else if (b === 'float') { r.position.y = Math.sin(t * 2) * 0.06; r.rotation.z = Math.sin(t * 1.3) * 0.04; const s = Math.sin(t * 2.4) * 0.025; r.scale.set(1 + s, 1 - s, 1); }
      if (this.flying) { r.position.y += Math.sin(t * 9) * 0.05; r.rotation.z += Math.sin(t * 9) * 0.05; }
      if (this.talking) { const s = Math.abs(Math.sin(t * 14)) * 0.03; r.scale.y *= 1 + s; r.scale.x *= 1 - s * 0.5; }
      const o = this.one;
      if (o) {
        o.t += dt; const p = Math.min(1, o.t / o.dur);
        const sq = x => (x < 0.12 ? Math.sin(x / 0.12 * Math.PI) * 0.12 : 0);
        switch (o.n) {
          case 'hop': r.position.y += Math.sin(p * Math.PI) * 0.35; r.scale.y *= 1 - sq(p); r.scale.x *= 1 + sq(p); break;
          case 'happy': { const q = (p * 3) % 1; r.position.y += Math.sin(q * Math.PI) * 0.4; r.scale.y *= 1 - sq(q) * 0.8; break; }
          case 'celebrate': r.position.y += Math.sin(p * Math.PI) * 0.45; r.rotation.z += Math.sin(p * Math.PI * 4) * 0.12; r.scale.multiplyScalar(1 + Math.sin(p * Math.PI) * 0.08); break;
          case 'wave': r.rotation.z += Math.sin(p * Math.PI * 6) * 0.1 * (1 - p); r.position.y += Math.sin(p * Math.PI) * 0.06; break;
          case 'spin': { const c = Math.cos(p * Math.PI * 2); r.scale.x *= Math.sign(c || 1) * Math.max(0.08, Math.abs(c)); r.position.y += Math.sin(p * Math.PI) * 0.2; break; }
          case 'giggle': r.rotation.z += Math.sin(p * 55) * 0.07 * (1 - p); break;
          case 'stomp': r.position.y += Math.abs(Math.sin(p * 4 * Math.PI)) * 0.12; break;
          case 'wobble': case 'bonk': r.rotation.z += Math.sin(p * 4 * Math.PI) * 0.12 * (1 - p); r.position.y += Math.sin(Math.min(1, p * 3) * Math.PI) * 0.2; break;
        }
        if (p >= 1) this.one = null;
      }
      if (this.shadow) this.shadow.material.opacity = 1 - Math.min(0.6, r.position.y * 1.2);
    }
    habit() {
      if (this.busy > 0) return;
      this.busy = 2;
      this.sound();
      this.play(FF.pick(['wave', 'celebrate', 'happy']));
    }
    poke() {
      if (this.busy > 0) return;
      this.busy = 0.7;
      if (this.kind === 'pip') { FF.audio.sfx('yes'); this.play(FF.pick(['hop', 'spin', 'celebrate'])); return; }
      if (this.kind === 'grumble') { FF.audio.sfx('giggle'); this.play('giggle'); return; }
      const r = Math.random();
      if (r < 0.25) { FF.audio.sfx('giggle'); this.play('giggle'); }
      else if (r < 0.5) { FF.audio.sfx('whoosh'); this.play('spin'); }
      else if (r < 0.75) { this.sound(); this.play('hop'); }
      else { this.sound(); this.play('celebrate'); }
    }
    /* hold a waving flag on a pole (height in world units) */
    holdFlag(w, id, height) {
      const local = height / (this.scale || 1);
      const f = new F3.flags.Flag3D(id, local, { poleLen: local * 2.0, amp: 0.06, speed: 5 });
      f.group.position.set(0, -local * 0.75, 0.02);
      this.hand.add(f.group);
      w.onUpdate(dt => f.update(dt));
      this.flag = f;
      return f;
    }
    silhouette(color) { this.mat.color.set(color || '#2b2540'); }
  }
  CH.Char = Char;
  CH.make = (kind, o) => new Char(kind, o);
  CH.add = function (w, kind, o) {
    o = o || {};
    const c = new Char(kind, o);
    c.world = w;
    w.scene.add(c.root);
    w.onUpdate(dt => c.update(dt));
    w.chars = w.chars || [];
    if (o.poke !== false) w.chars.push(c);
    return c;
  };
  CH.forCountry = (w, country, o) => CH.add(w, country.friend.kind, Object.assign({ friend: country.friend }, o || {}));
})(window.FF);
