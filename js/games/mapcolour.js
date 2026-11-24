/* Game 1 — Map + Colour (3D)
   A: put the country piece back on the toy map · B: GOOD JOB! the flag waves big, Grumble
   rains on it · C: paint the grey flag with only the colours it needs.
   Game — Paint the Flag reuses part C on its own.                                       */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;
  const FL = () => F3.flags;
  const BLANK = '#dcd8e6';

  function gingham() {
    return F3.canvasTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,92,138,.45)';
      for (let i = 0; i < 8; i += 2) { ctx.fillRect(i * 32, 0, 32, h); ctx.fillRect(0, i * 32, w, 32); }
    });
  }

  class MapColour extends FF.games.GameBase {
    start() {
      FF.audio.music('calm');
      FF.pip.show(84, 704, 1.05);
      this.partA();
    }

    /* ================= Part A: the map puzzle ================= */
    partA() {
      const w = this.setWorld(new F3.World({ cam: [0.6, 10.6, 6.9], look: [0.6, 0, 0.75], fov: 42, sun: [3, 14, 7], shadowExt: 10, bg: 'ocean.jpg', shadowGround: -0.21 }));
      const tex = F3.woodTex('#c98a4e', 'rgba(110,60,20,.25)'); tex.repeat.set(3, 4); tex.rotation = Math.PI / 2;
      tex.dispose();
      const id = this.country.id, c = FF.geo.countries[id];
      const k = 0.0105;
      this.k = k;
      const board = this.board = F3.mapkit.board(w, { x: -1.75, z: 0.55, k, missing: id, labels: this.level !== 'hard', glow: this.level === 'easy' });
      this.T = board.center(id);

      // right side: a pedestal with the piece, the name, the flag
      const ped = F3.group(w.scene, 4.95, 0, -0.05);
      F3.Cy(ped, 1.45, 0.22, F3.toy('#b06cff'), 0, 0.11, 0).receiveShadow = true;
      F3.Cy(ped, 1.5, 0.06, F3.toy('#ffffff'), 0, 0.24, 0);
      const name = F3.label(this.country.name, { height: 0.62, size: 96, color: '#2a1f3d' });
      name.position.set(4.95, 0.45, 1.95); w.scene.add(name);
      const fl = F3.flags.add(w, null, this.flagId, 0.62, { poleLen: 1.5 });
      fl.group.position.set(3.55, 0, -1.9);
      this.makeFriend(w, 6.55, 0, -1.25, 1.9);

      const P = this.piece = { g: F3.mapkit.piece(w, id, k), hs: Math.min(2.4 / (c.bbox.w * k), 2.1 / (c.bbox.h * k), 1.9), placed: false, sel: false };
      P.home = new T.Vector3(4.95, 0.3, -0.05);
      P.g.position.copy(P.home); P.g.scale.setScalar(P.hs);
      this.tol = Math.max(0.75, 0.22 * Math.max(c.bbox.w, c.bbox.h) * k);
      w.onUpdate((dt, t) => { if (!P.drag && !P.placed && !P.moving) { P.g.rotation.y = Math.sin(t * 1.2) * 0.25; P.g.position.y = P.home.y + Math.abs(Math.sin(t * 2)) * 0.12; } });

      this.input({
        down: (p) => {
          if (P.placed || P.moving) return false;
          const hit = w.pick(p.x, p.y, [P.g]);
          if (hit) {
            FF.audio.sfx('pick'); this.hints.reset();
            P.drag = true; P.moved = false; P.sx = p.x; P.sy = p.y;
            const q = w.atY(p.x, p.y, 1.0);
            P.off = new T.Vector3(P.g.position.x - q.x, 0, P.g.position.z - q.z).multiplyScalar(0.3);
            const s0 = P.g.scale.x, r0 = P.g.rotation.y;
            this.tween(0.16, kk => { P.g.scale.setScalar(FF.lerp(s0, 1.06, kk)); P.g.rotation.y = FF.lerp(r0, 0, kk); P.g.position.y = FF.lerp(P.home.y, 1.0, kk); });
            return true;
          }
          if (P.sel) { this.tapPlace(p); return true; }
          return false;
        },
        move: (p) => {
          if (!P.drag) return;
          if (Math.hypot(p.x - P.sx, p.y - P.sy) > 8) P.moved = true;
          const q = w.atY(p.x, p.y, 1.0);
          P.g.position.set(q.x + P.off.x, 1.0, q.z + P.off.z);
        },
        up: () => {
          if (!P.drag) return;
          P.drag = false;
          if (!P.moved) { this.toggleSelect(); return; }
          this.tryDrop();
        }
      });

      this.hints = new FF.Hints(this, {
        point: () => { FF.say('mapHint', this.ctx); this.pointAt(w.toStage(this.T)); },
        glow: () => board.slot && board.slot.userData.setGlow(true),
        show: () => { if (!P.drag) this.showMove(w.toStage(P.g.position), w.toStage(this.T)); }
      });
      this.hints.stop();
      (async () => {
        this.friend.play('hop'); this.friend.sound();
        await FF.say('mapHello', this.ctx, { hold: 400 });
        if (!this.alive) return;
        await FF.say('mapPut', this.ctx);
        if (!this.alive || P.placed) return;
        this.hints.stopped = false; this.hints.reset();
      })();
    }
    toggleSelect() {
      const P = this.piece;
      P.sel = !P.sel;
      this.backHome(false);
      if (P.sel) { FF.audio.sfx('pick'); this.board.slot && this.board.slot.userData.setGlow(true); P.g.userData.inner.position.y = 0; }
    }
    backHome(boing) {
      const P = this.piece;
      if (boing) FF.audio.sfx('boing');
      P.moving = true;
      const p0 = P.g.position.clone(), s0 = P.g.scale.x;
      this.tween(0.55, kk => { P.g.position.lerpVectors(p0, P.home, kk); P.g.scale.setScalar(FF.lerp(s0, P.hs, kk)); }, FF.ease.back).then(() => { P.moving = false; });
    }
    tryDrop() {
      const P = this.piece;
      const d = Math.hypot(P.g.position.x - this.T.x, P.g.position.z - this.T.z);
      if (d < this.tol) { this.snap(); return; }
      this.backHome(true);
      if (P.g.position.x < 3.0) FF.say('mapNearly', this.ctx);
    }
    tapPlace(p) {
      const P = this.piece, w = this.w, c = FF.geo.countries[this.country.id];
      const q = w.atY(p.x, p.y, 0);
      const px = (q.x - this.board.ox) / this.k, py = (q.z - this.board.oz) / this.k;
      this.hints.reset();
      if (FF.inPoly(px, py, c.pts) || Math.hypot(q.x - this.T.x, q.z - this.T.z) < this.tol) {
        P.sel = false; P.moving = true;
        const p0 = P.g.position.clone(), s0 = P.g.scale.x;
        const top = this.T.clone().setY(1.2);
        this.tween(0.55, kk => { P.g.position.lerpVectors(p0, top, kk); P.g.position.y += Math.sin(kk * Math.PI) * 1.2; P.g.scale.setScalar(FF.lerp(s0, 1.04, kk)); P.g.rotation.y = 0; }, FF.ease.inOut)
          .then(() => { P.moving = false; this.snap(); });
      } else { FF.audio.sfx('boing'); FF.say('mapNearly', this.ctx); }
    }
    snap() {
      const P = this.piece, w = this.w;
      P.placed = true;
      this.hints.stop();
      const p0 = P.g.position.clone(), s0 = P.g.scale.x;
      this.tween(0.3, kk => { P.g.position.lerpVectors(p0, this.T, kk); P.g.scale.setScalar(FF.lerp(s0, 1, kk)); P.g.rotation.y = 0; }, FF.ease.in).then(() => {
        FF.audio.sfx('clunk');
        w.scene.remove(P.g);
        const node = this.board.fill(this.country.id);
        this.tween(0.4, kk => node.scale.y = 1 + Math.sin(kk * Math.PI) * 0.35);
        F3.burst(w, this.T.clone().setY(0.4), ['#ffd23f', '#ff4d6d', '#3d9bff', '#7cdb5a'], 22, 3.2);
        this.friend.play('happy');
        this.praise();
        this.after(1300, () => this.partB());
      });
    }

    /* ================= Part B: GOOD JOB! ================= */
    async partB() {
      await FF.ui.wipe(() => {
        const w = this.setWorld(FF.frontWorld({ ground: { stageX: 6, stageZ: -18 } }));
        this.input({});
        const fd = this.fd;
        const H = Math.min(3.3, 6.2 * fd.h / fd.w);
        const W = H * fd.w / fd.h;
        this.bigFlag = F3.flags.add(w, null, this.flagId, H, { poleLen: 1.75 + 3.4, poleR: 0.09, amp: 0.06 });
        this.bigFlag.group.position.set(-W / 2 - 0.2, -3.4 - 7, 0);
        this.bigW = W; this.bigH = H;
        this.makeFriend(w, 4.7, -3.4, -0.4, 2.4);
        this.friend.turn(-0.35);
      });
      if (!this.alive) return;
      const w = this.w, f = this.bigFlag;
      FF.audio.sfx('drumroll', 0.9);
      await this.tween(0.7, kk => { f.group.position.y = -3.4 - 7 * (1 - kk); }, FF.ease.backBig);
      if (!this.alive) return;
      this.banner('GOOD JOB!', 150, 104);
      FF.audio.sfx('cheer');
      F3.confetti(w, new T.Vector3(0, 4.5, 0.5), 14, 2.5, 140);
      this.friend.play('happy');
      await this.wait(1000);
      if (!this.alive) return;
      this.layer.top.innerHTML = '';
      await FF.say('lookFlag', this.ctx, { hold: 600 });
      if (!this.alive) return;
      await this.wait(2200);
      if (!this.alive) return;
      // Grumble floats over and rains on it
      const gr = F3.chars.add(w, 'grumble');
      gr.setHeight(1.7).place(9, 0.75, 0.8).setBase('float');
      await this.tween(1.1, kk => gr.place(FF.lerp(9, 0.2, kk), 0.75, 0.8), FF.ease.inOut);
      if (!this.alive) return;
      gr.setFace('giggle'); FF.audio.sfx('giggle'); FF.audio.sfx('rain');
      F3.rain(w, -2.0, 2.4, 1.35, -3.4, 0.7, 1.8);
      await this.wait(900);
      f.setMode('grey');
      FF.audio.sfx('thunderlet');
      F3.burst(w, new T.Vector3(0, 0.4, 0.5), ['#a9a4b4', '#c4bfcd'], 16, 2.5);
      await this.wait(700);
      gr.setFace('sulk');
      FF.pip.char.play('hop');
      FF.say('rainOh', this.ctx, { hold: 500 });
      this.tween(1.0, kk => gr.place(FF.lerp(0.2, -10, kk), 0.75 + kk * 1.5, 0.8), FF.ease.in);
      await this.wait(1900);
      if (!this.alive) return;
      await this.tween(0.45, kk => { f.group.position.y = -3.4 - 7 * kk; }, FF.ease.in);
      this.w.scene.remove(f.group);
      this.partC();
    }

    /* ================= Part C: paint the flag ================= */
    partC(fresh) {
      if (fresh) this.setWorld(FF.frontWorld({ ground: { stageX: 6, stageZ: -18 } }));
      const w = this.w;
      if (this.friend) { w.scene.remove(this.friend.root); w.chars = (w.chars || []).filter(c => c !== this.friend); this.friend = null; }
      const fd = this.fd, id = this.country.id;
      FF.hud.title(this.layer.top, this.title || "Now let's colour the flag!", 640, 132, 54, { seed: 9 });
      FF.say(this.colourLine || 'colourNow', this.ctx, { hold: 600 });

      // the paintable cloth
      const cv = FL().canvas(this.flagId, 1024);
      this.cv = cv;
      this.paintBlank();
      const tex = new T.CanvasTexture(cv.c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
      this.tex = tex;
      const H = Math.min(3.0, 5.6 * fd.h / fd.w), W = H * fd.w / fd.h;
      const flag = this.cflag = F3.flags.add(w, null, this.flagId, H, { tex, poleLen: 1.6 + 3.4, poleR: 0.09, amp: 0.05 });
      flag.mat.map.userData.keep = false;
      flag.strength = 0.18;
      flag.group.position.set(-W / 2 + 0.25, -3.4, 0);
      flag.group.scale.setScalar(0.001);
      this.tween(0.55, kk => flag.group.scale.setScalar(Math.max(0.001, kk)), FF.ease.back);

      // the country on a white card, top-left: bright colour, bold outline
      this.countryCard(this.layer.top, 22, 168);

      // a shelf of paint jars: ONLY the colours that are in this flag — never any extra colour
      const need = FF.flags.colours(this.flagId);
      let pots = need.map(cn => ({ colour: cn, hex: FF.flags.paintHex(this.flagId, cn) }));
      pots = FF.shuffle(pots);
      const z = 2.4, shelfY = w.atZ(640, 622, z).y;
      const left = w.atZ(330, 650, z), right = w.atZ(1000, 650, z);
      const shelf = F3.B(w.scene, right.x - left.x + 1.6, 0.18, 1.2, F3.toy('#ff9f1c', { rough: 0.35 }), (left.x + right.x) / 2, shelfY - 0.09, z);
      shelf.receiveShadow = true;
      this.pots = pots.map((pt, i) => {
        const x = pots.length === 1 ? (left.x + right.x) / 2 : FF.lerp(left.x, right.x, i / (pots.length - 1));
        const g = FF.paintPot(w, pt.hex);
        g.position.set(x, shelfY, z); g.scale.setScalar(0.62);
        w.scene.add(g);
        const lab = F3.label(pt.colour, { height: 0.24, size: 64, color: '#2a1f3d' });
        lab.position.set(x, shelfY - 0.28, z + 0.5); w.scene.add(lab);
        return Object.assign(pt, { g, x, lift: 0 });
      });
      w.onUpdate((dt, t) => this.pots.forEach((p, i) => { const target = p === this.sel ? 1 : 0; p.lift += (target - p.lift) * Math.min(1, dt * 12); p.g.position.y = shelfY + p.lift * 0.35 + (p === this.sel ? Math.sin(t * 6) * 0.04 : 0); p.g.rotation.y = p === this.sel ? t * 1.5 : Math.sin(t + i) * 0.1; if (p.wig > 0) { p.wig -= dt; p.g.rotation.z = Math.sin(p.wig * 30) * 0.2; } else p.g.rotation.z = 0; }));

      this.areas = FF.flags.areas(this.flagId);
      this.wrongs = 0;
      this.flips = 0;
      this.progress = 0;
      this.flipCard(1000, 168);
      this.hitCtx = document.createElement('canvas').getContext('2d');

      this.input({
        down: (p) => {
          if (this.cDone) return false;
          const pot = w.pick(p.x, p.y, this.pots.map(q => q.g));
          if (pot) { const jar = this.pots.find(q => q.g === pot.object.userData.pot); if (jar) this.selectPot(jar); return true; }
          const hit = w.pick(p.x, p.y, [flag.cloth]);
          if (hit && hit.uv) { this.tapFlag(hit); return true; }
          return false;
        }
      });
      this.hints = new FF.Hints(this, {
        point: () => { const a = this.nextArea(); if (!a) return; FF.say('colourHint', this.ctx); const pot = this.pots.find(q => q.colour === a.colour); if (pot) { pot.wig = 0.6; this.pointAt(w.toStage(pot.g.position.clone().add(new T.Vector3(0, 0.9, 0)))); } },
        glow: () => { const a = this.nextArea(); if (a) { this.glowArea = a; const pot = this.pots.find(q => q.colour === a.colour); if (pot) pot.wig = 1; } },
        show: () => { const a = this.nextArea(); if (!a) return; const pot = this.pots.find(q => q.colour === a.colour); if (pot) this.showMove(w.toStage(pot.g.position.clone().add(new T.Vector3(0, 0.6, 0))), this.areaStage(a)); }
      });
      // glowing outline on the hinted area
      w.onUpdate((dt, t) => {
        if (!this.glowArea || this.glowArea.filled || this.cDone) { if (this._glowOn) { this._glowOn = false; this._glowNow = null; this.repaint(); } return; }
        this._glowOn = true;
        this._glowNow = this.glowArea; this._glowK = 0.5 + Math.sin(t * 7) * 0.5;
        this.repaint();
      });
    }
    /* The flag is always redrawn from scratch, bottom part first (stripes → circle →
       crescent/star/eagle), so a colour painted later can never cover one painted before. */
    paintBlank() { this.repaint(); }
    repaint() {
      const { ctx } = this.cv, fd = this.fd;
      ctx.clearRect(0, 0, fd.w, fd.h);
      ctx.fillStyle = BLANK; ctx.fillRect(0, 0, fd.w, fd.h);
      fd.parts.forEach(part => {
        const f = part._paint;                       // { x, y, r, R, hex } once painted
        if (part.shape.t === 'eagle') { FL().drawPart(ctx, part, f && f.r >= f.R ? f.hex : BLANK, { line: f && f.hex === part.hex ? null : 'rgba(0,0,0,.3)' }); return; }
        const path = FL().path(part.shape);
        ctx.save(); ctx.clip(path);
        ctx.fillStyle = BLANK; ctx.fillRect(0, 0, fd.w, fd.h);
        if (!f || f.r < f.R) {                        // rain streaks on the parts still grey
          ctx.globalAlpha = 0.3; ctx.strokeStyle = '#9b96aa'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
          for (let i = 0; i < 90; i++) { const x = (i * 37) % fd.w, y = (i * 53) % fd.h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2.5, y + 8); ctx.stroke(); }
          ctx.globalAlpha = 1;
        }
        if (f) {
          if (f.under) { ctx.fillStyle = f.under; ctx.fillRect(0, 0, fd.w, fd.h); }   // the colour it had before a repaint
          ctx.fillStyle = f.hex; ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(0.5, f.r), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      });
      this.redrawLines(this._glowNow, this._glowK);
    }
    redrawLines(glowArea, gk) {
      const { ctx } = this.cv, fd = this.fd;
      ctx.save();
      ctx.lineJoin = 'round';
      fd.parts.forEach(p => {
        if (p.shape.t === 'eagle') return;
        const isGlow = glowArea && glowArea.parts.includes(p);
        ctx.strokeStyle = isGlow ? `rgba(255,178,31,${0.4 + gk * 0.6})` : '#2a1f3d';
        ctx.lineWidth = isGlow ? 6 : 2.6;
        ctx.stroke(FL().path(p.shape));
      });
      ctx.strokeStyle = '#2a1f3d'; ctx.lineWidth = 4; ctx.strokeRect(1, 1, fd.w - 2, fd.h - 2);
      ctx.restore();
      if (this.tex) this.tex.needsUpdate = true;
    }
    nextArea() { return this.areas.find(a => !a.filled); }
    areaStage(a) {
      const b = FF.flags.shapeBox(a.parts[0].shape);
      const f = this.cflag;
      const v = new T.Vector3((b.x + b.w / 2) / this.fd.w * f.W, -(b.y + b.h / 2) / this.fd.h * f.H, 0);
      return this.w.toStage(f.cloth.localToWorld(v));
    }
    selectPot(p) {
      if (this.cDone) return;
      this.hints.reset();
      FF.audio.sfx('pick');
      this.sel = p;
      FF.pip.tip(p.hex);
      F3.burst(this.w, p.g.position.clone().add(new T.Vector3(0, 0.6, 0)), p.hex, 8, 1.6);
      FF.audio.say(p.colour + '!', { who: 'pip', key: 'colour_' + p.colour, fast: true });
    }
    areaAt(x, y) {
      const parts = this.fd.parts, hc = this.hitCtx;
      const areaOf = p => this.areas.find(a => a.parts.includes(p));
      // the part really under the finger (topmost first)
      let exact = null;
      for (let i = parts.length - 1; i >= 0; i--) if (hc.isPointInPath(FL().path(parts[i].shape), x, y)) { exact = parts[i]; break; }
      // small crescents/stars get a little extra room — but only while they're still unpainted
      if (!exact || !(exact.area || exact.shape.t === 'star' || exact.shape.t === 'crescent')) {
        hc.lineWidth = 14;
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          if (!(p.area || p.shape.t === 'star' || p.shape.t === 'crescent')) continue;
          const a = areaOf(p);
          if (a && !a.paintColour && hc.isPointInStroke(FL().path(p.shape), x, y)) return a;
        }
      }
      return exact ? areaOf(exact) : null;
    }
    tapFlag(hit) {
      this.hints.reset();
      const x = hit.uv.x * this.fd.w, y = (1 - hit.uv.y) * this.fd.h;
      const area = this.areaAt(x, y);
      if (!area) return;
      if (!this.sel) {
        FF.audio.sfx('boing'); FF.say('pickColour', this.ctx);
        this.pots.forEach(p => { p.wig = 0.6; });
        return;
      }
      if (area.paintColour === this.sel.colour) { FF.audio.sfx('tap'); return; }
      this.fillArea(area, x, y, this.sel);
    }
    fillArea(area, qx, qy, pot) {
      pot = pot || { colour: area.colour, hex: area.hex };
      const right = pot.colour === area.colour;
      area.paintColour = pot.colour;
      area.filled = right;
      if (this.glowArea === area && right) this.glowArea = null;
      FF.audio.sfx('splosh');
      area.parts.forEach(part => {
        const b = FF.flags.shapeBox(part.shape);
        const R = Math.max(...[[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].map(c => Math.hypot(c[0] - qx, c[1] - qy))) + 6;
        const prev = part._paint && part._paint.r >= part._paint.R ? part._paint.hex : null;
        // the right colour is the flag's exact colour; a wrong one is the jar's colour
        part._paint = { x: qx, y: qy, r: 0, R, hex: right ? part.hex : pot.hex, under: prev };
        this.tween(0.5, kk => { part._paint.r = R * kk; this.repaint(); }, FF.ease.out);
      });
      F3.burst(this.w, this.cflag.cloth.localToWorld(new T.Vector3(qx / this.fd.w * this.cflag.W, -qy / this.fd.h * this.cflag.H, 0.2)), area.hex.toUpperCase() === '#FFFFFF' ? ['#ffffff', '#e8f6ff'] : area.hex, 12, 2.2);
      this.setProgress();
      if (this.friend && right) { this.friend.play('celebrate'); this.friend.sound(); }
      if (!right) {
        this.wrongs++;
        if (this.wrongs >= 3) { this.wrongs = 0; FF.say('cardHelp', this.ctx, { hold: 900 }); this.showFlag(true); }
      }
      if (this.areas.every(a => a.filled)) this.after(650, () => this.colourDone());
      else if (right && Math.random() < 0.5) this.praise();
    }
    /* A wrong colour never fills: a little blob of paint just bounces off the cloth,
       with a soft boing — no red, no "wrong" words. After 3 of these the card shows the flag. */
    wrongFill(pt) {
      this.wrongs++;
      FF.audio.sfx('boing');
      const w = this.w, hex = this.sel.hex;
      const blob = F3.S(w.scene, 0.13, F3.toy(hex, { rough: 0.15 }), pt.x, pt.y, pt.z + 0.15);
      const p0 = blob.position.clone();
      this.tween(0.6, k => {
        blob.position.set(p0.x + k * 0.6, p0.y + Math.sin(k * Math.PI) * 0.7, p0.z + k * 1.2);
        blob.scale.setScalar(0.13 * (1 - k * 0.8));
      }, FF.ease.out).then(() => w.scene.remove(blob));
      if (this.sel) this.sel.wig = 0.5;               // the jar gives a little shrug
      if (this.wrongs >= 3) { this.wrongs = 0; this.showFlag(true); }
    }
    async colourDone() {
      if (this.cDone) return;
      this.cDone = true;
      this.hints.stop();
      this.sel = null;
      const { ctx } = this.cv;
      FL().draw(ctx, this.flagId, 'full');
      this.tex.needsUpdate = true;
      const f = this.cflag, w = this.w;
      FF.audio.sfx('drumroll', 0.7);
      this.tween(0.8, kk => { f.strength = 0.18 + kk * 0.9; });
      await this.wait(900);
      if (!this.alive) return;
      const stars = this.flips === 0 ? 3 : this.flips === 1 ? 2 : 1;   // always at least 1 star (decided before the reveal)
      await this.revealMatch();                                          // the card turns over: both flags match!
      if (!this.alive) return;
      FF.audio.sfx('cheer');
      F3.confetti(w, new T.Vector3(0, 4.5, 0.5), 14, 2.2, 120);
      this.praise();
      this.lastStars = stars;
      if (FF.app && FF.app.profile) { const pr = FF.app.profile; pr.colourStars = pr.colourStars || {}; pr.colourStars[this.flagId] = Math.max(pr.colourStars[this.flagId] || 0, stars); FF.app.save(); }
      const rw = this.showStars(stars);
      await this.wait(stars === 3 ? 5200 : 3400);
      if (!this.alive) return;
      this.tween(0.35, k => rw.setAttribute('opacity', (1 - k).toFixed(2))).then(() => rw.remove());
      await this.wait(200);
      if (!this.alive) return;
      // the finished flag flies off to the parade ground
      const p0 = f.group.position.clone();
      await this.tween(0.9, kk => { f.group.position.set(p0.x + kk * 9, p0.y + Math.sin(kk * Math.PI) * 1.5 + kk * 2, p0.z); f.group.scale.setScalar(Math.max(0.001, 1 - kk * 0.6)); }, FF.ease.in);
      this.finish(300);
    }
    /* ---------- the flip card (face down = "?", face up = the flag) ---------- */
    flipCard(x, y) {
      const fd = this.fd, W = 260, H = 210;
      const g = FF.el('g', { transform: `translate(${x} ${y})`, class: 'tappable' }, this.layer.top);
      const card = FF.el('g', {}, g);
      this.cardG = card; this.cardW = W; this.cardH = H;
      // back: big "?" with green rising from the bottom
      const back = FF.el('g', {}, card);
      FF.hud.panel(back, 0, 0, W, H, { stroke: '#5a3214', sw: 5, r: 22 });
      const cid = FF.uid('fc');
      back.insertAdjacentHTML('beforeend', `<clipPath id="${cid}"><path d="${FF.hud.rr(10, 10, W - 20, H - 20, 16)}"/></clipPath>`);
      const fillG = FF.el('g', { 'clip-path': `url(#${cid})` }, back);
      FF.el('rect', { x: 10, y: 10, width: W - 20, height: H - 20, fill: '#fff4d6' }, fillG);
      this.greenRect = FF.el('rect', { x: 10, y: H - 10, width: W - 20, height: 0, fill: '#5cc531' }, fillG);
      this.greenTop = FF.el('rect', { x: 10, y: H - 10, width: W - 20, height: 6, fill: '#8de05a', opacity: 0 }, fillG);
      FF.el('path', { d: FF.hud.rr(10, 10, W - 20, H - 20, 16), fill: 'none', stroke: '#e8c47a', 'stroke-width': 3, 'stroke-dasharray': '8 7' }, back);
      FF.hud.text(back, '?', W / 2, H / 2 + 44, 130, { fill: '#ffcc2e', stroke: '#5a3214' });
      // front: the real flag
      const front = FF.el('g', { visibility: 'hidden' }, card);
      FF.hud.panel(front, 0, 0, W, H, { stroke: '#5a3214', sw: 5, r: 22 });
      const fs = Math.min((W - 40) / fd.w, (H - 40) / fd.h);
      const u = FF.flags.use(front, this.flagId, (W - fd.w * fs) / 2, (H - fd.h * fs) / 2, fd.w * fs, fd.h * fs);
      u.g.insertAdjacentHTML('afterbegin', `<rect x="-4" y="-4" width="${fd.w * fs + 8}" height="${fd.h * fs + 8}" rx="6" fill="#5a3214"/>`);
      this.cardBack = back; this.cardFront = front; this.cardUp = false; this.cardBusy = false;
      FF.onTap(g, () => { if (!this.cDone) this.showFlag(false); }, this);
      this.tween(0.5, k => card.setAttribute('transform', `translate(${W / 2} ${H / 2}) scale(${(0.3 + 0.7 * k).toFixed(3)}) translate(${-W / 2} ${-H / 2})`), FF.ease.back);
    }
    /* turn the card over (a real card flip: squeeze to the edge, swap faces, open up) */
    turnCard(up) {
      const card = this.cardG, W = this.cardW, H = this.cardH;
      const set = sx => card.setAttribute('transform', `translate(${W / 2} ${H / 2}) scale(${sx.toFixed(3)} ${(1 + (1 - Math.abs(sx)) * 0.08).toFixed(3)}) translate(${-W / 2} ${-H / 2})`);
      FF.audio.sfx('paper');
      return this.tween(0.22, k => set(1 - k), FF.ease.in).then(() => {
        this.cardFront.setAttribute('visibility', up ? 'visible' : 'hidden');
        this.cardBack.setAttribute('visibility', up ? 'hidden' : 'visible');
        this.cardUp = up;
        return this.tween(0.26, k => set(k), FF.ease.back);
      });
    }
    /* show the flag for 3 seconds, then turn back to "?". Every flip counts. */
    showFlag(auto) {
      if (this.cardUp || this.cardBusy) {
        // already showing (or turning): a tap does nothing; the automatic help still counts and keeps it open
        if (auto) { this.flips++; if (this.cardUp) { clearTimeout(this._flipBack); this._flipBack = this.after(3000, () => this.turnCard(false).then(() => { this.cardBusy = false; })); } }
        return;
      }
      this.flips++;
      this.cardBusy = true;
      this.turnCard(true).then(() => {
        this._flipBack = this.after(3000, () => this.turnCard(false).then(() => { this.cardBusy = false; }));
      });
    }
    /* When the flag is right, the card turns over to prove it: the painted flag matches the real one.
       This reveal is not a flip for the stars, and the card stays face up with a big green tick. */
    async revealMatch() {
      clearTimeout(this._flipBack);
      if (!this.cardUp) { await this.turnCard(true); if (!this.alive) return; }
      this.cardBusy = true;
      const W = this.cardW, H = this.cardH;
      const tick = FF.el('g', { transform: `translate(${W - 26} ${H - 22})`, class: 'no-hit' }, this.cardFront);
      const ti = FF.el('g', { transform: 'scale(0)' }, tick);
      ti.innerHTML = `<circle r="34" fill="${FF.hud.candy('#5cc531')}" stroke="#ffffff" stroke-width="5"/><circle r="38" fill="none" stroke="#5a3214" stroke-width="4"/>${FF.art.icon('check', 40, '#ffffff')}`;
      FF.audio.sfx('yes');
      await this.tween(0.45, k => ti.setAttribute('transform', `scale(${k.toFixed(3)})`), FF.ease.backBig);
      FF.say('itMatches', this.ctx, { hold: 700 });
      await this.wait(1300);
    }
    /* % of the flag coloured right = parts coloured / all parts */
    setProgress() {
      const parts = this.fd.parts;
      const done = parts.filter(p => p._paint && p._paint.hex === p.hex).length;
      const target = done / parts.length;
      const from = this.progress || 0;
      this.progress = target;
      const inner = this.cardH - 20;
      this.greenTop.setAttribute('opacity', 1);
      this.tween(0.7, k => {
        const v = FF.lerp(from, target, k) * inner;
        this.greenRect.setAttribute('y', (this.cardH - 10 - v).toFixed(1));
        this.greenRect.setAttribute('height', v.toFixed(1));
        this.greenTop.setAttribute('y', (this.cardH - 10 - v).toFixed(1));
      }, FF.ease.out);
    }
    /* ---------- the reward: stars (+ golden name flag and island map for 0 flips) ---------- */
    showStars(n) {
      const L = FF.el('g', { class: 'no-hit' }, this.layer.top);
      L.insertAdjacentHTML('beforeend', `<rect x="0" y="0" width="1280" height="720" fill="#1a1030" opacity=".35"/>`);
      const star = (cx, cy, r, on) => `<path d="${FF.flags.starD(cx, cy, r, -90)}" transform="translate(0 6)" fill="rgba(40,20,5,.3)"/>
        <path d="${FF.flags.starD(cx, cy, r, -90)}" fill="${on ? FF.hud.candy('#ffc21f') : '#d9d2c4'}" stroke="#5a3214" stroke-width="7" stroke-linejoin="round"/>
        ${on ? `<path d="${FF.flags.starD(cx - r * 0.12, cy - r * 0.16, r * 0.42, -90)}" fill="#fff" opacity=".45"/>` : ''}`;
      const top = n === 3 ? 150 : 250;
      [0, 1, 2].forEach(i => {
        const sg = FF.el('g', { transform: `translate(${640 + (i - 1) * 150} ${top + (i === 1 ? -20 : 0)})` }, L);
        const inner = FF.el('g', { transform: 'scale(0)' }, sg);
        inner.innerHTML = star(0, 0, i === 1 ? 72 : 60, i < n);
        this.after(250 + i * 350, () => {
          if (i < n) FF.audio.sfx('pop');
          this.tween(0.45, k => inner.setAttribute('transform', `scale(${k.toFixed(3)}) rotate(${((1 - k) * -40).toFixed(1)})`), FF.ease.backBig);
        });
      });
      if (n === 3) {
        // the Golden Ticket (assets/bg/golden-ticket.png) with the player's name written on it
        const name = (FF.C.playerName || 'Champion').toString();
        const TW = 1495, TH = 794, k = 760 / TW;           // ticket picture size → on screen
        const tg = FF.el('g', { transform: `translate(640 ${236 + TH * k / 2})` }, L);
        const ti = FF.el('g', { transform: 'scale(0)' }, tg);
        const art = FF.el('g', { transform: `scale(${k}) translate(${-TW / 2} ${-TH / 2})` }, ti);
        FF.el('image', { href: 'assets/bg/golden-ticket.png', x: 0, y: 0, width: TW, height: TH }, art);
        // cover the printed name, then write the player's own name in the name box
        FF.el('rect', { x: 104, y: 398, width: 440, height: 96, rx: 22, fill: '#fee6b3' }, art);
        const nt = FF.el('text', { x: 324, y: 470, 'text-anchor': 'middle', 'font-size': name.length > 14 ? 44 : name.length > 9 ? 54 : 64, class: 'body-font', 'font-weight': 700, fill: '#5a3214' }, art);
        nt.textContent = name.length > 20 ? name.slice(0, 20) : name;
        this.after(1300, () => { FF.audio.sfx('chime'); FF.audio.sfx('cheer'); this.tween(0.6, kk => ti.setAttribute('transform', `scale(${kk.toFixed(3)}) rotate(${((1 - kk) * -8).toFixed(1)})`), FF.ease.backBig); });
        L.setAttribute('data-reward', 'golden-ticket');
      } else {
        FF.hud.text(L, n === 2 ? 'Great colouring!' : 'Well done!', 640, 420, 64, { fill: '#ffffff', stroke: '#5a3214' });
      }
      L.setAttribute('data-stars', n);
      return L;
    }
    countryCard(parent, x, y) {
      const c = FF.geo.countries[this.country.id];
      const W = 236, Hh = 214;
      const card = FF.hud.panel(parent, x, y, W, Hh, { stroke: '#5a3214', sw: 5, r: 24 });
      FF.hud.text(card, this.country.name, W / 2, 42, 32, { fill: '#ffffff', stroke: '#5a3214' });
      const s = Math.min((W - 40) / c.bbox.w, (Hh - 80) / c.bbox.h);
      const ox = W / 2 - c.cx * s, oy = 56 + (Hh - 70) / 2 - c.cy * s;
      const g = FF.el('g', { transform: `translate(${ox.toFixed(1)} ${oy.toFixed(1)}) scale(${s.toFixed(4)})` }, card);
      FF.el('path', { d: c.d, fill: 'rgba(40,20,5,.25)', transform: `translate(${(3 / s).toFixed(1)} ${(5 / s).toFixed(1)})` }, g);
      FF.el('path', { d: c.d, fill: F3.mapkit.COL[this.country.id] || '#ffb21f', stroke: '#5a3214', 'stroke-width': (4 / s).toFixed(2), 'stroke-linejoin': 'round' }, g);
      return card;
    }
  }
  FF.games.map = MapColour;

  /* Game — Paint the Flag: Grumble's rain washed a friend's flag grey; paint it back. */
  class PaintFlag extends MapColour {
    start() {
      FF.audio.music('calm');
      FF.pip.show(84, 704, 1.05);
      this.title = 'Paint the flag!';
      this.colourLine = 'paintIntro';
      this.partC(true);
    }
  }
  FF.games.paint = PaintFlag;
})(window.FF);
