// Mock data for design exploration only. Loaded as a script so the pages work from file://.
// Pieces are calories for the 4, 3, 2 and 1 minute efforts. `order` is the machine order the person did them in.
window.PYRAMID = {
  machines: ["echo", "row", "ski"],
  people: [
    { name: "Matt",  tests: { week1: { order: ["row", "ski", "echo"], pieces: { echo: [48, 32, 21, 11], row: [80, 58, 40, 21], ski: [57, 42, 26, 14] }, boardTotal: 450 } } },
    { name: "Julie", tests: { week1: { order: ["row", "ski", "echo"], pieces: { echo: [32, 22, 15, 7],  row: [52, 38, 24, 12], ski: [42, 32, 21, 10] }, boardTotal: 307 } } },
    { name: "Sanna", tests: { week1: { order: ["echo", "row", "ski"], pieces: { echo: [32, 20, 18, 9],  row: [45, 33, 22, 12], ski: [39, 30, 23, 10] }, boardTotal: 293 } } },
    { name: "Anto",  tests: { week1: { order: ["ski", "echo", "row"], pieces: { echo: [25, 18, 12, 6],  row: [44, 32, 20, 10], ski: [40, 32, 21, 11] }, boardTotal: 271 } } },
    { name: "Rich",    tests: {} },
    { name: "Joe",     tests: {} },
    { name: "Jo",      tests: {} },
    { name: "Jay",     tests: {} },
    { name: "Lindsay", tests: {} }
  ],
  // Example override so the designs can show how an overridden target looks.
  overrides: { Julie: { week8: { row: 140 } } },
  flatUplift: 0.05
};
