/* Story step 2 — the map with the friends' countries missing (2 now; works for up to 3).
   The pieces wait on the right; each is dragged (or tapped, then the map tapped) into its
   own slot, exactly like the single-piece map puzzle. All placed → done.                   */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;

  class MapThree extends FF.games.GameBase {
    start() {
      FF.audio.music('calm');
      const w = this.setWorld(new F3.World({ cam: [0.6, 10.6, 6.9], look: [0.6, 0, 0.75], fov: 42, sun: [3, 14, 7], shadowExt: 10, bg: 'ocean.jpg', shadowGround: -0.21 }));
      const ids = this.args.countries.map(c => c.id);
      const k = this.k = 0.0105;
      const board = this.board = F3.mapkit.board(w, { x: -1.75, z: 0.55, k, missing: ids, labels: this.level !== 'hard', glow: false });
      this.makeFriend(w, 9, 0, -9, 1);
      FF.pip.show(84, 704, 1.0);
      FF.pip.spot = { x: 160, bottom: 742, w: 470, tail: 'left' };   // the sea under the board, beside Pip

      // the pieces, one under the other on the right, each on a little stand with its name and flag
      const rowsZ = this.args.countries.length === 2 ? [-1.25, 1.65] : [-2.15, 0.25, 2.65];
      this.pieces = FF.shuffle(this.args.countries.slice()).map((cn, i) => {
        const c = FF.geo.countries[cn.id];
        const z = rowsZ[i];
        const ped = F3.group(w.scene, 4.95, 0, z);
        F3.Cy(ped, 1.05, 0.2, F3.toy('#b06cff'), 0, 0.1, 0).receiveShadow = true;
        F3.Cy(ped, 1.1, 0.05, F3.toy('#ffffff'), 0, 0.22, 0);
        const name = F3.label(cn.name, { height: 0.42, size: 96, color: '#2a1f3d' });
        name.position.set(4.95, 0.45, z + 1.05); w.scene.add(name);
        // the country's flag on a little pole just left of its stand (clear of everything), leaning
        // back towards the camera so the whole flag is seen properly from above
        const fl = F3.flags.add(w, null, cn.flag, 0.62, { poleLen: 1.25, amp: 0.05, maxW: 1.0 });
        fl.group.position.set(2.95, 0.05, z + 0.15);
        fl.group.rotation.x = -0.85;
        const g = F3.mapkit.piece(w, cn.id, k);
        // small countries (Bhutan, Nepal…) are shown much bigger on their stand, so little hands can grab them
        const P = { cn, g, name, hs: Math.min(1.75 / (c.bbox.w * k), 1.35 / (c.bbox.h * k), 6), placed: false, sel: false };
        P.home = new T.Vector3(4.95, 0.3, z);
        P.T = board.center(cn.id);
        P.tol = Math.max(0.75, 0.22 * Math.max(c.bbox.w, c.bbox.h) * k);
        g.position.copy(P.home); g.scale.setScalar(P.hs);
        g.traverse(o => { if (o.isMesh) o.userData.piece = P; });
        return P;
      });
      w.onUpdate((dt, t) => this.pieces.forEach((P, i) => {
        if (P.drag || P.placed || P.moving) return;
        P.g.rotation.y = Math.sin(t * 1.2 + i) * 0.25;
        P.g.position.y = P.home.y + Math.abs(Math.sin(t * 2 + i)) * 0.12;
        P.g.userData.inner.position.y = P.sel ? Math.abs(Math.sin(t * 6)) * 0.25 : 0;
      }));
      // a small country shown big on its stand stays a flat piece (not a tall block)
      w.onUpdate(() => this.pieces.forEach(P => { if (!P.placed) P.g.scale.y = Math.min(P.g.scale.x, 1.6); }));

      let D = null;
      this.input({
        down: p => {
          if (this.finished) return false;
          const hit = w.pick(p.x, p.y, this.pieces.filter(q => !q.placed && !q.moving).map(q => q.g));
          if (hit) {
            const P = hit.object.userData.piece;
            FF.audio.sfx('pick'); this.hints.reset();
            const q = w.atY(p.x, p.y, 1.0);
            D = { P, sx: p.x, sy: p.y, moved: false, off: new T.Vector3(P.g.position.x - q.x, 0, P.g.position.z - q.z).multiplyScalar(0.3) };
            P.drag = true;
            const s0 = P.g.scale.x, r0 = P.g.rotation.y;
            this.tween(0.16, kk => { P.g.scale.setScalar(FF.lerp(s0, 1.06, kk)); P.g.rotation.y = FF.lerp(r0, 0, kk); P.g.position.y = FF.lerp(P.home.y, 1.0, kk); });
            return true;
          }
          const sel = this.pieces.find(q => q.sel && !q.placed);
          if (sel) { this.tapPlace(sel, p); return true; }
          return false;
        },
        move: p => {
          if (!D) return;
          if (Math.hypot(p.x - D.sx, p.y - D.sy) > 8) D.moved = true;
          const q = w.atY(p.x, p.y, 1.0);
          D.P.g.position.set(q.x + D.off.x, 1.0, q.z + D.off.z);
        },
        up: () => {
          if (!D) return;
          const { P, moved } = D; D = null; P.drag = false;
          if (!moved) {                                    // a tap: pick this piece, then tap the map
            const was = P.sel;
            this.pieces.forEach(q => { q.sel = false; });
            P.sel = !was;
            this.backHome(P, false);
            return;
          }
          this.tryDrop(P);
        }
      });

      this.hints = new FF.Hints(this, {
        point: () => { const P = this.next(); if (!P) return; FF.say('mapHint', this.ctx); this.pointAt(w.toStage(P.T)); },
        glow: () => {},
        show: () => { const P = this.next(); if (P && !D) this.showMove(w.toStage(P.g.position), w.toStage(P.T)); }
      });
      this.hints.stop();
      (async () => {
        await FF.say('map3Put', {}, { hold: 400 });
        if (!this.alive || this.finished) return;
        this.hints.stopped = false; this.hints.reset();
      })();
    }
    next() { return this.pieces.find(P => !P.placed); }
    backHome(P, boing) {
      if (boing) FF.audio.sfx('boing');
      P.moving = true;
      const p0 = P.g.position.clone(), s0 = P.g.scale.x;
      this.tween(0.55, kk => { P.g.position.lerpVectors(p0, P.home, kk); P.g.scale.setScalar(FF.lerp(s0, P.hs, kk)); }, FF.ease.back).then(() => { P.moving = false; });
    }
    tryDrop(P) {
      if (Math.hypot(P.g.position.x - P.T.x, P.g.position.z - P.T.z) < P.tol) { this.snap(P); return; }
      this.backHome(P, true);
      if (P.g.position.x < 3.0) FF.say('mapNearly', {});
    }
    tapPlace(P, p) {
      const q = this.w.atY(p.x, p.y, 0);
      const c = FF.geo.countries[P.cn.id];
      const px = (q.x - this.board.ox) / this.k, py = (q.z - this.board.oz) / this.k;
      this.hints.reset();
      if (FF.inPoly(px, py, c.pts) || Math.hypot(q.x - P.T.x, q.z - P.T.z) < P.tol) {
        P.sel = false; P.moving = true;
        const p0 = P.g.position.clone(), s0 = P.g.scale.x;
        const top = P.T.clone().setY(1.2);
        this.tween(0.55, kk => { P.g.position.lerpVectors(p0, top, kk); P.g.position.y += Math.sin(kk * Math.PI) * 1.2; P.g.scale.setScalar(FF.lerp(s0, 1.04, kk)); P.g.rotation.y = 0; }, FF.ease.inOut)
          .then(() => { P.moving = false; this.snap(P); });
      } else { FF.audio.sfx('boing'); FF.say('mapNearly', {}); }
    }
    snap(P) {
      const w = this.w;
      P.placed = true; P.sel = false;
      this.hints.reset();
      const p0 = P.g.position.clone(), s0 = P.g.scale.x;
      this.tween(0.3, kk => { P.g.position.lerpVectors(p0, P.T, kk); P.g.scale.setScalar(FF.lerp(s0, 1, kk)); P.g.rotation.y = 0; }, FF.ease.in).then(() => {
        if (!this.alive) return;
        FF.audio.sfx('clunk');
        w.scene.remove(P.g);
        w.scene.remove(P.name);
        const node = this.board.fill(P.cn.id);
        this.tween(0.4, kk => node.scale.y = 1 + Math.sin(kk * Math.PI) * 0.35);
        F3.burst(w, P.T.clone().setY(0.4), ['#ffd23f', '#ff4d6d', '#3d9bff', '#7cdb5a'], 22, 3.2);
        if (this.pieces.every(q => q.placed)) this.allDone();
        else FF.say('mapHello', FF.ctxFor(P.cn), { hold: 300 });
      });
    }
    async allDone() {
      this.hints.stop();
      FF.audio.sfx('cheer');
      F3.confetti(this.w, new T.Vector3(-1.5, 5, 0.5), 14, 4, 140);
      this.banner('WELL DONE!', 150, 96);
      FF.pip.cheer();
      await FF.say('map3Done', {}, { hold: 600 });
      this.finish(400);
    }
  }
  FF.games.map3 = MapThree;
})(window.FF);
