/* Final step — Which flag? (revision, no help)
   An empty box for the country on the left, three waving flags on the right: the
   country's own flag and two others. Drag the right flag into the box.
   This is the memory check, so there are NO hints, NO example card and NO glowing help:
   a wrong flag simply bounces back and the child tries again.                           */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;

  class Quiz extends FF.games.GameBase {
    start() {
      FF.audio.music('calm');
      const w = this.setWorld(FF.frontWorld({}));
      FF.pip.show(84, 704, 1.0);

      // the question: country name + shape, above an empty box
      this.questionCard(120, 120);
      const boxC = this.boxC = w.atZ(615, 430, 0.3);
      const fd = this.fd;
      const BH = 2.2, BW = Math.min(BH * fd.w / fd.h, 4.0);
      const bh = BW * fd.h / fd.w;
      this.boxW = BW; this.boxH = bh;
      const wood = F3.toy('#a8652e', { rough: 0.4 });
      const t = 0.2;
      [[BW + 2 * t, t, 0, bh / 2 + t / 2], [BW + 2 * t, t, 0, -bh / 2 - t / 2], [t, bh, -BW / 2 - t / 2, 0], [t, bh, BW / 2 + t / 2, 0]]
        .forEach(q => F3.B(w.scene, q[0], q[1], 0.3, wood, boxC.x + q[2], boxC.y + q[3], boxC.z));
      const back = F3.B(w.scene, BW, bh, 0.06, F3.toy('#fff8e8', { rough: 0.8 }), boxC.x, boxC.y, boxC.z - 0.12);
      back.receiveShadow = true;
      const q = F3.label('?', { height: 1.2, size: 160, color: '#ffcc2e', outlineColor: '#5a3214' });
      q.position.set(boxC.x, boxC.y, boxC.z + 0.1); w.scene.add(q);
      this.q = q;
      w.onUpdate((dt, tt) => { if (q.visible) q.scale.setScalar(1 + Math.sin(tt * 3) * 0.05); });

      // three flags to choose from: the right one + two others (one of them may look alike)
      const others = FF.C.countries.map(c => c.flag).filter(f => f !== this.flagId);
      const look = this.level !== 'easy' && FF.C.flags[this.country.lookalike] ? [this.country.lookalike] : [];
      const pickOthers = FF.shuffle(look.concat(FF.shuffle(others))).filter((f, i, a) => a.indexOf(f) === i).slice(0, 2);
      const choices = FF.shuffle([this.flagId].concat(pickOthers));
      const rows = [200, 385, 570];
      this.cards = choices.map((id, i) => {
        const home = w.atZ(1010, rows[i], 0.8);
        const g = new T.Group();
        const f = F3.flags.add(w, g, id, 1.05, { pole: false, amp: 0.05, maxW: 2.0 });
        f.group.position.set(-f.W / 2, f.H / 2, 0);
        g.position.copy(home);
        w.scene.add(g);
        const C = { id, g, f, home, right: id === this.flagId };
        g.traverse(o => { if (o.isMesh) o.userData.card = C; });
        return C;
      });

      let D = null;
      this.input({
        down: p => {
          if (this.done) return false;
          const hit = w.pick(p.x, p.y, this.cards.filter(c => !c.moving).map(c => c.g));
          if (!hit) return false;
          const C = hit.object.userData.card;
          FF.audio.sfx('pick');
          const qq = w.atZ(p.x, p.y, 1.2);
          D = { C, off: new T.Vector3(C.g.position.x - qq.x, C.g.position.y - qq.y, 0).multiplyScalar(0.5) };
          this.tween(0.15, k => C.g.scale.setScalar(1 + k * 0.12));
          return true;
        },
        move: p => { if (!D) return; const qq = w.atZ(p.x, p.y, 1.2); D.C.g.position.set(qq.x + D.off.x, qq.y + D.off.y, 1.2); },
        up: () => { if (!D) return; const C = D.C; D = null; this.drop(C); }
      });
      FF.say('quizIntro', this.ctx, { hold: 800 });
    }
    questionCard(x, y) {
      const c = FF.geo.countries[this.country.id];
      const W = 360, H = 150;
      const card = FF.hud.panel(this.layer.top, x, y, W, H, { stroke: '#5a3214', sw: 5, r: 24 });
      FF.hud.text(card, this.country.name, 220, 64, 44, { fill: '#ffffff', stroke: '#5a3214' });
      FF.hud.text(card, 'Which flag?', 220, 116, 28, { fill: '#ffcc2e', stroke: '#5a3214' });
      const s = Math.min(110 / c.bbox.w, 110 / c.bbox.h);
      const g = FF.el('g', { transform: `translate(${(75 - c.cx * s).toFixed(1)} ${(75 - c.cy * s).toFixed(1)}) scale(${s.toFixed(4)})` }, card);
      FF.el('path', { d: c.d, fill: F3.mapkit.COL[this.country.id] || '#ffb21f', stroke: '#5a3214', 'stroke-width': (4 / s).toFixed(2), 'stroke-linejoin': 'round' }, g);
    }
    drop(C) {
      const w = this.w;
      const a = w.toStage(C.g.position), b = w.toStage(this.boxC);
      const inBox = Math.hypot(a.x - b.x, a.y - b.y) < 150;
      if (inBox && C.right) return this.correct(C);
      // not this one (or not in the box): it simply goes back — no hint
      FF.audio.sfx('boing');
      C.moving = true;
      const p0 = C.g.position.clone(), s0 = C.g.scale.x;
      this.tween(0.5, k => { C.g.position.lerpVectors(p0, C.home, k); C.g.scale.setScalar(FF.lerp(s0, 1, k)); }, FF.ease.back).then(() => { C.moving = false; });
    }
    async correct(C) {
      this.done = true;
      const w = this.w;
      this.q.visible = false;
      const p0 = C.g.position.clone(), s0 = C.g.scale.x;
      const target = this.boxC.clone().setZ(this.boxC.z + 0.05);
      const sc = Math.min(this.boxW / C.f.W, this.boxH / C.f.H);
      await this.tween(0.35, k => { C.g.position.lerpVectors(p0, target, k); C.g.scale.setScalar(FF.lerp(s0, sc, k)); }, FF.ease.out);
      if (!this.alive) return;
      FF.audio.sfx('clunk');
      FF.audio.sfx('drumroll', 0.7);
      this.cards.filter(c => c !== C).forEach(c => this.tween(0.4, k => c.g.scale.setScalar(Math.max(0.001, 1 - k))));
      C.f.strength = 0.25;
      await this.wait(700);
      if (!this.alive) return;
      FF.audio.sfx('cheer');
      F3.confetti(w, new T.Vector3(this.boxC.x, 4.5, 0.5), 10, 2.2, 120);
      this.banner('YOU REMEMBERED!', 140, 78);
      FF.pip.cheer();
      FF.say('quizRight', this.ctx, { hold: 800 });
      this.finish(3000);
    }
  }
  FF.games.quiz = Quiz;
})(window.FF);
