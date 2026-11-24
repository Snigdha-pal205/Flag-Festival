/* Flag Festival — shared base for 3D scenes and the five games */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;
  FF.games = FF.games || {};

  /* A scene that owns a 3D world (shown on the canvas) plus a flat HUD layer */
  class Scene3D extends FF.Scene {
    constructor(args) {
      super(args);
      this.layer = { top: FF.el('g', {}, this.root) };
      this.handlers = null;
    }
    setWorld(w) {
      if (this.w && this.w !== w) this.w.dispose();
      this.w = w;
      F3.active = w;
      return w;
    }
    /* stage-pixel pointer input on the 3D world. h: {down(p) → true if used, move(p), up(p)} */
    input(h) {
      this.handlers = h;
      if (this._inputOn) return;
      this._inputOn = true;
      let downId = null;
      this.listen(FF.svg, 'pointerdown', e => {
        if (downId !== null || FF.drag.active) return;
        const p = FF.toLocal(e);
        downId = e.pointerId;
        const used = this.handlers && this.handlers.down && this.handlers.down(p, e);
        if (!used) { this.pokeAt(p); downId = null; }
      });
      this.listen(window, 'pointermove', e => { if (e.pointerId !== downId) return; e.preventDefault(); this.handlers && this.handlers.move && this.handlers.move(FF.toLocal(e), e); }, { passive: false });
      const up = e => { if (e.pointerId !== downId) return; downId = null; this.handlers && this.handlers.up && this.handlers.up(FF.toLocal(e), e); };
      this.listen(window, 'pointerup', up);
      this.listen(window, 'pointercancel', up);
    }
    pokeAt(p) {
      if (!this.w || !this.w.chars || !this.w.chars.length) return false;
      const hit = this.w.pick(p.x, p.y, this.w.chars.map(c => c.root));
      if (hit && hit.object.userData.char) { hit.object.userData.char.poke(); return true; }
      return false;
    }
    /* tween a camera to a new place */
    moveCamera(pos, look, dur) {
      const cam = this.w.camera, w = this.w;
      const p0 = cam.position.clone(), l0 = w.look.clone();
      const p1 = new T.Vector3(...pos), l1 = new T.Vector3(...look);
      return this.tween(dur || 1, k => { cam.position.lerpVectors(p0, p1, k); w.look.lerpVectors(l0, l1, k); cam.lookAt(w.look); }, FF.ease.inOut);
    }
    destroy() {
      super.destroy();
      if (this.w) { if (F3.active === this.w) F3.active = null; this.w.dispose(); this.w = null; }
    }
  }
  FF.Scene3D = Scene3D;

  /* front-view festival world: camera at z=10, 1 unit = 100 stage px on the plane z = 0 */
  FF.frontWorld = function (o) {
    o = o || {};
    const w = new F3.World(Object.assign({ cam: [0, 3.3, 10.9], look: [0, -0.45, 0], sun: [9, 13, 8], shadowExt: 14, bg: 'festival.jpg', shadowGround: -3.4 }, o));
    if (o.festival === true) F3.festival(w, Object.assign({ groundY: -3.4, pathZ: o.pathZ === undefined ? -1.2 : o.pathZ }, o.ground || {}));
    return w;
  };
  /* stage pixel → world point on plane z (front worlds) */
  FF.S2W = (w, sx, sy, z) => w.atZ(sx, sy, z || 0);

  class GameBase extends Scene3D {
    constructor(args) {
      super(args);
      this.country = args.country;
      this.flagId = args.country.flag;
      this.fd = FF.flags.data(this.flagId);
      this.level = args.level || 'easy';
      this.ctx = FF.ctxFor(this.country);
      this.finished = false;
    }
    /* the animal friend, standing on the ground at stage x, sized to `height` world units */
    makeFriend(w, x, y, z, height, o) {
      // No animal characters are shown any more: the friend stays only as an invisible,
      // silent placeholder so the game code that moves it keeps working.
      const f = F3.chars.forCountry(w, this.country, Object.assign({}, o, { poke: false, shadow: false }));
      f.setHeight(height || 2.2).place(x, y, z);
      f.root.visible = false;
      f.friend = null;              // no animal sounds
      this.friend = f;
      return f;
    }
    praise() { return FF.say('praise', this.ctx, { hold: 900 }); }
    finish(delay) {
      if (this.finished) return;
      this.finished = true;
      if (this.hints) this.hints.stop();
      this.after(delay || 0, () => { this.args.done && this.args.done(); });
    }
    /* ghost hand showing the move: from → to (stage pixels), twice */
    showMove(from, to, o) {
      o = o || {};
      if (this._handBusy) return;
      this._handBusy = true;
      const h = FF.hud.hand(this.layer.top);
      const run = n => {
        if (!this.alive) return;
        h.setAttribute('opacity', 0);
        this.tween(0.25, k => { h.setAttribute('opacity', k); h.setAttribute('transform', `translate(${from.x} ${from.y}) scale(${1.15 - k * 0.15})`); })
          .then(() => this.wait(250))
          .then(() => this.tween(1.1, k => h.setAttribute('transform', `translate(${FF.lerp(from.x, to.x, k).toFixed(1)} ${(FF.lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * 40).toFixed(1)})`), FF.ease.inOut))
          .then(() => this.wait(350))
          .then(() => this.tween(0.25, k => h.setAttribute('opacity', 1 - k)))
          .then(() => { if (n > 1) run(n - 1); else { h.remove(); this._handBusy = false; } });
      };
      run(o.times || 2);
    }
    pointAt(p) {
      const h = FF.hud.hand(this.layer.top);
      let t = 0;
      const stop = this.tick(dt => {
        t += dt;
        h.setAttribute('transform', `translate(${p.x} ${(p.y + 8 + Math.sin(t * 8) * 8).toFixed(1)})`);
        h.setAttribute('opacity', t > 2.6 ? Math.max(0, 1 - (t - 2.6) * 3) : 1);
        if (t > 3) { stop(); h.remove(); }
      });
    }
    banner(text, y, size) {
      const g = FF.el('g', { class: 'no-hit' }, this.layer.top);
      const inner = FF.el('g', {}, g);
      FF.hud.title(inner, text, 0, 0, size || 100, { seed: text.length * 13 });
      g.setAttribute('transform', `translate(640 ${y || 170})`);
      this.tween(0.5, k => inner.setAttribute('transform', `scale(${(0.2 + 0.8 * k).toFixed(3)}) rotate(${((1 - k) * -12).toFixed(1)})`), FF.ease.backBig);
      return g;
    }
    friendRunOff(dir, dur) {
      const f = this.friend; if (!f) return Promise.resolve();
      f.turn(dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      f.setBase('march');
      const x0 = f.root.position.x;
      return this.tween(dur || 1.4, k => { f.root.position.x = x0 + dir * k * 12; }, FF.ease.in);
    }
    /* the real flag on a card, always on screen, so children can copy it */
    referenceCard(x, y, w) {
      w = w || 260;
      const fd = this.fd;
      const fw = w - 36, fh = Math.min(fw * fd.h / fd.w, 150);
      const fs = Math.min(fw / fd.w, fh / fd.h);
      const H = fd.h * fs + 74;
      const g = FF.el('g', { transform: `translate(${x} ${y})` }, this.layer.top);
      const inner = FF.el('g', {}, g);
      FF.hud.panel(inner, 0, 0, w, H, { stroke: '#5a3214', sw: 5, r: 22 });
      FF.hud.text(inner, 'Copy this flag!', w / 2, 40, 26, { fill: '#ffcc2e', stroke: '#5a3214' });
      const u = FF.flags.use(inner, this.flagId, (w - fd.w * fs) / 2, 56, fd.w * fs, fd.h * fs);
      u.g.insertAdjacentHTML('afterbegin', `<rect x="-4" y="-4" width="${fd.w * fs + 8}" height="${fd.h * fs + 8}" rx="6" fill="#5a3214"/>`);
      this.tween(0.5, k => inner.setAttribute('transform', `translate(${w / 2} ${H / 2}) scale(${(0.3 + 0.7 * k).toFixed(3)}) translate(${-w / 2} ${-H / 2})`), FF.ease.back);
      return g;
    }
    /* a small example flag in a corner (stage px), waving on a pole */
    example(sx, sy, height) {
      const w = this.w;
      const p = w.atZ(sx, sy, 1.5);
      const f = F3.flags.add(w, null, this.flagId, height || 0.75, { poleLen: (height || 0.75) * 1.7, amp: 0.05 });
      f.group.position.copy(p).add(new T.Vector3(0, -(height || 0.75) * 1.7, 0));
      f.group.scale.setScalar(0.001);
      this.tween(0.5, k => f.group.scale.setScalar(Math.max(0.001, k)), FF.ease.back);
      return f;
    }
  }
  FF.games.GameBase = GameBase;

  /* glossy jar of paint */
  FF.paintPot = function (w, hex) {
    const g = new T.Group();
    const solid = F3.ownMat(new T.MeshStandardMaterial({ color: hex, roughness: 0.35, metalness: 0 }));
    const isWhite = hex.toUpperCase() === '#FFFFFF';
    const paint = F3.Cy(g, 0.44, 0.62, solid, 0, 0.31, 0);                       // the jar, full of paint
    F3.Cy(g, 0.45, 0.06, F3.toy(isWhite ? '#c9c4bb' : '#ffffff'), 0, 0.06, 0);   // bottom rim
    F3.Cy(g, 0.47, 0.1, F3.toy(isWhite ? '#c9c4bb' : '#ffffff'), 0, 0.63, 0);    // top rim
    F3.S(g, 0.42, solid, 0, 0.66, 0, 1, 0.3, 1);                                 // a dome of paint on top
    F3.S(g, 0.09, solid, 0.33, 0.5, 0.3, 1, 1.7, 1);                             // a drip down the side
    F3.S(g, 0.07, solid, -0.2, 0.42, 0.38, 1, 1.4, 1);
    g.userData.paint = paint;
    g.scale.setScalar(1);
    g.traverse(n => { if (n.isMesh) n.userData.pot = g; });
    return g;
  };
})(window.FF);
