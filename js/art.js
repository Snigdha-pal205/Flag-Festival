/* Flag Festival — art kit. Everything is drawn here in one hand: warm paper, brown ink,
   slightly wobbly lines, cut-paper pieces. No gradients-as-decoration, no glossy UI.    */
(function (FF) {
  'use strict';
  const A = FF.art = {};
  const INK = FF.INK;
  const PAL = A.PAL = {
    paper: '#F4EBDD', paperLight: '#FBF5EA', kraft: '#D9B98F', ink: INK,
    marigold: '#F2A541', turmeric: '#E9B824', chilli: '#C8442F', indigo: '#3D4E8C', leaf: '#5B8C3A',
    sky: '#9CC9DE', grumble: '#A8A2AE', grass: '#9DBE63', grassDark: '#7FA24C', wood: '#B7804B', woodDark: '#8A5A33'
  };
  A.FESTIVE = [PAL.marigold, PAL.chilli, PAL.indigo, PAL.leaf, PAL.turmeric, '#E57A8C'];

  /* ---------- shared defs ---------- */
  A.initDefs = function () {
    const grain = FF.makeTexture('grain', 256);
    const blotch = FF.makeTexture('blotch', 256);
    FF.defs.innerHTML += `
      <pattern id="pat-grain" patternUnits="userSpaceOnUse" width="256" height="256"><image href="${grain}" width="256" height="256"/></pattern>
      <pattern id="pat-blotch" patternUnits="userSpaceOnUse" width="256" height="256"><image href="${blotch}" width="256" height="256"/></pattern>
      <pattern id="pat-weave" patternUnits="userSpaceOnUse" width="5" height="5">
        <path d="M0 2.5H5M2.5 0V5" stroke="#000" stroke-opacity=".07" stroke-width="1"/>
      </pattern>
      <pattern id="pat-rain" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(18)">
        <path d="M3 0V8M10 6V14" stroke="#8C8596" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
      </pattern>
      <pattern id="pat-basket" patternUnits="userSpaceOnUse" width="22" height="14">
        <rect width="22" height="14" fill="#C9914E"/>
        <path d="M0 7 q5.5 -6 11 0 t11 0" fill="none" stroke="#8A5A2B" stroke-width="2"/>
        <path d="M0 0 q5.5 6 11 0 t11 0 M0 14 q5.5 -6 11 0 t11 0" fill="none" stroke="#E0B070" stroke-width="1.6"/>
      </pattern>
      <pattern id="pat-wood" patternUnits="userSpaceOnUse" width="120" height="30">
        <rect width="120" height="30" fill="#BF8A52"/>
        <path d="M0 8 q30 -4 60 0 t60 0 M0 20 q40 4 80 0 t40 0" fill="none" stroke="#9B6A3B" stroke-width="1.4" opacity=".6"/>
      </pattern>
      <filter id="boil0" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>
      <filter id="boil1" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>
      <filter id="boil2" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="13"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>
    `;
    // line "boil" (8–10 fps) on characters: swap seed filter on the root class
    let b = 0;
    setInterval(() => { b = (b + 1) % 3; FF.svg.setAttribute('data-boil', b); }, 110);
    const st = document.createElement('style');
    st.textContent = `svg[data-boil="0"] .boil{filter:url(#boil0)} svg[data-boil="1"] .boil{filter:url(#boil1)} svg[data-boil="2"] .boil{filter:url(#boil2)}`;
    document.head.appendChild(st);
  };

  /* ---------- small drawing helpers ---------- */
  A.limb = function (d, fill, w, extra) {
    return `<path d="${d}" stroke="${INK}" stroke-width="${w + 7}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" stroke="${fill}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}/>`;
  };
  A.textEl = function (parent, str, x, y, o) {
    o = o || {};
    const t = FF.el('text', {
      x, y, 'text-anchor': o.anchor || 'middle', 'font-size': o.size || 28, 'font-weight': o.weight || 700,
      fill: o.fill || INK, class: o.cls || '', 'dominant-baseline': o.baseline || 'auto',
      stroke: o.halo ? (o.haloColor || PAL.paperLight) : null, 'stroke-width': o.halo ? o.halo : null,
      'paint-order': o.halo ? 'stroke' : null, 'stroke-linejoin': 'round', transform: o.rot ? `rotate(${o.rot} ${x} ${y})` : null
    }, parent);
    t.textContent = str;
    return t;
  };

  /* Hand-lettered-style title: cut-paper sticker letters, each glyph tilted and coloured */
  A.letters = function (parent, str, x, y, size, o) {
    o = o || {};
    const colors = o.colors || A.FESTIVE;
    const g = FF.el('g', { class: 'no-hit' }, parent);
    const rnd = FF.rng(o.seed || str.length * 7 + 3);
    const rot = [], dys = [];
    for (let i = 0; i < str.length; i++) { rot.push(((rnd() - 0.5) * 14).toFixed(1)); dys.push(((rnd() - 0.5) * size * 0.1).toFixed(1)); }
    const mk = (layer) => {
      const t = FF.el('text', { x, y, 'text-anchor': o.anchor || 'middle', 'font-size': size, class: 'hand-letter', rotate: rot.join(' '), 'stroke-linejoin': 'round', 'letter-spacing': o.spacing || 1 }, g);
      let dyPrev = 0;
      for (let i = 0; i < str.length; i++) {
        const ts = FF.el('tspan', {}, t);
        const dy = +dys[i];
        ts.setAttribute('dy', (dy - dyPrev).toFixed(1)); dyPrev = dy;
        if (layer === 0) { ts.setAttribute('fill', INK); ts.setAttribute('stroke', INK); ts.setAttribute('stroke-width', size * 0.2); }
        else if (layer === 1) { ts.setAttribute('fill', PAL.paperLight); ts.setAttribute('stroke', PAL.paperLight); ts.setAttribute('stroke-width', size * 0.13); }
        else {
          ts.setAttribute('fill', o.fill || colors[i % colors.length]);
          ts.setAttribute('stroke', INK); ts.setAttribute('stroke-width', Math.max(1.5, size * 0.03)); ts.setAttribute('paint-order', 'stroke');
        }
        ts.textContent = str[i];
      }
      return t;
    };
    mk(0); mk(1); mk(2);
    return g;
  };

  /* ---------- backgrounds ---------- */
  A.paperBG = function (parent, o) {
    o = o || {};
    const g = FF.el('g', { class: 'bg-paper' }, parent);
    g.innerHTML = `
      <rect x="-40" y="-40" width="1360" height="800" fill="${o.color || PAL.paper}"/>
      <rect x="-40" y="-40" width="1360" height="800" fill="url(#pat-blotch)" opacity=".28"/>
      <rect x="-40" y="-40" width="1360" height="800" fill="url(#pat-grain)" opacity=".9"/>
      <path d="${FF.wobRect(10, 10, 1260, 700, 3, 21)}" fill="none" stroke="#C9B08C" stroke-width="2" stroke-dasharray="2 9" opacity=".7"/>
    `;
    if (o.crafts !== false) {
      // a few craft-table bits around the edges, placed by hand
      g.innerHTML += `
        <g transform="translate(1210 650) rotate(-28)" opacity=".95">
          <rect x="-8" y="-60" width="16" height="96" rx="3" fill="#3D4E8C" stroke="${INK}" stroke-width="2.5"/>
          <path d="M-8 36 L0 54 L8 36 Z" fill="#E9D3A8" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M-3 47 L0 54 L3 47 Z" fill="#3D4E8C"/>
          <rect x="-8" y="-30" width="16" height="10" fill="#F4EBDD" opacity=".5"/>
        </g>
        <g transform="translate(1248 560) rotate(-12)" opacity=".95">
          <rect x="-8" y="-60" width="16" height="96" rx="3" fill="#C8442F" stroke="${INK}" stroke-width="2.5"/>
          <path d="M-8 36 L0 54 L8 36 Z" fill="#E9D3A8" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M-3 47 L0 54 L3 47 Z" fill="#C8442F"/>
        </g>
        <path d="${FF.blobD(36, 700, 34, 18, 8, .3)}" fill="#F2A541" opacity=".35"/>
        <path d="${FF.blobD(1250, 30, 30, 16, 3, .3)}" fill="#5B8C3A" opacity=".25"/>
        <path d="M-10 420 q40 -20 30 30 t40 60" fill="none" stroke="#C8442F" stroke-width="2.5" opacity=".45"/>
      `;
    }
    return g;
  };

  /* Festival ground: sky, hills, the stage with a shamiana, bunting, trees, a marching path */
  A.festivalBG = function (parent, o) {
    o = o || {};
    const hy = o.horizon || 420;
    const g = FF.el('g', { class: 'bg-festival' }, parent);
    let s = '';
    s += `<rect x="-40" y="-40" width="1360" height="${hy + 80}" fill="${PAL.sky}"/>`;
    s += `<rect x="-40" y="-40" width="1360" height="${hy + 80}" fill="url(#pat-blotch)" opacity=".35"/>`;
    // sun
    if (o.sun !== false) s += `<path d="${FF.wobCircle(1120, 110, 46, 2.5, 4)}" fill="#F6C65B" stroke="${INK}" stroke-width="3"/><path d="${FF.wobCircle(1120, 110, 34, 2, 6)}" fill="#F9D77E" opacity=".8"/>`;
    // paper clouds (white, never grey — grey is Grumble)
    const cloud = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-60 10 C-70 -10 -40 -26 -24 -16 C-18 -40 22 -40 28 -18 C46 -28 70 -12 60 10 Z" fill="#FFFDF7" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-40 4 q16 -6 30 0" stroke="#D6E7EE" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
    s += cloud(190, 120, 1.1) + cloud(640, 70, 0.8) + cloud(930, 170, 0.9);
    // far hills
    s += `<path d="M-40 ${hy - 30} C 120 ${hy - 110} 260 ${hy - 60} 380 ${hy - 70} C 520 ${hy - 120} 700 ${hy - 50} 860 ${hy - 80} C 1000 ${hy - 120} 1150 ${hy - 50} 1320 ${hy - 90} L1320 ${hy + 40} L-40 ${hy + 40} Z" fill="#B9D18E" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M-40 ${hy - 30} C 120 ${hy - 110} 260 ${hy - 60} 380 ${hy - 70} C 520 ${hy - 120} 700 ${hy - 50} 860 ${hy - 80} C 1000 ${hy - 120} 1150 ${hy - 50} 1320 ${hy - 90} L1320 ${hy + 40} L-40 ${hy + 40} Z" fill="url(#pat-blotch)" opacity=".3"/>`;
    // trees
    const tree = (x, y, k, c) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-6 0 L-4 -50 Q0 -60 4 -50 L6 0 Z" fill="#8A5A33" stroke="${INK}" stroke-width="3"/><path d="${FF.blobD(0, -78, 44, 36, x | 0, .2)}" fill="${c}" stroke="${INK}" stroke-width="3"/><path d="${FF.blobD(-12, -86, 18, 12, 3, .2)}" fill="#fff" opacity=".18"/></g>`;
    s += tree(70, hy + 10, 1.1, '#6E9E4A') + tree(1230, hy + 4, 1.25, '#5B8C3A') + tree(410, hy - 20, 0.7, '#7FAA55');
    // stage with shamiana
    if (o.stage !== false) {
      const sx = o.stageX || 820, sy = hy - 6;
      s += `<g transform="translate(${sx} ${sy})">
        <rect x="-170" y="-40" width="340" height="44" fill="url(#pat-wood)" stroke="${INK}" stroke-width="3"/>
        <path d="M-160 -40 V-150 M160 -40 V-150 M-60 -40 V-150 M60 -40 V-150" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
        <path d="M-160 -40 V-150 M160 -40 V-150 M-60 -40 V-150 M60 -40 V-150" stroke="#C9914E" stroke-width="5" stroke-linecap="round"/>
        <path d="M-190 -150 L0 -200 L190 -150 Z" fill="${PAL.chilli}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-120 -160 L0 -200 L-60 -150 Z M60 -150 L0 -200 L120 -160 Z" fill="${PAL.marigold}" opacity=".9"/>
        <path d="M-190 -150 ${Array.from({ length: 10 }, (_, i) => `q19 22 38 0`).join(' ')}" fill="${PAL.turmeric}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-150 -22 h300" stroke="#8A5A33" stroke-width="2" opacity=".6"/>
        <circle cx="-110" cy="-58" r="14" fill="${PAL.chilli}" stroke="${INK}" stroke-width="3"/><ellipse cx="-110" cy="-58" rx="14" ry="5" fill="#F3D9B0" stroke="${INK}" stroke-width="2"/>
        <circle cx="110" cy="-58" r="14" fill="${PAL.indigo}" stroke="${INK}" stroke-width="3"/><ellipse cx="110" cy="-58" rx="14" ry="5" fill="#F3D9B0" stroke="${INK}" stroke-width="2"/>
      </g>`;
    }
    // ground
    s += `<path d="M-40 ${hy} C 200 ${hy - 12} 500 ${hy + 10} 760 ${hy - 4} C 1000 ${hy - 16} 1160 ${hy + 6} 1320 ${hy - 6} L1320 760 L-40 760 Z" fill="${PAL.grass}" stroke="${INK}" stroke-width="3"/>`;
    s += `<path d="M-40 ${hy} C 200 ${hy - 12} 500 ${hy + 10} 760 ${hy - 4} C 1000 ${hy - 16} 1160 ${hy + 6} 1320 ${hy - 6} L1320 760 L-40 760 Z" fill="url(#pat-blotch)" opacity=".35"/>`;
    // marching path
    if (o.path !== false) {
      const py = o.pathY || hy + 140;
      s += `<path d="M-40 ${py - 46} C 300 ${py - 60} 900 ${py - 36} 1320 ${py - 52} L1320 ${py + 44} C 900 ${py + 30} 400 ${py + 52} -40 ${py + 38} Z" fill="#E2C08F" stroke="${INK}" stroke-width="3"/>`;
      s += `<path d="M-40 ${py - 46} C 300 ${py - 60} 900 ${py - 36} 1320 ${py - 52} L1320 ${py + 44} C 900 ${py + 30} 400 ${py + 52} -40 ${py + 38} Z" fill="url(#pat-grain)"/>`;
      for (let i = 0; i < 14; i++) s += `<ellipse cx="${40 + i * 95 + (i % 3) * 13}" cy="${py - 10 + (i % 4) * 9}" rx="5" ry="3" fill="#C9A06E" opacity=".7"/>`;
    }
    // grass tufts
    const rr = FF.rng(5);
    for (let i = 0; i < 26; i++) {
      const x = rr() * 1280, y = hy + 20 + rr() * (720 - hy - 20);
      if (o.path !== false && Math.abs(y - (o.pathY || hy + 140)) < 56) continue;
      s += `<path d="M${x - 8} ${y} q4 -14 6 -2 q2 -16 5 0 q3 -12 6 2" fill="none" stroke="${PAL.grassDark}" stroke-width="2.5" stroke-linecap="round"/>`;
    }
    // flowers
    for (let i = 0; i < 9; i++) {
      const x = 30 + rr() * 1220, y = hy + 30 + rr() * (720 - hy - 40);
      if (o.path !== false && Math.abs(y - (o.pathY || hy + 140)) < 60) continue;
      const c = A.FESTIVE[i % A.FESTIVE.length];
      s += `<g transform="translate(${x} ${y})"><circle r="6" fill="${c}" stroke="${INK}" stroke-width="2"/><circle r="2.2" fill="#FBE7A1"/></g>`;
    }
    s += `<rect x="-40" y="-40" width="1360" height="800" fill="url(#pat-grain)" opacity=".8"/>`;
    g.innerHTML = s;
    // bunting strings across the sky
    if (o.bunting !== false) {
      A.buntingString(g, -20, 150, 1300, 130, 60, 22, 2);
      A.buntingString(g, -20, 60, 700, 210, 40, 14, 7);
    }
    return g;
  };

  /* decorative bunting: catenary string with triangle pennants */
  A.buntingString = function (parent, x0, y0, x1, y1, sag, n, seed) {
    const g = FF.el('g', { class: 'no-hit' }, parent);
    const pt = t => [FF.lerp(x0, x1, t), FF.lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag];
    let d = '';
    for (let i = 0; i <= 30; i++) { const p = pt(i / 30); d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
    FF.el('path', { d, fill: 'none', stroke: INK, 'stroke-width': 2.5 }, g);
    const rr = FF.rng(seed || 1);
    for (let i = 1; i < n; i++) {
      const p = pt(i / n);
      const c = A.FESTIVE[Math.floor(rr() * A.FESTIVE.length)];
      const pg = FF.el('g', { transform: `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})` }, g);
      const inner = FF.el('g', { class: 'pennant-sway', style: `animation-delay:${(-rr() * 3).toFixed(2)}s` }, pg);
      inner.innerHTML = `<path d="M-15 0 L15 0 L1 34 Z" fill="${c}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-8 4 L8 4" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="2 3"/>`;
    }
    return g;
  };

  /* ---------- buttons (cardboard tags, wooden signs, round stickers) ---------- */
  A.icon = function (name, s, color) {
    color = color || INK;
    const k = s / 40;
    const w = (3.5 / k).toFixed(1);
    const p = {
      home: `<path d="M-14 2 L0 -12 L14 2 M-10 -1 V13 H10 V-1" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><rect x="-3" y="4" width="6" height="9" fill="${color}"/>`,
      speaker: `<path d="M-14 -5 H-7 L2 -13 V13 L-7 5 H-14 Z" fill="${color}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><path d="M7 -7 q6 7 0 14 M11 -12 q11 12 0 24" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`,
      music: `<path d="M-6 9 V-12 L12 -15 V5" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round"/><ellipse cx="-10" cy="9" rx="6" ry="4.5" fill="${color}"/><ellipse cx="8" cy="5" rx="6" ry="4.5" fill="${color}"/>`,
      musicOff: `<path d="M-6 9 V-12 L12 -15 V5" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" opacity=".45"/><ellipse cx="-10" cy="9" rx="6" ry="4.5" fill="${color}" opacity=".45"/><ellipse cx="8" cy="5" rx="6" ry="4.5" fill="${color}" opacity=".45"/><path d="M-15 -15 L15 15" stroke="${PAL.chilli}" stroke-width="${w}" stroke-linecap="round"/>`,
      play: `<path d="M-9 -14 L15 0 L-9 14 Z" fill="${color}" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>`,
      skip: `<path d="M-15 -11 L0 0 L-15 11 Z M0 -11 L15 0 L0 11 Z" fill="${color}" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`,
      again: `<path d="M10 -8 A13 13 0 1 0 12 6" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/><path d="M4 -14 L12 -8 L4 -2" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
      check: `<path d="M-12 0 L-3 10 L13 -10" fill="none" stroke="${color}" stroke-width="${(5 / k).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`,
      close: `<path d="M-10 -10 L10 10 M10 -10 L-10 10" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`,
      key: `<circle cx="-8" cy="0" r="7" fill="none" stroke="${color}" stroke-width="${w}"/><path d="M-1 0 H14 M10 0 V6 M14 0 V5" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`
    }[name] || '';
    return `<g transform="scale(${k.toFixed(3)})">${p}</g>`;
  };

  /* Round sticker button. Returns the outer <g> (place it), click handled by caller */
  A.sticker = function (parent, x, y, r, o) {
    o = o || {};
    const g = FF.el('g', { transform: `translate(${x} ${y}) rotate(${o.rot || 0})` }, parent);
    const b = FF.el('g', { class: 'btn' }, g);
    b.innerHTML = `
      <path d="${FF.wobCircle(2, 4, r + 4, 1.5, 3)}" fill="${INK}" opacity=".22"/>
      <path d="${FF.wobCircle(0, 0, r + 4, 1.5, 3)}" fill="${PAL.paperLight}" stroke="${INK}" stroke-width="3"/>
      <path d="${FF.wobCircle(0, 0, r - 3, 1.5, 8)}" fill="${o.color || PAL.marigold}"/>
      <path d="M${-r * 0.55} ${-r * 0.35} q${r * 0.3} ${-r * 0.35} ${r * 0.7} ${-r * 0.3}" stroke="#fff" stroke-opacity=".45" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${o.icon ? A.icon(o.icon, r * 1.15, o.iconColor || INK) : ''}
    `;
    return g;
  };

  /* Cardboard tag with a string hole — label in hand-letter font */
  A.tag = function (parent, x, y, w, h, o) {
    o = o || {};
    const g = FF.el('g', { transform: `translate(${x} ${y}) rotate(${o.rot === undefined ? -2 : o.rot})` }, parent);
    const b = FF.el('g', { class: 'btn' + (o.bob ? ' btn-bob' : '') }, g);
    const hw = w / 2, hh = h / 2, n = hh * 0.8;
    const pts = [[-hw + n, -hh], [hw, -hh], [hw, hh], [-hw + n, hh], [-hw, 0]];
    const d = FF.pathD(FF.jitterPoly(pts, { amp: 1.6, step: 10, freq: 0.05, seed: (w + h) | 0 }));
    b.innerHTML = `
      <path d="${d}" transform="translate(3 5)" fill="${INK}" opacity=".22"/>
      <path d="${d}" fill="${o.color || PAL.kraft}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="${d}" fill="url(#pat-grain)"/>
      <circle cx="${-hw + n * 0.75}" cy="0" r="${Math.max(5, h * 0.07)}" fill="${PAL.paper}" stroke="${INK}" stroke-width="2.5"/>
      <path d="M${-hw + n * 0.75} 0 q-30 -10 -44 -34" fill="none" stroke="${PAL.chilli}" stroke-width="3" stroke-linecap="round"/>
    `;
    const cx = n * 0.35;
    if (o.icon) b.innerHTML += `<g transform="translate(${cx + (o.label ? -w * 0.22 : 0)} 0)">${A.icon(o.icon, h * 0.5, o.iconColor || INK)}</g>`;
    if (o.label) {
      const t = A.textEl(b, o.label, cx + (o.icon ? h * 0.18 : 0), h * 0.13 * (o.size ? o.size / (h * 0.4) : 1) + 2, { size: o.size || h * 0.42, cls: 'hand-letter', fill: o.textColor || INK });
      t.setAttribute('dominant-baseline', 'middle'); t.setAttribute('y', 2);
    }
    return g;
  };

  /* Wooden sign (big Play / Yes!) */
  A.sign = function (parent, x, y, w, h, o) {
    o = o || {};
    const g = FF.el('g', { transform: `translate(${x} ${y}) rotate(${o.rot === undefined ? 2 : o.rot})` }, parent);
    const b = FF.el('g', { class: 'btn' + (o.bob ? ' btn-bob' : '') }, g);
    const d = FF.wobRoundRect(-w / 2, -h / 2, w, h, 14, 2, (w | 0) + 3);
    b.innerHTML = `
      <path d="${d}" transform="translate(4 7)" fill="${INK}" opacity=".25"/>
      <path d="${d}" fill="url(#pat-wood)" stroke="${INK}" stroke-width="4"/>
      <path d="M${-w / 2 + 8} 0 H${w / 2 - 8}" stroke="#8A5A33" stroke-width="2.5" opacity=".7"/>
      <circle cx="${-w / 2 + 18}" cy="${-h / 2 + 16}" r="4.5" fill="#6B5A4A" stroke="${INK}" stroke-width="1.5"/>
      <circle cx="${w / 2 - 18}" cy="${-h / 2 + 16}" r="4.5" fill="#6B5A4A" stroke="${INK}" stroke-width="1.5"/>
      <circle cx="${-w / 2 + 18}" cy="${h / 2 - 16}" r="4.5" fill="#6B5A4A" stroke="${INK}" stroke-width="1.5"/>
      <circle cx="${w / 2 - 18}" cy="${h / 2 - 16}" r="4.5" fill="#6B5A4A" stroke="${INK}" stroke-width="1.5"/>
    `;
    if (o.icon) b.innerHTML += `<g transform="translate(${o.label ? -w * 0.28 : 0} 0)"><circle r="${h * 0.32}" fill="${o.iconBg || PAL.leaf}" stroke="${INK}" stroke-width="3"/>${A.icon(o.icon, h * 0.42, '#FFF8EA')}</g>`;
    if (o.label) A.letters(b, o.label, o.icon ? w * 0.1 : 0, h * 0.2, o.size || h * 0.58, { colors: o.colors || ['#FFF3D6'], seed: 4 });
    return g;
  };

  /* ---------- speech bubble ---------- */
  A.bubble = function (parent, text, o) {
    o = o || {};
    const size = o.size || 30;
    const maxChars = o.maxChars || 22;
    const words = text.split(' ');
    const lines = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) lines.push(cur);
    const lw = Math.max(...lines.map(l => l.length)) * size * 0.52 + 44;
    const lh = lines.length * size * 1.22 + 30;
    const g = FF.el('g', { class: 'bubble no-hit' }, parent);
    const inner = FF.el('g', { class: 'bubble-pop' }, g);
    const tail = o.tail || 'left';
    const tailD = tail === 'left' ? `M18 ${lh - 4} L-14 ${lh + 26} L46 ${lh - 4} Z` : tail === 'right' ? `M${lw - 46} ${lh - 4} L${lw + 14} ${lh + 26} L${lw - 18} ${lh - 4} Z` : '';
    const d = FF.wobRoundRect(0, 0, lw, lh, 22, 1.6, lines.length * 7 + 1);
    inner.innerHTML = `
      <path d="${d}" transform="translate(3 5)" fill="${INK}" opacity=".18"/>
      ${tailD ? `<path d="${tailD}" fill="${PAL.paperLight}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` : ''}
      <path d="${d}" fill="${PAL.paperLight}" stroke="${INK}" stroke-width="3"/>
      ${tailD ? `<path d="${tail === 'left' ? `M20 ${lh - 4.5} L44 ${lh - 4.5}` : `M${lw - 44} ${lh - 4.5} L${lw - 20} ${lh - 4.5}`}" stroke="${PAL.paperLight}" stroke-width="5"/>` : ''}
    `;
    lines.forEach((l, i) => A.textEl(inner, l, lw / 2, 16 + size * 0.95 + i * size * 1.22, { size, weight: 700 }));
    g._w = lw; g._h = lh;
    return g;
  };

  /* ---------- the hint hand ---------- */
  A.hand = function (parent) {
    const g = FF.el('g', { class: 'hint-hand' }, parent);
    g.innerHTML = `<g transform="translate(-6 40) rotate(-12)">
      <path d="M0 0 C -4 -10 -2 -38 6 -40 C 14 -42 15 -30 14 -20 L 16 -6 C 22 -10 30 -8 30 0 C 36 -2 42 2 40 10 C 46 10 49 18 45 26 L 37 46 C 30 58 6 60 0 46 L -12 22 C -17 13 -8 7 0 14 Z" transform="translate(3 4)" fill="${INK}" opacity=".2"/>
      <path d="M0 0 C -4 -10 -2 -38 6 -40 C 14 -42 15 -30 14 -20 L 16 -6 C 22 -10 30 -8 30 0 C 36 -2 42 2 40 10 C 46 10 49 18 45 26 L 37 46 C 30 58 6 60 0 46 L -12 22 C -17 13 -8 7 0 14 Z" fill="#FBE3C8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M16 -6 L18 6 M30 0 L31 10" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
      <path d="M4 52 q14 6 30 -2" stroke="${PAL.chilli}" stroke-width="7" fill="none" stroke-linecap="round"/>
    </g>`;
    return g;
  };

  /* ---------- wooden flag pole ---------- */
  A.pole = function (parent, x, yTop, len, o) {
    o = o || {};
    const g = FF.el('g', { class: 'no-hit' }, parent);
    const w = o.w || 10;
    g.innerHTML = `
      <rect x="${x - w / 2}" y="${yTop}" width="${w}" height="${len}" rx="${w / 2}" fill="#B7804B" stroke="${INK}" stroke-width="3"/>
      <path d="M${x - 1} ${yTop + 10} V${yTop + len - 8}" stroke="#E1B27A" stroke-width="2" opacity=".7"/>
      <circle cx="${x}" cy="${yTop - w * 0.5}" r="${w * 0.95}" fill="${PAL.turmeric}" stroke="${INK}" stroke-width="3"/>
    `;
    return g;
  };

  /* ---------- a waving cloth flag, made of vertical strips (real wave, not a fade) ----------
     defId: <g> id in <defs> drawn at fw × fh.  Shown at w × h with its hoist at (0,0). */
  A.wavingFlag = function (parent, defId, fw, fh, w, h, o) {
    o = o || {};
    const n = o.strips || Math.max(16, Math.min(40, Math.round(w / 12)));
    const g = FF.el('g', { class: 'waving' }, parent);
    const sx = w / fw, sy = h / fh;
    const sw = w / n;
    const strips = [];
    for (let i = 0; i < n; i++) {
      const cid = FF.uid('wc');
      const cp = FF.el('clipPath', { id: cid }, FF.defs);
      FF.el('rect', { x: (i * sw - 0.7).toFixed(2), y: -4, width: (sw + 1.4).toFixed(2), height: h + 8 }, cp);
      const sg = FF.el('g', { 'clip-path': `url(#${cid})` }, g);
      FF.el('use', { href: '#' + defId, transform: `scale(${sx.toFixed(4)} ${sy.toFixed(4)})` }, sg);
      const sh = FF.el('rect', { x: (i * sw - 0.7).toFixed(2), y: 0, width: (sw + 1.4).toFixed(2), height: h, fill: '#000', opacity: 0 }, sg);
      strips.push({ sg, sh, cp });
    }
    const amp = o.amp === undefined ? h * 0.045 : o.amp;
    const speed = o.speed || 3.2;
    const waves = o.waves || 1.4;
    let phase = Math.random() * 6;
    let strength = o.still ? 0 : 1;
    const api = {
      g,
      update(dt) {
        phase += dt * speed;
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          const k = u * (0.35 + 0.65 * u);            // the hoist is held still
          const a = phase - u * waves * Math.PI * 2;
          const dy = Math.sin(a) * amp * k * strength * 2;
          const sl = Math.cos(a) * k * strength;
          strips[i].sg.setAttribute('transform', `translate(0 ${dy.toFixed(2)})`);
          strips[i].sh.setAttribute('fill', sl > 0 ? '#fff' : '#000');
          strips[i].sh.setAttribute('opacity', (Math.abs(sl) * 0.16).toFixed(3));
        }
      },
      setStrength(s) { strength = s; },
      setDef(id) { g.querySelectorAll('use').forEach(u => u.setAttribute('href', '#' + id)); },
      destroy() { strips.forEach(s => s.cp.remove()); g.remove(); }
    };
    api.update(0);
    return api;
  };

  /* ---------- paint pot ---------- */
  A.paintPot = function (parent, x, y, hex, o) {
    o = o || {};
    const g = FF.el('g', { transform: `translate(${x} ${y})` }, parent);
    const b = FF.el('g', { class: 'btn pot' }, g);
    const light = hex.toUpperCase() === '#FFFFFF';
    b.innerHTML = `
      <ellipse cx="3" cy="44" rx="44" ry="9" fill="${INK}" opacity=".2"/>
      <path d="M-40 -18 L-34 38 Q0 50 34 38 L40 -18 Z" fill="#F7F0E2" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M-40 -18 L-34 38 Q0 50 34 38 L40 -18 Z" fill="url(#pat-grain)"/>
      <path d="M-37 6 Q0 16 37 6 L34 38 Q0 50 -34 38 Z" fill="${hex}" opacity="${light ? 1 : .95}" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="0" cy="-18" rx="40" ry="11" fill="${hex}" stroke="${INK}" stroke-width="3.5"/>
      <ellipse cx="-12" cy="-21" rx="12" ry="3" fill="#fff" opacity="${light ? .9 : .35}"/>
      <path d="M22 -12 q4 14 -2 22 q-6 -4 -2 -10" fill="${hex}" stroke="${INK}" stroke-width="2"/>
      ${light ? `<path d="M-37 6 Q0 16 37 6" stroke="#D9CDB8" stroke-width="2" fill="none"/>` : ''}
    `;
    return { g, b };
  };

  /* ---------- woven basket ---------- */
  A.basket = function (parent) {
    const g = FF.el('g', {}, parent);
    g.innerHTML = `
      <path d="M-82 -30 C -84 -80, 84 -80, 82 -30" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
      <path d="M-82 -30 C -84 -80, 84 -80, 82 -30" fill="none" stroke="#C9914E" stroke-width="7" stroke-linecap="round"/>
      <g class="basket-back"></g>
      <path d="M-92 -34 L-74 40 Q0 56 74 40 L92 -34 Z" fill="url(#pat-basket)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-96 -38 Q0 -24 96 -38" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
      <path d="M-96 -38 Q0 -24 96 -38" fill="none" stroke="#B9783E" stroke-width="9" stroke-linecap="round"/>
      <path d="M-96 -38 Q0 -24 96 -38" fill="none" stroke="#E0B070" stroke-width="2.5" stroke-dasharray="6 6"/>
    `;
    return g;
  };

  /* ---------- the painted map ---------- */
  A.CCOL = { algeria: '#E8C07D', tunisia: '#A9CB8C', libya: '#EFA77A', egypt: '#F3D27E', sudan: '#D99A7C', chad: '#B9C97E', niger: '#E9B9A3' };
  let mapDefsDone = false;
  function ensureMapDefs() {
    if (mapDefsDone) return;
    mapDefsDone = true;
    let s = '';
    Object.keys(FF.geo.countries).forEach(id => { s += `<clipPath id="cc-${id}"><path d="${FF.geo.countries[id].d}"/></clipPath>`; });
    s += `<clipPath id="map-clip"><path d="${FF.wobRoundRect(0, 0, FF.geo.W, FF.geo.H, 18, 2.5, 33)}"/></clipPath>`;
    FF.defs.insertAdjacentHTML('beforeend', s);
  }
  function decorMarkup(type, x, y) {
    switch (type) {
      case 'dune': return `<path d="M${x - 11} ${y + 2} q11 -11 22 0" fill="#E1B062" stroke="#A97A3E" stroke-width="1.6"/><path d="M${x + 4} ${y + 6} q7 -7 14 0" fill="#E9BE72" stroke="#A97A3E" stroke-width="1.4"/>`;
      case 'mount': return `<path d="M${x - 16} ${y + 8} L${x - 3} ${y - 12} L${x + 3} ${y - 4} L${x + 8} ${y - 10} L${x + 18} ${y + 8} Z" fill="#B78A63" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${x - 3} ${y - 12} L${x - 1} ${y + 8}" stroke="#8C6446" stroke-width="1.4"/>`;
      case 'palm': return `<path d="M${x} ${y + 8} q2 -10 0 -18" stroke="#8A5A33" stroke-width="2.5" fill="none"/><path d="M${x} ${y - 10} q-9 -2 -12 5 M${x} ${y - 10} q9 -2 12 5 M${x} ${y - 10} q-5 -8 -12 -6 M${x} ${y - 10} q5 -8 12 -6" stroke="#4E8A3A" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      case 'tree': return `<path d="M${x} ${y + 8} V${y - 4}" stroke="#8A5A33" stroke-width="2.5"/><ellipse cx="${x}" cy="${y - 6}" rx="12" ry="5" fill="#6E9E4A" stroke="${INK}" stroke-width="1.5"/>`;
      case 'pyramids': return `<path d="M${x - 14} ${y + 6} L${x - 4} ${y - 9} L${x + 6} ${y + 6} Z" fill="#E9C27A" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${x - 4} ${y - 9} L${x + 6} ${y + 6} L${x} ${y + 6} Z" fill="#C99B55"/><path d="M${x + 2} ${y + 6} L${x + 10} ${y - 5} L${x + 18} ${y + 6} Z" fill="#E9C27A" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    }
    return '';
  }
  /* One country, in map (projected) coordinates. Used on the map and as the puzzle piece. */
  A.countryMarkup = function (id, o) {
    ensureMapDefs();
    o = o || {};
    const c = FF.geo.countries[id];
    let s = `<path d="${c.d}" fill="${A.CCOL[id]}"/>`;
    s += `<g clip-path="url(#cc-${id})">`;
    s += `<rect x="${c.bbox.x - 5}" y="${c.bbox.y - 5}" width="${c.bbox.w + 10}" height="${c.bbox.h + 10}" fill="url(#pat-blotch)" opacity=".55"/>`;
    // darker painted edge, like watercolour drying at the rim
    s += `<path d="${c.d}" fill="none" stroke="${A.CCOL[id]}" stroke-width="9" opacity=".9" style="mix-blend-mode:multiply"/>`;
    if (id === 'egypt' || id === 'sudan') {
      s += `<path d="${FF.geo.nile}" fill="none" stroke="#5FA3C9" stroke-width="5" stroke-linecap="round"/>`;
      s += `<path d="${FF.geo.nile}" fill="none" stroke="#A9D5EA" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="4 7"/>`;
      if (id === 'sudan') s += `<path d="${FF.geo.blueNile}" fill="none" stroke="#5FA3C9" stroke-width="4" stroke-linecap="round"/>`;
      if (id === 'egypt' || id === 'sudan') s += `<path d="${FF.geo.lakeNasser}" fill="#7DB8D8" stroke="#4C8DB3" stroke-width="1.4"/>`;
    }
    if (id === 'chad' || id === 'niger') s += `<path d="${FF.geo.lakeChad}" fill="#7DB8D8" stroke="#4C8DB3" stroke-width="1.4"/>`;
    (FF.geo.decor[id] || []).forEach(dc => { const p = FF.geo.P(dc[1], dc[2]); s += decorMarkup(dc[0], p[0], p[1]); });
    s += `</g>`;
    s += `<path d="${c.d}" fill="none" stroke="${INK}" stroke-width="${o.stroke || 2.4}" stroke-linejoin="round"/>`;
    return s;
  };

  A.drawMap = function (parent, o) {
    ensureMapDefs();
    o = o || {};
    const G = FF.geo;
    const g = FF.el('g', { class: 'map' }, parent);
    // paper sheet with tape
    g.innerHTML = `
      <path d="${FF.wobRoundRect(-14, -14, G.W + 28, G.H + 28, 20, 2.5, 41)}" transform="translate(5 8)" fill="${INK}" opacity=".2"/>
      <path d="${FF.wobRoundRect(-14, -14, G.W + 28, G.H + 28, 20, 2.5, 41)}" fill="${PAL.paperLight}" stroke="${INK}" stroke-width="3"/>
    `;
    const inner = FF.el('g', { 'clip-path': 'url(#map-clip)' }, g);
    let s = `<rect x="0" y="0" width="${G.W}" height="${G.H}" fill="${PAL.sky}"/><rect x="0" y="0" width="${G.W}" height="${G.H}" fill="url(#pat-blotch)" opacity=".4"/>`;
    // little painted waves
    const rr = FF.rng(3);
    const waves = [[120, 30], [300, 22], [470, 40], [610, 25], [720, 60], [690, 120], [760, 200], [230, 60], [40, 70]];
    waves.forEach(w => { s += `<path d="M${w[0]} ${w[1]} q6 -5 12 0 t12 0" fill="none" stroke="#5E9BBE" stroke-width="2" stroke-linecap="round" opacity=".8"/>`; });
    Object.keys(G.other).forEach(k => { s += `<path d="${G.other[k]}" fill="#EFE3C9" stroke="${INK}" stroke-width="1.6" stroke-opacity=".55"/>`; });
    s += `<rect x="0" y="0" width="${G.W}" height="${G.H}" fill="url(#pat-grain)" opacity=".7"/>`;
    inner.innerHTML = s;
    const countriesG = FF.el('g', {}, inner);
    const nodes = {};
    Object.keys(G.countries).forEach(id => {
      const cg = FF.el('g', { class: 'country', 'data-id': id }, countriesG);
      if (id === o.missing) {
        cg.innerHTML = `<path d="${G.countries[id].d}" fill="${PAL.paper}"/><path d="${G.countries[id].d}" fill="url(#pat-grain)"/>`;
        if (o.glow) cg.innerHTML += `<path class="glow-pulse" d="${G.countries[id].d}" fill="${PAL.marigold}" fill-opacity=".25" stroke="${PAL.marigold}" stroke-width="9" stroke-linejoin="round"/>`;
        cg.innerHTML += `<path d="${G.countries[id].d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-dasharray="8 7" stroke-linejoin="round"/>`;
      } else cg.innerHTML = A.countryMarkup(id);
      nodes[id] = cg;
    });
    // compass rose, hand-drawn
    inner.insertAdjacentHTML('beforeend', `<g transform="translate(60 ${G.H - 60})" opacity=".85"><circle r="22" fill="${PAL.paperLight}" stroke="${INK}" stroke-width="2"/><path d="M0 -30 L6 0 L0 30 L-6 0 Z" fill="${PAL.chilli}" stroke="${INK}" stroke-width="1.6"/><path d="M-30 0 L0 -5 L30 0 L0 5 Z" fill="${PAL.indigo}" stroke="${INK}" stroke-width="1.6" opacity=".8"/></g>`);
    // labels (not inside the wobble, so they stay readable)
    const labels = FF.el('g', { class: 'labels no-hit' }, g);
    const lab = {};
    if (o.labels !== false) {
      FF.C.countries.forEach(cn => {
        if (cn.id === o.missing && !o.labelMissing) return;
        const p = G.P(cn.label[0], cn.label[1]);
        lab[cn.id] = A.textEl(labels, cn.name, p[0], p[1], { size: cn.id === 'tunisia' ? 13 : 17, halo: 5 });
      });
    }
    return { g, nodes, countriesG, labels: lab, inner };
  };

  /* Small locator: the whole region, one country lit up */
  A.locator = function (parent, id, scale) {
    ensureMapDefs();
    const g = FF.el('g', { class: 'locator no-hit' }, parent);
    const G = FF.geo;
    let s = `<path d="${FF.wobRoundRect(-6, -6, G.W + 12, G.H + 12, 22, 3, 2)}" fill="${PAL.paperLight}" stroke="${INK}" stroke-width="${3 / scale}"/>`;
    s += `<g clip-path="url(#map-clip)"><rect width="${G.W}" height="${G.H}" fill="${PAL.sky}"/>`;
    Object.keys(G.other).forEach(k => { s += `<path d="${G.other[k]}" fill="#EFE3C9"/>`; });
    Object.keys(G.countries).forEach(cid => { s += `<path d="${G.countries[cid].d}" fill="${cid === id ? PAL.chilli : '#E3D2B0'}" stroke="${INK}" stroke-width="${(cid === id ? 3 : 1.4) / scale}"/>`; });
    s += `</g>`;
    g.innerHTML = s;
    g.setAttribute('transform', `scale(${scale})`);
    return g;
  };

  /* ---------- fx: raindrops, confetti, splats ---------- */
  A.rain = function (scene, parent, x0, x1, y0, y1, dur) {
    const g = FF.el('g', { class: 'no-hit' }, parent);
    const drops = [];
    for (let i = 0; i < 40; i++) {
      const d = FF.el('path', { d: 'M0 0 q-4 8 0 12 q4 -4 0 -12 Z', fill: '#7FB2D0', stroke: INK, 'stroke-width': 1.2 }, g);
      drops.push({ d, x: FF.rand(x0, x1), y: FF.rand(y0 - 200, y0), v: FF.rand(420, 620) });
    }
    let t = 0;
    const stop = scene.tick(dt => {
      t += dt;
      drops.forEach(p => {
        p.y += p.v * dt;
        if (p.y > y1) { p.y = y0 + FF.rand(-40, 0); p.x = FF.rand(x0, x1); }
        p.d.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      });
      if (t > dur) { g.style.opacity = Math.max(0, 1 - (t - dur) * 3); }
      if (t > dur + 0.4) { stop(); g.remove(); }
    });
    return g;
  };
  A.confetti = function (scene, parent, x0, x1, y0, dur, colors) {
    const g = FF.el('g', { class: 'no-hit' }, parent);
    const bits = [];
    colors = colors || A.FESTIVE;
    for (let i = 0; i < 70; i++) {
      const c = colors[i % colors.length];
      const shape = i % 3 === 0 ? 'M-5 -3 L5 -3 L5 3 L-5 3 Z' : i % 3 === 1 ? 'M-4 -4 L5 0 L-4 4 Z' : 'M-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0';
      const d = FF.el('path', { d: shape, fill: c, stroke: INK, 'stroke-width': 1 }, g);
      bits.push({ d, x: FF.rand(x0, x1), y: y0 - FF.rand(0, 300), vy: FF.rand(90, 170), sw: FF.rand(1, 3), ph: FF.rand(0, 6), r: FF.rand(0, 360), vr: FF.rand(-200, 200) });
    }
    let t = 0;
    const stop = scene.tick(dt => {
      t += dt;
      bits.forEach(b => {
        b.y += b.vy * dt; b.ph += dt * b.sw; b.r += b.vr * dt;
        if (b.y > 740 && t < dur) { b.y = -20; }
        b.d.setAttribute('transform', `translate(${(b.x + Math.sin(b.ph) * 20).toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.r.toFixed(0)})`);
      });
      if (t > dur + 4) { stop(); g.remove(); }
    });
    return g;
  };
})(window.FF);
