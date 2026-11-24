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
    romania: { name: "Romania", w: 300, h: 200, lookalikeOnly: true, parts: [
      { id: "blue",   colour: "blue",   hex: "#002B7F", shape: { t: "rect", x: 0,   y: 0, w: 100, h: 200 } },
      { id: "yellow", colour: "yellow", hex: "#FCD116", shape: { t: "rect", x: 100, y: 0, w: 100, h: 200 } },
      { id: "red",    colour: "red",    hex: "#CE1126", shape: { t: "rect", x: 200, y: 0, w: 100, h: 200 } }
    ] },
    india: { name: "India", w: 300, h: 200, lookalikeOnly: true, parts: [
      { id: "saffron", colour: "orange", hex: "#FF9933", shape: { t: "rect", x: 0, y: 0,     w: 300, h: 66.7 } },
      { id: "white",   colour: "white",  hex: "#FFFFFF", shape: { t: "rect", x: 0, y: 66.7,  w: 300, h: 66.6 } },
      { id: "green",   colour: "green",  hex: "#138808", shape: { t: "rect", x: 0, y: 133.3, w: 300, h: 66.7 } },
      { id: "wheel",   colour: "blue",   hex: "#000080", shape: { t: "wheel", cx: 150, cy: 100, r: 25 } }
    ] },
    jordan: { name: "Jordan", w: 400, h: 200, lookalikeOnly: true, parts: [
      { id: "black", colour: "black", hex: "#000000", shape: { t: "rect", x: 0, y: 0,     w: 400, h: 66.7 } },
      { id: "white", colour: "white", hex: "#FFFFFF", shape: { t: "rect", x: 0, y: 66.7,  w: 400, h: 66.6 } },
      { id: "green", colour: "green", hex: "#007A3D", shape: { t: "rect", x: 0, y: 133.3, w: 400, h: 66.7 } },
      { id: "tri",   colour: "red",   hex: "#CE1126", shape: { t: "poly", pts: [[0, 0], [200, 100], [0, 200]] } },
      { id: "star",  colour: "white", hex: "#FFFFFF", shape: { t: "star", cx: 66, cy: 100, R: 15, rot: -90, n: 7 } }
    ] },
    pakistan: { name: "Pakistan", w: 300, h: 200, lookalikeOnly: true, parts: [
      { id: "white", colour: "white", hex: "#FFFFFF", shape: { t: "rect", x: 0,  y: 0, w: 75,  h: 200 } },
      { id: "green", colour: "green", hex: "#01411C", shape: { t: "rect", x: 75, y: 0, w: 225, h: 200 } },
      { id: "cres",  colour: "white", hex: "#FFFFFF", shape: { t: "crescent", cx: 187, cy: 104, R: 54, d: 14, r: 45, rot: -40 } },
      { id: "star",  colour: "white", hex: "#FFFFFF", shape: { t: "star", cx: 222, cy: 72, R: 17, rot: 140 } }
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
    lookFlag: "Look closely — this is {country}'s flag!",
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
