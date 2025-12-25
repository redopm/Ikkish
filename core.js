/*********************************
 BASIC UTILS
*********************************/
function getLevelConfig(level) {
  if (level === "easy") return window.LEVEL_EASY;
  if (level === "moderate") return window.LEVEL_MODERATE;
  return window.LEVEL_HARD;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*********************************
 DECIMAL CONTROL (GLOBAL RULE)
*********************************/
function fixDecimal(v) {
  if (Number.isInteger(v)) return v;
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/*********************************
 HARD ANSWER MIX CONTROL
*********************************/
function isValidHardAnswer(ans) {
  const v = fixDecimal(ans);
  const isInt = Number.isInteger(v);

  // 60% integer, 40% decimal
  if (Math.random() < 0.6) return isInt;
  return !isInt;
}

/*********************************
 BODMAS EVALUATION
*********************************/
function evaluateBODMAS(expr) {
  const jsExpr = expr
    .replace(/×/g, "*")
    .replace(/−/g, "-")
    .replace(/÷/g, "/")
    .replace(/√(\d+)/g, "Math.sqrt($1)")
    .replace(/∛(\d+)/g, "Math.cbrt($1)")
    .replace(/(\d+)²/g, "Math.pow($1,2)")
    .replace(/(\d+)³/g, "Math.pow($1,3)");

  return Function(`"use strict"; return (${jsExpr})`)();
}

/*********************************
 ALLOWED OPERATIONS
*********************************/
function getAllowedOps(cfg) {
  const ops = [];

  if (cfg.TOPICS.ADD) ops.push("ADD");
  if (cfg.TOPICS.SUB) ops.push("SUB");
  if (cfg.TOPICS.MUL) ops.push("MUL");
  if (cfg.TOPICS.DIV) ops.push("DIV");
  if (cfg.TOPICS.PERCENT) ops.push("PERCENT");
  if (cfg.TOPICS.SQUARE) ops.push("SQUARE");
  if (cfg.TOPICS.CUBE) ops.push("CUBE");
  if (cfg.TOPICS.SQRT) ops.push("SQRT");
  if (cfg.TOPICS.CBRT) ops.push("CBRT");
  if (cfg.TOPICS.FRACTION) ops.push("FRACTION");

  return ops;
}

/*********************************
 EXPRESSION BUILDER
*********************************/
function buildExpression(opCount, cfg) {
  let expr, ans;
  let attempts = 0;

  do {
    attempts++;
    expr = `${rand(cfg.ADD_MIN, cfg.ADD_MAX)}`;
    let usedOps = 0;

    const allowedOps = getAllowedOps(cfg);

    while (usedOps < opCount) {
      const op = allowedOps[rand(0, allowedOps.length - 1)];

      switch (op) {
        case "ADD":
          expr += ` + ${rand(cfg.ADD_MIN, cfg.ADD_MAX)}`;
          break;

        case "SUB":
          expr += ` − ${rand(cfg.SUB_MIN, cfg.SUB_MAX)}`;
          break;

        case "MUL":
          expr += ` × ${rand(cfg.MUL_MIN, cfg.MUL_MAX)}`;
          break;

        case "DIV":
          expr += ` ÷ ${rand(2, cfg.MUL_MAX)}`;
          break;

        case "PERCENT": {
          const p = rand(5, 50);
          const b = rand(cfg.ADD_MIN, cfg.ADD_MAX);
          expr += ` + (${p}/100) × ${b}`;
          break;
        }

        case "SQUARE": {
          const n = rand(2, Math.floor(Math.sqrt(cfg.ADD_MAX)));
          expr += ` + (${n}²)`;
          break;
        }

        case "CUBE": {
          const n = rand(2, Math.floor(Math.cbrt(cfg.ADD_MAX)));
          expr += ` + (${n}³)`;
          break;
        }

        case "SQRT": {
          const n = rand(2, Math.floor(Math.sqrt(cfg.ADD_MAX)));
          expr += ` + √${n * n}`;
          break;
        }

        case "CBRT": {
          const n = rand(2, Math.floor(Math.cbrt(cfg.ADD_MAX)));
          expr += ` + ∛${n * n * n}`;
          break;
        }

        case "FRACTION": {
          const num = rand(1, 9);
          const den = rand(num + 1, 10);
          const base = rand(cfg.ADD_MIN, cfg.ADD_MAX);
          expr += ` + ((${num}/${den}) × ${base})`;
          break;
        }
      }

      usedOps++;
    }

    ans = fixDecimal(evaluateBODMAS(expr));

    // EASY → integer only
    if (cfg.LEVEL === "easy" && !Number.isInteger(ans)) ans = null;

    // HARD → controlled mix
    if (cfg.LEVEL === "hard" && !isValidHardAnswer(ans)) ans = null;

  } while (ans === null && attempts < 50);

  if (ans === null) throw new Error("Failed to generate question");

  return {
    q: expr + " = ?",
    ans
  };
}

/*********************************
 FIND THE VALUE (HARD ONLY)
*********************************/
function generateFindValueRight() {
  const p1 = rand(10, 30);
  const p2 = rand(5, 25);
  const base = rand(5, 40);

  return {
    expr: `${p1}% of ? + ${p2}% of ${base}`,
    coef: p1 / 100,
    constant: (p2 / 100) * base
  };
}

function buildFindValueQuestion(cfg) {
  let tries = 0;

  while (tries < 20) {
    tries++;

    const left = buildExpression(3, cfg);
    const right = generateFindValueRight();

    let x = (left.ans - right.constant) / right.coef;
    x = fixDecimal(x);

    if (!Number.isFinite(x)) continue;
    if (!isValidHardAnswer(x)) continue;

    return {
      q: `${left.q.replace(" = ?", "")} = ${right.expr}`,
      ans: x
    };
  }

  return null;
}

/*********************************
 OPTIONS
*********************************/
function generateUnitDigitOptions(ans, count = 5) {
  const options = new Set();
  options.add(ans);

  while (options.size < count) {
    const delta = rand(-30, 30);
    const v = fixDecimal(ans + delta);
    options.add(v);
  }

  return shuffle([...options]);
}

/*********************************
 QUESTION GENERATOR
*********************************/
function generateQuestion(level) {
  const cfg = getLevelConfig(level);

  const opCount =
    level === "easy" ? 3 :
    level === "moderate" ? 4 : 5;

  // HARD → 40% find-the-value
  if (level === "hard" && Math.random() < 0.4) {
    const q = buildFindValueQuestion(cfg);
    if (q) {
      return {
        q: q.q,
        ans: q.ans,
        options: generateUnitDigitOptions(q.ans),
        complexity: opCount
      };
    }
  }

  const base = buildExpression(opCount, cfg);

  return {
    q: base.q,
    ans: base.ans,
    options: generateUnitDigitOptions(base.ans),
    complexity: opCount
  };
}
