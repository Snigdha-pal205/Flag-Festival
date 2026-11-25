/* Game 4 — Build a Flag (3D): drag glossy felt parts (stripes, circle, triangle, crescent,
   star, eagle) onto the white cloth. Parts on top only stick after the stripes under them. */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;

  class Build extends FF.games.GameBase {
    start() {
      FF.audio.music('calm');
      const w = this.setWorld(FF.frontWorld({ ground: { stageX: 7, stageZ: -18 } }));
      const fd = this.fd;
      const H = Math.min(2.85, 5.6 * fd.h / fd.w), W = H * fd.w / fd.h;
      const s = this.s = W / fd.w;
      const cx = -0.55 + (5.6 - W) * 0, cy = 0.75;
      const BL = this.BL = new T.Vector3(cx - W / 2, cy - H / 2, 0);
      this.W = W; this.H = H;

      // the pole and the blank white cloth
      const poleX = BL.x - 0.12;
      F3.Cy(w.scene, 0.1, cy + H / 2 + 0.3 + 3.4, F3.toy('#c98a4b', { rough: 0.3 }), poleX, (cy + H / 2 + 0.3 - 3.4) / 2, 0);
      F3.S(w.scene, 0.18, F3.toy('#ffcf3a', { rough: 0.15 }), poleX, cy + H / 2 + 0.36, 0);
      const ct = F3.canvasTex(512, Math.round(512 * fd.h / fd.w), (ctx, cw, chh) => {
        ctx.fillStyle = '#fbfaf6'; ctx.fillRect(0, 0, cw, chh);
        ctx.globalAlpha = 0.06; ctx.strokeStyle = '#000';
        for (let x = 0; x < cw; x += 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, chh); ctx.stroke(); }
        for (let y = 0; y < chh; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
        ctx.globalAlpha = 0.5; ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = '#c9c2b4'; ctx.strokeRect(10, 10, cw - 20, chh - 20);
      });
      const cloth = F3.B(w.scene, W, H, 0.05, F3.ownMat(new T.MeshStandardMaterial({ map: ct, roughness: 0.85 })), cx, cy, -0.03);
      cloth.receiveShadow = true;
      this.cloth = cloth;
      this.guides = F3.group(w.scene);
      if (this.level === 'easy') this.showGuides();
      this.referenceCard(1000, 110);

      this.makeFriend(w, -5.6, -3.4, -0.4, 2.2);
      this.friend.turn(0.45);
      FF.pip.show(1206, 708, 1.0);

      // the tray
      const tz = w.atY(640, 672, -3.4).z;          // the tray sits on the grass, near the bottom of the screen
      const tl = w.atZ(330, 560, tz), br = w.atZ(1130, 690, tz);
      const trayY = -3.4 + 0.28;
      const tw = F3.woodTex('#b9773f'); tw.repeat.set(4, 1);
      const tray = F3.B(w.scene, br.x - tl.x + 0.8, 0.28, 1.2, F3.ownMat(new T.MeshStandardMaterial({ map: tw, roughness: 0.85 })), (tl.x + br.x) / 2, trayY - 0.14, tz - 0.1);
      tray.receiveShadow = true;
      F3.B(w.scene, br.x - tl.x + 0.8, 0.22, 0.14, F3.toy('#8a5a32'), (tl.x + br.x) / 2, trayY + 0.06, tz + 0.5);

      let list = fd.parts.map((p, idx) => ({ part: p, idx, real: true }));
      if (this.level === 'hard') list = list.concat(this.distractors());
      list = FF.shuffle(list);
      const n = list.length;
      const rowsN = n > 5 ? 2 : 1, perRow = Math.ceil(n / rowsN);
      const slotW = (br.x - tl.x) / perRow;
      const rowH = rowsN === 1 ? 1.1 : 0.62;
      this.parts = list.map((P, k) => {
        const row = Math.floor(k / perRow), col = k % perRow;
        const inRow = row === rowsN - 1 ? n - perRow * (rowsN - 1) : perRow;
        const g = F3.flags.partMesh(fd, P.part);
        w.scene.add(g);
        const b = F3.flags.box(P.part.shape);
        // an invisible grab area over the whole piece: hollow shapes (the crescent!) and thin
        // pieces can be picked up by tapping anywhere on or inside them
        const pad = Math.max(b.w, b.h) * 0.12;
        const hit = new T.Mesh(new T.PlaneGeometry(b.w + pad, b.h + pad), F3.ownMat(new T.MeshBasicMaterial({ visible: false })));
        hit.position.z = 2; g.add(hit);
        let hs = Math.min(slotW * 0.8 / b.w, rowH * 0.85 / b.h, s);
        if (Math.max(b.w, b.h) * hs < 0.7) hs = Math.min(s * 1.25, 0.7 / Math.max(b.w, b.h));
        const midX = (tl.x + br.x) / 2;
        const x = midX + (col - (inRow - 1) / 2) * slotW;
        const y = rowsN === 1 ? trayY + b.h * hs / 2 + 0.05 : trayY + 0.08 + rowH * (row === 0 ? 1.55 : 0.5);
        Object.assign(P, { g, hs, home: new T.Vector3(x, y, tz - (rowsN > 1 && row === 0 ? 0.35 : 0)), hr: FF.rand(-0.15, 0.15), placed: false, c: g.userData.center });
        P.target = new T.Vector3(BL.x + P.c.x * s, BL.y + P.c.y * s, 0.02 + (P.idx || 0) * 0.035);
        g.position.copy(P.home); g.scale.setScalar(hs); g.rotation.z = P.hr;
        g.traverse(o => { if (o.isMesh) o.userData.part = P; });
        return P;
      });
      this.placed = new Set();
      w.onUpdate((dt, t) => this.parts.forEach((P, i) => { if (!P.placed && !P.drag && !P.moving) P.g.rotation.y = Math.sin(t * 1.5 + i) * 0.15; }));

      let D = null;
      this.input({
        down: (p) => {
          if (this.done) return false;
          const hit = w.pick(p.x, p.y, this.parts.filter(q => !q.placed && !q.moving).map(q => q.g));
          if (!hit) return false;
          const P = hit.object.userData.part;
          FF.audio.sfx('pick'); this.hints.reset();
          const q = w.atZ(p.x, p.y, 1.6);
          D = { P, off: new T.Vector3(P.g.position.x - q.x, P.g.position.y - q.y, 0).multiplyScalar(0.4) };
          P.drag = true; this.dragging = true;
          const s0 = P.g.scale.x, r0 = P.g.rotation.z;
          this.tween(0.16, kk => { P.g.scale.setScalar(FF.lerp(s0, s * 1.03, kk)); P.g.rotation.z = FF.lerp(r0, 0, kk); P.g.rotation.y = 0; });
          return true;
        },
        move: (p) => { if (!D) return; const q = w.atZ(p.x, p.y, 1.6); D.P.g.position.set(q.x + D.off.x, q.y + D.off.y, 1.6); },
        up: () => { if (!D) return; const P = D.P; D = null; P.drag = false; this.dragging = false; this.drop(P); }
      });

      this.hints = new FF.Hints(this, {
        point: () => { const P = this.nextPart(); if (!P) return; FF.say('buildHint', this.ctx); this.pointAt(w.toStage(P.g.position)); },
        glow: () => { const P = this.nextPart(); if (!P) return; if (this.level !== 'hard') this.showGuides(); this.glowTarget(P); },
        show: () => { const P = this.nextPart(); if (P && !D) this.showMove(w.toStage(P.g.position), w.toStage(P.target)); }
      });
      this.hints.stop();
      (async () => {
        this.friend.play('hop');
        await FF.say('buildIntro', this.ctx);
        if (!this.alive || this.done) return;
        this.hints.stopped = false; this.hints.reset();
      })();
    }
    distractors() {
      const fd = this.fd;
      const cols = FF.flags.colours(this.flagId);
      const wrongC = ['blue', 'green', 'yellow', 'orange', 'pink', 'purple'].filter(c => !cols.includes(c));
      const c1 = wrongC[0], c2 = wrongC[1] || 'pink';
      const stripe = fd.parts.find(p => p.stripe) || fd.parts[0];
      const star = fd.parts.find(p => p.shape.t === 'star');
      const d1 = { id: 'x1', label: c1 + ' stripe', colour: c1, hex: FF.C.paints[c1], shape: Object.assign({}, stripe.shape) };
      const d2 = star
        ? { id: 'x2', label: 'extra star', colour: star.colour, hex: star.hex, shape: Object.assign({}, star.shape, { cx: fd.w * 0.2, cy: fd.h * 0.25 }) }
        : { id: 'x2', label: c2 + ' star', colour: c2, hex: FF.C.paints[c2], shape: { t: 'star', cx: fd.w * 0.5, cy: fd.h * 0.5, R: 24, rot: -90 } };
      return [{ part: d1, real: false }, { part: d2, real: false }];
    }
    nextPart() { return this.parts.find(P => P.real && !P.placed && (P.part.needs || []).every(id => this.placed.has(id))); }
    outlinePts(sh) {
      if (sh.t === 'eagle') { const b = FF.flags.shapeBox(sh); return [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]].map(p => new T.Vector2(p[0], this.fd.h - p[1])); }
      return F3.flags.shape(sh, this.fd.h).getPoints(16);
    }
    showGuides() {
      if (this._guides) return;
      this._guides = true;
      this.fd.parts.forEach(p => {
        const pts = this.outlinePts(p.shape).map(q => new T.Vector3(this.BL.x + q.x * this.s, this.BL.y + q.y * this.s, 0.0));
        const ln = new T.Line(new T.BufferGeometry().setFromPoints(pts.concat([pts[0]])), F3.ownMat(new T.LineDashedMaterial({ color: '#9a8f80', dashSize: 0.08, gapSize: 0.06 })));
        ln.computeLineDistances(); this.guides.add(ln);
      });
    }
    example(sx, sy, h) { return super.example(sx, sy, h); }
    glowTarget(P) {
      if (this._glow) this.w.scene.remove(this._glow);
      const pts = this.outlinePts(P.part.shape).map(q => new T.Vector3(this.BL.x + q.x * this.s, this.BL.y + q.y * this.s, 0.05));
      const mat = F3.ownMat(new T.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffb21f', emissiveIntensity: 0.8 }));
      const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true, 'catmullrom', 0.05), 160, 0.035, 6, true), mat);
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
      const fd = this.fd, pos = P.g.position;
      const over = pos.x > this.BL.x - 0.3 && pos.x < this.BL.x + this.W + 0.3 && pos.y > this.BL.y - 0.3 && pos.y < this.BL.y + this.H + 0.3;
      if (!P.real) {
        this.back(P, over);
        if (over) { const now = performance.now(); if (!this._lw || now - this._lw > 3000) { this._lw = now; FF.say('buildWrong', this.ctx); } }
        return;
      }
      const a = this.w.toStage(pos), bb = this.w.toStage(P.target);
      if (Math.hypot(a.x - bb.x, a.y - bb.y) < 56) {
        const missing = (P.part.needs || []).filter(id => !this.placed.has(id));
        if (missing.length) {
          this.back(P, true);
          const parts = missing.map(m => fd.parts.find(p => p.id === m));
          if (parts.every(p => p.stripe)) FF.say('stripesFirst', this.ctx);
          else FF.say('partFirst', Object.assign({ part: parts.find(p => !p.stripe).label }, this.ctx));
          return;
        }
        this.snap(P);
      } else this.back(P, over);
    }
    snap(P) {
      P.placed = true;
      this.placed.add(P.part.id);
      if (this._glow) { this.w.scene.remove(this._glow); this._glow = null; }
      const p0 = P.g.position.clone(), s0 = P.g.scale.x;
      this.tween(0.18, kk => { P.g.position.lerpVectors(p0, P.target, kk); P.g.scale.setScalar(FF.lerp(s0, this.s, kk)); P.g.rotation.set(0, 0, 0); }).then(() => {
        FF.audio.sfx('stitch');
        this.tween(0.25, kk => { P.g.scale.setScalar(this.s * (1 + Math.sin(kk * Math.PI) * 0.06)); });
        F3.burst(this.w, P.target.clone().setZ(0.4), [P.part.hex, '#ffffff', '#ffd23f'], 10, 2);
        if (this.parts.filter(p => p.real).every(p => p.placed)) this.complete();
        else if (Math.random() < 0.5) this.praise();
      });
    }
    async complete() {
      this.done = true;
      this.hints.stop();
      const w = this.w;
      w.scene.remove(this.guides);
      this.parts.filter(p => !p.real).forEach(p => this.tween(0.3, kk => p.g.scale.setScalar(Math.max(0.001, p.hs * (1 - kk)))));
      await this.wait(500);
      if (!this.alive) return;
      // the friend lifts the flag high and it flaps in the wind
      const f = F3.flags.add(w, null, this.flagId, this.H, { pole: false, amp: 0.07, speed: 5 });
      f.group.position.set(this.BL.x, this.BL.y + this.H, 0.05);
      this.parts.filter(p => p.real).forEach(p => w.scene.remove(p.g));
      w.scene.remove(this.cloth);
      FF.audio.sfx('drumroll', 0.6);
      this.friend.play('happy');
      this.tween(0.7, kk => { f.group.position.y = this.BL.y + this.H + kk * 0.35; }, FF.ease.back);
      await this.wait(700);
      if (!this.alive) return;
      FF.audio.sfx('cheer'); FF.audio.sfx('whoosh');
      F3.confetti(w, new T.Vector3(-0.5, 4.5, 0.5), 12, 2, 110);
      this.praise();
      this.finish(2400);
    }
  }
  FF.games.build = Build;
})(window.FF);
