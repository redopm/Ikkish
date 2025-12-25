/*********************************
 STATE
*********************************/
let SELECTED_LEVEL = null;
let questions = [];
let index = 0;
let timer = null;
let selectedAnswer = null;

let correct = 0;
let wrong = 0;
let unattempted = 0;
let timeSpent = [];

/*********************************
 CONFIG
*********************************/
const TOTAL_QUESTIONS = 10;

/*********************************
 DOM
*********************************/
const qno = document.getElementById("qno");
const timerEl = document.getElementById("timer");
const questionText = document.getElementById("questionText");
const optionsDiv = document.getElementById("options");
const submitBtn = document.getElementById("submitBtn");
const quiz = document.getElementById("quiz");
const result = document.getElementById("result");
const topbar = document.querySelector(".topbar");
const levelBadge = document.getElementById("levelBadge");
const skipBtn = document.getElementById("skipBtn");


/*********************************
 UTILS
*********************************/
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getBaseTime(level) {
  return level === "easy" ? 20 : level === "moderate" ? 25 : 35;
}

/*********************************
 START TEST
*********************************/
function startTest() {
  questions = [];
  index = 0;
  correct = wrong = unattempted = 0;
  timeSpent = [];

  levelBadge.innerText = SELECTED_LEVEL.toUpperCase();
  levelBadge.className = `level-badge ${SELECTED_LEVEL}`;

  generateQuestions();
  loadQuestion();
}

/*********************************
 QUESTIONS
*********************************/
function generateQuestions() {
  while (questions.length < TOTAL_QUESTIONS) {
    const q = generateQuestion(SELECTED_LEVEL);
    if (!questions.some(x => x.q === q.q)) {
      questions.push(q);
    }
  }
}

function loadQuestion() {
  clearInterval(timer);
  selectedAnswer = null;
  submitBtn.disabled = true;

  questionStartTime = Date.now();   // ✅ START TIME HERE

  const q = questions[index];
  qno.innerText = `Q ${index + 1} / ${questions.length}`;
  questionText.innerHTML = q.q;

  renderOptions(q.options);
  startTimer(getBaseTime(SELECTED_LEVEL));
}

/*********************************
 OPTIONS
*********************************/
function renderOptions(options) {
  optionsDiv.innerHTML = "";
  options.forEach(val => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="radio"> ${val}`;
    label.onclick = () => {
      selectedAnswer = val;
      submitBtn.disabled = false;
    };
    optionsDiv.appendChild(label);
  });
}

/*********************************
 TIMER
*********************************/
function startTimer(sec) {
  timerEl.innerText = `⏱ ${sec}s`;
  timer = setInterval(() => {
    sec--;
    timerEl.innerText = `⏱ ${sec}s`;
    if (sec <= 0) {
      clearInterval(timer);
      submitAnswer();
    }
  }, 1000);
}

/*********************************
 SUBMIT
*********************************/
function submitAnswer() {
  clearInterval(timer);

  const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
  timeSpent.push(timeTaken);   // ✅ PUSH TIME

  if (selectedAnswer === null) {
    unattempted++;
  } else if (+selectedAnswer === questions[index].ans) {
    correct++;
  } else {
    wrong++;
  }

  index++;
  index < questions.length ? loadQuestion() : showResult();
}

submitBtn.onclick = submitAnswer;

skipBtn.onclick = () => {
  clearInterval(timer);

  const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
  timeSpent.push(timeTaken);   // ✅ SKIP TIME COUNT

  unattempted++;
  index++;

  index < questions.length ? loadQuestion() : showResult();
};

/*********************************
 RESULT
*********************************/
function showResult() {
  quiz.style.display = "none";
  result.classList.remove("hidden");
  result.style.display = "block";

  const totalTime = timeSpent.reduce((a, b) => a + b, 0);
  const avgTime = (totalTime / questions.length).toFixed(1);
  const score = correct - (wrong * 0.25);
  const accuracy = Math.round((correct / questions.length) * 100);
  const percentile = Math.min(99, accuracy + 10);

  document.getElementById("rTotalTime").innerText = totalTime + "s";
  document.getElementById("rScore").innerText = score.toFixed(2);
  document.getElementById("rCorrect").innerText = correct;
  document.getElementById("rWrong").innerText = wrong;
  document.getElementById("rScore").innerText = score.toFixed(2);
  document.getElementById("rAccuracy").innerText = accuracy + "%";
  document.getElementById("rPercentile").innerText = percentile + "%";
  document.getElementById("rAvgTime").innerText = avgTime + "s";

  drawCompareChart(score);
  drawHistoryChart();

  document.getElementById("retakeBtn").onclick = () => location.reload();
}
/*********************************
 CHARTS
*********************************/
function drawCompareChart(score) {
  new Chart(document.getElementById("compareChart"), {
    type: "bar",
    data: {
      labels: ["Topper", "Average", "You"],
      datasets: [{
        data: [questions.length * 0.9, questions.length * 0.6, score],
        backgroundColor: ["#f39c12","#bdc3c7","#2ecc71"]
      }]
    },
    options: { plugins:{legend:{display:false}} }
  });
}
function drawHistoryChart() {
  new Chart(document.getElementById("historyChart"), {
    type: "line",
    data: {
      labels: ["T1","T2","T3","T4","T5"],
      datasets: [{
        label: "Score",
        data: [10,12,14,13,15],
        borderColor: "#3498db",
        tension: 0.3
      }]
    }
  });
}
