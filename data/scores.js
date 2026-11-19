// Pyramid programme scores. JSON-shaped; a .js file so index.html works when opened from disk.
// pieces: calories for the 4, 3, 2 and 1 minute efforts, in that order. null = not recorded.
// Each person has a week1 and a week8 slot; null until that test is done.
// order: the machine order the person did the test in.
// paces: Target and Recovery ranges from the official pace calculator. Echo in watts, Row and Ski in cal/hr.
// overrides: per-person week-8 targets that replace the +5% default, e.g. { Julie: { week8: { row: 140 } } }.
globalThis.PYRAMID = {
  machines: ["echo", "row", "ski"],
  flatUplift: 0.05,
  people: [
    { name: "Matt",  tests: { week1: { date: null, order: ["row", "ski", "echo"], boardTotal: 450, pieces: { echo: [48, 32, 21, 11], row: [80, 58, 40, 21], ski: [57, 42, 26, 14] } }, week8: null }, paces: { echo: { target: [235, 258], recovery: [146, 168] }, row: { target: [1254, 1373], recovery: [896, 1015] }, ski: { target: [876, 959], recovery: [626, 709] } } },
    { name: "Julie", tests: { week1: { date: null, order: ["row", "ski", "echo"], boardTotal: 307, pieces: { echo: [32, 22, 15, 7],  row: [52, 38, 24, 12], ski: [42, 32, 21, 10] } }, week8: null }, paces: { echo: { target: [160, 175], recovery: [99, 114] }, row: { target: [794, 869], recovery: [567, 643] }, ski: { target: [662, 725], recovery: [473, 536] } } },
    { name: "Sanna", tests: { week1: { date: null, order: ["echo", "row", "ski"], boardTotal: 293, pieces: { echo: [32, 20, 18, 9],  row: [45, 33, 22, 12], ski: [39, 30, 23, 10] } }, week8: null }, paces: { echo: { target: [166, 182], recovery: [103, 119] }, row: { target: [706, 773], recovery: [504, 571] }, ski: { target: [643, 704], recovery: [459, 520] } } },
    { name: "Anto",  tests: { week1: { date: null, order: ["ski", "echo", "row"], boardTotal: 271, pieces: { echo: [25, 18, 12, 6],  row: [44, 32, 20, 10], ski: [40, 32, 21, 11] } }, week8: null }, paces: { echo: { target: [128, 140], recovery: [79, 92] }, row: { target: [668, 731], recovery: [477, 541] }, ski: { target: [655, 718], recovery: [468, 530] } } },
    { name: "Rich",  tests: { week1: { date: null, order: ["echo", "row", "ski"], boardTotal: 405, pieces: { echo: [60, 39, 25, 14], row: [62, 43, 25, 14], ski: [54, 34, 22, 13] } }, week8: null }, paces: { echo: { target: [290, 317], recovery: [179, 207] }, row: { target: [907, 994], recovery: [648, 734] }, ski: { target: [775, 849], recovery: [554, 627] } } },
    { name: "Joe",   tests: { week1: { date: null, order: ["row", "ski", "echo"], boardTotal: 460, pieces: { echo: [51, 35, 21, 16], row: [82, 58, 40, 21], ski: [57, 40, 26, 13] } }, week8: null }, paces: { echo: { target: [258, 283], recovery: [160, 185] }, row: { target: [1266, 1387], recovery: [905, 1025] }, ski: { target: [857, 938], recovery: [612, 694] } } },
    // Jo: starting machine recorded as "Ski?" on the sheet; order assumed from the usual Echo, Row, Ski rotation.
    { name: "Jo",    tests: { week1: { date: null, order: ["ski", "echo", "row"], boardTotal: 330, pieces: { echo: [40, 31, 21, 12], row: [50, 37, 24, 12], ski: [41, 30, 21, 11] } }, week8: null }, paces: { echo: { target: [218, 239], recovery: [135, 156] }, row: { target: [775, 849], recovery: [554, 627] }, ski: { target: [649, 711], recovery: [464, 525] } } },
    { name: "Jay",   tests: { week1: { date: null, order: ["echo", "row", "ski"], boardTotal: 462, pieces: { echo: [62, 45, 29, 16], row: [68, 45, 30, 16], ski: [64, 43, 28, 16] } }, week8: null }, paces: { echo: { target: [319, 350], recovery: [198, 228] }, row: { target: [1002, 1097], recovery: [716, 811] }, ski: { target: [951, 1042], recovery: [680, 770] } } },
    { name: "Joel",    tests: { week1: null, week8: null } },
    { name: "Lindsay", tests: { week1: null, week8: null } }
  ],
  overrides: {}
};
