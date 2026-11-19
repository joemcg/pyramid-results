// Frozen copy of the first four boards (Matt, Julie, Sanna, Anto) so calc tests do not move when new boards are added.
// pieces: calories for the 4, 3, 2 and 1 minute efforts, in that order. null = not recorded.
// order: the machine order the person did the test in.
// overrides: per-person week-8 targets that replace the +5% default, e.g. { Julie: { week8: { row: 140 } } }.
globalThis.PYRAMID = {
  machines: ["echo", "row", "ski"],
  flatUplift: 0.05,
  people: [
    { name: "Matt",  tests: { week1: { date: null, order: ["row", "ski", "echo"], boardTotal: 450, pieces: { echo: [48, 32, 21, 11], row: [80, 58, 40, 21], ski: [57, 42, 26, 14] } } } },
    { name: "Julie", tests: { week1: { date: null, order: ["row", "ski", "echo"], boardTotal: 307, pieces: { echo: [32, 22, 15, 7],  row: [52, 38, 24, 12], ski: [42, 32, 21, 10] } } } },
    { name: "Sanna", tests: { week1: { date: null, order: ["echo", "row", "ski"], boardTotal: 293, pieces: { echo: [32, 20, 18, 9],  row: [45, 33, 22, 12], ski: [39, 30, 23, 10] } } } },
    { name: "Anto",  tests: { week1: { date: null, order: ["ski", "echo", "row"], boardTotal: 271, pieces: { echo: [25, 18, 12, 6],  row: [44, 32, 20, 10], ski: [40, 32, 21, 11] } } } },
    { name: "Rich",    tests: {} },
    { name: "Joe",     tests: {} },
    { name: "Jo",      tests: {} },
    { name: "Jay",     tests: {} },
    { name: "Lindsay", tests: {} }
  ],
  overrides: {}
};
