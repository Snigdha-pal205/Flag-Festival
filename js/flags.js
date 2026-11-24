/* Flag Festival — flags: drawn from the content file's part list at true proportions.
   Real colours always; around them a felt/cloth texture, stitched edge and brown ink outline. */
(function (FF) {
  'use strict';
  const INK = FF.INK;
  const F = FF.flags = {};
  F.data = id => FF.C.flags[id];

  F.starD = function (cx, cy, R, rot, n, inner) {
    n = n || 5; rot = rot === undefined ? -90 : rot;
    const r = R * (inner || (n === 5 ? 0.382 : 0.5));
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = (rot + i * 180 / n) * Math.PI / 180;
      const rr = i % 2 === 0 ? R : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(2) + ' ' + (cy + Math.sin(a) * rr).toFixed(2);
    }
    return d + 'Z';
  };
  /* crescent = outer circle minus inner circle (moved d along angle rot) */
  F.crescentD = function (cx, cy, R, d, r, rot) {
    const a = (rot || 0) * Math.PI / 180;
    const ix = (d * d + R * R - r * r) / (2 * d);
    const iy = Math.sqrt(Math.max(0, R * R - ix * ix));
    const rotp = (x, y) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
    const p1 = rotp(ix, -iy), p2 = rotp(ix, iy);
    const largeO = ix > 0 ? 1 : 0;
    const largeI = ix > d ? 1 : 0;
    const f = v => v.toFixed(2);
    return `M${f(p1[0])} ${f(p1[1])} A${R} ${R} 0 ${largeO} 0 ${f(p2[0])} ${f(p2[1])} A${r} ${r} 0 ${largeI} 1 ${f(p1[0])} ${f(p1[1])} Z`;
  };
  /* Egypt's eagle: one simplified gold sticker shape (GDD §7) */
  F.eagleMarkup = function (cx, cy, s, fill, detail) {
    const dk = detail || '#7A5E00';
    return `<g transform="translate(${cx} ${cy}) scale(${s})">
      <path d="M-6 -16 C -16 -26, -30 -28, -36 -22 C -34 -14, -32 -6, -29 2 C -25 9, -16 13, -9 12 Z" fill="${fill}" stroke="${dk}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M6 -16 C 16 -26, 30 -28, 36 -22 C 34 -14, 32 -6, 29 2 C 25 9, 16 13, 9 12 Z" fill="${fill}" stroke="${dk}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M-9 -18 L9 -18 L10 10 L0 19 L-10 10 Z" fill="${fill}" stroke="${dk}" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="-2" cy="-24" r="6.5" fill="${fill}" stroke="${dk}" stroke-width="1.6"/>
      <path d="M-8 -26 L-14 -23.5 L-8 -21 Z" fill="${fill}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M-8 18 L8 18 L12 27 L-12 27 Z" fill="${fill}" stroke="${dk}" stroke-width="1.6" stroke-linejoin="round"/>
      <rect x="-19" y="27" width="38" height="7" rx="2" fill="${fill}" stroke="${dk}" stroke-width="1.6"/>
      <path d="M-5 -12 V8 M0 -12 V12 M5 -12 V8 M-28 -16 L-14 -4 M-30 -8 L-16 2 M28 -16 L14 -4 M30 -8 L16 2" stroke="${dk}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <circle cx="-3" cy="-25" r="1.4" fill="${dk}"/>
    </g>`;
  };
  F.wheelMarkup = function (cx, cy, r, color) {
    let sp = '';
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; sp += `M${cx} ${cy} L${(cx + Math.cos(a) * r * 0.92).toFixed(2)} ${(cy + Math.sin(a) * r * 0.92).toFixed(2)} `; }
    return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${r * 0.12}"/><path d="${sp}" stroke="${color}" stroke-width="${r * 0.05}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.18}" fill="${color}"/></g>`;
  };

  /* SVG string for one shape. attrs: string of extra attributes (fill etc. already included) */
  F.shapeMarkup = function (sh, fill, extra) {
    extra = extra || '';
    switch (sh.t) {
      case 'rect': return `<rect x="${sh.x}" y="${sh.y}" width="${sh.w}" height="${sh.h}" fill="${fill}" ${extra}/>`;
      case 'poly': return `<path d="M${sh.pts.map(p => p.join(' ')).join('L')}Z" fill="${fill}" ${extra}/>`;
      case 'circle': return `<circle cx="${sh.cx}" cy="${sh.cy}" r="${sh.r}" fill="${fill}" ${extra}/>`;
      case 'star': return `<path d="${F.starD(sh.cx, sh.cy, sh.R, sh.rot, sh.n)}" fill="${fill}" ${extra}/>`;
      case 'crescent': return `<path d="${F.crescentD(sh.cx, sh.cy, sh.R, sh.d, sh.r, sh.rot)}" fill="${fill}" ${extra}/>`;
      case 'eagle': return `<g ${extra}>${F.eagleMarkup(sh.cx, sh.cy, sh.s, fill, fill === '#C09300' || fill === '#D4A92A' ? '#7A5E00' : 'rgba(0,0,0,.35)')}</g>`;
      case 'wheel': return F.wheelMarkup(sh.cx, sh.cy, sh.r, fill);
    }
    return '';
  };
  /* bounding box of a shape in flag units */
  F.shapeBox = function (sh) {
    switch (sh.t) {
      case 'rect': return { x: sh.x, y: sh.y, w: sh.w, h: sh.h };
      case 'poly': { const xs = sh.pts.map(p => p[0]), ys = sh.pts.map(p => p[1]); const x = Math.min(...xs), y = Math.min(...ys); return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }; }
      case 'circle': case 'wheel': return { x: sh.cx - sh.r, y: sh.cy - sh.r, w: sh.r * 2, h: sh.r * 2 };
      case 'star': return { x: sh.cx - sh.R, y: sh.cy - sh.R, w: sh.R * 2, h: sh.R * 2 };
      case 'crescent': return { x: sh.cx - sh.R, y: sh.cy - sh.R, w: sh.R * 2, h: sh.R * 2 };
      case 'eagle': return { x: sh.cx - 36 * sh.s, y: sh.cy - 31 * sh.s, w: 72 * sh.s, h: 65 * sh.s };
    }
    return { x: 0, y: 0, w: 10, h: 10 };
  };

  F.GREY = '#BDB7C3';
  F.BLANK = '#CFCAD3';

  /* The cloth look laid over any flag: weave, a soft fold, stitched hem, wobbly ink edge */
  F.clothOver = function (w, h, seed) {
    return `
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#pat-weave)"/>
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#pat-grain)" opacity=".55"/>
      <path d="M${w * 0.62} 0 C ${w * 0.6} ${h * 0.3}, ${w * 0.66} ${h * 0.7}, ${w * 0.63} ${h}" stroke="#000" stroke-opacity=".06" stroke-width="${w * 0.05}" fill="none"/>
      <rect x="5" y="5" width="${w - 10}" height="${h - 10}" fill="none" stroke="#3B2A20" stroke-opacity=".35" stroke-width="1.6" stroke-dasharray="5 4"/>
      <path d="${FF.wobRect(0, 0, w, h, 1.2, seed || 7)}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    `;
  };

  /* Full flag markup (flag units). mode: 'full' | 'grey' */
  F.markup = function (id, mode) {
    const fd = F.data(id);
    let s = '';
    fd.parts.forEach(p => { s += F.shapeMarkup(p.shape, mode === 'grey' ? F.GREY : p.hex); });
    if (mode === 'grey') s += `<rect width="${fd.w}" height="${fd.h}" fill="url(#pat-rain)"/>`;
    return s + F.clothOver(fd.w, fd.h, id.length * 5);
  };

  const made = {};
  /* Put a flag into <defs> once and return its id */
  F.def = function (id, mode) {
    mode = mode || 'full';
    const key = `fd-${id}-${mode}`;
    if (!made[key]) {
      made[key] = true;
      const g = FF.el('g', { id: key }, FF.defs);
      g.innerHTML = F.markup(id, mode);
    }
    return key;
  };

  /* A flag placed on the stage: <use> scaled to fit (w × h max). Returns {g, w, h} */
  F.use = function (parent, id, x, y, maxW, maxH, mode) {
    const fd = F.data(id);
    const s = Math.min(maxW / fd.w, (maxH || 1e9) / fd.h);
    const g = FF.el('g', { transform: `translate(${x} ${y})` }, parent);
    FF.el('use', { href: '#' + F.def(id, mode), transform: `scale(${s.toFixed(4)})` }, g);
    return { g, w: fd.w * s, h: fd.h * s, s };
  };

  /* Colour names a flag uses */
  F.colours = function (id) { const set = []; F.data(id).parts.forEach(p => { if (!set.includes(p.colour)) set.push(p.colour); }); return set; };
  /* Colouring areas: parts sharing an `area` are one tap target */
  F.areas = function (id) {
    const fd = F.data(id); const areas = []; const map = {};
    fd.parts.forEach(p => {
      const k = p.area || p.id;
      if (!map[k]) { map[k] = { id: k, colour: p.colour, hex: p.hex, label: p.area ? (p.colour + ' ' + (fd.parts.filter(q => q.area === p.area).length > 1 ? 'crescent and star' : p.label)) : p.label, parts: [] }; areas.push(map[k]); }
      map[k].parts.push(p);
    });
    return areas;
  };
  F.paintHex = function (flagId, colour) {
    const p = F.data(flagId).parts.find(q => q.colour === colour);
    return p ? p.hex : FF.C.paints[colour];
  };
})(window.FF);
