/* Flag Festival — ALL game content lives here (GDD §11: "All content in one file").
   Add a new flag set by editing this file only: countries, friends, flag parts, lookalikes, lines.

   Flag shapes use each flag's own coordinate box (w × h, h is always 200) at the real proportions.
   Shape types:  rect {x,y,w,h} · poly {pts} · circle {cx,cy,r} · star {cx,cy,R,rot,n}
                 crescent {cx,cy,R,d,r,rot}  (outer circle R, inner circle r moved d along angle rot)
                 eagle {cx,cy,s} · wheel {cx,cy,r}
   area   = parts with the same area are ONE tap target when colouring (crescent + star).
   needs  = in Build a Flag, this part only snaps after these parts are on the cloth.        */

window.FF_CONTENT = {
  title: "Flag Festival",

  /* The player's name — shown on the golden flag reward. Change it to the child's name. */
  playerName: "Champion",
  set: "North Africa",

  /* Paint pots that are not in a flag (used for the "extra wrong colours" in Hard) */
  paints: {
    blue: "#2456A6", yellow: "#F5C400", red: "#D21034", orange: "#E8701A",
    green: "#2E8B3A", white: "#FFFFFF", black: "#1E1A18", pink: "#E97BA2",
    purple: "#7B4FA0", gold: "#C09300"
  },

  /* The order children meet the flags: simplest first (GDD §8) */
  countries: [
    { id: "chad", name: "Chad", flag: "chad", lookalike: "romania", label: [18.6, 15.6],
      friend: { name: "Ellie", kind: "elephant", animal: "elephant", he: "She", sound: "trumpet" } },
    { id: "niger", name: "Niger", flag: "niger", lookalike: "india", label: [9.2, 17.2],
      friend: { name: "Daisy", kind: "cow", animal: "cow", he: "She", sound: "moo" } },
    { id: "sudan", name: "Sudan", flag: "sudan", lookalike: "jordan", label: [30.0, 15.4],
      friend: { name: "Sami", kind: "bird", animal: "bird", he: "He", sound: "tweet" } },
    { id: "algeria", name: "Algeria", flag: "algeria", lookalike: "pakistan", label: [2.6, 28.0],
      friend: { name: "Mimi", kind: "kitten", animal: "kitten", he: "She", sound: "meow" } },
    { id: "libya", name: "Libya", flag: "libya", lookalike: "sudan", label: [17.6, 26.6],
      friend: { name: "Kamal", kind: "camel", animal: "camel", he: "He", sound: "grunt" } },
    { id: "egypt", name: "Egypt", flag: "egypt", lookalike: "yemen", label: [29.4, 26.4],
      friend: { name: "Momo", kind: "mouse", animal: "mouse", he: "He", sound: "squeak" } },
    { id: "tunisia", name: "Tunisia", flag: "tunisia", lookalike: "turkey", label: [9.4, 33.9],
      friend: { name: "Andy", kind: "ant", animal: "ant", he: "He", sound: "chirp" } }
  ],

  /* Second set: South Asia, from Afghanistan to China. Labels are [lon, lat] on the map.
     (friend: kept only for the old games' wording; the story friends come from friends.js) */
  asiaCountries: [
    { id: "india", name: "India", flag: "india", lookalike: "niger", label: [78.6, 21.5],
      friend: { name: "Leo", kind: "elephant", animal: "lion", he: "They", sound: "trumpet" } },
    { id: "pakistan", name: "Pakistan", flag: "pakistan", lookalike: "algeria", label: [69.4, 29.6], labelSize: 0.3,
      friend: { name: "Gigi", kind: "elephant", animal: "giraffe", he: "They", sound: "trumpet" } },
    { id: "afghanistan", name: "Afghanistan", flag: "afghanistan", lookalike: "chad", label: [66.0, 33.6], labelSize: 0.24,
      friend: { name: "Hiru", kind: "elephant", animal: "deer", he: "They", sound: "trumpet" } },
    { id: "nepal", name: "Nepal", flag: "nepal", label: [84.0, 28.4], labelSize: 0.2,
      friend: { name: "Leo", kind: "elephant", animal: "lion", he: "They", sound: "trumpet" } },
    { id: "bhutan", name: "Bhutan", flag: "bhutan", label: [90.4, 28.6], labelSize: 0.17,
      friend: { name: "Gigi", kind: "elephant", animal: "giraffe", he: "They", sound: "trumpet" } },
    { id: "bangladesh", name: "Bangladesh", flag: "bangladesh", lookalike: "japan", label: [90.2, 21.2], labelSize: 0.2,
      friend: { name: "Hiru", kind: "elephant", animal: "deer", he: "They", sound: "trumpet" } },
    { id: "china", name: "China", flag: "china", lookalike: "vietnam", label: [102.0, 35.0],
      friend: { name: "Leo", kind: "elephant", animal: "lion", he: "They", sound: "trumpet" } }
  ],

  flags: {
    chad: { name: "Chad", w: 300, h: 200, parts: [
      { id: "blue",   label: "blue stripe",   colour: "blue",   hex: "#002664", stripe: true, shape: { t: "rect", x: 0,   y: 0, w: 100, h: 200 } },
      { id: "yellow", label: "yellow stripe", colour: "yellow", hex: "#FECB00", stripe: true, shape: { t: "rect", x: 100, y: 0, w: 100, h: 200 } },
      { id: "red",    label: "red stripe",    colour: "red",    hex: "#C60C30", stripe: true, shape: { t: "rect", x: 200, y: 0, w: 100, h: 200 } }
    ] },

    niger: { name: "Niger", w: 233, h: 200, parts: [
      { id: "orange", label: "orange stripe", colour: "orange", hex: "#E05206", stripe: true, shape: { t: "rect", x: 0, y: 0,      w: 233, h: 66.7 } },
      { id: "white",  label: "white stripe",  colour: "white",  hex: "#FFFFFF", stripe: true, shape: { t: "rect", x: 0, y: 66.7,   w: 233, h: 66.6 } },
      { id: "green",  label: "green stripe",  colour: "green",  hex: "#0DB02B", stripe: true, shape: { t: "rect", x: 0, y: 133.3,  w: 233, h: 66.7 } },
      { id: "circle", label: "orange circle", colour: "orange", hex: "#E05206", needs: ["orange", "white", "green"], shape: { t: "circle", cx: 116.5, cy: 100, r: 26 } }
    ] },

    sudan: { name: "Sudan", w: 400, h: 200, parts: [
      { id: "red",      label: "red stripe",     colour: "red",   hex: "#D21034", stripe: true, shape: { t: "rect", x: 0, y: 0,     w: 400, h: 66.7 } },
      { id: "white",    label: "white stripe",   colour: "white", hex: "#FFFFFF", stripe: true, shape: { t: "rect", x: 0, y: 66.7,  w: 400, h: 66.6 } },
      { id: "black",    label: "black stripe",   colour: "black", hex: "#000000", stripe: true, shape: { t: "rect", x: 0, y: 133.3, w: 400, h: 66.7 } },
      { id: "triangle", label: "green triangle", colour: "green", hex: "#007229", needs: ["red", "white", "black"], shape: { t: "poly", pts: [[0, 0], [134, 100], [0, 200]] } }
    ] },

    algeria: { name: "Algeria", w: 300, h: 200, parts: [
      { id: "green",    label: "green half",  colour: "green", hex: "#006633", stripe: true, shape: { t: "rect", x: 0,   y: 0, w: 150, h: 200 } },
      { id: "white",    label: "white half",  colour: "white", hex: "#FFFFFF", stripe: true, shape: { t: "rect", x: 150, y: 0, w: 150, h: 200 } },
      { id: "crescent", label: "red crescent", colour: "red",  hex: "#D21034", area: "emblem", needs: ["green", "white"], shape: { t: "crescent", cx: 150, cy: 100, R: 50, d: 12.5, r: 40, rot: 0 } },
      { id: "star",     label: "red star",     colour: "red",  hex: "#D21034", area: "emblem", needs: ["green", "white"], shape: { t: "star", cx: 172, cy: 100, R: 25, rot: 180 } }
    ] },

    libya: { name: "Libya", w: 400, h: 200, parts: [
      { id: "red",      label: "red stripe",     colour: "red",   hex: "#E70013", stripe: true, shape: { t: "rect", x: 0, y: 0,   w: 400, h: 50 } },
      { id: "black",    label: "black stripe",   colour: "black", hex: "#000000", stripe: true, shape: { t: "rect", x: 0, y: 50,  w: 400, h: 100 } },
      { id: "green",    label: "green stripe",   colour: "green", hex: "#239E46", stripe: true, shape: { t: "rect", x: 0, y: 150, w: 400, h: 50 } },
      { id: "crescent", label: "white crescent", colour: "white", hex: "#FFFFFF", area: "emblem", needs: ["black"], shape: { t: "crescent", cx: 192, cy: 100, R: 30, d: 8, r: 25, rot: 0 } },
      { id: "star",     label: "white star",     colour: "white", hex: "#FFFFFF", area: "emblem", needs: ["black"], shape: { t: "star", cx: 214, cy: 100, R: 13, rot: 180 } }
    ] },

    egypt: { name: "Egypt", w: 300, h: 200, parts: [
      { id: "red",   label: "red stripe",   colour: "red",   hex: "#CE1126", stripe: true, shape: { t: "rect", x: 0, y: 0,     w: 300, h: 66.7 } },
      { id: "white", label: "white stripe", colour: "white", hex: "#FFFFFF", stripe: true, shape: { t: "rect", x: 0, y: 66.7,  w: 300, h: 66.6 } },
      { id: "black", label: "black stripe", colour: "black", hex: "#000000", stripe: true, shape: { t: "rect", x: 0, y: 133.3, w: 300, h: 66.7 } },
      { id: "eagle", label: "gold eagle",   colour: "gold",  hex: "#C09300", needs: ["red", "white", "black"], shape: { t: "eagle", cx: 150, cy: 100, s: 0.92 } }
    ] },

    tunisia: { name: "Tunisia", w: 300, h: 200, parts: [
      { id: "cloth",    label: "red cloth",    colour: "red",   hex: "#E70013", stripe: true, shape: { t: "rect", x: 0, y: 0, w: 300, h: 200 } },
      { id: "circle",   label: "white circle", colour: "white", hex: "#FFFFFF", needs: ["cloth"], shape: { t: "circle", cx: 150, cy: 100, r: 50 } },
      { id: "crescent", label: "red crescent", colour: "red",   hex: "#E70013", area: "emblem", needs: ["circle"], shape: { t: "crescent", cx: 146, cy: 100, R: 37.5, d: 9, r: 30, rot: 0 } },
      { id: "star",     label: "red star",     colour: "red",   hex: "#E70013", area: "emblem", needs: ["circle"], shape: { t: "star", cx: 160, cy: 100, R: 20, rot: 180 } }
    ] },

    /* ---- lookalikes (only in Hard level of Catch the Flag) ---- */
    /* ---------- South Asia ---------- */
    afghanistan: { name: "Afghanistan", w: 300, h: 200, parts: [
      { id: "black",  label: "black stripe", colour: "black", hex: "#000000", stripe: true, shape: { t: "rect", x: 0,   y: 0, w: 100, h: 200 } },
      { id: "red",    label: "red stripe",   colour: "red",   hex: "#D32011", stripe: true, shape: { t: "rect", x: 100, y: 0, w: 100, h: 200 } },
      { id: "green",  label: "green stripe", colour: "green", hex: "#007A36", stripe: true, shape: { t: "rect", x: 200, y: 0, w: 100, h: 200 } },
      { id: "emblem", label: "white emblem", colour: "white", hex: "#FFFFFF", needs: ["black", "red", "green"], shape: { t: "emblem", kind: "afghan", cx: 150, cy: 100, s: 1.12 } }
    ] },

    nepal: { name: "Nepal", w: 164, h: 200,
      /* Nepal's flag is two pennants, not a rectangle */
      outline: [[0, 0], [160, 112], [54, 112], [160, 200], [0, 200]],
      parts: [
      { id: "border",  label: "blue border",  colour: "blue",    hex: "#003893", stripe: true, shape: { t: "poly", pts: [[0, 0], [160, 112], [54, 112], [160, 200], [0, 200]] } },
      { id: "crimson", label: "crimson cloth", colour: "red",    hex: "#DC143C", stripe: true, needs: ["border"], shape: { t: "poly", pts: [[9, 17], [131, 103], [33, 103], [138, 191], [9, 191]] } },
      { id: "moon",    label: "white moon",   colour: "white",   hex: "#FFFFFF", area: "moon", areaLabel: "white moon", needs: ["crimson"], shape: { t: "crescent", cx: 42, cy: 62, R: 17, d: 7, r: 14.5, rot: -90 } },
      { id: "moonsun", label: "white moon",   colour: "white",   hex: "#FFFFFF", area: "moon", areaLabel: "white moon", needs: ["crimson"], shape: { t: "star", cx: 42, cy: 74, R: 11, rot: -90, n: 8 } },
      { id: "sun",     label: "white sun",    colour: "white",   hex: "#FFFFFF", needs: ["crimson"], shape: { t: "star", cx: 42, cy: 157, R: 22, rot: -90, n: 12 } }
    ] },

    /* Bhutan's dragon is the real artwork (assets/flags/bhutan-dragon.png, cut from the user's
       picture) at its exact place; "hit" is its outline, for tapping when colouring */
    bhutan: { name: "Bhutan", w: 300, h: 200, parts: [
      { id: "yellow", label: "yellow half",  colour: "yellow", hex: "#F6CB45", stripe: true, shape: { t: "poly", pts: [[0, 0], [300, 0], [0, 200]] } },
      { id: "orange", label: "orange half",  colour: "orange", hex: "#ED7336", stripe: true, shape: { t: "poly", pts: [[300, 0], [300, 200], [0, 200]] } },
      { id: "dragon", label: "white dragon", colour: "white",  hex: "#FFFFFF", needs: ["yellow", "orange"],
        shape: { t: "picture", src: "assets/flags/bhutan-dragon.png", x: 43.32, y: 25.72, w: 212.64, h: 155.07,
          hit: [[[242.6,26.1],[237.2,30.8],[236.8,34.4],[232.9,39.1],[231.8,45.3],[230.0,46.4],[223.8,46.4],[218.4,44.6],[217.0,42.0],[214.1,40.2],[211.9,41.3],[207.9,39.1],[202.5,40.2],[187.4,31.2],[182.3,29.7],[179.1,30.1],[182.3,30.4],[185.9,32.6],[185.2,33.7],[182.7,32.6],[184.8,34.8],[183.8,37.0],[176.5,33.7],[172.2,34.1],[177.6,35.5],[180.5,38.8],[171.5,35.1],[165.3,35.1],[169.7,35.5],[173.6,37.7],[170.8,38.8],[171.1,43.1],[164.6,41.7],[157.4,42.0],[154.2,44.6],[154.5,47.8],[157.8,48.9],[155.6,47.5],[156.0,44.9],[161.4,43.8],[171.1,46.4],[175.5,48.9],[174.4,49.6],[166.4,48.6],[163.5,47.1],[164.6,48.9],[163.5,50.0],[159.6,50.4],[155.2,53.3],[149.5,53.3],[145.5,55.4],[148.4,54.3],[161.0,55.1],[158.5,65.6],[152.7,70.3],[157.4,69.6],[156.3,73.9],[154.2,76.4],[154.2,78.6],[156.3,75.7],[161.4,75.0],[162.5,78.6],[165.3,80.4],[165.3,83.3],[167.9,85.5],[166.4,87.7],[162.1,88.4],[166.8,90.6],[169.7,90.6],[171.1,94.2],[169.3,95.3],[163.9,94.2],[167.9,97.1],[163.5,97.1],[160.6,94.2],[157.0,94.2],[154.5,91.7],[152.3,92.0],[148.0,85.5],[145.5,84.1],[146.6,86.6],[145.8,88.8],[139.7,87.0],[132.9,87.3],[131.0,84.8],[126.0,83.7],[128.2,85.9],[127.8,88.0],[123.5,88.4],[121.7,92.0],[118.1,92.0],[116.6,94.9],[111.9,94.2],[106.9,96.7],[111.9,97.8],[111.2,103.3],[108.3,105.1],[107.2,110.9],[98.2,115.9],[105.8,115.9],[104.3,118.8],[105.1,121.7],[102.2,126.8],[96.8,129.7],[99.6,131.5],[96.4,133.7],[97.1,135.5],[96.0,136.6],[92.1,136.6],[92.1,138.4],[90.6,139.5],[84.1,139.1],[86.3,141.3],[78.0,141.7],[74.4,139.5],[62.1,138.4],[66.8,140.9],[74.4,141.3],[78.7,144.2],[61.4,148.6],[67.5,148.9],[71.8,147.5],[74.0,148.2],[71.5,150.7],[65.7,151.8],[60.3,155.1],[55.2,156.2],[50.2,160.5],[57.4,157.2],[66.4,155.8],[64.6,158.0],[55.6,161.2],[49.8,167.0],[43.7,169.9],[46.9,169.6],[54.5,165.9],[62.1,164.5],[67.1,159.8],[70.0,159.8],[75.1,155.8],[78.0,155.1],[80.9,151.4],[81.9,152.9],[77.6,158.0],[83.8,154.0],[87.7,152.9],[88.1,154.3],[82.3,158.3],[89.9,156.5],[104.0,142.8],[109.4,139.5],[114.8,139.5],[115.5,143.1],[114.1,144.9],[110.5,144.6],[113.0,147.1],[111.2,147.8],[109.0,151.1],[112.6,150.0],[114.4,153.3],[116.6,149.6],[119.1,152.5],[120.2,156.9],[118.8,159.4],[115.5,160.5],[114.1,162.3],[114.1,168.5],[118.4,177.9],[122.0,180.1],[127.8,179.3],[131.0,176.1],[133.6,168.5],[133.2,162.7],[131.8,160.5],[133.9,159.4],[136.8,160.9],[139.7,163.8],[139.7,166.7],[140.4,161.6],[138.3,156.5],[134.7,155.1],[130.7,155.8],[128.2,154.3],[126.0,149.3],[123.1,147.1],[123.8,138.0],[128.2,137.7],[133.9,141.7],[137.2,142.4],[144.0,140.9],[147.3,137.0],[147.3,133.0],[144.4,129.0],[143.7,125.7],[141.5,124.6],[137.5,124.6],[133.2,126.4],[132.5,125.7],[132.9,122.8],[134.7,121.0],[137.5,120.3],[135.7,118.8],[131.0,119.2],[128.2,123.6],[127.1,127.5],[124.5,128.3],[123.1,127.2],[121.7,123.2],[123.5,113.8],[127.8,108.7],[130.7,108.7],[132.1,107.2],[143.3,108.3],[153.4,112.0],[171.8,114.9],[172.9,115.6],[171.8,119.2],[168.2,119.9],[165.7,118.8],[168.6,120.7],[169.0,122.1],[165.0,126.8],[170.4,123.9],[171.5,128.3],[174.7,125.4],[176.5,127.9],[178.0,127.5],[180.1,129.7],[184.8,131.5],[188.1,131.5],[189.9,133.0],[196.4,133.0],[199.6,135.1],[198.6,138.8],[200.4,143.5],[204.3,147.1],[214.1,149.3],[219.9,147.8],[223.5,143.5],[223.8,138.0],[222.0,134.4],[217.7,131.2],[219.5,130.4],[222.4,132.6],[222.0,129.7],[218.4,126.1],[211.9,125.7],[213.0,122.8],[218.1,119.2],[208.3,120.7],[207.2,123.6],[200.4,127.5],[193.9,124.6],[188.4,124.6],[184.8,122.8],[184.1,118.8],[192.1,106.5],[194.6,92.8],[200.7,92.0],[201.8,94.9],[200.4,97.5],[202.5,96.4],[203.6,97.1],[203.6,101.4],[205.4,102.9],[206.1,98.9],[207.2,98.2],[210.1,101.4],[208.3,95.7],[209.4,94.6],[215.5,93.5],[220.6,89.9],[223.1,89.9],[229.2,93.5],[234.3,93.5],[241.5,89.5],[244.8,85.9],[244.0,82.6],[239.0,76.8],[238.3,74.3],[233.6,71.0],[227.4,72.5],[221.7,81.9],[218.1,81.5],[212.6,83.3],[202.2,81.9],[196.4,77.9],[190.3,76.1],[185.9,71.0],[190.6,71.0],[197.8,76.4],[191.3,68.8],[194.9,66.7],[205.8,66.7],[213.4,72.5],[210.5,76.8],[214.4,76.1],[215.9,78.6],[218.1,75.7],[220.6,78.6],[220.9,71.0],[218.1,67.8],[219.9,65.6],[223.5,67.4],[223.8,73.2],[225.6,68.1],[233.6,68.8],[245.1,67.0],[249.5,69.6],[247.7,67.0],[242.2,65.6],[241.2,62.7],[239.0,61.2],[239.7,64.9],[237.9,66.7],[236.8,66.3],[236.5,64.1],[233.9,62.7],[234.7,65.6],[233.6,67.0],[230.7,68.1],[228.9,67.4],[231.0,60.9],[230.3,56.2],[231.8,53.3],[245.1,48.2],[255.2,47.5],[244.8,46.4],[240.4,48.6],[237.2,48.2],[240.8,44.2],[247.7,41.3],[239.7,40.9],[236.5,43.8],[235.0,43.5],[237.9,37.0],[238.3,31.9]]] } }
    ] },

    bangladesh: { name: "Bangladesh", w: 333, h: 200, parts: [
      { id: "cloth",  label: "green cloth", colour: "green", hex: "#006A4E", stripe: true, shape: { t: "rect", x: 0, y: 0, w: 333, h: 200 } },
      { id: "circle", label: "red circle",  colour: "red",   hex: "#F42A41", needs: ["cloth"], shape: { t: "circle", cx: 150, cy: 100, r: 66 } }
    ] },

    china: { name: "China", w: 300, h: 200, parts: [
      { id: "cloth", label: "red cloth",         colour: "red",    hex: "#EE1C25", stripe: true, shape: { t: "rect", x: 0, y: 0, w: 300, h: 200 } },
      { id: "big",   label: "big yellow star",   colour: "yellow", hex: "#FFDE00", area: "stars", areaLabel: "yellow stars", needs: ["cloth"], shape: { t: "star", cx: 50, cy: 50, R: 30, rot: -90 } },
      { id: "s1",    label: "small yellow star", colour: "yellow", hex: "#FFDE00", area: "stars", areaLabel: "yellow stars", needs: ["cloth"], shape: { t: "star", cx: 100, cy: 20, R: 10, rot: 149 } },
      { id: "s2",    label: "small yellow star", colour: "yellow", hex: "#FFDE00", area: "stars", areaLabel: "yellow stars", needs: ["cloth"], shape: { t: "star", cx: 120, cy: 40, R: 10, rot: 172 } },
      { id: "s3",    label: "small yellow star", colour: "yellow", hex: "#FFDE00", area: "stars", areaLabel: "yellow stars", needs: ["cloth"], shape: { t: "star", cx: 120, cy: 70, R: 10, rot: 196 } },
      { id: "s4",    label: "small yellow star", colour: "yellow", hex: "#FFDE00", area: "stars", areaLabel: "yellow stars", needs: ["cloth"], shape: { t: "star", cx: 100, cy: 90, R: 10, rot: 219 } }
    ] },

    /* look-alikes for South Asia (Catch the Flag, later rounds) */
    japan: { name: "Japan", w: 300, h: 200, lookalikeOnly: true, parts: [
      { id: "white", colour: "white", hex: "#FFFFFF", shape: { t: "rect", x: 0, y: 0, w: 300, h: 200 } },
      { id: "sun",   colour: "red",   hex: "#BC002D", shape: { t: "circle", cx: 150, cy: 100, r: 60 } }
    ] },
    vietnam: { name: "Vietnam", w: 300, h: 200, lookalikeOnly: true, parts: [
      { id: "red",  colour: "red",    hex: "#DA251D", shape: { t: "rect", x: 0, y: 0, w: 300, h: 200 } },
      { id: "star", colour: "yellow", hex: "#FFFF00", shape: { t: "star", cx: 150, cy: 100, R: 60, rot: -90 } }
    ] },

    romania: { name: "Romania", w: 300, h: 200, lookalikeOnly: true, parts: [
      { id: "blue",   colour: "blue",   hex: "#002B7F", shape: { t: "rect", x: 0,   y: 0, w: 100, h: 200 } },
      { id: "yellow", colour: "yellow", hex: "#FCD116", shape: { t: "rect", x: 100, y: 0, w: 100, h: 200 } },
      { id: "red",    colour: "red",    hex: "#CE1126", shape: { t: "rect", x: 200, y: 0, w: 100, h: 200 } }
    ] },
    india: { name: "India", w: 300, h: 200, parts: [
      { id: "saffron", label: "saffron stripe", colour: "orange", hex: "#FF9933", stripe: true, shape: { t: "rect", x: 0, y: 0,     w: 300, h: 66.7 } },
      { id: "white",   label: "white stripe",   colour: "white",  hex: "#FFFFFF", stripe: true, shape: { t: "rect", x: 0, y: 66.7,  w: 300, h: 66.6 } },
      { id: "green",   label: "green stripe",   colour: "green",  hex: "#138808", stripe: true, shape: { t: "rect", x: 0, y: 133.3, w: 300, h: 66.7 } },
      { id: "wheel",   label: "blue wheel",     colour: "blue",   hex: "#000080", needs: ["saffron", "white", "green"], shape: { t: "wheel", cx: 150, cy: 100, r: 25 } }
    ] },
    jordan: { name: "Jordan", w: 400, h: 200, lookalikeOnly: true, parts: [
      { id: "black", colour: "black", hex: "#000000", shape: { t: "rect", x: 0, y: 0,     w: 400, h: 66.7 } },
      { id: "white", colour: "white", hex: "#FFFFFF", shape: { t: "rect", x: 0, y: 66.7,  w: 400, h: 66.6 } },
      { id: "green", colour: "green", hex: "#007A3D", shape: { t: "rect", x: 0, y: 133.3, w: 400, h: 66.7 } },
      { id: "tri",   colour: "red",   hex: "#CE1126", shape: { t: "poly", pts: [[0, 0], [200, 100], [0, 200]] } },
      { id: "star",  colour: "white", hex: "#FFFFFF", shape: { t: "star", cx: 66, cy: 100, R: 15, rot: -90, n: 7 } }
    ] },
    pakistan: { name: "Pakistan", w: 300, h: 200, parts: [
      { id: "white", label: "white stripe",   colour: "white", hex: "#FFFFFF", stripe: true, shape: { t: "rect", x: 0,  y: 0, w: 75,  h: 200 } },
      { id: "green", label: "green part",     colour: "green", hex: "#01411C", stripe: true, shape: { t: "rect", x: 75, y: 0, w: 225, h: 200 } },
      { id: "cres",  label: "white crescent", colour: "white", hex: "#FFFFFF", area: "emblem", needs: ["green"], shape: { t: "crescent", cx: 187, cy: 104, R: 54, d: 14, r: 45, rot: -40 } },
      { id: "star",  label: "white star",     colour: "white", hex: "#FFFFFF", area: "emblem", needs: ["green"], shape: { t: "star", cx: 222, cy: 72, R: 17, rot: 140 } }
    ] },
    yemen: { name: "Yemen", w: 300, h: 200, lookalikeOnly: true, parts: [
      { id: "red",   colour: "red",   hex: "#CE1126", shape: { t: "rect", x: 0, y: 0,     w: 300, h: 66.7 } },
      { id: "white", colour: "white", hex: "#FFFFFF", shape: { t: "rect", x: 0, y: 66.7,  w: 300, h: 66.6 } },
      { id: "black", colour: "black", hex: "#000000", shape: { t: "rect", x: 0, y: 133.3, w: 300, h: 66.7 } }
    ] },
    turkey: { name: "Turkey", w: 300, h: 200, lookalikeOnly: true, parts: [
      { id: "red",  colour: "red",   hex: "#E30A17", shape: { t: "rect", x: 0, y: 0, w: 300, h: 200 } },
      { id: "cres", colour: "white", hex: "#FFFFFF", shape: { t: "crescent", cx: 106, cy: 100, R: 50, d: 12.5, r: 40, rot: 0 } },
      { id: "star", colour: "white", hex: "#FFFFFF", shape: { t: "star", cx: 160, cy: 100, R: 25, rot: 180 } }
    ] }
  },

  /* Everything Pip (and friends) say. Keep every line under 8 words (GDD §9).
     {friend} {country} {He} are filled in by the game. */
  lines: {
    tapToStart: "Tap to start!",
    whoIsPlaying: "Who is playing? Tap your picture!",
    welcomeBack: "Welcome back! Let's play!",
    intro1: "It's the Flag Festival!",
    intro2: "Nobody invited me!",
    intro3: "Oh no! The flags!",
    intro4: "The parade is today!",
    intro5: "Will you help everyone get their flag back?",
    letsGo: "Let's get the flags ready!",
    newCatch: "New game! Grumble is dropping flags — catch them!",
    newBuild: "New game! Let's build a flag from pieces!",

    mapHello: "This is {country}!",
    mapPut: "Put {country} back on the map!",
    mapNearly: "Nearly! Try again.",
    mapHint: "Look! It goes here.",
    goodJob: "Good job!",
    lookFlag: "Look carefully! This is the flag of {country}!",
    rainOh: "Oh no! Let's paint it again!",
    colourNow: "Now let's paint {country}'s flag!",
    pickColour: "Pick a paint pot first!",
    lookAgain: "Hmm, look again!",
    colourHint: "Try this colour!",
    cardHelp: "Let's look at the flag card!",
    itMatches: "Look! Your flag matches!",
    paintIntro: "Grumble rained on {country}'s flag! Paint it!",

    jigsawIntro: "Grumble tore {country}'s flag! Put the pieces back.",
    jigsawHint: "This piece goes here!",
    jigsawExtra: "That piece is from another flag!",

    catchIntro: "Grumble is dropping flags! Catch {country}'s flag!",
    catchHint: "Move the basket! Catch this one!",
    catchIndia: "That's India's flag! Our flag has a blue wheel.",

    buildIntro: "Let's build {country}'s flag!",
    stripesFirst: "Stripes first!",
    partFirst: "The {part} first!",
    buildHint: "Try this one!",
    buildWrong: "That's not on {country}'s flag!",

    quizIntro: "Which one is {country}'s flag? Put it in the box!",
    quizRight: "Yes! That's {country}'s flag!",
    praise: ["Yay!", "Well done!", "Wonderful!", "Shabaash!", "Super!", "You did it!"],
    paradeTime: "It's parade time!",
    /* the story of the three friends */
    storyStart: "Oh no! Our friends lost their real flags! Let's help them get their flags back!",
    map3Put: "Put the two countries back on the map!",
    map3Done: "Both are back on the map! Well done!",
    stepColour: "Let's help {friend}! Colour the flag!",
    stepBuild: "Let's help {friend}! Build the flag!",
    stepJigsaw: "Let's help {friend}! Fix the flag jigsaw!",
    stepCatch: "Let's help {friend}! Catch the flag!",
    revealAsk: "Which one is {country}'s flag? Put it in the box for {friend}!",
    revealYes: "Yes! {friend} has the real flag of {country}!",
    storyEnd: "Hooray! Every friend has a real flag! Parade time!",
    allDone: "Every flag is ready! Hooray!",
    grumbleJoin: "Grumble, come and join the parade!",
    grumbleYay: "Really? Thank you!",
    bubbles: "Pop the bubbles!",
    rotate: "Please turn your tablet sideways"
  },

  /* Recorded voice files can be dropped in later (GDD: real voice actor).
     Map a line key (or a country/colour name) to an audio file, e.g. "mapPut": "audio/voice/map_put.mp3".
     Anything not listed here is spoken by the browser's Indian English voice. */
  voiceFiles: {}
};
