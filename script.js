let score = 0;
let streak = 0;
let attemptedQuestions = [];
let currentTopic = "";
let answered = false;
let questionsData = {};
let quizTimer;
let remainingTime = 300; // 5 minuti
let allQuestionsAnswered = false;

// Carica domande da file JSON esterno (questions.json)
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
  attemptedQuestions = [];
  currentTopic = "";
  answered = false;
  allQuestionsAnswered = false;
  remainingTime = 300;
  updateTimerDisplay();
  document.getElementById("feedback").style.display = "none";
  document.getElementById("progress-fill").style.width = `0%`;
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
  fetchQuestion();
  startTimer();
}

function getRandomTopic() {
  const keys = Object.keys(questionsData);
  return keys[Math.floor(Math.random() * keys.length)];
}

function fetchQuestion() {
  const topicQuestions = questionsData[currentTopic];
  if (!topicQuestions) {
    alert("Nessuna domanda disponibile per questo argomento.");
    return;
  }

  const unansweredQuestions = topicQuestions.filter((_, i) => !attemptedQuestions.includes(i));

  if (unansweredQuestions.length === 0) {
    allQuestionsAnswered = true;
    endQuiz();
    return;
  }

  // Prendi una domanda casuale non ancora tentata
  const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
  const questionIndex = topicQuestions.indexOf(unansweredQuestions[randomIndex]);

  displayQuestion(topicQuestions[questionIndex], questionIndex);
  updateProgress();
  answered = false;
}

function displayQuestion(questionData, index) {
  const questionContainer = document.getElementById("question");
  const optionsContainer = document.getElementById("options");
  const feedback = document.getElementById("feedback");

  questionContainer.textContent = questionData.question;
  optionsContainer.innerHTML = "";
  feedback.style.display = "none";
  feedback.textContent = "";

  // Mescola le opzioni
  const shuffledOptions = shuffleArray([...questionData.options]);

  shuffledOptions.forEach(option => {
    const li = document.createElement("li");
    li.textContent = option;
    li.onclick = () => handleAnswer(li, questionData.answer, questionData.tip, index);
    li.title = questionData.tip || "";
    optionsContainer.appendChild(li);
  });
}

function handleAnswer(selectedOption, correctAnswer, tip, questionIndex) {
  if (answered) return; // previeni doppio click

  const options = document.querySelectorAll("#options li");
  const isCorrect = selectedOption.textContent === correctAnswer;

  options.forEach(option => {
    option.style.pointerEvents = "none"; // disabilita tutte le opzioni
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

  attemptedQuestions.push(questionIndex);
  displayScore();
  updateStreak();
  answered = true;
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
  const total = questionsData[currentTopic]?.length || 1;
  const progressPercent = (attemptedQuestions.length / total) * 100;
  document.getElementById("progress-fill").style.width = `${progressPercent}%`;
}

function nextQuestion() {
  if (!answered) {
    alert("Seleziona una risposta prima di andare alla prossima domanda.");
    return;
  }
  fetchQuestion();
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
  const totalQuestions = questionsData[currentTopic]?.length || 0;
  const points = score * 0.5;
  const vote = Math.min(10, Math.max(1, Math.round((points / totalQuestions) * 10)));

  summary.innerHTML = `
    <p>Hai risposto a ${attemptedQuestions.length} domande.</p>
    <p>Punteggio totale: ${points.toFixed(1)} punti.</p>
    <p>Voto finale: ${vote} / 10</p>
  `;
}
