/* Flag Festival — 3D title, profiles, opening story, parade, goodbye, grown-ups panel */
(function (FF) {
  'use strict';
  const T = THREE;
  const F3 = FF.three;
  const H = FF.hud;
  const S = FF.scenes = {};
  const byKind = k => FF.C.countries.find(c => c.friend.kind === k);

  /* ================= Title ================= */
  S.Title = class extends FF.Scene3D {
    start() {
      FF.ui.showTop(false);
      FF.pip.hide();
      // the poster itself is the title screen
      const w = this.setWorld(new F3.World({ bg: 'title.jpg', fog: false }));
      this.input({});
      const L = this.layer.top;
      const M = FF.bgMap('title.jpg'), k = M.s;   // poster pixels → stage pixels (the poster fills the screen)
      // PLAY: the poster's own button, cut out so it can bounce
      const pg = FF.el('g', { transform: `translate(${M.x(600 + 243).toFixed(1)} ${M.y(535 + 87).toFixed(1)})`, class: 'tappable' }, L);
      const pi = FF.el('g', { class: 'btn-bob' }, pg);
      FF.el('image', { href: 'assets/bg/play.png', x: -243 * k, y: -87 * k, width: 485 * k, height: 175 * k }, pi);
      FF.el('rect', { x: -240 * k, y: -85 * k, width: 480 * k, height: 170 * k, fill: 'transparent' }, pg);
      FF.onTap(pg, () => { FF.audio.init(); FF.audio.sfx('pop'); FF.audio.music('festival'); FF.app.toProfiles(); }, this);
      // a few raindrops keep falling from Grumble
      const rain = FF.el('g', { class: 'no-hit' }, L);
      const drops = [];
      for (let i = 0; i < 14; i++) {
        const d = FF.el('path', { d: 'M0 0 q-3 7 0 10 q3 -3 0 -10z', fill: '#9fd8ff', opacity: 0.8 }, rain);
        drops.push({ d, x: FF.rand(1319, 1528), y: FF.rand(183, 340), v: FF.rand(210, 310) });      // in poster pixels, under Grumble
      }
      this.tick(dt => drops.forEach(p => { p.y += p.v * dt; if (p.y > 352) { p.y = 196; p.x = FF.rand(1319, 1528); } p.d.setAttribute('transform', `translate(${M.x(p.x).toFixed(1)} ${M.y(p.y).toFixed(1)})`); }));
      this.grownUps();
    }
    grownUps() {
      const M = FF.bgMap('title.jpg'), k = M.s;
      // the poster's own "Grown-ups" button — or, if a wide screen trims it off, our own one in the corner
      let gx = M.x(1522), gy = M.y(883);
      const own = gy + 42 * k > 712;
      if (own) { gx = 1280 + FF.OX - 140 * k; gy = 720 - 52 * k; }
      const g = FF.el('g', { transform: `translate(${gx.toFixed(1)} ${gy.toFixed(1)})` }, this.layer.top);
      if (own) {
        FF.el('path', { d: FF.hud.rr(-128 * k, -40 * k, 256 * k, 80 * k, 40 * k), fill: '#fff8ec', stroke: '#5a3214', 'stroke-width': 5 }, g);
        FF.hud.text(g, 'Grown-ups', 0, 12 * k, 34 * k, { fill: '#5a3214' });
      }
      FF.el('rect', { x: -130 * k, y: -42 * k, width: 260 * k, height: 84 * k, rx: 40 * k, fill: 'transparent' }, g);
      const ring = FF.el('path', { d: FF.hud.rr(-128 * k, -40 * k, 256 * k, 80 * k, 40 * k), fill: 'none', stroke: '#5cc531', 'stroke-width': 6, 'stroke-dasharray': '520', 'stroke-dashoffset': 520 }, g);
      g.classList.add('tappable');
      let stopT = null, held = 0;
      const stop = () => { if (stopT) { stopT(); stopT = null; } held = 0; ring.setAttribute('stroke-dashoffset', 520); };
      g.addEventListener('pointerdown', e => {
        e.stopPropagation(); held = 0;
        stopT = this.tick(dt => { held += dt; ring.setAttribute('stroke-dashoffset', (520 * (1 - held / 2)).toFixed(0)); if (held >= 2) { stop(); FF.audio.init(); S.settings(); } });
      });
      this.listen(window, 'pointerup', stop);
      this.listen(window, 'pointercancel', stop);
    }
  };

  /* ================= Who is playing? ================= */
  const ICONS = {
    kite: `<path d="M0 -46 L34 0 L0 46 L-34 0 Z" fill="#ff4d6d" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M0 -46 L34 0 L0 0 Z M0 46 L-34 0 L0 0 Z" fill="#ffd23f"/><path d="M0 -46 V46 M-34 0 H34" stroke="#fff" stroke-width="3"/><path d="M0 46 q14 10 0 20 q-14 10 2 22" stroke="#fff" stroke-width="4" fill="none"/>`,
    sun: `${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<path d="M${(Math.cos(a) * 34).toFixed(1)} ${(Math.sin(a) * 34).toFixed(1)} L${(Math.cos(a + 0.16) * 54).toFixed(1)} ${(Math.sin(a + 0.16) * 54).toFixed(1)} L${(Math.cos(a + 0.32) * 34).toFixed(1)} ${(Math.sin(a + 0.32) * 34).toFixed(1)} Z" fill="#ffb21f" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`; }).join('')}<circle r="36" fill="#ffe14d" stroke="#fff" stroke-width="5"/><circle cx="-12" cy="-6" r="5" fill="#2a1f3d"/><circle cx="12" cy="-6" r="5" fill="#2a1f3d"/><path d="M-14 10 q14 14 28 0" stroke="#2a1f3d" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    drum: `<path d="M-46 -24 L-46 26 Q0 44 46 26 L46 -24 Z" fill="#ff4d6d" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M-46 -14 L-30 30 L-14 -14 L2 34 L18 -14 L34 32 L46 -10" fill="none" stroke="#fff" stroke-width="3"/><ellipse cx="0" cy="-24" rx="46" ry="14" fill="#fff3d6" stroke="#fff" stroke-width="5"/><path d="M30 -60 L8 -28 M-30 -60 L-8 -28" stroke="#c98a4b" stroke-width="7" stroke-linecap="round"/><circle cx="30" cy="-62" r="7" fill="#ffd23f" stroke="#fff" stroke-width="3"/><circle cx="-30" cy="-62" r="7" fill="#ffd23f" stroke="#fff" stroke-width="3"/>`,
    boat: `<path d="M-50 14 L50 14 L34 40 L-34 40 Z" fill="#3d6bff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M-2 10 V-50" stroke="#fff" stroke-width="5"/><path d="M2 -48 L40 6 L2 6 Z" fill="#ffffff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M-6 -40 L-36 6 L-6 6 Z" fill="#ffd23f" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`
  };
  const PCOL = { kite: '#ff8a1f', sun: '#2f9cf0', drum: '#5cc531', boat: '#ff5fa8' };
  S.Profiles = class extends FF.Scene3D {
    start() {
      FF.ui.showTop(false);
      const w = this.setWorld(FF.frontWorld({ ground: { stageX: 0, stageZ: -16 } }));
      this.input({});
      H.title(this.layer.top, 'Who is playing?', 640, 140, 86, { seed: 3 });
      ['kite', 'sun', 'drum', 'boat'].forEach((id, i) => {
        const x = 220 + i * 280, y = 330;
        const g = H.round(this.layer.top, x, y, 104, { color: PCOL[id], bob: true });
        g.firstChild.style.animationDelay = (-i * 0.4) + 's';
        g.firstChild.insertAdjacentHTML('beforeend', `<g transform="translate(0 -4) scale(1.25)">${ICONS[id]}</g>`);
        const p = FF.app.getProfile(id);
        const learned = FF.C.countries.filter(c => p.flags[c.id] && p.flags[c.id].learned);
        const bg = FF.el('g', { transform: `translate(${x} ${y + 148})`, class: 'no-hit' }, this.layer.top);
        let s = `<path d="M-122 -6 Q0 14 122 -6" fill="none" stroke="#ffffff" stroke-width="5"/>`;
        FF.C.countries.forEach((c, k) => {
          const px = -102 + k * 34, py = -2 + Math.sin((k + 0.5) / 7 * Math.PI) * 10;
          if (learned.includes(c)) {
            const fd = FF.flags.data(c.flag), sc = 30 / fd.h, cid = FF.uid('pp');
            s += `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)})"><clipPath id="${cid}"><path d="M-13 0 L13 0 L0 28 Z"/></clipPath><g clip-path="url(#${cid})"><use href="#${FF.flags.def(c.flag)}" transform="translate(${(-fd.w * sc / 2).toFixed(1)} 0) scale(${sc.toFixed(3)})"/></g><path d="M-13 0 L13 0 L0 28 Z" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></g>`;
          } else s += `<path transform="translate(${px.toFixed(1)} ${py.toFixed(1)})" d="M-13 0 L13 0 L0 28 Z" fill="rgba(255,255,255,.45)" stroke="#fff" stroke-width="2" stroke-dasharray="3 3" stroke-linejoin="round"/>`;
        });
        bg.innerHTML = s;
        FF.onTap(g, () => { FF.audio.sfx('pop'); FF.app.choose(id); }, this);
      });
      FF.pip.show(660, 706, 1.1);
      FF.say('whoIsPlaying');
    }
  };

  /* ================= Opening story (about 25 s, once, skippable) ================= */
  S.Intro = class extends FF.Scene3D {
    start() {
      FF.ui.showTop(false);
      FF.audio.music('festival');
      FF.pip.hide();
      this.setWorld(FF.frontWorld({ ground: { stageX: 3, stageZ: -16 } }));
      this.input({});
      const skip = H.button(this.layer.top, 1150, 60, 190, 76, { color: '#e8793a', label: 'Skip', icon: 'skip', size: 34 });
      FF.onTap(skip, () => this.end(), this);
      this.run();
    }
    end() { if (this.ended) return; this.ended = true; FF.audio.stopVoice(); this.args.done && this.args.done(); }
    async run() {
      const w = this.w;
      const who = [['chad', 2.0], ['niger', 2.6], ['algeria', 1.9], ['egypt', 2.0]];
      const stopAt = [4.2, 1.6, -1.0, -3.6];
      const fr = who.map((wh, i) => {
        const cn = FF.C.countries.find(c => c.id === wh[0]);
        const c = F3.chars.forCountry(w, cn);
        c.setHeight(wh[1]).place(-9 - i * 2.6, -3.4, -1.2).turn(Math.PI / 2 * 0.7).setBase('march');
        c.flagObj = c.holdFlag(w, cn.flag, 0.6);
        c.cn = cn;
        return c;
      });
      w.onUpdate(dt => fr.forEach((c, i) => {
        const x = c.root.position.x;
        if (x < stopAt[i]) { c.root.position.x = Math.min(stopAt[i], x + 2.2 * dt); if (c.root.position.x >= stopAt[i]) { c.setBase('idle'); c.turn(0.2); } }
      }));
      await this.wait(700);
      if (!this.alive) return;
      FF.pip.show(-80, 300, 1.4);
      FF.pip.flyTo(170, 330, 0.9, 1.4);
      await this.wait(1000);
      await FF.say('intro1', {}, { hold: 500 });
      if (!this.alive) return;
      await this.wait(1500);
      if (!this.alive) return;
      // Grumble drifts over, sulking, and rains on the flags
      const gr = F3.chars.add(w, 'grumble');
      gr.setHeight(2).place(11, 0.45, -1).setBase('float');
      await this.tween(1.6, k => gr.place(FF.lerp(11, 0.5, k), 0.45, -1), FF.ease.inOut);
      if (!this.alive) return;
      FF.audio.sfx('hmph');
      const gb = H.bubble(this.layer.top, FF.line('intro2'), { size: 28, tail: 'left' });
      gb.setAttribute('transform', 'translate(815 150)');
      await FF.audio.say(FF.line('intro2'), { who: 'grumble', key: 'intro2' });
      if (!this.alive) return;
      FF.audio.sfx('rain'); FF.audio.sfx('thunderlet');
      gr.setFace('giggle');
      F3.rain(w, -6, 6, 1.2, -3.4, -1.2, 2.4);
      this.after(1300, () => fr.forEach(c => c.flagObj.setMode('grey')));
      await this.wait(2300);
      if (!this.alive) return;
      gb.remove();
      // ...and the pieces scatter in the wind
      FF.audio.sfx('whoosh');
      fr.forEach(c => {
        const hp = c.flagObj.cloth.getWorldPosition(new T.Vector3());
        c.hand.remove(c.flagObj.group);
        for (let k = 0; k < 6; k++) {
          const m = F3.B(w.scene, 0.25, 0.18, 0.02, F3.toy(['#a9a4b4', '#c4bfcd', '#8f8a9c'][k % 3], { side: T.DoubleSide }), hp.x, hp.y, hp.z);
          const vx = FF.rand(3, 7), vy = FF.rand(1, 4);
          this.tween(1.4, kk => { m.position.set(hp.x + vx * kk * 1.4, hp.y + vy * kk - 4 * kk * kk, hp.z); m.rotation.set(kk * 9, kk * 7, kk * 5); }, FF.ease.linear).then(() => w.scene.remove(m));
        }
        c.play('hop');
      });
      this.tween(1.4, k => gr.place(FF.lerp(0.5, 11, k), 0.45 + k, -1), FF.ease.in);
      await FF.say('intro3', {}, { hold: 400 });
      if (!this.alive) return;
      await FF.pip.flyTo(260, 560, 0.9, 1.9);
      if (!this.alive) return;
      await FF.say('intro4', {}, { hold: 300 });
      if (!this.alive) return;
      await FF.say('intro5', {}, { hold: 99999 });
      if (!this.alive) return;
      const yes = H.button(this.layer.top, 800, 420, 300, 130, { color: '#6cb33f', label: 'YES!', icon: 'check', bob: true, size: 64 });
      FF.audio.sfx('pop');
      FF.onTap(yes, () => { FF.audio.sfx('yes'); FF.pip.cheer(); fr.forEach(c => c.play('happy')); F3.confetti(w, new T.Vector3(0, 4.5, 0), 14, 2, 120); this.after(900, () => this.end()); }, this);
    }
  };

  /* ================= The parade (about 25 s) ================= */
  S.Parade = class extends FF.Scene3D {
    start() {
      FF.ui.showTop(false);
      FF.audio.music('parade');
      FF.audio.sfx('cheer');
      const w = this.setWorld(FF.frontWorld({ ground: { stageX: 0, stageZ: -16, pathZ: -1.6 } }));
      const learned = this.args.learned || [];
      const all = learned.length >= FF.C.countries.length;
      const gap = 2.6;
      const pz = -1.6;
      this.members = FF.C.countries.map((cn, i) => {
        const x = -8 - i * gap;
        if (learned.includes(cn.id)) {
          // a flag on its own pole, marching with a little bounce
          const g = F3.group(w.scene, x, -3.4, pz);
          const f = F3.flags.add(w, g, cn.flag, 1.0, { poleLen: 3.0, amp: 0.07, speed: 5 });
          let jump = 0, t0 = i * 0.4;
          w.onUpdate((dt, t) => { jump = Math.max(0, jump - dt); f.group.position.y = Math.abs(Math.sin((t + t0) * 6)) * 0.12 + Math.sin(jump / 0.5 * Math.PI) * 0.5; f.group.rotation.z = Math.sin((t + t0) * 6) * 0.04; });
          const c = { play: () => { jump = 0.5; }, sound: () => FF.audio.sfx('pop') };
          g.traverse(o => { if (o.isMesh) o.userData.member = { c, cn }; });
          return { o: g, c, cn };
        }
        // empty space: a friend still to come
        const g = F3.group(w.scene, x, -3.4, pz);
        const ghost = F3.ownMat(new T.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, roughness: 0.2, clearcoat: 1 }));
        F3.mesh(F3.geo.sphere, ghost, 0, 1.0, 0, 0.7, 1.0, 0.7, g);
        const q = F3.label('?', { height: 0.9, size: 120, color: '#b06cff' }); q.position.set(0, 1.1, 0.8); g.add(q);
        return { o: g };
      });
      // the cheering crowd in front
      const skins = ['#8d5a3b', '#c68b59', '#a86b45', '#e0ac7e', '#6e432a', '#b97a4e'];
      const shirts = ['#ff4d6d', '#3d9bff', '#ffb21f', '#3fcf5a', '#ff8fd0', '#b06cff'];
      const crowd = [];
      for (let i = 0; i < 0; i++) {
        const p = w.atZ(30 + i * 82 + (i % 2) * 12, 800 - (i % 3) * 6, 4.2);
        const g = F3.group(w.scene, p.x, p.y, 4.2 - (i % 2) * 0.3);
        g.scale.setScalar(0.62);
        F3.Ca(g, 0.32, 0.4, F3.toy(shirts[i % 6]), 0, 0.2, 0);
        F3.S(g, 0.3, F3.toy(skins[i % 6]), 0, 0.95, 0);
        F3.S(g, 0.31, F3.toy('#2e211a', { rough: 0.5 }), 0, 1.05, -0.04, 1, 0.75, 1);
        [-1, 1].forEach(s => F3.S(g, 0.05, F3.toy('#231a2e'), s * 0.1, 0.98, 0.27));
        if (i % 3 === 0) { const a = F3.Ca(g, 0.07, 0.45, F3.toy(skins[(i + 2) % 6]), 0.32, 0.8, 0.1); a.rotation.z = -0.5; const pf = F3.B(g, 0.32, 0.2, 0.02, F3.toy(shirts[(i + 3) % 6]), 0.62, 1.25, 0.1); }
        crowd.push({ g, y: p.y, ph: Math.random() * 6 });
      }
      w.onUpdate((dt, t) => crowd.forEach(c => { c.g.position.y = c.y + Math.abs(Math.sin(t * 5 + c.ph)) * 0.18; }));
      FF.pip.show(640, 280, 1.2);
      FF.pip.char.flying = true;
      FF.say('paradeTime', {}, { hold: 1200 });
      const speed = 1.35;
      let cheer = 4;
      w.onUpdate((dt, t) => {
        this.members.forEach(m => { m.o.position.x += speed * dt; });
        FF.pip.x = 640 + Math.sin(t * 0.7) * 300; FF.pip.y = 270 + Math.sin(t * 2.1) * 20; FF.pip.place();
        cheer -= dt; if (cheer <= 0) { cheer = FF.rand(4, 7); FF.audio.sfx('cheer'); }
      });
      // tap any flag (or friend) to hear its name
      this.input({
        down: p => {
          const hit = w.pick(p.x, p.y, this.members.filter(m => m.c).map(m => m.o));
          if (hit && hit.object.userData.member) {
            const { c, cn } = hit.object.userData.member;
            FF.audio.say(cn.name + '!', { who: 'pip', key: 'country_' + cn.id });
            c.play('hop'); c.sound();
            return true;
          }
          return false;
        }
      });
      this.after(1500, () => F3.confetti(w, new T.Vector3(0, 5, 0), 18, 7, 160));
      if (all) this.after(9000, () => this.finale());
      else { const gr = F3.chars.add(w, 'grumble'); gr.setHeight(1.3).place(6, 0.95, -3).setBase('float'); }
      const total = ((this.members.length - 1) * gap + 17) / speed;
      this.after(total * 1000, () => this.end());
      const next = H.round(this.layer.top, 1214, 650, 42, { color: '#3fcf5a', icon: 'skip' });
      FF.onTap(next, () => this.end(), this);
    }
    async finale() {
      const w = this.w;
      const gr = F3.chars.add(w, 'grumble');
      gr.setHeight(1.8).place(11, 0.6, -1).setBase('float');
      await this.tween(1.4, k => gr.place(FF.lerp(11, 3.2, k), 0.6, -1), FF.ease.inOut);
      if (!this.alive) return;
      await FF.say('grumbleJoin', {}, { hold: 400 });
      if (!this.alive) return;
      gr.setFace('happy'); gr._face = 'happy'; gr.play('hop');
      FF.audio.sfx('yes');
      const b = H.bubble(this.layer.top, FF.line('grumbleYay'), { size: 28, tail: 'left' });
      b.setAttribute('transform', 'translate(900 40)');
      await FF.audio.say(FF.line('grumbleYay'), { who: 'grumble', key: 'grumbleYay' });
      if (!this.alive) return;
      this.after(1200, () => b.remove());
      FF.audio.sfx('cheer');
      F3.confetti(w, new T.Vector3(3.2, 2.5, -1), 4, 6, 140);
    }
    end() {
      if (this.ended) return;
      this.ended = true;
      FF.pip.char.flying = false;
      this.args.done && this.args.done();
    }
  };

  /* ================= Goodbye: stop on a happy high ================= */
  S.Goodbye = class extends FF.Scene3D {
    start() {
      FF.ui.showTop(false);
      FF.audio.music('festival');
      const w = this.setWorld(FF.frontWorld({ ground: { stageX: 0, stageZ: -16 } }));
      this.input({});
      const next = this.args.next;
      FF.pip.show(330, 580, 1.7);
      {
        FF.C.countries.forEach((cn, i) => {
          const g = F3.group(w.scene, -2.9 + i * 1.25, -3.4, -1.2 - (i % 2) * 0.6);
          const f = F3.flags.add(w, g, cn.flag, 0.55, { poleLen: 2.2, amp: 0.07, speed: 5 });
          w.onUpdate((dt, t) => { f.group.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.15; });
        });
        const gr = F3.chars.add(w, 'grumble');
        gr.setHeight(1.6).place(2.5, 0.75, -2).setBase('float'); gr.setFace('happy'); gr._face = 'happy';
        F3.confetti(w, new T.Vector3(2.5, 5, -1), 12, 6, 140);
        FF.say('allDone', {}, { hold: 99999 });
      }
      const home = H.button(this.layer.top, 1110, 150, 200, 96, { color: '#3d9bff', icon: 'home' });
      FF.onTap(home, () => { FF.audio.sfx('tap'); FF.app.home(); }, this);
      const again = H.round(this.layer.top, 1110, 270, 42, { color: '#ffb21f', icon: 'again' });
      FF.onTap(again, () => { FF.audio.sfx('tap'); FF.app.again(); }, this);
    }
  };

  // the title screen is laid out on the poster: redraw it if the screen changes shape
  FF.onLayout.add(() => { if (FF.current instanceof S.Title && FF.app) FF.app.go(new S.Title(), false); });

  /* ================= Grown-ups settings (text is for adults) ================= */
  S.settings = function () {
    const L = FF.layers.top;
    const g = FF.el('g', {}, L);
    g.innerHTML = `<rect x="-700" y="0" width="2680" height="720" fill="#1a1030" opacity=".5"/>`;
    g.addEventListener('pointerdown', e => e.stopPropagation());
    H.panel(g, 290, 90, 700, 410, { stroke: '#b06cff' });
    H.title(g, 'For grown-ups', 640, 170, 54, { seed: 2 });
    const row = (y, label, sub, kind, fn, value) => {
      const rg = FF.el('g', { transform: `translate(350 ${y})` }, g);
      const t1 = FF.el('text', { x: 0, y: 0, 'font-size': 26, class: 'body-font', fill: '#2a1f3d', 'font-weight': 700 }, rg); t1.textContent = label;
      const t2 = FF.el('text', { x: 0, y: 28, 'font-size': 17, class: 'body-font', fill: '#6b5a80' }, rg); t2.textContent = sub;
      const bx = FF.el('g', { transform: 'translate(540 2)', class: 'tappable' }, rg);
      const draw = v => {
        bx.innerHTML = kind === 'toggle'
          ? `<path d="${H.rr(-42, -24, 84, 48, 24)}" fill="${v ? '#3fcf5a' : '#cfc8dc'}" stroke="#fff" stroke-width="4"/><circle cx="${v ? 18 : -18}" cy="0" r="17" fill="#fff"/>`
          : `<path d="${H.rr(-72, -26, 144, 52, 26)}" fill="${H.grad('#ff4d6d')}" stroke="#fff" stroke-width="4"/>`;
        if (kind !== 'toggle') { const tt = FF.el('text', { x: 0, y: 8, 'text-anchor': 'middle', 'font-size': 21, class: 'body-font', fill: '#fff', 'font-weight': 700 }, bx); tt.textContent = v; }
      };
      let val = value; draw(val);
      bx.addEventListener('pointerdown', e => { e.stopPropagation(); FF.audio.sfx('tap'); val = fn(val); draw(val); });
    };
    row(260, 'Music', 'Festival music in the background.', 'toggle', v => { FF.audio.setMusicOn(!v); FF.app.saveSetting('music', !v); FF.ui.refreshMusic(); return !v; }, FF.audio.isMusicOn());
    let armed = false;
    row(360, 'Reset all progress', 'Clears every child profile on this device.', 'btn', () => { if (!armed) { armed = true; return 'Tap again'; } FF.app.resetAll(); return 'Cleared'; }, 'Reset');
    const close = H.round(g, 950, 120, 30, { color: '#ff4d6d', icon: 'close' });
    close.addEventListener('pointerdown', e => { e.stopPropagation(); FF.audio.sfx('tap'); g.remove(); });
    const ft = FF.el('text', { x: 640, y: 470, 'text-anchor': 'middle', 'font-size': 16, class: 'body-font', fill: '#6b5a80' }, g);
    ft.textContent = 'Progress is saved only in this browser. No personal data leaves the device.';
  };
})(window.FF);
