// Pyramid programme scores. JSON-shaped; a .js file so index.html works when opened from disk.
// pieces: calories for the 4, 3, 2 and 1 minute efforts, in that order. null = not recorded.
// Each person has a week1 and a week8 slot; null until that test is done.
// order: the machine order the person did the test in.
// paces: Target and Recovery ranges from the official pace calculator. Echo in watts, Row and Ski in cal/hr.
// cycleStart: the date week 2 starts; later weeks start every 7 days.
// sessions: cycle-session results copied from the results Sheet, one row per section, plus notes written from them.
//   Rows with from: "board" came from a board photo instead of the Sheet.
// overrides: per-person week-8 targets that replace the +5% default, e.g. { Julie: { week8: { row: 140 } } }.
globalThis.PYRAMID = {
  machines: ["echo", "row", "ski"],
  flatUplift: 0.05,
  cycleStart: "2026-11-23", // Monday week 2 (the first cycle session) starts
  resultsUrl: "https://script.google.com/macros/s/AKfycbyhhhjI1Wov8-NT6kwSgNrFoHp6-HQbQDbShzmVw7_kqgt_eHH5rGlCYHJqfX0I0I-8/exec",         // Apps Script web app URL for saving session results; entry hidden while null
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
    // Joel: machine order Echo, Row, Ski, confirmed by Joe.
    { name: "Joel",    tests: { week1: { date: null, order: ["echo", "row", "ski"], boardTotal: 432, pieces: { echo: [48, 38, 28, 17], row: [65, 46, 30, 15], ski: [57, 43, 28, 17] } }, week8: null }, paces: { echo: { target: [275, 301], recovery: [170, 197] }, row: { target: [983, 1076], recovery: [702, 796] }, ski: { target: [914, 1000], recovery: [653, 740] } } },
    // Lindsay: started on the Ski; rest of the order assumed from the usual Echo, Row, Ski rotation.
    { name: "Lindsay", tests: { week1: { date: null, order: ["ski", "echo", "row"], boardTotal: 388, pieces: { echo: [44, 33, 22, 11], row: [60, 45, 30, 15], ski: [51, 38, 25, 14] } }, week8: null }, paces: { echo: { target: [231, 253], recovery: [143, 165] }, row: { target: [945, 1035], recovery: [675, 765] }, ski: { target: [806, 883], recovery: [576, 653] } } }
  ],
  sessions: [
    {
      week: 2, date: "2026-11-27",
      rows: [
        { name: "Joe", set: 1, machine: "row", calories: 77, comment: "" },
        { name: "Joe", set: 2, machine: "row", calories: 75, comment: "" },
        { name: "Joe", set: 1, machine: "ski", calories: 58, comment: "Paces felt too easy so went faster." },
        { name: "Joe", set: 2, machine: "ski", calories: 60, comment: "Paces felt too easy so went faster." },
        { name: "Joe", set: 1, machine: "echo", calories: 52, comment: "Paces felt too easy so went faster." },
        { name: "Joe", set: 2, machine: "echo", calories: 58, comment: "Paces felt too easy so went faster." },
        { name: "Sanna", set: 1, machine: "echo", calories: 28, comment: "" },
        { name: "Sanna", set: 2, machine: "echo", calories: 28, comment: "" },
        { name: "Sanna", set: 1, machine: "row", calories: 43, comment: "" },
        { name: "Sanna", set: 2, machine: "row", calories: 43, comment: "" },
        { name: "Sanna", set: 1, machine: "ski", calories: 40, comment: "" },
        { name: "Sanna", set: 2, machine: "ski", calories: 40, comment: "" },
        { name: "Rich", set: 1, machine: "echo", calories: 50, comment: "Target paces good" },
        { name: "Rich", set: 2, machine: "echo", calories: 52, comment: "Target paces good" },
        { name: "Rich", set: 1, machine: "row", calories: 64, comment: "1050-1120 working pace" },
        { name: "Rich", set: 2, machine: "row", calories: 67, comment: "1050-1120 working pace" },
        { name: "Rich", set: 1, machine: "ski", calories: 51, comment: "880-920 working pace" },
        { name: "Rich", set: 2, machine: "ski", calories: 53, comment: "880-920 working pace" },
        { name: "Julie", set: 1, machine: "row", calories: 52, comment: "Pacing felt fine. Upper end of both paces" },
        { name: "Julie", set: 2, machine: "row", calories: 51, comment: "Same as first set" },
        { name: "Julie", set: 1, machine: "ski", calories: 46, comment: "Good" },
        { name: "Julie", set: 2, machine: "ski", calories: 46, comment: "Recovery pace very slow" },
        { name: "Julie", set: 1, machine: "echo", calories: 31, comment: "Most challenging" },
        { name: "Julie", set: 2, machine: "echo", calories: 34, comment: "Recovery pace more challenging than other machines" },
        { name: "Jay", set: 1, machine: "echo", calories: 54, comment: "Paces: 342-350 / 216-230 (the bad echo bike)" },
        { name: "Jay", set: 2, machine: "echo", calories: 55, comment: "Paces: 342-350 / 216-230 (the bad echo bike)" },
        { name: "Jay", set: 1, machine: "row", calories: 65, comment: "Paces: 1100-1200 / 850-900" },
        { name: "Jay", set: 2, machine: "row", calories: 66, comment: "Paces: 1100-1200 / 850-900" },
        { name: "Jay", set: 1, machine: "ski", calories: 63, comment: "Paces: 1040-1080 / 800-850" },
        { name: "Jay", set: 2, machine: "ski", calories: 64, comment: "Paces: 1040-1080 / 800-850" },
        { name: "Matt", set: 1, machine: "row", calories: 78, comment: "" },
        { name: "Matt", set: 2, machine: "row", calories: 76, comment: "" },
        { name: "Matt", set: 1, machine: "ski", calories: 62, comment: "1000+ target, 800 ish recovery" },
        { name: "Matt", set: 2, machine: "ski", calories: 62, comment: "1000+ target, 800 ish recovery" },
        { name: "Matt", set: 1, machine: "echo", calories: 42, comment: "Felt easy" },
        { name: "Matt", set: 2, machine: "echo", calories: 42, comment: "Felt easy" },
        // Jo: from a board photo, not the Sheet. Keep these rows when refreshing from the Sheet.
        { name: "Jo", set: 1, machine: "ski", calories: 45, comment: "", from: "board" },
        { name: "Jo", set: 2, machine: "ski", calories: 45, comment: "", from: "board" },
        { name: "Jo", set: 1, machine: "echo", calories: 39, comment: "", from: "board" },
        { name: "Jo", set: 2, machine: "echo", calories: 38, comment: "", from: "board" },
        { name: "Jo", set: 1, machine: "row", calories: 57, comment: "", from: "board" },
        { name: "Jo", set: 2, machine: "row", calories: 57, comment: "", from: "board" }
      ],
      notes: {
        group: [
          "Most machines came in over plan: 12 of 21, with none under. That is fine for week 2, whose job is learning the paces, but the plan gets harder from here: weeks 3 and 4 add target time, and weeks 5 and 6 cut recovery.",
          "The Ski stands out. It was over plan for 6 of the 7 people who logged, by 11% to 17%; only Sanna was on plan. The Echo is the opposite: on plan for 5 of 7.",
          "For Joe, Jo, Julie and Jay, the biggest gap is on the machine they did last in the week 1 test. Tired legs at the end of the test may have set that pace low; the week 8 retest will tell.",
          "The extra calories mostly come from recovery. Jay and Matt noted the paces they held, and their recovery sits above their recovery ranges; Julie found recovery pace very slow. Keeping recovery slow keeps target pace honest later in the cycle. Nobody faded: set 2 matched or beat set 1 on 17 of 21 machines."
        ],
        Joe: "On plan on the Row, but 14% over on the Ski and 24% over on the Echo, which matches \"paces felt too easy\". The Echo was Joe's last machine in the week 1 test, so its pace may have been set low. Next week: sit at the top of the target range on the Echo and Ski, and keep recovery at recovery pace.",
        Sanna: "On plan on all three machines, with identical sets. Exactly what week 2 is for. Keep the same paces for week 3.",
        Rich: "Echo on plan, as Rich said. Row and Ski were 20% and 11% over: Rich's working paces (1050 to 1120 on the Row, 880 to 920 on the Ski) sit above the target ranges (907 to 994 and 775 to 849). The week 1 Row and Ski may undersell Rich; the week 8 retest will tell.",
        Julie: "Over plan on all three (8% to 19%), at the upper end of both paces. Julie found recovery pace very slow on the Ski and more challenging on the Echo than elsewhere, so the extra calories likely came from the recovery minutes. The Echo is still the most challenging machine, and it was also the furthest over plan. Next week: let recovery be properly easy.",
        Matt: "Row and Echo on plan (+2% and +4%), though Matt found the Echo easy, so there is room to sit at the top of that target range. The Ski was 17% over: Matt worked at 1000+ target and about 800 recovery, against ranges of 876 to 959 and 626 to 709. Recovery is where most of that gap is. Sets were steady.",
        Jo: "Echo on plan (+3%), with set 2 one calorie under set 1. Row 22% over and Ski 15% over, with identical sets on both. The Row was Jo's last machine in the week 1 test, so its pace may have been set low; the week 8 retest will tell. Next week: sit at the top of the Row and Ski target ranges and keep recovery properly easy.",
        Jay: "Echo exactly on plan, on what Jay called the bad Echo bike. Row and Ski were 8% and 11% over: Jay held 1100 to 1200 target and 850 to 900 recovery on the Row (ranges 1002 to 1097 and 716 to 811), and 1040 to 1080 and 800 to 850 on the Ski (951 to 1042 and 680 to 770). Recovery ran above the top of the range on both, by 30 to 90 cal/hr. Set 2 beat set 1 on every machine."
      }
    }
  ],
  overrides: {}
};
