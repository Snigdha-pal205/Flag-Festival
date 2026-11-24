/* Flag Festival — sound: made-in-browser craft sounds, 3 music loops, and spoken lines.
   Voice: a recorded file from FF_CONTENT.voiceFiles if present, else the browser's
   Indian English voice (en-IN), warm and a little higher for Pip.                       */
(function (FF) {
  'use strict';
  const A = FF.audio = {};
  let ctx = null, master, sfxBus, musicBus, noiseBuf = null;
  let musicOn = true;
  A.ready = false;

  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    comp.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(comp);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.16 : 0; musicBus.connect(comp);
    // 2 s of white noise, reused
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    if (ctx.state === 'suspended') ctx.resume();
    A.ready = true;
    pickVoice();
    // a silent utterance unlocks speech on iOS Safari
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) { /* no speech */ }
  };

  const T = () => ctx.currentTime;

  function tone(o) {
    if (!ctx) return;
    const t0 = T() + (o.when || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + (o.glide || o.dur));
    if (o.vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.vib; lg.gain.value = o.vibAmt || 12;
      l.connect(lg); lg.connect(osc.frequency); l.start(t0); l.stop(t0 + o.dur + 0.1);
    }
    const vol = o.vol === undefined ? 0.3 : o.vol;
    const at = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    let node = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || 1;
      osc.connect(f); node = f;
    }
    node.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t0); osc.stop(t0 + o.dur + 0.05);
  }
  function noise(o) {
    if (!ctx) return;
    const t0 = T() + (o.when || 0);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    src.playbackRate.value = o.rate || 1;
    const f = ctx.createBiquadFilter();
    f.type = o.ftype || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t0);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    const vol = o.vol === undefined ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t0, Math.random()); src.stop(t0 + o.dur + 0.05);
  }

  /* ---------- craft-table sound effects (GDD §9) ---------- */
  const S = {
    pick() { tone({ f: 660, f2: 990, dur: 0.09, vol: 0.18, type: 'triangle' }); noise({ f: 3000, dur: 0.05, vol: 0.06 }); },
    clunk() { // wooden puzzle piece sliding in
      tone({ f: 190, f2: 110, dur: 0.18, vol: 0.5, type: 'triangle' });
      tone({ f: 420, f2: 300, dur: 0.07, vol: 0.25, type: 'square', lp: 1200 });
      noise({ f: 900, dur: 0.06, vol: 0.25, q: 2 });
    },
    tap() { noise({ f: 2400, dur: 0.05, vol: 0.35, q: 1.5 }); tone({ f: 520, f2: 380, dur: 0.06, vol: 0.12, type: 'triangle' }); },
    stitch() { for (let i = 0; i < 5; i++) { noise({ f: 4200, dur: 0.03, vol: 0.18, q: 6, when: i * 0.055 }); tone({ f: 1500 + i * 80, dur: 0.03, vol: 0.05, when: i * 0.055, type: 'triangle' }); } },
    splosh() {
      noise({ f: 1800, f2: 300, dur: 0.32, vol: 0.4, ftype: 'lowpass', q: 3 });
      tone({ f: 300, f2: 700, dur: 0.12, vol: 0.18, when: 0.04 });
      tone({ f: 500, f2: 900, dur: 0.08, vol: 0.1, when: 0.14 });
    },
    drip() { tone({ f: 900, f2: 300, dur: 0.15, vol: 0.12 }); tone({ f: 700, f2: 250, dur: 0.15, vol: 0.09, when: 0.12 }); },
    boing() { tone({ f: 180, f2: 520, dur: 0.38, vol: 0.32, type: 'sine', vib: 18, vibAmt: 60, glide: 0.12 }); },
    pop() { tone({ f: 500, f2: 1200, dur: 0.08, vol: 0.32, type: 'sine' }); noise({ f: 2000, dur: 0.04, vol: 0.12 }); },
    bubble() { tone({ f: 700 + Math.random() * 500, f2: 1600, dur: 0.07, vol: 0.2 }); },
    whoosh() { noise({ f: 400, f2: 2400, dur: 0.35, vol: 0.18, q: 0.8 }); },
    paper() { noise({ f: 3000, f2: 1500, dur: 0.22, vol: 0.12, q: 0.6, rate: 0.7 }); },
    yes() { [0, 4, 7, 12].forEach((s, i) => tone({ f: 523 * Math.pow(2, s / 12), dur: 0.22, vol: 0.13, when: i * 0.07, type: 'triangle' })); },
    chime() { [12, 16, 19].forEach((s, i) => tone({ f: 523 * Math.pow(2, s / 12), dur: 0.5, vol: 0.08, when: i * 0.05, type: 'sine' })); },
    drumroll(len) {
      len = len || 1.1;
      const n = Math.floor(len / 0.045);
      for (let i = 0; i < n; i++) noise({ f: 900, dur: 0.05, vol: 0.06 + 0.2 * i / n, q: 0.9, when: i * 0.045 });
      dhol(len, 1); dhol(len + 0.02, 0.5, true);
      tone({ f: 784, dur: 0.4, vol: 0.12, when: len, type: 'triangle' });
      tone({ f: 1046, dur: 0.5, vol: 0.12, when: len + 0.08, type: 'triangle' });
    },
    cheer() {
      noise({ f: 1400, dur: 1.6, vol: 0.18, q: 0.5, attack: 0.3 });
      for (let i = 0; i < 6; i++) tone({ f: 600 + Math.random() * 500, f2: 900 + Math.random() * 400, dur: 0.25, vol: 0.04, when: Math.random() * 1.2, type: 'triangle' });
    },
    giggle() { // Grumble's silly giggle
      for (let i = 0; i < 6; i++) tone({ f: 330 + (i % 2) * 70, f2: 260, dur: 0.09, vol: 0.18, when: i * 0.1, type: 'triangle', vib: 30, vibAmt: 20 });
    },
    hmph() { tone({ f: 160, f2: 110, dur: 0.35, vol: 0.28, type: 'sawtooth', lp: 600 }); noise({ f: 500, dur: 0.25, vol: 0.12 }); },
    sneeze() {
      tone({ f: 300, f2: 600, dur: 0.5, vol: 0.12, type: 'triangle' });
      noise({ f: 2500, f2: 600, dur: 0.4, vol: 0.4, when: 0.5, q: 0.7 });
      tone({ f: 520, f2: 180, dur: 0.3, vol: 0.2, when: 0.5, type: 'sawtooth', lp: 1500 });
    },
    rain() { for (let i = 0; i < 26; i++) noise({ f: 2500 + Math.random() * 3000, dur: 0.04, vol: 0.08, q: 8, when: Math.random() * 1.6 }); },
    thunderlet() { noise({ f: 200, f2: 80, dur: 0.8, vol: 0.25, ftype: 'lowpass' }); },
    sparkle() { for (let i = 0; i < 4; i++) tone({ f: 1200 + i * 300, dur: 0.12, vol: 0.05, when: i * 0.06 }); },
    flap() { noise({ f: 700, dur: 0.08, vol: 0.12, q: 1.2 }); noise({ f: 600, dur: 0.08, vol: 0.1, when: 0.12, q: 1.2 }); },
    // animal friends
    trumpet() { tone({ f: 300, f2: 700, dur: 0.6, vol: 0.2, type: 'sawtooth', lp: 1800, vib: 7, vibAmt: 25, glide: 0.3 }); },
    hum() { tone({ f: 140, dur: 0.7, vol: 0.25, type: 'triangle', vib: 5, vibAmt: 6, attack: 0.08 }); },
    croak() { for (let i = 0; i < 3; i++) tone({ f: 220, f2: 140, dur: 0.12, vol: 0.18, when: i * 0.15, type: 'sawtooth', lp: 900 }); },
    yip() { tone({ f: 900, f2: 1500, dur: 0.1, vol: 0.2, type: 'triangle' }); tone({ f: 1000, f2: 1700, dur: 0.1, vol: 0.18, when: 0.14, type: 'triangle' }); },
    grunt() { tone({ f: 120, f2: 90, dur: 0.45, vol: 0.3, type: 'sawtooth', lp: 500, vib: 9, vibAmt: 10 }); },
    snap() { noise({ f: 1800, dur: 0.05, vol: 0.5, q: 3 }); tone({ f: 260, f2: 120, dur: 0.08, vol: 0.3, type: 'square', lp: 900 }); },
    honk() { tone({ f: 440, f2: 380, dur: 0.22, vol: 0.18, type: 'sawtooth', lp: 1400 }); tone({ f: 470, f2: 400, dur: 0.22, vol: 0.18, when: 0.26, type: 'sawtooth', lp: 1400 }); },
    yawn() { tone({ f: 380, f2: 150, dur: 1.0, vol: 0.14, type: 'triangle', attack: 0.15, vib: 4, vibAmt: 8 }); },
    moo() { tone({ f: 150, f2: 110, dur: 0.9, vol: 0.28, type: 'sawtooth', lp: 700, attack: 0.12, vib: 5, vibAmt: 6 }); },
    tweet() { [0, 0.13, 0.26].forEach((w, i) => tone({ f: 2200 + i * 300, f2: 3200, dur: 0.09, vol: 0.12, when: w, type: 'sine' })); },
    meow() { tone({ f: 600, f2: 900, dur: 0.2, vol: 0.16, type: 'triangle', glide: 0.12 }); tone({ f: 900, f2: 500, dur: 0.35, vol: 0.14, when: 0.18, type: 'triangle' }); },
    squeak() { tone({ f: 2400, f2: 3000, dur: 0.07, vol: 0.12 }); tone({ f: 2600, f2: 3300, dur: 0.07, vol: 0.12, when: 0.11 }); },
    chirp() { tone({ f: 1400, f2: 2100, dur: 0.08, vol: 0.12, type: 'triangle' }); tone({ f: 1600, f2: 2400, dur: 0.08, vol: 0.12, when: 0.1, type: 'triangle' }); },
    buzz() { tone({ f: 210, dur: 0.6, vol: 0.06, type: 'sawtooth', lp: 1200, vib: 30, vibAmt: 25 }); }
  };
  function dhol(when, vol, high) {
    if (!ctx) return;
    if (high) { noise({ f: 1800, dur: 0.08, vol: 0.2 * vol, q: 1.5, when }); tone({ f: 420, f2: 300, dur: 0.07, vol: 0.14 * vol, when, type: 'triangle' }); }
    else { tone({ f: 120, f2: 52, dur: 0.32, vol: 0.55 * vol, when, type: 'sine' }); noise({ f: 300, dur: 0.05, vol: 0.12 * vol, when }); }
  }
  A.sfx = function (name, arg) { if (!ctx) return; try { S[name] && S[name](arg); } catch (e) { /* ignore */ } };

  /* ---------- music: small sequencer, Bhupali-like pentatonic, dhol + plucked strings ---------- */
  const SC = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81]; // C D E G A C' D' E' G' A'
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const SONGS = {
    festival: { bpm: 108, // 8ths
      mel: [5, -1, 4, 3, 4, -1, 5, 6, 7, -1, 6, 5, 4, -1, -1, -1, 3, 4, 5, 4, 3, 2, 1, 2, 3, -1, 2, 1, 0, -1, -1, -1,
        5, -1, 4, 3, 4, -1, 5, 6, 7, -1, 8, 7, 6, -1, 5, -1, 4, 5, 6, 5, 4, 3, 2, 3, 0, -1, -1, -1, -1, -1, -1, -1],
      bass: [48, 48, 55, 55, 57, 57, 55, 55, 48, 48, 55, 55, 53, 53, 48, 48],
      drum: 'D.t.D.tt D.t.Dtt.', inst: 'pluck', vol: 1 },
    calm: { bpm: 84,
      mel: [2, -1, 4, -1, 3, -1, 2, -1, 1, -1, 3, -1, 2, -1, -1, -1, 0, -1, 2, -1, 4, -1, 5, -1, 4, -1, 3, -1, 2, -1, -1, -1],
      bass: [48, 48, 45, 45, 41, 41, 43, 43],
      drum: 'D.......t.......', inst: 'soft', vol: 0.7 },
    parade: { bpm: 120,
      mel: [5, 5, 7, 5, 8, -1, 7, -1, 6, 6, 5, 4, 5, -1, -1, -1, 4, 4, 5, 4, 3, -1, 2, -1, 3, 4, 3, 2, 0, -1, -1, -1,
        5, 5, 7, 5, 8, -1, 9, -1, 8, 7, 6, 5, 6, -1, -1, -1, 7, 6, 5, 4, 3, 4, 5, 3, 5, -1, 4, 2, 0, -1, -1, -1],
      bass: [48, 55, 48, 55, 53, 57, 55, 55, 48, 55, 48, 55, 53, 55, 48, 48],
      drum: 'DtDtDttt DtDtDtTT', inst: 'brass', vol: 1.1 }
  };
  let song = null, songName = null, step = 0, nextT = 0, timer = null;
  function playNote(inst, m, when, dur) {
    const f = mtof(m);
    const w = when - T();
    if (inst === 'pluck') {
      tone({ f, dur: dur * 1.6, vol: 0.22, type: 'triangle', when: w, bus: musicBus });
      tone({ f: f * 2, dur: dur * 0.6, vol: 0.06, type: 'sawtooth', lp: 2200, when: w, bus: musicBus });
    } else if (inst === 'soft') {
      tone({ f, dur: dur * 2.4, vol: 0.16, type: 'sine', attack: 0.06, when: w, bus: musicBus, vib: 5, vibAmt: 2 });
    } else {
      tone({ f, dur: dur * 0.95, vol: 0.13, type: 'sawtooth', lp: 1500, attack: 0.02, when: w, bus: musicBus, vib: 6, vibAmt: 3 });
      tone({ f: f / 2, dur: dur * 0.95, vol: 0.06, type: 'square', lp: 900, attack: 0.02, when: w, bus: musicBus });
    }
  }
  function schedule() {
    if (!song || !ctx) return;
    const spb = 60 / song.bpm / 2; // seconds per 8th
    while (nextT < T() + 0.25) {
      const mi = song.mel[step % song.mel.length];
      if (mi >= 0) playNote(song.inst, SC[mi], nextT, spb);
      if (step % 2 === 0) {
        const b = song.bass[(step / 2) % song.bass.length];
        tone({ f: mtof(b), dur: spb * 1.8, vol: 0.18 * song.vol, type: 'triangle', when: nextT - T(), bus: musicBus, lp: 600 });
      }
      const ds = song.drum.replace(/ /g, '');
      const dc = ds[step % ds.length];
      const w = nextT - T();
      if (dc === 'D') dhol(w, 0.7 * song.vol, false, musicBus);
      else if (dc === 't') dhol(w, 0.5 * song.vol, true, musicBus);
      else if (dc === 'T') dhol(w, 0.8 * song.vol, true, musicBus);
      nextT += spb; step++;
    }
  }
  // drums for music go to the music bus
  const _dhol = dhol;
  dhol = function (when, vol, high, bus) { // eslint-disable-line no-func-assign
    if (!ctx) return;
    if (bus) {
      if (high) { noise({ f: 1800, dur: 0.07, vol: 0.22 * vol, q: 1.5, when, bus }); }
      else { tone({ f: 110, f2: 50, dur: 0.3, vol: 0.6 * vol, when, type: 'sine', bus }); }
    } else _dhol(when, vol, high);
  };
  A.music = function (name) {
    if (!ctx) { songName = name; return; }
    if (songName === name && timer) return;
    songName = name; song = SONGS[name] || null; step = 0; nextT = T() + 0.1;
    if (timer) clearInterval(timer);
    timer = song ? setInterval(schedule, 60) : null;
  };
  A.stopMusic = function () { if (timer) clearInterval(timer); timer = null; song = null; songName = null; };
  A.setMusicOn = function (on) {
    musicOn = on;
    if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.16 : 0, T(), 0.1);
  };
  A.isMusicOn = () => musicOn;
  A.duck = function (on) { if (musicBus && musicOn) musicBus.gain.setTargetAtTime(on ? 0.07 : 0.16, T(), 0.15); };

  /* ---------- voice ---------- */
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const choose = () => {
      const vs = speechSynthesis.getVoices();
      if (!vs.length) return;
      const score = v => {
        let s = 0;
        const lang = (v.lang || '').toLowerCase().replace('_', '-');
        const n = v.name.toLowerCase();
        if (lang === 'en-in') s += 100;
        else if (lang.startsWith('en')) s += 20;
        else return -1;
        if (/natural|online|neural|enhanced|premium/.test(n)) s += 30;
        if (/neerja|heera|veena|isha|kajal|swara|aditi|raveena|female/.test(n)) s += 15;
        if (/google/.test(n)) s += 8;
        if (/rishi|prabhat|male/.test(n)) s += 4;
        return s;
      };
      voice = vs.slice().sort((a, b) => score(b) - score(a))[0] || null;
    };
    choose();
    speechSynthesis.onvoiceschanged = choose;
  }
  let currentAudio = null;
  A.stopVoice = function () {
    try { speechSynthesis.cancel(); } catch (e) { /* */ }
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  };
  /* who: 'pip' | 'grumble' | 'friend' */
  A.say = function (text, o) {
    o = o || {};
    return new Promise(resolve => {
      let done = false;
      const fin = () => { if (done) return; done = true; A.duck(false); resolve(); };
      const file = o.key && FF.C.voiceFiles && FF.C.voiceFiles[o.key];
      A.stopVoice();
      A.duck(true);
      if (file) {
        currentAudio = new Audio(file);
        currentAudio.onended = fin; currentAudio.onerror = fin;
        currentAudio.play().catch(fin);
        setTimeout(fin, 8000);
        return;
      }
      if (!('speechSynthesis' in window)) { setTimeout(fin, 300 + text.length * 55); return; }
      const u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-IN';
      const who = o.who || 'pip';
      u.pitch = who === 'grumble' ? 0.55 : who === 'friend' ? 1.05 : 1.3;
      u.rate = who === 'grumble' ? 0.85 : o.fast ? 1.1 : 0.98;
      u.volume = 1;
      u.onend = fin; u.onerror = fin;
      try { speechSynthesis.speak(u); } catch (e) { fin(); }
      // safety: some browsers never fire onend
      setTimeout(fin, 1200 + text.length * 95);
    });
  };
})(window.FF);
