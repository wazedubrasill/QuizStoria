let score = 0;
let streak = 0;
let attemptedQuestions = [];
let currentTopic = "present-simple";
let answered = false;
let questionsData = {};
let quizTimer;
let remainingTime = 300;
let allQuestionsAnswered = false;

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to load questions.", error);
        return {};
    }
}

loadQuestions().then(data => {
    questionsData = data;
});

function toggleDarkMode() {
    const sun = document.getElementById("dark-mode-toggle");
    document.body.classList.toggle("dark-mode");
    sun.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
}

function startQuiz(topic) {
    currentTopic = topic === 'random' ? getRandomTopic() : topic;
    score = 0;
    streak = 0;
    attemptedQuestions = [];
    allQuestionsAnswered = false;
    document.getElementById("home-page").style.display = "none";
    document.getElementById("quiz-page").style.display = "block";
    document.getElementById("quiz-title").textContent = `Quiz di storia romana - ${currentTopic.replace("-", " ")}`;
    displayScore();
    updateStreak();
    updateProgress();
    fetchQuestion(currentTopic);
    startTimer();
}

function getRandomTopic() {
    const keys = Object.keys(questionsData);
    return keys[Math.floor(Math.random() * keys.length)];
}

function fetchQuestion(topic) {
    const topicQuestions = questionsData[topic];
    const unansweredQuestions = topicQuestions.filter((q, index) =>
        !attemptedQuestions.some(attempt => attempt.index === index)
    );

    if (unansweredQuestions.length === 0) {
        allQuestionsAnswered = true;
        endQuiz();
        return;
    }

    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    const randomQuestion = unansweredQuestions[randomIndex];
    const questionIndex = topicQuestions.indexOf(randomQuestion);
    randomQuestion.index = questionIndex;

    displayQuestion(randomQuestion);
    updateProgress();
}

function displayQuestion(questionData) {
    const questionContainer = document.getElementById("question");
    const optionsContainer = document.getElementById("options");

    const { question, options, answer, tip, index } = questionData;

    questionContainer.textContent = question;
    optionsContainer.innerHTML = "";
    resetOptions();

    shuffleArray(options).forEach(option => {
        const li = document.createElement("li");
        li.textContent = option;
        li.onclick = () => handleAnswer(li, answer, tip, index);
        li.title = tip || "";
        optionsContainer.appendChild(li);
    });
}

function handleAnswer(selectedOption, correctAnswer, tip, questionIndex) {
    const allOptions = document.querySelectorAll("#options li");
    const isCorrect = selectedOption.textContent === correctAnswer;

    allOptions.forEach(option => {
        if (option.textContent === correctAnswer) {
            if (document.body.classList.contains("dark-mode")){
                option.style.backgroundColor = "darkgreen";
            }
            else{
                option.style.backgroundColor = "lightgreen";
            }
        } 
        else if (option === selectedOption && !isCorrect) {
            if (document.body.classList.contains("dark-mode")){
                option.style.backgroundColor = "darkred";
            }
            else{
                option.style.backgroundColor = "lightcoral";
            }
            option.classList.add("shake");
            setTimeout(() => option.classList.remove("shake"), 500);
        }
    });

    if (isCorrect) {
        score++;
        streak++;
        launchConfetti();
        document.getElementById("correct-sound").play();
    } else {
        streak = 0;
        document.getElementById("wrong-sound").play();
        showTip(tip);
    }

    const existing = attemptedQuestions.find(q => q.index === questionIndex);
    if (existing) {
        existing.userAnswer = selectedOption.textContent;
    } else {
        attemptedQuestions.push({ index: questionIndex, userAnswer: selectedOption.textContent });
    }

    disableOptions();
    displayScore();
    updateStreak();
    answered = true;
}

function showTip(tip) {
    const feedback = document.getElementById("feedback");
    feedback.style.display = "block";
    feedback.textContent = `Risposta: ${tip || "Ripeti!"}`;
}

function disableOptions() {
    document.querySelectorAll("#options li").forEach(option => option.style.pointerEvents = "none");
}

function resetOptions() {
    const feedback = document.getElementById("feedback");
    feedback.style.display = "none";
    feedback.textContent = "";
    document.querySelectorAll("#options li").forEach(option => {
        option.style.backgroundColor = "";
        option.style.pointerEvents = "auto";
    });
}

function displayScore() {
    document.getElementById("score").textContent = "Score: " + score;
}

function updateStreak() {
    document.getElementById("streak").textContent = `🔥 Streak: ${streak}`;
}

function updateProgress() {
    const total = questionsData[currentTopic]?.length || 1;
    const progressPercent = (attemptedQuestions.length / total) * 100;
    document.getElementById("progress-fill").style.width = `${progressPercent}%`;
}

function idk() {
    if (!answered) {
        alert("Please select an answer before moving to the next question.");
        return;
    }
    answered = false;
    fetchQuestion(currentTopic);
}

function shuffleArray(array) {
    return array.map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

function launchConfetti() {
    const confettiCount = 40;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        document.body.appendChild(confetti);

        const startX = window.innerWidth / 2;
        const startY = window.innerHeight - 30;
        const xOffset = Math.random() * 600 - 300;
        const yOffset = Math.random() * -window.innerHeight * 0.9;

        confetti.style.left = `${startX}px`;
        confetti.style.top = `${startY}px`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;

        confetti.animate([{
            transform: 'translate(0, 0)',
            opacity: 1
        }, {
            transform: `translate(${xOffset}px, ${yOffset}px)`,
            opacity: 0
        }], {
            duration: 1300 + Math.random() * 500,
            easing: 'ease-out',
            fill: 'forwards'
        });

        setTimeout(() => confetti.remove(), 2000);
    }
}

function startTimer() {
    quizTimer = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();

        if (remainingTime <= 0 || allQuestionsAnswered) {
            clearInterval(quizTimer);
            endQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById("timer");
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerDisplay.textContent = `Time: ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}


function endMessage() {
    const rightAnswers = attemptedQuestions.filter(({ index, userAnswer }) =>
        questionsData[currentTopic][index].answer === userAnswer
    );

    const correctCount = rightAnswers.length;
    const total = questionsData[currentTopic]?.length || 0;
    let message = "";

    if (correctCount < 3) {
        message = "Hai bisogno di ripetere.";
    } 
    else if (correctCount < 6) {
        message = "Bene, ma ripeti un po' di più.";
    } 
    else if (correctCount < 8) {
        message = "Fantastico!";
    } 
    else if (correctCount === total) {
        message = "Hai risposto a tutte le domande correttamente, Perfetto!";
    } 
    else {
        message = "Bene!";
    }

    return message;
}
function endQuiz() {
    document.getElementById("quiz-page").style.display = "none";
    document.getElementById("summary-page").style.display = "block";

    const summaryContainer = document.getElementById("summary-container");
    summaryContainer.innerHTML = "";

    const topicQuestions = questionsData[currentTopic];

    attemptedQuestions.forEach(({ index, userAnswer }) => {
        const questionData = topicQuestions[index];
        const { question, answer } = questionData;
        const isCorrect = userAnswer === answer;

        const result = document.createElement("div");
        result.classList.add("question-result");

        result.innerHTML = `
            <p><strong>${question}</strong></p>
            <p>Your answer: <span style="color:${isCorrect ? 'green' : 'red'}">${userAnswer}</span></p>
            <p>Correct answer: <span style="color:green">${answer}</span></p>
        `;

        summaryContainer.appendChild(result);
    });

    const finalScore = document.createElement("div");
    const messageBox = document.createElement("div");
    finalScore.innerHTML = `
        <p><strong>Final Score: ${score}/${topicQuestions.length}</strong></p>
        <p><strong>Streak: ${streak}</strong></p>
    `;
    messageBox.innerHTML = `<p>${endMessage()}</p>`;
    summaryContainer.appendChild(finalScore);
    summaryContainer.appendChild(messageBox);
}

function showRules() {
    document.getElementById("home-page").style.display = "none";
    document.getElementById("quiz-page").style.display = "none";
    document.getElementById("rules-page").style.display = "block";
}

function goHome() {
    document.getElementById("rules-page").style.display = "none";
    document.getElementById("home-page").style.display = "block";
}

function toggleRuleSection(topicId) {
    const rule = document.getElementById(`rule-${topicId}`);
    rule.style.display = rule.style.display === "block" ? "none" : "block";
}
