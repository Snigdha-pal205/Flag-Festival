/* Game 2 — Flag Jigsaw (3D): Grumble's wind tore the flag; fit the chunky glossy pieces
   back into the wooden frame. Always cut 2 × 2 (4 pieces), never along the stripes.
   Never more than 4 pieces, and no extra pieces from other flags — it must stay easy.  */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;

  class Jigsaw extends FF.games.GameBase {
    start() {
      FF.audio.music('calm');
      const w = this.setWorld(FF.frontWorld({ ground: { stageX: 7, stageZ: -18 } }));
      const fd = this.fd;
      const grid = [2, 2];   // always 4 pieces (a 2 × 2 cut) — a little challenge, never more
      const H = Math.min(3.1, 4.8 * fd.h / fd.w), W = H * fd.w / fd.h;
      const s = this.s = W / fd.w;
      const cx = -1.25, cy = -0.1;
      const BL = this.BL = new T.Vector3(cx - W / 2, cy - H / 2, 0);
      this.W = W; this.H = H;

      // pole + wooden frame + soft backing
      const wood = F3.toy('#e0954f', { rough: 0.3 });
      F3.Cy(w.scene, 0.1, 3.4 + cy + H / 2 + 0.5, F3.toy('#c98a4b', { rough: 0.3 }), BL.x - 0.35, (-3.4 + cy + H / 2 + 0.5) / 2, -0.05);
      F3.S(w.scene, 0.18, F3.toy('#ffcf3a', { rough: 0.15 }), BL.x - 0.35, cy + H / 2 + 0.55, -0.05);
      const b = 0.22;
      [[W + 2 * b, b, cx, cy + H / 2 + b / 2], [W + 2 * b, b, cx, cy - H / 2 - b / 2], [b, H, cx - W / 2 - b / 2, cy], [b, H, cx + W / 2 + b / 2, cy]].forEach(q => F3.B(w.scene, q[0], q[1], 0.3, wood, q[2], q[3], 0));
      const back = F3.B(w.scene, W, H, 0.06, F3.toy('#fff3d9', { rough: 0.7 }), cx, cy, -0.1); back.receiveShadow = true;
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(c => F3.S(w.scene, 0.07, F3.toy('#ffd23f', { rough: 0.1 }), cx + c[0] * (W / 2 + b / 2), cy + c[1] * (H / 2 + b / 2), 0.17));

      const cuts = this.cuts = F3.flags.cutGrid(fd, grid[0], grid[1], (Math.random() * 1e6) | 0);
      if (this.level === 'easy') {
        cuts.forEach(c => {
          const pts = c.shape.getPoints(10).map(p => new T.Vector3(BL.x + p.x * s, BL.y + p.y * s, -0.04));
          const ln = new T.Line(new T.BufferGeometry().setFromPoints(pts.concat([pts[0]])), F3.ownMat(new T.LineDashedMaterial({ color: '#b08a6a', dashSize: 0.08, gapSize: 0.06 })));
          ln.computeLineDistances(); w.scene.add(ln);
        });
        this.example(200, 236, 0.7);
      }

      this.makeFriend(w, -5.3, -3.4, -0.4, 2.1);
      this.friend.turn(0.4);
      FF.pip.show(80, 706, 0.95);
      FF.pip.spot = { x: 150, bottom: 742, w: 420, tail: 'left' };   // under the frame, beside Pip — never on the pieces

      // a glossy board on the right where the pieces wait
      const z = 0.7;
      const tl = w.atZ(905, 180, z), br = w.atZ(1195, 575, z);
      const brd = F3.B(w.scene, br.x - tl.x + 0.3, tl.y - br.y + 0.3, 0.12, F3.ownMat(new T.MeshStandardMaterial({ map: (() => { const t = F3.woodTex('#c98a4e'); t.repeat.set(1, 3); return t; })(), roughness: 0.85 })), (tl.x + br.x) / 2, (tl.y + br.y) / 2, z - 0.3);
      brd.receiveShadow = true;

      const list = cuts.map(c => Object.assign({}, c, { real: true }));
      const order = FF.shuffle(list);
      const n = order.length, cols = n <= 2 ? 1 : 2, rows = Math.ceil(n / cols);
      const cw = (br.x - tl.x) / cols, ch = (tl.y - br.y) / rows;
      this.pieces = order.map((pc, k) => {
        const ci = k % cols, ri = Math.floor(k / cols);
        const g = new T.Group();
        g.add(F3.flags.pieceMesh(fd, pc, pc.real ? this.flagId : pc.other));
        w.scene.add(g);
        const hs = Math.min(s * 0.92, 0.85 * cw / pc.pw, 0.85 * ch / pc.ph);
        const P = Object.assign(pc, { g, hs, home: new T.Vector3(tl.x + cw * (ci + 0.5) + FF.rand(-0.08, 0.08), tl.y - ch * (ri + 0.5), z), hr: FF.rand(-0.3, 0.3), placed: false });
        P.target = new T.Vector3(BL.x + pc.cx * s, BL.y + pc.cy * s, 0.0);
        g.position.copy(P.home); g.scale.setScalar(hs); g.rotation.z = P.hr;
        g.traverse(o => { if (o.isMesh) o.userData.piece = P; });
        return P;
      });

      let D = null;
      this.input({
        down: (p) => {
          if (this.done) return false;
          const hit = w.pick(p.x, p.y, this.pieces.filter(q => !q.placed && !q.moving).map(q => q.g));
          if (!hit) return false;
          const P = hit.object.userData.piece;
          FF.audio.sfx('pick'); this.hints.reset();
          const q = w.atZ(p.x, p.y, 1.2);
          D = { P, off: new T.Vector3(P.g.position.x - q.x, P.g.position.y - q.y, 0).multiplyScalar(0.5) };
          this.dragging = true;
          const s0 = P.g.scale.x, r0 = P.g.rotation.z;
          this.tween(0.15, kk => { P.g.scale.setScalar(FF.lerp(s0, s * 1.05, kk)); P.g.rotation.z = FF.lerp(r0, 0, kk); });
          return true;
        },
        move: (p) => { if (!D) return; const q = w.atZ(p.x, p.y, 1.2); D.P.g.position.set(q.x + D.off.x, q.y + D.off.y, 1.2); D.P.g.rotation.x = 0.15; },
        up: () => { if (!D) return; const P = D.P; D = null; this.dragging = false; P.g.rotation.x = 0; this.drop(P); }
      });

      this.hints = new FF.Hints(this, {
        point: () => { const P = this.next(); if (!P) return; FF.say('jigsawHint', this.ctx); this.pointAt(w.toStage(P.g.position)); },
        glow: () => { const P = this.next(); if (!P) return; this.glowSlot(P); if (this.level === 'normal' && !this._ex) { this._ex = true; this.example(200, 236, 0.7); } },
        show: () => { const P = this.next(); if (P && !D) this.showMove(w.toStage(P.g.position), w.toStage(P.target)); }
      });
      this.hints.stop();
      (async () => {
        this.friend.play('hop');
        await FF.say('jigsawIntro', this.ctx);
        if (!this.alive || this.done) return;
        this.hints.stopped = false; this.hints.reset();
      })();
    }
    next() { return this.pieces.find(p => p.real && !p.placed); }
    glowSlot(P) {
      if (this._glow) this.w.scene.remove(this._glow);
      const pts = P.shape.getPoints(10).map(p => new T.Vector3(this.BL.x + p.x * this.s, this.BL.y + p.y * this.s, 0));
      const mat = F3.ownMat(new T.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffb21f', emissiveIntensity: 0.8 }));
      const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 120, 0.035, 6, true), mat);
      this.w.scene.add(m); this._glow = m;
      const stop = this.w.onUpdate((dt, t) => { mat.emissiveIntensity = 0.5 + Math.sin(t * 7) * 0.5; if (!m.parent) stop(); });
    }
    back(P, boing) {
      if (boing) FF.audio.sfx('boing');
      P.moving = true;
      const p0 = P.g.position.clone(), s0 = P.g.scale.x;
      this.tween(0.5, kk => { P.g.position.lerpVectors(p0, P.home, kk); P.g.scale.setScalar(FF.lerp(s0, P.hs, kk)); P.g.rotation.z = FF.lerp(0, P.hr, kk); }, FF.ease.back).then(() => { P.moving = false; });
    }
    drop(P) {
      const pos = P.g.position;
      const over = pos.x > this.BL.x - 0.4 && pos.x < this.BL.x + this.W + 0.4 && pos.y > this.BL.y - 0.4 && pos.y < this.BL.y + this.H + 0.4;
      if (!P.real) {
        this.back(P, over);
        if (over && !this._saidExtra) { this._saidExtra = true; FF.say('jigsawExtra', this.ctx); FF.audio.sfx('giggle'); }
        return;
      }
      const a = this.w.toStage(pos), bb = this.w.toStage(P.target);
      if (Math.hypot(a.x - bb.x, a.y - bb.y) < 52) {
        P.placed = true;
        if (this._glow) { this.w.scene.remove(this._glow); this._glow = null; }
        const p0 = pos.clone(), s0 = P.g.scale.x;
        this.tween(0.18, kk => { P.g.position.lerpVectors(p0, P.target, kk); P.g.scale.setScalar(FF.lerp(s0, this.s, kk)); }).then(() => {
          FF.audio.sfx('clunk');
          this.tween(0.25, kk => { P.g.position.z = Math.sin(kk * Math.PI) * 0.15; });
          F3.burst(this.w, P.target.clone().setZ(0.4), ['#ffd23f', '#ffffff', '#3d9bff'], 10, 2);
          if (this.pieces.filter(p => p.real).every(p => p.placed)) this.complete();
          else if (Math.random() < 0.6) this.praise();
        });
      } else this.back(P, over);
    }
    async complete() {
      this.done = true;
      this.hints.stop();
      const w = this.w;
      this.pieces.filter(p => !p.real).forEach(p => this.tween(0.3, kk => p.g.scale.setScalar(Math.max(0.001, p.hs * (1 - kk)))));
      FF.audio.sfx('stitch'); this.after(260, () => FF.audio.sfx('stitch'));
      await this.wait(700);
      if (!this.alive) return;
      // the mended flag waves
      const f = F3.flags.add(w, null, this.flagId, this.H, { pole: false, amp: 0.05 });
      f.group.position.set(this.BL.x, this.BL.y + this.H, 0.12);
      this.pieces.forEach(p => w.scene.remove(p.g));
      FF.audio.sfx('drumroll', 0.6); FF.audio.sfx('cheer');
      F3.confetti(w, new T.Vector3(-1.2, 4.5, 0.5), 10, 2, 100);
      FF.pip.say(this.country.name + '!', { key: 'country_' + this.country.id, hold: 700 });
      await this.wait(2200);
      if (!this.alive) return;
      this.finish(300);
    }
  }
  FF.games.jigsaw = Jigsaw;
})(window.FF);
