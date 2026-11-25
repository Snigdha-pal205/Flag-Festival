/* Flag Festival — the story around the games (the friends lost their real flags):
   · FriendParade  — opening (the friends march with "?" flags) and final (real flags) parade
   · StepIntro     — before each game: which friend this step is for
   · Reveal        — after a friend's 4th game: tap the right flag, the "?" becomes the real flag */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;
  const H = FF.hud;
  const S = FF.story = {};
  const GAME_NAMES = { colour: 'Colour the flag!', build: 'Build the flag!', jigsaw: 'Flag jigsaw!', catch: 'Catch the flag!' };
  const GAME_LINES = { colour: 'stepColour', build: 'stepBuild', jigsaw: 'stepJigsaw', catch: 'stepCatch' };

  /* ================= the parade of the friends ================= */
  S.FriendParade = class extends FF.Scene3D {
    start() {
      const final = !!this.args.final;
      FF.ui.showTop(false);
      FF.friends.strip.hide();
      FF.audio.music('festival');
      const w = this.setWorld(FF.frontWorld({}));
      this.input({});
      const team = FF.friends.team;
      const L = FF.el('g', {}, this.layer.top);
      // they march in from the left, stop in a row in the middle, then (opening) march off right
      const spots = team.length === 2 ? (final ? [300, 760] : [380, 850]) : [280, 620, 960];   // room for the big flags (and, at the end, the buttons)
      // they walk ON the sandy path of the background picture (at picture row ~772, wherever
      // that is on this screen)
      const pathY = Math.min(700, FF.bgMap('festival.jpg').y(772));
      this.sprites = team.map((m, i) => new FF.friends.Sprite(L, m, { h: 300, x: -260 - (team.length - 1 - i) * 300, y: pathY, walk: true, mood: final ? 4 : 1, flag: final ? m.flag : null }));
      this.tick(dt => this.sprites.forEach(s => s.update(dt)));
      FF.pip.show(1150, 300, 1.15);
      FF.pip.spot = { x: 640, y: 90, w: 420, tail: 'right' };     // clear of the friends, the "?" flag and HOORAY
      FF.pip.char.flying = true;
      // marching: a gentle start and a gentle stop (sine ease), steady in between
      const soft = k => (1 - Math.cos(k * Math.PI)) / 2;
      const glide = (k, a, b) => {           // a: ease at the start? b: ease at the end?
        if (a && b) return soft(k);
        if (b) return Math.sin(k * Math.PI / 2);
        if (a) return 1 - Math.cos(k * Math.PI / 2);
        return k;
      };
      const march = (to, dur, a, b) => Promise.all(this.sprites.map((s, i) => { const x0 = s.x; s.walk = true; return this.tween(dur, k => { s.x = FF.lerp(x0, to[i], glide(k, a, b)); }, FF.ease.linear); }));
      // tap a friend to hear their name (and, at the end, their country)
      this.listen(FF.svg, 'pointerdown', e => {
        const p = FF.toLocal(e);
        const s = this.sprites.find(sp => Math.abs(p.x - sp.x) < 120 && p.y < sp.y && p.y > sp.y - 310);
        if (!s) return;
        s.hop(); FF.audio.sfx('pop');
        FF.audio.say(final ? s.m.country.name + '!' : s.m.name + '!', { who: 'pip', key: final ? 'country_' + s.m.country.id : 'friend_' + s.m.kind });
      });
      (async () => {
        if (final) F3.confetti(w, new T.Vector3(0, 5, 0), 18, 7, 160);
        await march(spots, 6.0, false, true);            // walk in, slowing down gently to a stop
        if (!this.alive) return;
        this.sprites.forEach(s => { s.walk = false; });
        FF.audio.sfx(final ? 'cheer' : 'drumroll', final ? 1 : 0.5);
        if (!final) {
          this.sprites.forEach(s => s.setMood(1));
          // the big glowing "?" flag: the flags are a mystery!
          const mg = FF.el('g', { class: 'no-hit', opacity: 0 }, this.layer.top);
          const mi = FF.el('g', {}, mg);
          FF.el('image', { href: 'assets/bg/mystery-flag.png', x: -170, y: -127, width: 340, height: 254 }, mi);
          this.tween(0.6, k => { mg.setAttribute('opacity', k.toFixed(2)); mi.setAttribute('transform', `scale(${(0.6 + 0.4 * k).toFixed(3)})`); }, FF.ease.back);
          const stopBob = this.tick((dt, tt) => mg.setAttribute('transform', `translate(270 ${(170 + Math.sin(tt * 1.6) * 8).toFixed(1)}) rotate(${(Math.sin(tt * 1.1) * 3).toFixed(1)})`));
          this.hideMystery = () => this.tween(0.5, k => mg.setAttribute('opacity', (1 - k).toFixed(2))).then(() => { stopBob(); mg.remove(); });
          await FF.say('storyStart', {}, { hold: 700 });
          if (!this.alive) return;
          this.sprites.forEach(s => { s.setMood(2); s.hop(); });
          await this.wait(500);
          if (!this.alive) return;
          this.hideMystery();
          await march(spots.map(x => x + 1150 + FF.OX), 6.5, true, false);   // set off gently, walk away
          if (!this.alive) return;
          this.end();
          return;
        }
        // final: everyone dances with their real flag, confetti and the way home / play again
        this.sprites.forEach(s => { s.setMood(4); s.hop(); });
        this.banner('HOORAY!');
        const boom = () => { if (!this.alive) return; FF.audio.sfx('cheer'); F3.confetti(w, new T.Vector3(FF.rand(-4, 4), 5, 0), 12, 4, 120); };
        boom(); this.after(2500, boom); this.after(5000, boom);
        await FF.say('storyEnd', {}, { hold: 99999 });
      })();
      if (final) {
        // the way home / play again: bottom-right, clear of Pip, his words and the friends
        const home = H.button(this.layer.top, 1150, 655, 190, 90, { color: '#3d9bff', icon: 'home' });
        FF.onTap(home, () => { FF.audio.sfx('tap'); FF.app.home(); }, this);
        const again = H.round(this.layer.top, 1212, 535, 42, { color: '#ffb21f', icon: 'again' });
        FF.onTap(again, () => { FF.audio.sfx('tap'); FF.app.again(); }, this);
      } else {
        const next = H.round(this.layer.top, 1214, 650, 42, { color: '#3fcf5a', icon: 'skip' });
        FF.onTap(next, () => this.end(), this);
      }
    }
    banner(text) {
      const g = FF.el('g', { class: 'no-hit' }, this.layer.top);
      const inner = FF.el('g', {}, g);
      H.title(inner, text, 0, 0, 100, { seed: 7 });
      g.setAttribute('transform', 'translate(330 150)');
      this.tween(0.5, k => inner.setAttribute('transform', `scale(${(0.2 + 0.8 * k).toFixed(3)})`), FF.ease.backBig);
    }
    end() {
      if (this.ended) return;
      this.ended = true;
      FF.pip.char.flying = false;
      this.args.done && this.args.done();
    }
  };

  /* ================= before each game: who this step is for ================= */
  S.StepIntro = class extends FF.Scene3D {
    start() {
      const m = this.args.member, game = this.args.game;
      FF.ui.showTop(true);
      FF.friends.strip.show();
      FF.friends.strip.focus(m.i);
      this.setWorld(FF.frontWorld({}));
      this.input({});
      const L = FF.el('g', {}, this.layer.top);
      const sp = new FF.friends.Sprite(L, m, { h: 370, x: 380, y: 690, mood: Math.max(1, m.games), flag: m.revealed ? m.flag : null });
      sp.s = 0.01;
      this.tick(dt => sp.update(dt));
      this.tween(0.45, k => { sp.s = Math.max(0.01, k); }, FF.ease.backBig);
      this.after(300, () => { sp.hop(); FF.audio.sfx('pop'); });
      // the step's name on a bubbly sign
      const g = FF.el('g', { class: 'no-hit' }, this.layer.top);
      const inner = FF.el('g', {}, g);
      H.title(inner, GAME_NAMES[game] || '', 0, 0, 80, { seed: 3 });
      g.setAttribute('transform', 'translate(640 200)');
      this.tween(0.5, k => inner.setAttribute('transform', `scale(${(0.2 + 0.8 * k).toFixed(3)})`), FF.ease.backBig);
      FF.pip.show(1150, 650, 1.1);
      FF.pip.spot = { x: 700, y: 300, w: 440, tail: 'right' };   // clear of the friend, its flag and the title
      const t0 = performance.now();
      (async () => {
        await FF.say(GAME_LINES[game], FF.friends.ctx(m), { hold: 200 });
        const left = 2400 - (performance.now() - t0);
        if (left > 0) await this.wait(left);
        if (this.alive) this.args.done && this.args.done();
      })();
    }
  };

  /* ================= after a friend's 4th game: choose the right flag ================= */
  S.Reveal = class extends FF.Scene3D {
    start() {
      const m = this.m = this.args.member;
      FF.ui.showTop(true);
      FF.friends.strip.show();
      FF.friends.strip.focus(m.i);
      FF.audio.music('calm');
      const w = this.setWorld(FF.frontWorld({}));
      FF.pip.show(1205, 212, 0.85);
      FF.pip.spot = { x: 560, y: 86, w: 540, tail: 'right' };
      const L = FF.el('g', {}, this.layer.top);
      this.sp = new FF.friends.Sprite(L, m, { h: 380, x: 245, y: 700, mood: 4, flag: null });
      this.tick(dt => this.sp.update(dt));
      this.questionCard(m);
      // the empty wooden box in the middle (like before): the right flag goes in here
      const boxC = this.boxC = w.atZ(745, 425, 0.3);
      const fd = FF.flags.data(m.flag);
      const BH = 2.0, BW = Math.min(BH * fd.w / fd.h, 3.2);
      const bh = BW * fd.h / fd.w;
      this.boxW = BW; this.boxH = bh;
      const box = this.box = F3.group(w.scene, boxC.x, boxC.y, boxC.z);
      const wood = F3.toy('#a8652e', { rough: 0.4 });
      const t = 0.2;
      [[BW + 2 * t, t, 0, bh / 2 + t / 2], [BW + 2 * t, t, 0, -bh / 2 - t / 2], [t, bh, -BW / 2 - t / 2, 0], [t, bh, BW / 2 + t / 2, 0]]
        .forEach(q => F3.B(box, q[0], q[1], 0.3, wood, q[2], q[3], 0));
      F3.B(box, BW, bh, 0.06, F3.toy('#fff8e8', { rough: 0.8 }), 0, 0, -0.12).receiveShadow = true;
      // the glowing "?" flag waits in the empty box
      const qh = bh * 0.86, qw = Math.min(BW * 0.92, qh * F3.mapkit.MYSTERY_ASPECT);
      const qm = new T.Mesh(new T.PlaneGeometry(qw, qw / F3.mapkit.MYSTERY_ASPECT), F3.ownMat(new T.MeshBasicMaterial({ map: F3.mapkit.mysteryTex(), transparent: true, depthWrite: false })));
      qm.position.set(0, 0, 0.1); box.add(qm);
      this.qm = qm;
      w.onUpdate((dt, tt) => { if (qm.visible) qm.scale.setScalar(1 + Math.sin(tt * 2.2) * 0.04); });
      // on the right: the flags of this game (one per friend), in a random order
      const choices = FF.shuffle(FF.friends.team.map(t => t.flag));
      const rows = choices.length === 2 ? [290, 510] : [215, 395, 575];
      this.cards = choices.map((id, i) => {
        const home = w.atZ(1045, rows[i], 0.8);
        const g = new T.Group();
        const f = F3.flags.add(w, g, id, 1.05, { pole: false, amp: 0.05, maxW: 2.0 });
        f.group.position.set(-f.W / 2, f.H / 2, 0);
        g.position.copy(home);
        w.scene.add(g);
        const C = { id, g, f, home, right: id === m.flag };
        g.traverse(o => { if (o.isMesh) o.userData.card = C; });
        return C;
      });
      // drag a flag into the box — or just tap it
      let D = null;
      this.input({
        down: p => {
          if (this.done) return false;
          const hit = w.pick(p.x, p.y, this.cards.filter(c => !c.moving).map(c => c.g));
          if (!hit) return false;
          const C = hit.object.userData.card;
          FF.audio.sfx('pick');
          const qq = w.atZ(p.x, p.y, 1.2);
          D = { C, sx: p.x, sy: p.y, moved: false, off: new T.Vector3(C.g.position.x - qq.x, C.g.position.y - qq.y, 0).multiplyScalar(0.5) };
          this.tween(0.15, k => C.g.scale.setScalar(1 + k * 0.12));
          return true;
        },
        move: p => {
          if (!D) return;
          if (Math.hypot(p.x - D.sx, p.y - D.sy) > 10) D.moved = true;
          if (!D.moved) return;
          const qq = w.atZ(p.x, p.y, 1.2);
          D.C.g.position.set(qq.x + D.off.x, qq.y + D.off.y, 1.2);
        },
        up: () => {
          if (!D) return;
          const { C, moved } = D; D = null;
          if (!moved) { if (C.right) this.correct(C); else this.bounce(C); return; }   // a tap
          const a = w.toStage(C.g.position), b = w.toStage(this.boxC);
          if (C.right && Math.hypot(a.x - b.x, a.y - b.y) < 170) this.correct(C);
          else this.bounce(C);
        }
      });
      FF.say('revealAsk', FF.friends.ctx(m), { hold: 800 });   // "Which one is X's flag? Put it in the box for Y!"
    }
    questionCard(m) {
      const c = FF.geo.countries[m.country.id];
      const W = 380, Hh = 150, x = 150, y = 112;
      const card = H.panel(this.layer.top, x, y, W, Hh, { stroke: '#5a3214', sw: 5, r: 24 });
      H.text(card, m.name + "'s flag", 232, 62, 36, { fill: '#ffffff', stroke: '#5a3214' });
      H.text(card, m.country.name, 232, 112, 34, { fill: '#ffcc2e', stroke: '#5a3214' });
      const s = Math.min(110 / c.bbox.w, 110 / c.bbox.h);
      const g = FF.el('g', { transform: `translate(${(75 - c.cx * s).toFixed(1)} ${(75 - c.cy * s).toFixed(1)}) scale(${s.toFixed(4)})` }, card);
      FF.el('path', { d: c.d, fill: F3.mapkit.COL[m.country.id] || '#ffb21f', stroke: '#5a3214', 'stroke-width': (4 / s).toFixed(2), 'stroke-linejoin': 'round' }, g);
    }
    /* not this one (or not in the box): it just bounces gently back home — no red, no words */
    bounce(C) {
      FF.audio.sfx('boing');
      C.moving = true;
      const p0 = C.g.position.clone(), s0 = C.g.scale.x, home = C.home;
      this.tween(0.55, k => {
        C.g.position.lerpVectors(p0, home, k);
        C.g.position.x -= Math.sin(k * Math.PI) * 0.3; C.g.position.y += Math.sin(k * Math.PI) * 0.25;
        C.g.scale.setScalar(FF.lerp(s0, 1, k));
        C.g.rotation.z = Math.sin(k * Math.PI * 3) * 0.08 * (1 - k);
      }, FF.ease.out).then(() => { C.g.position.copy(home); C.g.rotation.z = 0; C.moving = false; });
    }
    async correct(C) {
      this.done = true;
      const w = this.w, m = this.m, sp = this.sp;
      C.moving = true;
      // 1) the right flag drops into the box
      this.qm.visible = false;
      const inBox = this.boxC.clone().setZ(this.boxC.z + 0.05);
      const sc = Math.min(this.boxW / C.f.W, this.boxH / C.f.H);
      let p0 = C.g.position.clone(), s0 = C.g.scale.x;
      await this.tween(0.35, k => { C.g.position.lerpVectors(p0, inBox, k); C.g.scale.setScalar(FF.lerp(s0, sc, k)); }, FF.ease.out);
      if (!this.alive) return;
      FF.audio.sfx('clunk'); FF.audio.sfx('drumroll', 0.6);
      this.cards.filter(c => c !== C).forEach(c => this.tween(0.4, k => c.g.scale.setScalar(Math.max(0.001, 1 - k))));
      await this.wait(900);
      if (!this.alive) return;
      // 2) the friend comes to the front, and the flag flies from the box onto the name flag
      const x0 = sp.x, ss = sp.s;
      this.tween(1.3, k => { sp.x = FF.lerp(x0, 330, k); sp.s = FF.lerp(ss, 1.1, k); }, FF.ease.inOut);   // slow and smooth
      this.tween(0.6, k => this.box.scale.setScalar(Math.max(0.001, 1 - k)), FF.ease.in);
      await this.wait(1300);
      if (!this.alive) return;
      const fs = sp.flagStage();
      const target = w.atZ(fs.x, fs.y, 0.8);
      p0 = C.g.position.clone(); s0 = C.g.scale.x;
      await this.tween(0.9, k => { C.g.position.lerpVectors(p0, target, k); C.g.position.y += Math.sin(k * Math.PI) * 0.6; C.g.scale.setScalar(Math.max(0.001, s0 * (1 - k * 0.8))); }, FF.ease.inOut);
      if (!this.alive) return;
      w.scene.remove(C.g);
      m.revealed = true;
      sp.setFlag(m.flag);
      sp.hop();
      FF.audio.sfx('sparkle'); FF.audio.sfx('cheer');
      F3.burst(w, target, ['#ffe14d', '#ff4d6d', '#3d9bff', '#3fcf5a', '#ffffff'], 30, 3.4);
      F3.confetti(w, new T.Vector3(0, 5, 0.5), 14, 5, 140);
      FF.friends.strip.refresh(m.i, true);
      this.banner('HOORAY!', 600, 96);              // low on the right, under Pip's words
      FF.pip.cheer();
      await FF.say('revealYes', FF.friends.ctx(m), { hold: 900 });
      if (!this.alive) return;
      this.after(600, () => { this.args.done && this.args.done(); });
    }
    banner(text, y, size) {
      const g = FF.el('g', { class: 'no-hit' }, this.layer.top);
      const inner = FF.el('g', {}, g);
      H.title(inner, text, 0, 0, size || 100, { seed: 5 });
      g.setAttribute('transform', `translate(880 ${y})`);
      this.tween(0.5, k => inner.setAttribute('transform', `scale(${(0.2 + 0.8 * k).toFixed(3)})`), FF.ease.backBig);
    }
  };
})(window.FF);
