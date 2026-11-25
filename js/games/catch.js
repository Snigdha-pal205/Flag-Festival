/* Game 3 — Catch the Flag (3D)
   Grumble drops waving flags; drag anywhere and the woven basket follows the finger.
   Catch the RIGHT flag and avoid the others:
   - right flag  → into the basket, pop, Pip cheers, counter +1, falling gets a little faster
   - wrong flag  → goes in, the basket shakes, Grumble laughs "Hee hee!", it pops back out (1 mistake)
   - missed flag → just fades away (no penalty)
   - 3 right in a row → "SUPER CATCH!"; Grumble's wind trick; lookalikes in later rounds;
     a rare golden bonus flag. 5 right flags end the round; stars from mistakes (always ≥ 1).
   Fairness: ≥ 1 in every 3 flags is right, ≤ 3 on screen, target always shown,
   20 s with no right catch → the right flag floats slowly down the middle. No timers/lives. */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;
  const Z = 1.2;
  const SPEED_START = 0.85, SPEED_STEP = 0.09, SPEED_MAX = 1.35;   // world units / second
  const RESCUE_SPEED = 0.7;

  function weaveTex() {
    const t = F3.canvasTex(256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#d99a4e'; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 32) {
        ctx.fillStyle = ((x + y) / 16) % 2 ? '#f0b866' : '#c78538';
        ctx.beginPath(); ctx.ellipse(x + 16 + ((y / 16) % 2) * 16, y + 8, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
      }
    });
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 1);
    return t;
  }
  /* shiny golden cloth for the bonus flag */
  let goldTex = null;
  function goldenTex() {
    if (goldTex) return goldTex;
    goldTex = F3.canvasTex(512, 340, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#fff3a6'); g.addColorStop(0.35, '#ffd23a'); g.addColorStop(0.7, '#f0a800'); g.addColorStop(1, '#ffe57a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(60 + i * 85, 40 + (i % 3) * 110); ctx.rotate(0.4); ctx.fillRect(-6, -60, 12, 120); ctx.restore(); }
      ctx.fillStyle = '#ffffff';
      ctx.fill(new Path2D(FF.flags.starD(w / 2, h / 2, 95, -90)));
      ctx.strokeStyle = '#b07a00'; ctx.lineWidth = 8; ctx.stroke(new Path2D(FF.flags.starD(w / 2, h / 2, 95, -90)));
      ctx.strokeStyle = 'rgba(176,122,0,.8)'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, w - 10, h - 10);
    });
    goldTex.userData.keep = true;
    return goldTex;
  }

  /* Grumble, animated from the 16-frame sprite sheet in assets/chars/grumble-anim/ */
  const GR_FRAMES = [];
  function grumbleFrames() {
    if (!GR_FRAMES.length) {
      const L = new T.TextureLoader();
      for (let i = 1; i <= 16; i++) {
        const t = L.load(`assets/chars/grumble-anim/${String(i).padStart(2, '0')}.png`);
        t.colorSpace = T.SRGBColorSpace; t.userData.keep = true; GR_FRAMES.push(t);
      }
    }
    return GR_FRAMES;
  }
  class GrumbleSheet {
    constructor(w, height) {
      this.frames = grumbleFrames();
      this.mat = F3.ownMat(new T.MeshBasicMaterial({ map: this.frames[0], transparent: true, alphaTest: 0.08, side: T.DoubleSide }));
      this.mat.toneMapped = false;
      const geo = new T.PlaneGeometry(height * 335 / 232, height);
      this.mesh = new T.Mesh(geo, this.mat);
      this.root = F3.group(w.scene);
      this.root.add(this.mesh);
      this.seq = null; this.loop = null; this.ft = 0; this.t = 0;
      w.onUpdate(dt => this.update(dt));
    }
    place(x, y, z) { this.root.position.set(x, y, z); }
    show(i) { this.mat.map = this.frames[i - 1]; }
    play(frames, fps, then) { this.seq = { frames, fps, i: 0, then }; this.ft = 0; this.show(frames[0]); }
    /* laugh, then keep blowing (swirl frames) until blowEnd() */
    blowStart() {
      if (this.blowing) return;
      this.blowing = true;
      this.play([2, 3, 4, 5], 14, () => { if (this.blowing) this.loop = [6, 7, 8, 7]; });
    }
    blowEnd() { this.blowing = false; this.loop = null; this.play([9, 13, 14, 15, 16], 11); }
    update(dt) {
      this.t += dt;
      this.mesh.position.y = Math.sin(this.t * 2) * 0.08;
      this.mesh.rotation.z = Math.sin(this.t * 1.3) * 0.04;
      if (this.seq) {
        this.ft += dt;
        const i = Math.floor(this.ft * this.seq.fps);
        if (i >= this.seq.frames.length) { const th = this.seq.then; this.seq = null; this.show(1); if (th) th(); }
        else this.show(this.seq.frames[i]);
      } else if (this.loop) this.show(this.loop[Math.floor(this.t * 10) % this.loop.length]);
      else this.show(1);
    }
  }

  class Catch extends FF.games.GameBase {
    start() {
      FF.audio.music('festival');
      const w = this.setWorld(FF.frontWorld({ ground: { stageX: 6, stageZ: -18, pathZ: -2 } }));
      this.firstTime = this.level === 'easy';            // lookalikes only after this flag was played before
      this.speed = SPEED_START;
      this.maxOn = this.firstTime ? 2 : 3;                // never more than 3 on screen
      this.look = this.firstTime ? null : (FF.C.flags[this.country.lookalike] ? this.country.lookalike : null);
      this.pool = this.wrongPool();
      this.got = 0; this.total = 0; this.rightCount = 0; this.wrongInRow = 0;
      this.mistakes = 0; this.combo = 0; this.superShown = 0;
      this.goldenUsed = false; this.goldenCaught = false;
      this.sinceCatch = 0; this.spawnT = 1.2; this.t = 0;
      this.wind = { v: 0, left: 0, dir: 1 };
      this.flashQ = []; this.flashing = false;
      this.flags = [];
      this.rimY = -1.95;

      // the woven basket
      this.bx = 0; this.tx = 0;
      const bk = this.basket = F3.group(w.scene, 0, -2.75, Z);
      const body = new T.Mesh(new T.CylinderGeometry(1.0, 0.78, 0.85, 32, 1, true), F3.ownMat(new T.MeshPhysicalMaterial({ map: weaveTex(), roughness: 0.5, clearcoat: 0.3, side: T.DoubleSide })));
      body.castShadow = true; bk.add(body);
      F3.Cy(bk, 0.78, 0.04, F3.toy('#b9763a', { rough: 0.5 }), 0, -0.42, 0);
      const rim = new T.Mesh(F3.geo.torus(1.0, 0.09), F3.toy('#c98338', { rough: 0.3 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.43; rim.castShadow = true; bk.add(rim);
      const handle = new T.Mesh(F3.geo.torus(0.95, 0.07, Math.PI), F3.toy('#c98338', { rough: 0.3 })); handle.position.y = 0.43; handle.rotation.y = 0.25; handle.castShadow = true; bk.add(handle);
      // a glow ring for "SUPER CATCH!"
      this.glowMat = F3.ownMat(new T.MeshBasicMaterial({ color: '#ffe14d', transparent: true, opacity: 0 }));
      const glow = new T.Mesh(F3.geo.torus(1.12, 0.16), this.glowMat); glow.rotation.x = Math.PI / 2; glow.position.y = 0.45; bk.add(glow);
      this.inBasket = F3.group(bk, 0, 0.2, 0);
      this.basketFlags = [];                             // the right flags sitting in the basket
      this.shake = 0;

      // Grumble (animated sprite sheet)
      this.gr = new GrumbleSheet(w, 1.7);
      this.gx = 0;

      // the flag to catch — always visible in the top corner — with 5 dots
      const panel = FF.hud.panel(this.layer.top, 22, 100, 320, 112, { stroke: '#3d9bff' });
      const fs = Math.min(128 / this.fd.w, 80 / this.fd.h);
      FF.flags.use(panel, this.flagId, 18, 56 - this.fd.h * fs / 2, 128, 80);
      this.dots = [];
      for (let i = 0; i < 5; i++) {
        const dg = FF.el('g', { transform: `translate(${176 + i * 30} 56)` }, panel);
        dg.innerHTML = `<circle r="12" fill="#e8f2ff" stroke="#3d9bff" stroke-width="3"/>`;
        this.dots.push(dg);
      }
      this.panel = panel;
      this.windLayer = FF.el('g', { class: 'no-hit' }, this.layer.top);

      FF.pip.show(80, 706, 0.95);
      FF.pip.spot = { x: 24, y: 226, w: 320, tail: 'left' };     // under the flag panel, away from the falling flags
      this.input({
        down: p => { this.tx = w.atZ(p.x, p.y, Z).x; return true; },
        move: p => { this.tx = w.atZ(p.x, p.y, Z).x; },
        up: () => {}
      });
      this.hints = new FF.Hints(this, {
        first: 13000, second: 20000, third: 27000,
        point: () => { FF.say('catchHint', this.ctx); this.spawn('right'); },
        glow: () => { this.glowRight = true; },
        show: () => { this.spawn('rescue'); }
      });
      this.running = false;
      (async () => {
        await FF.say('catchIntro', this.ctx, { hold: 500 });
        if (!this.alive) return;
        this.running = true;
      })();
      w.onUpdate(dt => this.update(dt));
    }

    /* wrong flags: on the first play, clearly different flags (no lookalikes at all) */
    wrongPool() {
      const lookalikes = FF.C.countries.map(c => c.lookalike).concat(Object.keys(FF.C.flags).filter(k => FF.C.flags[k].lookalikeOnly));
      const mine = FF.flags.colours(this.flagId);
      const overlap = id => FF.flags.colours(id).filter(c => mine.includes(c)).length;
      const seven = FF.C.countries.map(c => c.flag).filter(id => id !== this.flagId);
      if (this.firstTime) {
        const ok = seven.filter(id => id !== this.country.lookalike && !FF.C.flags[id].lookalikeOnly);
        const far = ok.filter(id => overlap(id) === 0);
        return far.length >= 2 ? far : ok.sort((a, b) => overlap(a) - overlap(b)).slice(0, 4);
      }
      const learned = (this.args.learned || []).filter(id => id !== this.flagId && seven.includes(id));
      let p = learned.filter(id => overlap(id) > 0);
      if (p.length < 3) p = p.concat(learned.filter(id => !p.includes(id)));
      if (p.length < 3) p = p.concat(seven.filter(id => !p.includes(id)));
      return p.filter(id => !lookalikes.includes(id) || id === this.look);
    }

    /* kind: undefined (normal mix) | 'right' | 'rescue' (right, slowly down the middle) */
    spawn(kind) {
      if (this.finished) return;
      if (this.flags.filter(f => f.state === 'fall').length >= 3) return;   // never more than 3 on screen
      const w = this.w;
      let right = kind === 'right' || kind === 'rescue' || this.total < 1 || this.wrongInRow >= 2
        || (this.rightCount / Math.max(1, this.total)) < 0.4 || Math.random() < 0.4;
      // a rare golden bonus flag: at most once per round
      const golden = !kind && !right && !this.goldenUsed && this.got >= 1 && Math.random() < 0.3;
      let id = this.flagId;
      if (golden) { this.goldenUsed = true; }
      else if (!right) {
        if (this.look && Math.random() < 0.45) id = this.look;
        else { let c, n = 0; do { c = FF.pick(this.pool); n++; } while (c === this.lastWrong && n < 5); id = c; }
        this.lastWrong = id;
      }
      if (golden) this.wrongInRow++;                       // a golden flag is not the right flag: keep 1-in-3 fair
      else { this.total++; if (right) { this.rightCount++; this.wrongInRow = 0; } else this.wrongInRow++; }
      this.spawned = (this.spawned || []).concat([golden ? 'gold' : right ? 'R' : 'w']);
      const f = F3.flags.add(w, null, golden ? this.flagId : id, 0.62, Object.assign({ pole: false, amp: 0.09, speed: 7, segX: 14, segY: 6 }, golden ? { tex: goldenTex() } : {}));
      if (golden) f.mat.map.userData.keep = true;
      const middle = kind === 'rescue';
      const x0 = middle ? 0 : FF.clamp(this.gx + FF.rand(-0.4, 0.4), -5.6, 5.6);
      const vy = middle ? Math.min(this.speed, RESCUE_SPEED) : this.speed * FF.rand(0.94, 1.06);
      const fl = { id, right: right && !golden, golden, f, x0, x: x0, y: 0.75, ph: Math.random() * 6, sway: middle ? 0 : FF.rand(0.25, 0.45), state: 'fall', vy, t: 0, vx: 0, ring: null };
      f.group.position.set(x0, 0.75, Z);
      if (golden) { fl.ring = new T.Mesh(F3.geo.torus(0.6, 0.05), F3.ownMat(new T.MeshBasicMaterial({ color: '#fff4b0' }))); fl.ring.position.set(f.W / 2, -f.H / 2, -0.05); f.group.add(fl.ring); }
      this.flags.push(fl);
      FF.audio.sfx(golden ? 'sparkle' : 'whoosh');
      if (id === 'india' && !this.saidIndia) { this.saidIndia = true; this.after(600, () => FF.say('catchIndia', this.ctx, { hold: 400 })); }
    }

    update(dt) {
      const w = this.w;
      this.t += dt;
      if (!this.finished) this.gx = 1.4 + Math.sin(this.t * 0.42) * 3.4;   // stays clear of the target panel (top-left)
      this.gr.place(this.gx, 1.5 + Math.sin(this.t * 1.3) * 0.08, -0.4);
      this.tx = FF.clamp(this.tx, -5.6, 5.6);
      this.bx += (this.tx - this.bx) * Math.min(1, dt * 12);
      this.basket.position.x = this.bx;
      this.shake = Math.max(0, this.shake - dt);
      this.basket.rotation.z = FF.clamp((this.tx - this.bx) * -0.08, -0.15, 0.15) + Math.sin(this.shake * 45) * 0.18 * (this.shake / 0.7);
      this.glowMat.opacity = Math.max(0, this.glowMat.opacity - dt * 0.6);

      if (this.running && !this.finished) {
        this.sinceCatch += dt;
        const falling = this.flags.filter(f => f.state === 'fall').length;
        this.spawnT -= dt;
        if (falling < this.maxOn && this.spawnT <= 0) { this.spawn(); this.spawnT = FF.rand(1.2, 1.8); }
        // 20 s with no right catch: the right flag floats slowly down the middle
        if (this.sinceCatch > 20 && falling < 3) { this.sinceCatch = 8; this.spawn('rescue'); }
      }
      if (this.wind.left > 0) {
        this.wind.left -= dt;
        if (this.wind.left <= 0) { this.wind.left = 0; this.wind.v = 0; this.gr.blowEnd(); }
      }

      this.flags.forEach(f => {
        f.t += dt;
        const g = f.f.group;
        if (f.state === 'fall') {
          f.y -= f.vy * dt; f.ph += dt * 1.7;
          if (this.wind.v) f.x0 = FF.clamp(f.x0 + this.wind.v * this.windK() * dt, -5.8, 5.8);   // blown sideways
          f.x = f.x0 + Math.sin(f.ph) * f.sway;
          g.position.set(f.x - f.f.W / 2, f.y + f.f.H / 2, Z);
          g.rotation.z = Math.sin(f.ph * 1.3) * 0.2 + this.wind.v * this.windK() * 0.15; g.rotation.y = Math.sin(f.ph) * 0.4;
          if (f.golden && f.ring) f.ring.rotation.z += dt * 3;
          if (f.y < this.rimY + 0.35 && f.y > this.rimY - 0.2 && Math.abs(f.x - this.bx) < 0.98) this.caught(f);
          else if (f.y < -3.2) { f.state = 'land'; f.t = 0; }                       // missed: just fades away
          if (f.right && this.glowRight && !f.ring) {
            f.ring = new T.Mesh(F3.geo.torus(0.55, 0.05), F3.ownMat(new T.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffb21f', emissiveIntensity: 1 })));
            f.ring.position.set(f.f.W / 2, -f.f.H / 2, -0.05); g.add(f.ring);
          }
        } else if (f.state === 'land') {
          g.scale.setScalar(Math.max(0.001, 1 - f.t * 1.4));
          if (f.t > 0.7) f.state = 'gone';
        }
      });
      this.flags = this.flags.filter(f => { if (f.state === 'gone') { w.scene.remove(f.f.group); return false; } return true; });
    }

    /* every flag can land in the basket */
    caught(f) {
      const g = f.f.group;
      const p0 = g.position.clone();
      const into = new T.Vector3(this.bx - 0.3, this.rimY - 0.2, Z);
      if (f.golden) {                                     // bonus: not a right flag, not a mistake
        f.state = 'in'; this.goldenCaught = true;
        this.tween(0.25, k => { g.position.lerpVectors(p0, into, k); g.scale.setScalar(Math.max(0.001, 1 - k)); }).then(() => { f.state = 'gone'; });
        FF.audio.sfx('sparkle'); FF.audio.sfx('chime'); FF.audio.sfx('cheer');
        F3.burst(this.w, new T.Vector3(this.bx, this.rimY + 0.5, Z + 0.3), ['#ffe14d', '#fff6c2', '#ffb21f', '#ffffff'], 26, 3.2);
        this.flash('BONUS!', '#ffc21f');
        FF.pip.cheer();
        return;
      }
      if (f.right) {
        f.state = 'in';
        this.got++; this.sinceCatch = 0; this.glowRight = false; this.combo++;
        this.hints.reset();
        FF.audio.sfx('pop'); FF.audio.sfx('yes');
        this.tween(0.25, k => { g.position.lerpVectors(p0, into, k); g.scale.setScalar(Math.max(0.001, 1 - k)); }).then(() => {
          f.state = 'gone';
          this.addToBasket(f.id, this.got);
        });
        F3.burst(this.w, new T.Vector3(this.bx, this.rimY + 0.4, Z + 0.3), ['#ffd23f', '#ff4d6d', '#3d9bff', '#7cdb5a'], 14, 2.6);
        this.setDot(this.got - 1, true);
        FF.pip.cheer();
        // a little faster after each right catch (but never too fast for a 6-year-old)
        this.speed = Math.min(SPEED_MAX, this.speed + SPEED_STEP);
        if (this.combo === 3) this.superCatch();
        if (this.got >= 5) this.win();
        else if (this.got === 3 && this.combo !== 3 && !this.wind.left) this.praise();
        return;
      }
      // wrong flag: it drops into the basket, and at that same moment the basket shakes,
      // Grumble laughs and blows, the wind sweeps across, and the wrong flag AND one right flag from the basket fly away on it.
      f.state = 'in';
      this.mistakes++; this.combo = 0;
      this.tween(0.22, k => { g.position.lerpVectors(p0, into, k); g.scale.setScalar(1 - k * 0.2); }).then(() => {
        if (!this.alive) return;
        const dir = this.bx < 0 ? 1 : -1;               // blow towards the open side of the screen
        this.shake = 0.7;
        FF.audio.sfx('tap'); FF.audio.sfx('giggle');
        FF.audio.say('Hee hee!', { who: 'grumble' });
        this.gust(dir);
        this.blowAway(f, dir);
        this.blowOutRight(dir);                         // ...and one right flag from the basket goes with it
      });
    }
    /* one dot in the target panel: filled (green tick) or empty */
    setDot(i, on) {
      const dot = this.dots[i];
      if (!dot) return;
      dot.innerHTML = on
        ? `<g class="pennant-pop"><circle r="14" fill="${FF.hud.grad('#3fcf5a')}" stroke="#ffffff" stroke-width="3"/>${FF.art.icon('check', 18, '#ffffff')}</g>`
        : `<circle r="12" fill="#e8f2ff" stroke="#3d9bff" stroke-width="3"/>`;
    }
    /* the wind also lifts the newest right flag out of the basket: the count goes down by one */
    blowOutRight(dir) {
      if (this.finished) return;
      const b = this.basketFlags.pop();
      if (!b) return;                                   // basket empty: only the wrong flag flies
      this.got = Math.max(0, this.got - 1);
      this.setDot(this.got, false);
      const g = b.group;
      this.w.scene.attach(g);                           // leave the basket, keep where it is on screen
      const p0 = g.position.clone(), r0 = g.rotation.z, s0 = g.scale.x;
      b.strength = 1.6;
      // a slightly higher path than the wrong flag, so the two never sit on top of each other
      this.tween(1.9, k => {
        g.position.set(p0.x + dir * k * 8.5, p0.y + k * 2.0 + Math.sin(k * Math.PI) * 0.6, p0.z + 0.2);
        g.rotation.z = r0 + dir * -k * 5;
        g.scale.setScalar(Math.max(0.001, s0 * (1 - k * 0.4)));
      }, FF.ease.inOut).then(() => { this.w.scene.remove(g); });
    }
    /* the wrong flag is lifted out of the basket and carried away by the wind */
    blowAway(f, dir) {
      f.state = 'blown';
      const g = f.f.group;
      const x0 = this.bx - f.f.W / 2, y0 = this.rimY + 0.2;
      f.f.strength = 1.6;
      this.tween(1.7, k => {
        g.position.set(x0 + dir * k * 8.5, y0 + k * 1.1 + Math.sin(k * Math.PI) * 0.5, Z + 0.3);
        g.rotation.z = dir * -k * 5;
        g.scale.setScalar(Math.max(0.001, 0.8 - k * 0.35));
      }, FF.ease.inOut).then(() => { f.state = 'gone'; });
    }
    /* wind strength: eases in and out (no sudden jumps) */
    windK() {
      const L = this.wind.len || 1, left = this.wind.left;
      if (left <= 0) return 0;
      const done = L - left;
      return Math.min(1, done / 0.35, left / 0.5);
    }

    superCatch() {
      this.superShown++;
      this.glowMat.opacity = 1;
      FF.audio.sfx('cheer'); FF.audio.sfx('yes');
      F3.burst(this.w, new T.Vector3(this.bx, this.rimY + 0.6, Z + 0.3), ['#ffe14d', '#ff4d6d', '#3d9bff', '#7cdb5a', '#ffffff'], 24, 3);
      this.flash('SUPER CATCH!', null);
    }
    /* big bubbly words for a moment */
    flash(text, fill) {
      this.flashQ.push([text, fill]);
      if (!this.flashing) this.nextFlash();
    }
    nextFlash() {
      const it = this.flashQ.shift();
      if (!it || !this.alive) { this.flashing = false; return; }
      this.flashing = true;
      const [text, fill] = it;
      const g = FF.el('g', { class: 'no-hit', 'data-flash': text }, this.layer.top);
      const inner = FF.el('g', {}, g);
      FF.hud.title(inner, text, 0, 0, 84, fill ? { fill } : {});
      g.setAttribute('transform', 'translate(640 250)');
      this.tween(0.45, k => inner.setAttribute('transform', `scale(${(0.2 + 0.8 * k).toFixed(3)}) rotate(${((1 - k) * -10).toFixed(1)})`), FF.ease.backBig);
      this.after(1300, () => this.tween(0.3, k => g.setAttribute('opacity', (1 - k).toFixed(2))).then(() => { g.remove(); this.nextFlash(); }));
    }

    /* Grumble blows: a gust of wind pushes the falling flags sideways for 2–3 s */
    gust(dir) {
      dir = dir || 1;
      this.gusts = (this.gusts || 0) + 1;
      if (this.wind.left > 0) {                       // already blowing: keep it going, same direction
        this.wind.left = Math.max(this.wind.left, 2.2); this.wind.len = Math.max(this.wind.len, this.wind.left + 0.4);
        return;
      }
      this.wind.dir = dir; this.wind.v = dir * 1.25; this.wind.left = 2.5; this.wind.len = 2.5;
      this.spawnT = Math.max(this.spawnT, 0.9);        // a short breather: no new flag pops out mid-gust start
      this.gr.blowStart();
      FF.audio.sfx('whoosh'); this.after(300, () => FF.audio.sfx('whoosh'));
      const L = this.windLayer;
      for (let i = 0; i < 7; i++) {
        const y = 260 + i * 52 + FF.rand(-10, 10), len = FF.rand(140, 260);   // below the target panel
        const s = FF.el('path', { d: `M0 0 q${len * 0.35} -18 ${len * 0.7} 0 t${len * 0.3} 0`, fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, L);
        const x0 = dir > 0 ? -300 - i * 60 : 1580 + i * 60, x1 = dir > 0 ? 1580 : -300;
        this.tween(2.2, k => {
          s.setAttribute('transform', `translate(${FF.lerp(x0, x1, k).toFixed(1)} ${y.toFixed(1)}) scale(${dir} 1)`);
          s.setAttribute('opacity', (Math.sin(k * Math.PI) * 0.75).toFixed(2));
        }, FF.ease.linear).then(() => s.remove());
      }
    }

    addToBasket(id, n) {
      const f = F3.flags.add(this.w, this.inBasket, id, 0.36, { poleLen: 0.75, amp: 0.05 });
      f.group.position.set(-0.55 + ((n * 0.37) % 1.1), -0.3, -0.1 + (n % 3) * 0.12);
      f.group.rotation.z = -0.3 + ((n * 0.23) % 0.6);
      this.basketFlags.push(f);
    }

    /* stars from mistakes: 0–1 → 3, 2–3 → 2, 4+ → 1 (always at least 1, nothing is locked) */
    starsFor(m) { return m <= 1 ? 3 : m <= 3 ? 2 : 1; }
    async win() {
      this.finished = true;
      this.hints.stop();
      this.flags.forEach(f => { if (f.state === 'fall') { f.state = 'land'; f.t = 0; } });
      if (this.wind.left > 0) { this.wind.v = 0; this.wind.left = 0; this.gr.blowEnd(); }
      FF.audio.sfx('cheer');
      FF.audio.sfx('hmph');
      F3.confetti(this.w, new T.Vector3(this.bx, 4.5, Z), 8, 2, 100);
      const stars = this.starsFor(this.mistakes);
      this.lastStars = stars;
      if (FF.app && FF.app.profile) { const pr = FF.app.profile; pr.catchStars = pr.catchStars || {}; pr.catchStars[this.flagId] = Math.max(pr.catchStars[this.flagId] || 0, stars); FF.app.save(); }
      await this.wait(700);
      // let "SUPER CATCH!" / "BONUS!" finish first, so nothing sits on top of the stars
      for (let i = 0; i < 30 && this.flashing; i++) await this.wait(100);
      if (!this.alive) return;
      this.showStars(stars);
      this.praise();
      const gx = this.gx;
      this.running = false;
      this.tween(1.2, k => { this.gx = FF.lerp(gx, 10, k); }, FF.ease.in);
      this.after(3600, () => { this.args.done && this.args.done(); });
    }
    showStars(n) {
      const L = FF.el('g', { class: 'no-hit', 'data-catch-stars': n }, this.layer.top);
      L.insertAdjacentHTML('beforeend', `<rect x="-700" y="0" width="2680" height="720" fill="#1a1030" opacity=".35"/>`);
      const star = (r, on) => `<path d="${FF.flags.starD(0, 0, r, -90)}" transform="translate(0 6)" fill="rgba(40,20,5,.3)"/>
        <path d="${FF.flags.starD(0, 0, r, -90)}" fill="${on ? FF.hud.candy('#ffc21f') : '#d9d2c4'}" stroke="#5a3214" stroke-width="7" stroke-linejoin="round"/>
        ${on ? `<path d="${FF.flags.starD(-r * 0.12, -r * 0.16, r * 0.42, -90)}" fill="#fff" opacity=".45"/>` : ''}`;
      [0, 1, 2].forEach(i => {
        const sg = FF.el('g', { transform: `translate(${640 + (i - 1) * 150} ${(i === 1 ? 250 : 270)})` }, L);
        const inner = FF.el('g', { transform: 'scale(0)' }, sg);
        inner.innerHTML = star(i === 1 ? 72 : 60, i < n);
        this.after(200 + i * 330, () => {
          if (i < n) FF.audio.sfx('pop');
          this.tween(0.45, k => inner.setAttribute('transform', `scale(${k.toFixed(3)}) rotate(${((1 - k) * -40).toFixed(1)})`), FF.ease.backBig);
        });
      });
      FF.hud.text(L, n === 3 ? 'Super catching!' : n === 2 ? 'Great catching!' : 'Well done!', 640, 420, 64, { fill: '#ffffff', stroke: '#5a3214' });
      return L;
    }
  }
  FF.games.catch = Catch;
})(window.FF);
