let score = 0;
let streak = 0;
let currentQuestionIndex = 0;
let currentTopic = "";
let answered = false;
let questionsData = {};
let quizTimer;
let remainingTime = 300; // 5 minuti

async function loadQuestions() {
  try {
    const response = await fetch('questions.json');
    const data = await response.json();
    questionsData = data;
  } catch (error) {
    alert("Errore nel caricamento delle domande.");
    console.error(error);
  }
}

loadQuestions();

function showRules() {
  document.getElementById("home-page").style.display = "none";
  document.getElementById("rules-page").style.display = "block";
}

function goHome() {
  clearInterval(quizTimer);
  resetQuizState();
  document.getElementById("home-page").style.display = "block";
  document.getElementById("rules-page").style.display = "none";
  document.getElementById("quiz-page").style.display = "none";
  document.getElementById("summary-page").style.display = "none";
}

function resetQuizState() {
  score = 0;
  streak = 0;
  currentQuestionIndex = 0;
  answered = false;
  remainingTime = 300;
  updateTimerDisplay();
  document.getElementById("feedback").style.display = "none";
  document.getElementById("progress-fill").style.width = `0%`;
  document.getElementById("next-question").disabled = true;
}

function startQuiz(topic) {
  if (!questionsData || Object.keys(questionsData).length === 0) {
    alert("Le domande non sono ancora state caricate. Riprova fra un momento.");
    return;
  }

  currentTopic = topic === 'random' ? getRandomTopic() : topic;
  resetQuizState();

  document.getElementById("home-page").style.display = "none";
  document.getElementById("rules-page").style.display = "none";
  document.getElementById("quiz-page").style.display = "block";
  document.getElementById("summary-page").style.display = "none";

  document.getElementById("quiz-title").textContent = `Quiz di storia romana - ${currentTopic.replace("-", " ")}`;
  displayScore();
  updateStreak();
  updateProgress();
  showQuestion();
  startTimer();
}

function getRandomTopic() {
  const keys = Object.keys(questionsData);
  return keys[Math.floor(Math.random() * keys.length)];
}

function showQuestion() {
  const topicQuestions = questionsData[currentTopic];

  if (!topicQuestions || currentQuestionIndex >= 20 || currentQuestionIndex >= topicQuestions.length) {
    endQuiz();
    return;
  }

  const questionData = topicQuestions[currentQuestionIndex];
  const questionContainer = document.getElementById("question");
  const optionsContainer = document.getElementById("options");
  const feedback = document.getElementById("feedback");

  questionContainer.textContent = questionData.question;
  optionsContainer.innerHTML = "";
  feedback.style.display = "none";
  feedback.textContent = "";

  const shuffledOptions = shuffleArray([...questionData.options]);

  shuffledOptions.forEach(option => {
    const li = document.createElement("li");
    li.textContent = option;
    li.onclick = () => handleAnswer(li, questionData.answer, questionData.tip);
    li.title = questionData.tip || "";
    optionsContainer.appendChild(li);
  });

  answered = false;
  updateProgress();
  document.getElementById("next-question").disabled = true;
}

function handleAnswer(selectedOption, correctAnswer, tip) {
  if (answered) return;

  const options = document.querySelectorAll("#options li");
  const isCorrect = selectedOption.textContent === correctAnswer;

  options.forEach(option => {
    option.style.pointerEvents = "none";
    if (option.textContent === correctAnswer) {
      option.style.backgroundColor = "lightgreen";
    } else if (option === selectedOption && !isCorrect) {
      option.style.backgroundColor = "lightcoral";
      option.classList.add("shake");
      setTimeout(() => option.classList.remove("shake"), 500);
    }
  });

  if (isCorrect) {
    score++;
    streak++;
    playSound("correct-sound");
  } else {
    streak = 0;
    playSound("wrong-sound");
    showTip(tip);
  }

  displayScore();
  updateStreak();
  answered = true;
  document.getElementById("next-question").disabled = false;
}

function showTip(tip) {
  if (!tip) return;
  const feedback = document.getElementById("feedback");
  feedback.style.display = "block";
  feedback.textContent = `Risposta corretta: ${tip}`;
}

function playSound(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}

function displayScore() {
  document.getElementById("score").textContent = `Punteggio: ${score}`;
}

function updateStreak() {
  document.getElementById("streak").textContent = `🔥 Streak: ${streak}`;
}

function updateProgress() {
  const total = Math.min(20, questionsData[currentTopic]?.length || 1);
  const progressPercent = ((currentQuestionIndex) / total) * 100;
  document.getElementById("progress-fill").style.width = `${progressPercent}%`;
}

function nextQuestion() {
  if (!answered) {
    alert("Seleziona una risposta prima di andare alla prossima domanda.");
    return;
  }

  currentQuestionIndex++;
  showQuestion();
}

function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function startTimer() {
  clearInterval(quizTimer);
  updateTimerDisplay();
  quizTimer = setInterval(() => {
    remainingTime--;
    updateTimerDisplay();
    if (remainingTime <= 0) {
      clearInterval(quizTimer);
      alert("Tempo scaduto!");
      endQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  document.getElementById("timer").textContent = `Tempo rimasto: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function endQuiz() {
  clearInterval(quizTimer);
  document.getElementById("quiz-page").style.display = "none";
  document.getElementById("summary-page").style.display = "block";

  const summary = document.getElementById("summary-container");
  const total = Math.min(20, questionsData[currentTopic]?.length || 0);
  const points = score * 0.5;
  const vote = Math.min(10, Math.max(1, Math.round((points / total) * 10)));

  summary.innerHTML = `
    <p>Hai risposto a ${currentQuestionIndex} domande.</p>
    <p>Punteggio totale: ${points.toFixed(1)} punti.</p>
    <p>Voto finale: ${vote} / 10</p>
  `;
}
