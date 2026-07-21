// Python Kadhai - Client-Side App Logic (Django Backend Integrated)

// App State
let lessons = [];
let currentLessonIndex = 0;
let userProgress = {}; // key: lessonId -> boolean (completed)

// Load State from LocalStorage
function loadProgress() {
  const saved = localStorage.getItem("python_kadhai_progress");
  if (saved) {
    try {
      userProgress = JSON.parse(saved);
    } catch(e) {
      userProgress = {};
    }
  }
}

function saveProgress() {
  localStorage.setItem("python_kadhai_progress", JSON.stringify(userProgress));
}

// Fetch lessons database from Python Backend API
async function fetchLessons() {
  try {
    const res = await fetch('/api/lessons');
    lessons = await res.json();
    if (lessons.length > 0) {
      renderLesson();
    }
  } catch (err) {
    console.error("Failed to load lessons from backend API:", err);
  }
}

// Navigation & Screen switching
function showView(viewId) {
  document.querySelectorAll(".view-section").forEach(view => {
    view.classList.remove("active");
  });
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  const activeView = document.getElementById(viewId);
  activeView.classList.add("active");

  if (viewId === "view-learn") {
    document.getElementById("sidebar-tracker").style.display = "flex";
    document.getElementById("nav-learn").classList.add("active");
    if (lessons.length === 0) {
      fetchLessons();
    } else {
      renderLesson();
    }
  } else {
    document.getElementById("sidebar-tracker").style.display = "none";
    if (viewId === "view-home") {
      document.getElementById("nav-home").classList.add("active");
    }
  }
}

// UI Rendering Functions
function renderSidebar() {
  const listContainer = document.getElementById("topic-navigation-list");
  listContainer.innerHTML = "";

  let totalCompleted = 0;
  lessons.forEach((lesson, index) => {
    const isCompleted = userProgress[lesson.id] === true;
    if (isCompleted) totalCompleted++;

    const activeClass = index === currentLessonIndex ? "active" : "";
    const completedClass = isCompleted ? "completed" : "";

    const item = document.createElement("div");
    item.className = `topic-item ${activeClass} ${completedClass}`;
    item.innerHTML = `
      <div class="topic-icon">${isCompleted ? '✓' : index + 1}</div>
      <div class="topic-details">
        <div class="topic-title">${lesson.title}</div>
        <div class="topic-subtitle">${lesson.indicator}</div>
      </div>
    `;
    item.addEventListener("click", () => {
      currentLessonIndex = index;
      renderLesson();
      document.querySelectorAll(".topic-item").forEach(t => t.classList.remove("active"));
      item.classList.add("active");
    });
    listContainer.appendChild(item);
  });

  const percent = lessons.length ? Math.round((totalCompleted / lessons.length) * 100) : 0;
  document.getElementById("overall-progress-text").textContent = percent + "%";
  document.getElementById("overall-progress-bar").style.width = percent + "%";
}

function renderLesson() {
  if (lessons.length === 0) return;
  
  const lesson = lessons[currentLessonIndex];
  
  // Render Lesson Content Card
  const contentCard = document.getElementById("lesson-content-card");
  contentCard.innerHTML = `
    <div class="lesson-header">
      <span class="lesson-topic-indicator">${lesson.indicator}</span>
      <h2 class="lesson-title-text">${lesson.title}</h2>
      <p style="color: var(--text-muted); margin-top: 0.25rem;">${lesson.subtitle}</p>
    </div>
    <div class="explanation-box">
      <div class="exp-panel tanglish">
        <span class="exp-label">Tanglish Explanations</span>
        <p class="exp-text">${lesson.tanglishExp}</p>
      </div>
      <div class="exp-panel english">
        <span class="exp-label">English Explanations</span>
        <p class="exp-text">${lesson.englishExp}</p>
      </div>
    </div>
  `;

  // Set Code Display values
  document.getElementById("lesson-code-display").textContent = lesson.initialCode;
  document.getElementById("sandbox-filename").textContent = lesson.id + ".py";

  // Hide feedback container
  const feedbackContainer = document.getElementById("meme-feedback-container");
  feedbackContainer.classList.remove("active", "correct-feedback", "incorrect-feedback");
  feedbackContainer.innerHTML = "";

  // Render Quiz questions
  const quizPanel = document.getElementById("quiz-panel");
  quizPanel.innerHTML = `
    <h3 class="quiz-question">${lesson.quiz.question}</h3>
    <div class="quiz-options">
      ${lesson.quiz.options.map((opt, i) => `
        <div class="quiz-option" data-idx="${i}">
          <span>${opt}</span>
        </div>
      `).join('')}
    </div>
  `;

  // Attach Quiz option events
  quizPanel.querySelectorAll(".quiz-option").forEach(opt => {
    opt.addEventListener("click", () => handleQuizSubmission(parseInt(opt.getAttribute("data-idx"), 10)));
  });

  // Manage Prev/Next buttons
  document.getElementById("btn-prev-lesson").disabled = currentLessonIndex === 0;
  document.getElementById("btn-next-lesson").disabled = currentLessonIndex === lessons.length - 1;

  renderSidebar();
}

function handleQuizSubmission(selectedIndex) {
  const lesson = lessons[currentLessonIndex];
  const isCorrect = selectedIndex === lesson.quiz.correctIndex;

  const feedbackContainer = document.getElementById("meme-feedback-container");
  feedbackContainer.innerHTML = "";

  // Highlight selected, correct, and incorrect options
  const options = document.querySelectorAll(".quiz-option");
  options.forEach((opt, idx) => {
    opt.classList.remove("selected", "correct", "incorrect");
    if (idx === selectedIndex) {
      opt.classList.add(isCorrect ? "correct" : "incorrect");
    }
    if (idx === lesson.quiz.correctIndex) {
      opt.classList.add("correct");
    }
  });

  // Setup Feedback container
  feedbackContainer.className = `meme-feedback-box active ${isCorrect ? 'correct-feedback' : 'incorrect-feedback'}`;
  
  const memeInfo = isCorrect ? lesson.quiz.correctMeme : lesson.quiz.incorrectMeme;

  feedbackContainer.innerHTML = `
    <div class="feedback-headline">${memeInfo.headline}</div>
    <div style="margin: 0.5rem 0; font-style: italic; text-align: center;">${memeInfo.text}</div>
    ${memeInfo.svg}
  `;

  if (isCorrect) {
    userProgress[lesson.id] = true;
    saveProgress();
    renderSidebar();
    showToast();
  }
}

function showToast() {
  const toast = document.getElementById("toast-notif");
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3500);
}

// Elements for Chitti
const chatbotWindow = document.getElementById("chatbot-window");
const chatbotToggleBtn = document.getElementById("chatbot-toggle-btn");
const chatbotCloseBtn = document.getElementById("chatbot-close-btn");
const chatbotInput = document.getElementById("chatbot-input");
const chatbotSendBtn = document.getElementById("chatbot-send-btn");
const chatbotMessages = document.getElementById("chatbot-messages");

// Open/Close toggle
chatbotToggleBtn.addEventListener("click", () => {
  chatbotWindow.classList.add("active");
  chatbotToggleBtn.style.display = "none";
});

chatbotCloseBtn.addEventListener("click", () => {
  chatbotWindow.classList.remove("active");
  chatbotToggleBtn.style.display = "flex";
});

// Send message to Python Backend Chitti endpoint
async function handleSendMessage() {
  const text = chatbotInput.value.trim();
  if (!text) return;

  // Append user message
  appendMessage(text, "user");
  chatbotInput.value = "";

  // Append typing indicator
  const indicator = document.createElement("div");
  indicator.className = "chat-message bot typing-indicator-wrapper";
  indicator.innerHTML = `
    <div class="message-bubble">
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  chatbotMessages.appendChild(indicator);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

  // Fetch response from Django chatbot API
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    });
    const data = await response.json();
    
    // Remove typing indicator & show reply
    chatbotMessages.removeChild(indicator);
    appendMessage(data.reply, "bot");
  } catch (err) {
    console.error("Chat API error:", err);
    chatbotMessages.removeChild(indicator);
    appendMessage("Aiyo! Chitti-ku memory error crash aayiduche! Python backend-a restart panni paarunga! 🤖🔴", "bot");
  }
}

function appendMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = `chat-message ${sender}`;
  msg.innerHTML = `<div class="message-bubble">${text}</div>`;
  chatbotMessages.appendChild(msg);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Bind events
chatbotSendBtn.addEventListener("click", handleSendMessage);
chatbotInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSendMessage();
  }
});

// Event Listeners Setup
document.getElementById("nav-home").addEventListener("click", () => showView("view-home"));
document.getElementById("nav-learn").addEventListener("click", () => showView("view-learn"));
document.getElementById("btn-start-now").addEventListener("click", () => showView("view-learn"));

document.getElementById("btn-prev-lesson").addEventListener("click", () => {
  if (currentLessonIndex > 0) {
    currentLessonIndex--;
    renderLesson();
  }
});

document.getElementById("btn-next-lesson").addEventListener("click", () => {
  if (currentLessonIndex < lessons.length - 1) {
    currentLessonIndex++;
    renderLesson();
  }
});

// Initialize App
loadProgress();
fetchLessons();
showView("view-home");

// Theme Toggle Logic
const themeToggleBtn = document.getElementById("theme-toggle-btn");

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggleBtn.textContent = savedTheme === "light" ? "☀️" : "🌙";
}

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeToggleBtn.textContent = newTheme === "light" ? "☀️" : "🌙";
});

// Initialize Theme on startup
initTheme();
