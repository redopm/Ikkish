window.LEVEL_EASY = {
  LEVEL: "easy",

  // 🔢 number limits
  ADD_MIN: 1, ADD_MAX: 50,
  SUB_MIN: 1, SUB_MAX: 50,
  MUL_MIN: 2, MUL_MAX: 10,

  // 🧠 allowed topics
  TOPICS: {
    ADD: true,
    SUB: true,
    MUL: true,
    DIV: true,

    PERCENT: true,      // only clean %
    SQUARE: true,       // 2–20
    CUBE: false,
    SQRT: true,         // perfect square only
    CBRT: false,

    FRACTION: false
  }
};
