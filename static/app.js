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
  if (listContainer) listContainer.innerHTML = "";

  const scrollTabsContainer = document.getElementById("topic-scroll-tabs");
  if (scrollTabsContainer) scrollTabsContainer.innerHTML = "";

  let totalCompleted = 0;
  lessons.forEach((lesson, index) => {
    const isCompleted = userProgress[lesson.id] === true;
    if (isCompleted) totalCompleted++;

    const activeClass = index === currentLessonIndex ? "active" : "";
    const completedClass = isCompleted ? "completed" : "";

    // 1. Populate Vertical Sidebar Item
    if (listContainer) {
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
      });
      listContainer.appendChild(item);
    }

    // 2. Populate Top Horizontal Scroll Tab Pill
    if (scrollTabsContainer) {
      const tab = document.createElement("button");
      tab.className = `topic-tab-pill ${activeClass} ${completedClass}`;
      tab.innerHTML = `
        <span class="tab-pill-icon">${isCompleted ? '✓' : index + 1}</span>
        <span class="tab-pill-title">${lesson.title}</span>
      `;
      tab.addEventListener("click", () => {
        currentLessonIndex = index;
        renderLesson();
      });
      scrollTabsContainer.appendChild(tab);
    }
  });

  // Auto scroll active tab pill into view
  if (scrollTabsContainer) {
    const activeTab = scrollTabsContainer.querySelector(".topic-tab-pill.active");
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  // Scroll active sidebar item into view
  if (listContainer) {
    const activeItem = listContainer.querySelector(".topic-item.active");
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

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

  // Set Code Editor values
  const codeEditor = document.getElementById("lesson-code-editor");
  if (codeEditor) {
    codeEditor.value = lesson.initialCode;
  }
  const filenameEl = document.getElementById("sandbox-filename");
  if (filenameEl) {
    filenameEl.textContent = lesson.id + ".py (Python WASM)";
  }

  // Clear Terminal Output
  const terminalOutput = document.getElementById("terminal-output");
  if (terminalOutput) {
    terminalOutput.innerHTML = `<span class="terminal-placeholder">Click "▶️ Run Code" to execute Python code and view output here...</span>`;
  }

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
    playSoundEffect("correct");
    userProgress[lesson.id] = true;
    saveProgress();
    renderSidebar();
    showToast();
  } else {
    playSoundEffect("incorrect");
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
    
    // Remove typing indicator & show reply with RAG context badge if present
    chatbotMessages.removeChild(indicator);
    appendMessage(data.reply, "bot", data.source);
  } catch (err) {
    console.error("Chat API error:", err);
    chatbotMessages.removeChild(indicator);
    appendMessage("Aiyo! Chitti RAG memory error crash aayiduche! Python backend-a restart panni paarunga! 🤖🔴", "bot");
  }
}

function appendMessage(text, sender, source = null) {
  const msg = document.createElement("div");
  msg.className = `chat-message ${sender}`;
  let content = `<div class="message-bubble">${text}`;
  if (source) {
    content += `<div style="font-size: 0.72rem; color: #a78bfa; margin-top: 0.4rem; padding-top: 0.3rem; border-top: 1px solid rgba(255,255,255,0.1); font-weight: 600;">📚 Retrieved Context: ${source}</div>`;
  }
  content += `</div>`;
  msg.innerHTML = content;
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

/* ==========================================================================
   Pyodide WASM Python Engine & Interactive Playground Logic
   ========================================================================== */

let pyodideInstance = null;
let isPyodideLoading = false;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function initPyodideEngine() {
  if (pyodideInstance || isPyodideLoading) return;
  const statusBadge = document.getElementById("pyodide-status");
  if (!statusBadge) return;

  isPyodideLoading = true;
  statusBadge.className = "pyodide-status-badge";
  statusBadge.textContent = "⏳ Loading Python WASM...";

  try {
    if (typeof loadPyodide === "function") {
      pyodideInstance = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
      });
      statusBadge.className = "pyodide-status-badge ready";
      statusBadge.textContent = "⚡ Engine Ready";
    } else {
      statusBadge.className = "pyodide-status-badge error";
      statusBadge.textContent = "⚠️ Offline Mode";
    }
  } catch (err) {
    console.error("Pyodide loading error:", err);
    statusBadge.className = "pyodide-status-badge error";
    statusBadge.textContent = "❌ WASM Load Error";
  } finally {
    isPyodideLoading = false;
  }
}

async function runPythonCode() {
  const codeEditor = document.getElementById("lesson-code-editor");
  const terminalOutput = document.getElementById("terminal-output");
  const runBtn = document.getElementById("btn-run-code");
  if (!codeEditor || !terminalOutput) return;

  const code = codeEditor.value;
  if (!code.trim()) {
    terminalOutput.innerHTML = `<span class="terminal-output-error">Aiyo! Code area empty-a iruku boss! Type something first! 😅</span>`;
    return;
  }

  if (!pyodideInstance) {
    terminalOutput.innerHTML = `<span class="terminal-placeholder">⏳ Initializing Python WASM engine... First load takes a few seconds...</span>`;
    await initPyodideEngine();
    if (!pyodideInstance) {
      terminalOutput.innerHTML = `<span class="terminal-output-error">❌ Could not load Pyodide engine. Check network connection!</span>`;
      return;
    }
  }

  runBtn.disabled = true;
  runBtn.textContent = "⏳ Running...";

  try {
    // Setup stdout / stderr capture streams inside Python runtime
    await pyodideInstance.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

    // Execute user code in WASM sandbox
    await pyodideInstance.runPythonAsync(code);

    // Retrieve printed outputs
    const stdout = await pyodideInstance.runPythonAsync(`sys.stdout.getvalue()`);
    const stderr = await pyodideInstance.runPythonAsync(`sys.stderr.getvalue()`);

    let resultHTML = "";
    if (stdout) {
      resultHTML += `<span class="terminal-output-text">${escapeHtml(stdout)}</span>`;
    }
    if (stderr) {
      resultHTML += `${stdout ? "\n" : ""}<span class="terminal-output-error">${escapeHtml(stderr)}</span>`;
    }
    if (!stdout && !stderr) {
      resultHTML = `<span class="terminal-placeholder">Code executed cleanly with no output. (Tip: Use print() to display values!)</span>`;
    }

    // Output check against expectedOutput
    const currentLesson = lessons[currentLessonIndex];
    if (currentLesson && currentLesson.expectedOutput && stdout) {
      const cleanActual = stdout.trim();
      const cleanExpected = currentLesson.expectedOutput.trim();
      if (cleanActual === cleanExpected) {
        playSoundEffect("success");
        resultHTML += `\n\n<span class="terminal-output-success">🎉 Vadivelu Praise: "Ahaaa! Correct output get pannitiye pa!"</span>`;
        showToast("Mass-u boss! Live execution match aayiduchu! 🎉");
      }
    }

    terminalOutput.innerHTML = resultHTML;
  } catch (err) {
    let cleanErr = err.message || String(err);
    if (cleanErr.includes("PythonError:")) {
      cleanErr = cleanErr.split("PythonError:")[1].trim();
    }
    terminalOutput.innerHTML = `<span class="terminal-output-error">🐍 Python Error Traceback:\n${escapeHtml(cleanErr)}</span>`;
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = "▶️ Run Code";
  }
}

function resetPythonCode() {
  const currentLesson = lessons[currentLessonIndex];
  if (!currentLesson) return;

  const codeEditor = document.getElementById("lesson-code-editor");
  if (codeEditor) {
    codeEditor.value = currentLesson.initialCode;
  }

  const terminalOutput = document.getElementById("terminal-output");
  if (terminalOutput) {
    terminalOutput.innerHTML = `<span class="terminal-placeholder">Code reset to original snippet. Click "▶️ Run Code" to execute.</span>`;
  }
}

// Enable Tab Key indents in Code Editor
const codeEditorInput = document.getElementById("lesson-code-editor");
if (codeEditorInput) {
  codeEditorInput.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = codeEditorInput.selectionStart;
      const end = codeEditorInput.selectionEnd;
      codeEditorInput.value = codeEditorInput.value.substring(0, start) + "    " + codeEditorInput.value.substring(end);
      codeEditorInput.selectionStart = codeEditorInput.selectionEnd = start + 4;
    }
  });
}

// Bind Code Runner controls
const runCodeBtn = document.getElementById("btn-run-code");
if (runCodeBtn) {
  runCodeBtn.addEventListener("click", runPythonCode);
}

const resetCodeBtn = document.getElementById("btn-reset-code");
if (resetCodeBtn) {
  resetCodeBtn.addEventListener("click", resetPythonCode);
}

const clearTerminalBtn = document.getElementById("btn-clear-terminal");
if (clearTerminalBtn) {
  clearTerminalBtn.addEventListener("click", () => {
    const terminalOutput = document.getElementById("terminal-output");
    if (terminalOutput) {
      terminalOutput.innerHTML = `<span class="terminal-placeholder">Terminal output cleared. Click "▶️ Run Code" to execute.</span>`;
    }
  });
}

// Pre-load Pyodide lazily when opening Learn view
const originalShowView = showView;
showView = function(viewId) {
  originalShowView(viewId);
  if (viewId === "view-learn") {
    initPyodideEngine();
  }
};

/* ==========================================================================
   Sound Effects Synthesizer (Web Audio API)
   ========================================================================== */

function playSoundEffect(type) {
  const soundToggle = document.getElementById("toggle-sound-fx");
  if (soundToggle && !soundToggle.checked) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "correct" || type === "success") {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.22);
      });
    } else if (type === "incorrect") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch (e) {
    // Audio context allowed after user interaction
  }
}

/* ==========================================================================
   Options & Settings Modal Logic
   ========================================================================== */

function populateQuickTopicSelect() {
  const select = document.getElementById("quick-topic-select");
  if (!select) return;
  select.innerHTML = "";
  lessons.forEach((l, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `${l.indicator}: ${l.title}`;
    select.appendChild(opt);
  });
}

const optionsOverlay = document.getElementById("options-modal-overlay");
const btnOpenMenu = document.getElementById("btn-open-menu");
const btnCloseMenu = document.getElementById("options-modal-close");

function openOptionsModal() {
  populateQuickTopicSelect();
  const select = document.getElementById("quick-topic-select");
  if (select) select.value = currentLessonIndex;
  if (optionsOverlay) optionsOverlay.classList.add("active");
}

function closeOptionsModal() {
  if (optionsOverlay) optionsOverlay.classList.remove("active");
}

if (btnOpenMenu) btnOpenMenu.addEventListener("click", openOptionsModal);
if (btnCloseMenu) btnCloseMenu.addEventListener("click", closeOptionsModal);

if (optionsOverlay) {
  optionsOverlay.addEventListener("click", (e) => {
    if (e.target === optionsOverlay) closeOptionsModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && optionsOverlay && optionsOverlay.classList.contains("active")) {
    closeOptionsModal();
  }
});

const quickSelect = document.getElementById("quick-topic-select");
if (quickSelect) {
  quickSelect.addEventListener("change", (e) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx) && idx >= 0 && idx < lessons.length) {
      currentLessonIndex = idx;
      renderLesson();
      showView("view-learn");
      closeOptionsModal();
    }
  });
}

const btnResetProgress = document.getElementById("btn-reset-progress");
if (btnResetProgress) {
  btnResetProgress.addEventListener("click", () => {
    if (confirm("Reset all your learning progress? This will clear completion checkmarks for all topics.")) {
      userProgress = {};
      saveProgress();
      renderSidebar();
      showToast("Progress reset cleanly! Start fresh! 🔄");
      closeOptionsModal();
    }
  });
}

// Add Ctrl + Enter shortcut to Code Editor
if (codeEditorInput) {
  codeEditorInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runPythonCode();
    }
  });
}

/* ==========================================================================
   Daily Streak Tracker & Tamil Meme Response Logic
   ========================================================================== */

let streakData = { count: 0, lastClaimDate: "" };

function loadStreakData() {
  const saved = localStorage.getItem("python_kadhai_streak_data");
  if (saved) {
    try {
      streakData = JSON.parse(saved);
    } catch(e) {
      streakData = { count: 0, lastClaimDate: "" };
    }
  }
}

function saveStreakData() {
  localStorage.setItem("python_kadhai_streak_data", JSON.stringify(streakData));
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayDateString() {
  const d = new Date(Date.now() - 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderStreakWidget() {
  loadStreakData();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const countDisplay = document.getElementById("streak-count-display");
  const claimBtn = document.getElementById("btn-claim-streak");
  const statusText = document.getElementById("streak-status-text");
  const memeBox = document.getElementById("streak-meme-box");

  if (!countDisplay || !claimBtn || !memeBox) return;

  const isClaimedToday = streakData.lastClaimDate === todayStr;
  const isContinuous = streakData.lastClaimDate === yesterdayStr || isClaimedToday;

  let currentStreak = streakData.count;
  let isBroken = false;

  if (!isClaimedToday && !isContinuous && streakData.lastClaimDate !== "") {
    // Missed a day!
    isBroken = true;
  }

  countDisplay.textContent = currentStreak > 0 ? currentStreak : 1;

  if (isClaimedToday) {
    claimBtn.textContent = "✓ Streak Claimed Today!";
    claimBtn.classList.add("claimed");
    claimBtn.disabled = true;
    if (statusText) statusText.textContent = "Great job! You maintained your streak for today! Come back tomorrow 🔥";
  } else {
    claimBtn.textContent = "🔥 Claim Today's Streak";
    claimBtn.classList.remove("claimed");
    claimBtn.disabled = false;
    if (statusText) statusText.textContent = isBroken ? "Streak reset! Claim today to start your new streak!" : "Claim today's check-in to keep your coding streak alive!";
  }

  // Generate Tamil Meme Response
  let actorEmoji = "😎";
  let headline = "";
  let text = "";

  if (isBroken) {
    actorEmoji = "😭";
    headline = "Vadivelu: \"Aiyo Streak Cut Aayiduchu!\"";
    text = "\"Oru naal break eduthadhula streak cut aayiduchu da swami! Kavalai padadhe, innaikula irundhu fresh-a arambipom!\"";
  } else if (currentStreak <= 1) {
    actorEmoji = "😎";
    headline = "Vadivelu: \"Arambichutanya Arambichutan!\"";
    text = "\"Day 1 Python coding streak start panniyaachu! Daily vandhu code panni mass pannu!\"";
  } else if (currentStreak <= 3) {
    actorEmoji = "🔥";
    headline = "Goundamani: \"3 Naal Thodarnthu Code Panriya da!\"";
    text = "\"Oru ruba kooda kuraiyama " + currentStreak + " days streak maintaining! Singam maadhiri irukaye pa!\"";
  } else if (currentStreak <= 6) {
    actorEmoji = "🏆";
    headline = "Vivekh: \"Aanandam... Vilaiyaadum Veedu!\"";
    text = "\"Indha " + currentStreak + " days coding streak-a paathaale kannula thanneer varudhu pa! Keep leveling up!\"";
  } else {
    actorEmoji = "🤖";
    headline = "Chitti 2.0: \"Speed 1 Terahertz, Memory 1 Zettabyte!\"";
    text = "\"Continuous " + currentStreak + " Days Streak! Unna thadukka yaaralum mudiyaadhu! Absolute Legend!\"";
  }

  memeBox.innerHTML = `
    <div class="streak-meme-actor">${actorEmoji}</div>
    <div class="streak-meme-content">
      <div class="streak-meme-headline">${headline}</div>
      <div class="streak-meme-text">${text}</div>
    </div>
  `;
}

function handleClaimStreak() {
  loadStreakData();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  if (streakData.lastClaimDate === todayStr) return;

  if (streakData.lastClaimDate === yesterdayStr) {
    streakData.count = (streakData.count || 0) + 1;
  } else {
    streakData.count = 1;
  }
  streakData.lastClaimDate = todayStr;
  saveStreakData();

  // Log activity date for Monthly Heatmap
  logTodayActivity();

  playSoundEffect("correct");
  showToast("🔥 Daily Streak Claimed! Keep Coding!");
  renderStreakWidget();
  renderMonthlyAnalytics();
}

// Bind Claim Streak button
const claimStreakBtn = document.getElementById("btn-claim-streak");
if (claimStreakBtn) {
  claimStreakBtn.addEventListener("click", handleClaimStreak);
}

// Initialize Streak Widget on startup
renderStreakWidget();

/* ==========================================================================
   Monthly Activity Log & Heatmap Analytics Renderer
   ========================================================================== */

let activityLog = {};

function loadActivityLog() {
  const saved = localStorage.getItem("python_kadhai_activity_log");
  if (saved) {
    try {
      activityLog = JSON.parse(saved);
    } catch(e) {
      activityLog = {};
    }
  }
}

function saveActivityLog() {
  localStorage.setItem("python_kadhai_activity_log", JSON.stringify(activityLog));
}

function logTodayActivity() {
  loadActivityLog();
  const todayStr = getTodayDateString();
  activityLog[todayStr] = true;
  saveActivityLog();
}

function renderMonthlyAnalytics() {
  loadActivityLog();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0..11

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[month] + " " + year;

  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0..Sunday=6

  const monthNameEl = document.getElementById("monthly-month-name");
  if (monthNameEl) monthNameEl.textContent = currentMonthName;

  const todayDateNum = now.getDate();
  let activeDaysCount = 0;

  // Count active days in current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (activityLog[dayStr]) {
      activeDaysCount++;
    }
  }

  // Always mark today as logged if streak claimed or active
  const todayStr = getTodayDateString();
  if (streakData.lastClaimDate === todayStr && !activityLog[todayStr]) {
    logTodayActivity();
    activeDaysCount++;
  }

  const consistencyRate = Math.round((activeDaysCount / daysInMonth) * 100);

  const activeDaysEl = document.getElementById("monthly-active-days");
  if (activeDaysEl) activeDaysEl.textContent = `${activeDaysCount} / ${daysInMonth}`;

  const scorePercentEl = document.getElementById("monthly-score-percent");
  if (scorePercentEl) scorePercentEl.textContent = `${consistencyRate}%`;

  const consistencyBadge = document.getElementById("monthly-consistency-badge");
  if (consistencyBadge) consistencyBadge.textContent = `${consistencyRate}% Consistency`;

  const peakStreakEl = document.getElementById("monthly-peak-streak");
  if (peakStreakEl) peakStreakEl.textContent = `${Math.max(streakData.count || 1, activeDaysCount)} Days`;

  // Populate Calendar Grid
  const calendarGrid = document.getElementById("monthly-calendar-grid");
  if (calendarGrid) {
    calendarGrid.innerHTML = "";

    // Empty offset padding cells
    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "calendar-day-cell empty";
      calendarGrid.appendChild(emptyCell);
    }

    // Day cells (1..N)
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isActive = activityLog[dayStr] === true;
      const isToday = day === todayDateNum;

      const dayCell = document.createElement("div");
      dayCell.className = `calendar-day-cell ${isActive ? 'active-day' : ''} ${isToday ? 'today' : ''}`;
      dayCell.setAttribute("title", `${monthNames[month]} ${day}, ${year} ${isActive ? '(Active 🔥)' : ''}`);

      dayCell.innerHTML = `
        <span>${day}</span>
        ${isActive ? '<span class="calendar-day-icon">🔥</span>' : ''}
      `;
      calendarGrid.appendChild(dayCell);
    }
  }

  // Monthly Tamil Meme Evaluation
  const memeBox = document.getElementById("monthly-meme-box");
  if (memeBox) {
    let actorEmoji = "🤖";
    let headline = "";
    let text = "";

    if (consistencyRate >= 70) {
      actorEmoji = "🤖";
      headline = "Chitti 2.0: \"Speed 1 Terahertz! Absolute Legend!\"";
      text = "\"Monthly consistency score top-notch-a iruku! Continuous coding monster-a irukaye pa!\"";
    } else if (consistencyRate >= 35) {
      actorEmoji = "😂";
      headline = "Vivekh: \"Nalla Consistency Pa! Target 100%-ku Polam!\"";
      text = "\"Monthly active days nalla count-la iruku. Innum konjam focus panna Rajini range-ku polaam!\"";
    } else {
      actorEmoji = "😅";
      headline = "Vadivelu: \"Enna Da Month-la Adikkadi Leave Eduthuruka?\"";
      text = "\"Aahaa, monthly frequency konjam kammi-a irukaye da swami! Next month-la irundhu full form-ku vaa!\"";
    }

    memeBox.innerHTML = `
      <div class="monthly-meme-actor">${actorEmoji}</div>
      <div class="monthly-meme-content">
        <div class="monthly-meme-headline">${headline}</div>
        <div class="monthly-meme-text">${text}</div>
      </div>
    `;
  }
}

// Log activity on initial load
logTodayActivity();

// Initialize Monthly Analytics on startup
renderMonthlyAnalytics();




