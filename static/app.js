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
    const navLearnMobile = document.getElementById("nav-learn-mobile");
    if(navLearnMobile) navLearnMobile.classList.add("active");
    if (lessons.length === 0) {
      fetchLessons();
    } else {
      renderLesson();
    }
  } else {
    document.getElementById("sidebar-tracker").style.display = "none";
    if (viewId === "view-home") {
      document.getElementById("nav-home").classList.add("active");
      const navHomeMobile = document.getElementById("nav-home-mobile");
      if(navHomeMobile) navHomeMobile.classList.add("active");
    }
  }
}

// UI Rendering Functions
function renderSidebar() {
  const listContainer = document.getElementById("topic-navigation-list");
  if (!listContainer) return;
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
      <div style="font-weight: 800; width: 28px; text-align: center; color: var(--accent-primary); font-size: 1.1rem;">${isCompleted ? '✓' : index + 1}</div>
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 0.95rem; font-weight: ${index === currentLessonIndex ? '800' : '600'}; color: ${index === currentLessonIndex ? '#fff' : 'var(--text-secondary)'};">${lesson.title}</span>
        <span style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 700;">${lesson.indicator}</span>
      </div>
    `;
    item.addEventListener("click", () => {
      currentLessonIndex = index;
      renderLesson();
    });
    listContainer.appendChild(item);
  });

  // Scroll active sidebar item into view
  const activeItem = listContainer.querySelector(".topic-item.active");
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    <div class="lesson-header-container">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <span class="lesson-topic-indicator">${lesson.indicator}</span>
        <span class="difficulty-badge">Beginner 🟢</span>
      </div>
      <h2 class="lesson-title-text">${lesson.title}</h2>
      <p style="color: #94a3b8; font-size: 1.1rem; max-width: 800px; margin-top: 12px; line-height: 1.6;">${lesson.subtitle}</p>
    </div>
      <div class="explanation-box" style="display: block;">
        <div class="exp-panel" style="width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
            <span class="exp-label" id="active-lang-icon" style="margin-bottom: 0;">
              <span style="font-size: 1.2rem;">🎭</span> Tanglish
            </span>
            <div class="lang-toggle-group">
              <button class="lang-btn active" onclick="switchLanguage('tanglish')">Tanglish</button>
              <button class="lang-btn" onclick="switchLanguage('english')">English</button>
              <button class="lang-btn" onclick="switchLanguage('tamil')">தமிழ்</button>
            </div>
          </div>
          <div class="exp-text" id="active-lang-content">
            ${window.DOMPurify ? DOMPurify.sanitize(typeof formatCodeExamples === 'function' ? formatCodeExamples(lesson.tanglishExp) : lesson.tanglishExp) : (typeof formatCodeExamples === 'function' ? formatCodeExamples(lesson.tanglishExp) : lesson.tanglishExp)}
          </div>
        </div>
      </div>
  `;

  // Set Code Editor values
  const codeEditor = document.getElementById("lesson-code-editor");
  if (codeEditor) {
    codeEditor.value = lesson.initialCode;
    if (typeof updateSandboxHighlight === 'function') updateSandboxHighlight();
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
  quizPanel.className = "quiz-panel-card mb-8";
  
  const completedCount = Object.keys(userProgress).length;
  const progressPercent = Math.min(100, Math.round((completedCount / lessons.length) * 100));

  quizPanel.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-progress-bar">
        <div class="quiz-progress-fill" style="width: ${progressPercent}%"></div>
      </div>
      <span style="color: var(--text-tertiary); font-weight: 700; font-size: 0.8rem; font-family: var(--font-mono);">${progressPercent}% XP</span>
    </div>
    <h3 class="quiz-question">${lesson.quiz.question}</h3>
    <div class="quiz-options">
      ${lesson.quiz.options.map((opt, i) => `
        <div class="quiz-glass-card" data-idx="${i}">
          <div class="option-label">${String.fromCharCode(65 + i)}</div>
          <span>${opt}</span>
        </div>
      `).join('')}
    </div>
  `;

  // Attach Quiz option events
  quizPanel.querySelectorAll(".quiz-glass-card").forEach(opt => {
    opt.addEventListener("click", (e) => handleQuizSubmission(parseInt(opt.getAttribute("data-idx"), 10), e));
  });

  // Manage Prev/Next buttons
  document.getElementById("btn-prev-lesson").disabled = currentLessonIndex === 0;
  document.getElementById("btn-next-lesson").disabled = currentLessonIndex === lessons.length - 1;

  renderSidebar();
}

function handleQuizSubmission(selectedIndex, event) {
  const lesson = lessons[currentLessonIndex];
  const isCorrect = selectedIndex === lesson.quiz.correctIndex;

  const feedbackContainer = document.getElementById("meme-feedback-container");
  feedbackContainer.innerHTML = "";

  // Highlight selected, correct, and incorrect options
  const options = document.querySelectorAll(".quiz-glass-card");
  options.forEach((opt, idx) => {
    opt.classList.remove("selected", "correct", "incorrect");
    if (idx === selectedIndex) {
      opt.classList.add(isCorrect ? "correct" : "incorrect");
    }
    if (idx === lesson.quiz.correctIndex && isCorrect) {
      if (idx !== selectedIndex) {
        opt.style.borderColor = "var(--accent-success)";
      }
    }
  });

  // Setup Feedback container
  feedbackContainer.className = `lesson-complete-screen active ${isCorrect ? '' : 'incorrect-mode'}`;
  
  const memeInfo = isCorrect ? lesson.quiz.correctMeme : lesson.quiz.incorrectMeme;

  feedbackContainer.innerHTML = `
    <div class="result-headline ${isCorrect ? 'success' : 'error'}">${memeInfo.headline}</div>
    <div style="margin: 0.5rem 0 1.5rem 0; font-size: 1.1rem; color: #94a3b8; max-width: 600px;">${window.DOMPurify ? DOMPurify.sanitize(memeInfo.text) : memeInfo.text}</div>
    <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem;">
      ${memeInfo.svg}
    </div>
    ${isCorrect && currentLessonIndex < lessons.length - 1 ? 
      `<button class="btn-pill btn-pill-next" onclick="document.getElementById('btn-next-lesson').click()">Next Lesson →</button>` : 
      ''}
  `;

  if (isCorrect) {
    playSoundEffect("correct");
    if (event) {
      const xpNode = document.createElement("div");
      xpNode.className = "xp-popup";
      xpNode.textContent = "+50 XP!";
      xpNode.style.left = (event.clientX) + "px";
      xpNode.style.top = (event.clientY - 20) + "px";
      document.body.appendChild(xpNode);
      setTimeout(() => { if (xpNode.parentNode) xpNode.parentNode.removeChild(xpNode); }, 1000);
    }
    if (typeof fireConfetti === 'function') fireConfetti();
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
  // Append typing indicator
  const indicator = document.createElement("div");
  indicator.className = "chat-message bot typing-indicator-wrapper";
  indicator.innerHTML = `
    <div class="chat-avatar bot-avatar">🤖</div>
    <div class="message-bubble">
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  chatbotMessages.appendChild(indicator);
  chatbotMessages.scrollTo({ top: chatbotMessages.scrollHeight, behavior: 'smooth' });

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
    appendMessage("Aiyo! Chitti RAG memory error crash aayiduche! Python backend-a restart panni paarunga! ⚡", "bot");
  }
}

function sendSuggested(text) {
  const input = document.getElementById('chatbot-input');
  if (input) {
    input.value = text;
    handleSendMessage();
    const suggestions = document.getElementById('suggested-prompts');
    if (suggestions) suggestions.style.display = 'none';
  }
}

function appendMessage(text, sender, source = null) {
  const msg = document.createElement("div");
  msg.className = `chat-message ${sender}`;
  
  let avatar = sender === 'bot' ? '<div class="chat-avatar bot-avatar">🤖</div>' : '<div class="chat-avatar user-avatar">👤</div>';
  
  // Basic markdown parsing for code blocks
  let parsedText = text;
  parsedText = parsedText.replace(/```python\\n([\\s\\S]*?)\\n```/g, '<code>$1</code>');
  parsedText = parsedText.replace(/```([\\s\\S]*?)```/g, '<code>$1</code>');
  parsedText = parsedText.replace(/\\*\\*(.*?)\\*\\*/g, '<b>$1</b>');

  if (typeof formatCodeExamples === 'function') {
    parsedText = formatCodeExamples(parsedText);
  }

  let content = `${avatar}<div class="message-bubble">${parsedText}`;
  if (source) {
    content += `<div style="font-size: 0.72rem; color: #a78bfa; margin-top: 0.4rem; padding-top: 0.3rem; border-top: 1px solid rgba(255,255,255,0.1); font-weight: 600;">✨ Retrieved Context: ${source}</div>`;
  }
  content += `</div>`;
  
  msg.innerHTML = content;
  chatbotMessages.appendChild(msg);
  chatbotMessages.scrollTo({ top: chatbotMessages.scrollHeight, behavior: 'smooth' });
}

// Bind events
chatbotSendBtn.addEventListener("click", handleSendMessage);
chatbotInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSendMessage();
  }
});

// Event Listeners Setup
const bindNav = (id, target) => {
  const el = document.getElementById(id);
  if(el) el.addEventListener("click", () => {
    showView(target);
    const mobileNavOverlay = document.getElementById("mobile-nav");
    if (mobileNavOverlay) mobileNavOverlay.classList.remove("active");
    if (target === "view-dashboard") renderDashboardStats();
  });
};
bindNav("nav-home", "view-home");
bindNav("nav-home-mobile", "view-home");
bindNav("nav-dashboard", "view-dashboard");
bindNav("nav-dashboard-mobile", "view-dashboard");
bindNav("nav-learn", "view-learn");
bindNav("nav-learn-mobile", "view-learn");

document.getElementById("btn-start-now").addEventListener("click", () => showView("view-learn"));

// Navbar Scroll Effect
window.addEventListener("scroll", () => {
  const header = document.getElementById("main-header");
  if (header) {
    if (window.scrollY > 20) {
      header.classList.add("header-scrolled");
    } else {
      header.classList.remove("header-scrolled");
    }
  }
});

// Mobile Menu Toggle
const btnMobileMenu = document.getElementById("btn-mobile-menu");
const mobileNavOverlay = document.getElementById("mobile-nav");
if (btnMobileMenu && mobileNavOverlay) {
  btnMobileMenu.addEventListener("click", () => {
    mobileNavOverlay.classList.toggle("active");
  });
}

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
  if (themeToggleBtn) {
    themeToggleBtn.textContent = savedTheme === "light" ? "☀️" : "🌙";
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    themeToggleBtn.textContent = newTheme === "light" ? "☀️" : "🌙";
  });
}

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
    if (typeof updateSandboxHighlight === 'function') updateSandboxHighlight();
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
const btnOpenMenuMobile = document.getElementById("btn-open-menu-mobile");
const btnCloseMenu = document.getElementById("options-modal-close");

function openOptionsModal() {
  populateQuickTopicSelect();
  const select = document.getElementById("quick-topic-select");
  if (select) select.value = currentLessonIndex;
  if (optionsOverlay) optionsOverlay.classList.add("active");
  const mobileNavOverlay = document.getElementById("mobile-nav");
  if (mobileNavOverlay) mobileNavOverlay.classList.remove("active");
}

function closeOptionsModal() {
  if (optionsOverlay) optionsOverlay.classList.remove("active");
}

if (btnOpenMenu) btnOpenMenu.addEventListener("click", openOptionsModal);
if (btnOpenMenuMobile) btnOpenMenuMobile.addEventListener("click", openOptionsModal);
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

  updateUserRank();
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
  updateUserRank();
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
  loadStreakData();
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

  // Populate Heatmap Grid (Last 365 Days)
  const heatmapGrid = document.getElementById("heatmap-grid");
  if (heatmapGrid) {
    heatmapGrid.innerHTML = "";

    const daysToRender = 365;
    const endDate = new Date();
    // Calculate start date and align to Sunday (start of column)
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - daysToRender + 1);
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }
    
    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalGridDays = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;

    for (let i = 0; i < totalGridDays; i++) {
      const d = new Date(startDate.getTime());
      d.setDate(startDate.getDate() + i);
      const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isActive = activityLog[dayStr] === true;
      
      const cell = document.createElement("div");
      cell.className = `heatmap-cell ${isActive ? 'level-4' : 'level-0'}`;
      cell.setAttribute("title", `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${isActive ? '(Active 🔥)' : '(No Activity)'}`);
      heatmapGrid.appendChild(cell);
    }

    // Populate Month Labels (X-axis)
    const heatmapLabelsX = document.getElementById("heatmap-labels-x");
    if (heatmapLabelsX) {
      heatmapLabelsX.innerHTML = "";
      const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      let lastMonth = -1;

      for (let i = 0; i < totalGridDays; i += 7) {
        const d = new Date(startDate.getTime());
        d.setDate(startDate.getDate() + i);
        
        // Check Wednesday to determine the column's primary month
        const midWeek = new Date(d.getTime());
        midWeek.setDate(d.getDate() + 3);
        const colMonth = midWeek.getMonth();
        
        if (colMonth !== lastMonth) {
          lastMonth = colMonth;
          const colIndex = i / 7;
          const label = document.createElement("span");
          label.className = "heatmap-month-label";
          label.textContent = shortMonthNames[colMonth];
          label.style.left = `${colIndex * 16}px`; // 12px width + 4px gap = 16px per column
          heatmapLabelsX.appendChild(label);
        }
      }
    }

    // Auto-scroll to the right to see the latest days
    const scrollContainer = document.querySelector('.heatmap-scroll-container');
    if (scrollContainer) {
      setTimeout(() => {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth;
      }, 100);
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

// User Ranking & Level System Logic (6 Custom Ranks & Images)
function updateUserRank() {
  const rankingBox = document.getElementById("user-ranking-box");
  if (!rankingBox) return;

  loadStreakData();
  loadProgress();
  const streakCount = (streakData && streakData.count > 0) ? streakData.count : 1;
  
  let completedCount = 0;
  if (typeof userProgress === 'object' && userProgress !== null) {
    completedCount = Object.keys(userProgress).filter(k => userProgress[k] === true).length;
  }

  // Calculate User XP: 50 XP per streak day + 100 XP per completed lesson topic
  const totalXP = (streakCount * 50) + (completedCount * 100);

  // 6 Custom Ranks Configuration
  const ranks = [
    {
      level: 1,
      title: "Code Kutty",
      img: "/static/ranks/code%20kutty.jpeg",
      minXP: 0,
      actor: "Vadivelu",
      quote: "\"Arambichutanya Arambichutan! Code-a thoda arambichutaen!\""
    },
    {
      level: 2,
      title: "Python Poochi",
      img: "/static/ranks/python%20poochi.jpeg",
      minXP: 300,
      actor: "Senthil",
      quote: "\"Poochi maadhiri nalla creep aayi code ezhuthuren anna!\""
    },
    {
      level: 3,
      title: "Bug Vettaikaran",
      img: "/static/ranks/bug%20vettaikaran.jpeg",
      minXP: 800,
      actor: "Vadivelu",
      quote: "\"Single bug-a kooda thapikka vidama vettai aaduraen!\""
    },
    {
      level: 4,
      title: "Logic Legend",
      img: "/static/ranks/logic%20legend.jpeg",
      minXP: 1600,
      actor: "Vivekh",
      quote: "\"Logic-la namma eduthadhu thaan mudivu! Top mind performance!\""
    },
    {
      level: 5,
      title: "Python Puli",
      img: "/static/ranks/python%20puli.jpeg",
      minXP: 2500,
      actor: "Chitti 2.0",
      quote: "\"Puli paaiyuradhu maadhiri Python-la mass kaatureom!\""
    },
    {
      level: 6,
      title: "Code Chakravarthy",
      img: "/static/ranks/code%20chakravarthi.jpeg",
      minXP: 3500,
      actor: "Superstar Rajini",
      quote: "\"Chakravarthy da! Absolute Supreme Python Ruler! All 30 topics conquered!\""
    }
  ];

  let currentRank = ranks[0];
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (totalXP >= ranks[i].minXP) {
      currentRank = ranks[i];
      break;
    }
  }

  const currentIndex = ranks.indexOf(currentRank);
  const nextRank = ranks[currentIndex + 1] || currentRank;
  const xpInLevel = totalXP - currentRank.minXP;
  const xpNeeded = (nextRank.minXP - currentRank.minXP) || 1;
  const progressPercent = currentRank === nextRank ? 100 : Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  rankingBox.innerHTML = `
    <div class="rank-header">
      <div class="rank-badge-info">
        <div class="rank-badge-img-wrapper">
          <img src="${currentRank.img}" alt="${currentRank.title}" class="rank-badge-img" />
          <span class="rank-status-icon">🏆</span>
        </div>
        <div>
          <div class="rank-level-label">Level ${currentRank.level} Rank</div>
          <h4 class="rank-title">${currentRank.title}</h4>
        </div>
      </div>
      <span class="rank-xp-badge">${totalXP} XP</span>
    </div>
    
    <div class="rank-progress-wrapper">
      <div class="rank-progress-labels">
        <span class="rank-progress-sub">XP Progress: ${totalXP} / ${currentRank === nextRank ? totalXP : nextRank.minXP} XP (${progressPercent}%)</span>
        <span class="rank-next-sub">${currentRank === nextRank ? '👑 MAX RANK UNLOCKED!' : 'Next: ' + nextRank.title}</span>
      </div>
      <div class="rank-progress-bg">
        <div class="rank-progress-fill" style="width: ${progressPercent}%;"></div>
      </div>
    </div>

    <div class="rank-meme-quote">
      <span class="quote-text"><b>${currentRank.actor}:</b> ${currentRank.quote}</span>
    </div>

    <div class="rank-milestones">
      ${ranks.map(r => {
        const isUnlocked = totalXP >= r.minXP;
        return `
          <div class="rank-milestone-item ${isUnlocked ? 'unlocked' : 'locked'}" title="${r.title} (${r.minXP} XP)">
            <img src="${r.img}" alt="${r.title}" class="milestone-img" />
            <span class="milestone-badge">${isUnlocked ? '✓' : '🔒'}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Check for New Rank Level Unlock Celebration
  const lastLevelSaved = localStorage.getItem("python_kadhai_last_unlocked_level");
  const lastUnlockedLevel = lastLevelSaved !== null ? parseInt(lastLevelSaved, 10) : null;

  if (lastUnlockedLevel !== null && currentRank.level > lastUnlockedLevel) {
    triggerRankUnlockModal(currentRank);
  }

  // Save current unlocked level
  localStorage.setItem("python_kadhai_last_unlocked_level", currentRank.level.toString());
}

/* ==========================================================================
   Full-Screen Rank Unlock Celebration Modal & Confetti FX
   ========================================================================== */

let confettiAnimationId = null;

function startConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ["#f59e0b", "#10b981", "#8b5cf6", "#3b82f6", "#ec4899", "#ffffff"];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 8 + 4,
      d: Math.random() * 10 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05,
      tiltAngle: 0
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, index) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.tilt = Math.sin(p.tiltAngle) * 15;

      if (p.y > canvas.height) {
        particles[index] = {
          x: Math.random() * canvas.width,
          y: -20,
          r: p.r,
          d: p.d,
          color: p.color,
          tilt: p.tilt,
          tiltAngleIncremental: p.tiltAngleIncremental,
          tiltAngle: p.tiltAngle
        };
      }

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });

    confettiAnimationId = requestAnimationFrame(draw);
  }

  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
  draw();
}

function stopConfetti() {
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
  }
  const canvas = document.getElementById("confetti-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function playVictoryFanfare() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + (index * 0.12);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch(e) {
    // Audio Context not allowed or unsupported
  }
}

function triggerRankUnlockModal(rank) {
  const modal = document.getElementById("rank-unlock-modal");
  if (!modal) return;

  document.getElementById("unlock-modal-img").src = rank.img;
  document.getElementById("unlock-modal-level").textContent = `Level ${rank.level} • Rank Title`;
  document.getElementById("unlock-modal-title").textContent = rank.title;
  document.getElementById("unlock-modal-quote").innerHTML = `<b>${rank.actor}:</b> ${rank.quote}`;

  modal.classList.add("active");
  startConfetti();
  playVictoryFanfare();
}

// Bind close button
const closeUnlockModalBtn = document.getElementById("btn-close-unlock-modal");
if (closeUnlockModalBtn) {
  closeUnlockModalBtn.addEventListener("click", () => {
    const modal = document.getElementById("rank-unlock-modal");
    if (modal) modal.classList.remove("active");
    stopConfetti();
  });
}

// Bind Options Menu Preview Button
const previewRankBtn = document.getElementById("btn-preview-rank-unlock");
if (previewRankBtn) {
  previewRankBtn.addEventListener("click", () => {
    // Close options modal if open
    const optionsModal = document.getElementById("options-modal");
    if (optionsModal) optionsModal.classList.remove("active");

    // Trigger celebration modal with sample rank
    triggerRankUnlockModal({
      level: 3,
      title: "Bug Vettaikaran",
      img: "/static/ranks/bug%20vettaikaran.jpeg",
      actor: "Vadivelu",
      quote: "\"Single bug-a kooda thapikka vidama vettai aaduraen!\""
    });
  });
}

/* ==========================================================================
   Theme Switcher Logic (Dark & Light Mode Controller)
   ========================================================================== */

function initThemeController() {
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const savedTheme = localStorage.getItem("python_kadhai_theme") || "dark";

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
      if (themeToggleBtn) themeToggleBtn.textContent = "☀️";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      if (themeToggleBtn) themeToggleBtn.textContent = "🌙";
    }
    localStorage.setItem("python_kadhai_theme", theme);
  }

  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = localStorage.getItem("python_kadhai_theme") || "dark";
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }
}

// Safe Dashboard Widgets Initialization
function initDashboardWidgets() {
  initThemeController();
  loadStreakData();
  logTodayActivity();
  renderStreakWidget();
  updateUserRank();
  renderDashboardStats();
  renderMonthlyAnalytics();
}

function renderDashboardStats() {
  const xpEl = document.getElementById("dash-xp");
  const streakEl = document.getElementById("dash-streak");
  const lessonsEl = document.getElementById("dash-lessons");
  
  // Gamification HUD elements
  const hudStreak = document.getElementById("hud-streak");
  const hudCoins = document.getElementById("hud-coins");
  const hudXpBar = document.getElementById("hud-xp-bar");
  
  loadStreakData();
  const currentStreak = streakData.count || 0;
  
  let completedTopics = 0;
  let totalTopics = 0;
  for (const t of lessons) {
    if (t.type === 'lesson') {
      totalTopics++;
      if (userProgress[t.id]) completedTopics++;
    }
  }
  
  const totalXp = completedTopics * 100 + currentStreak * 50;
  const totalCoins = completedTopics * 10 + currentStreak * 5;
  
  // Level Calculation (500 XP per level)
  const currentLevel = Math.floor(totalXp / 500) + 1;
  const xpIntoLevel = totalXp % 500;
  const xpPercent = (xpIntoLevel / 500) * 100;
  
  // Check for level up
  const savedLevel = localStorage.getItem('python_kadhai_level') || 1;
  if (currentLevel > parseInt(savedLevel)) {
    localStorage.setItem('python_kadhai_level', currentLevel);
    triggerLevelUp(currentLevel);
  } else if (!localStorage.getItem('python_kadhai_level')) {
    localStorage.setItem('python_kadhai_level', currentLevel);
  }
  
  // Update HUD
  if (hudStreak) hudStreak.textContent = currentStreak;
  if (hudCoins) hudCoins.textContent = totalCoins;
  if (hudXpBar) hudXpBar.style.width = `${xpPercent}%`;

  if (!xpEl) return;
  
  xpEl.textContent = totalXp;
  streakEl.textContent = `${currentStreak} Days`;
  lessonsEl.textContent = `${completedTopics} / ${totalTopics}`;
}

function triggerLevelUp(level) {
  const modal = document.getElementById('level-up-modal');
  const levelText = document.getElementById('new-level-text');
  if (modal && levelText) {
    levelText.textContent = `Level ${level}`;
    modal.classList.add('active');
    setTimeout(() => {
      if(typeof fireConfetti === 'function') fireConfetti();
    }, 300);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboardWidgets);
} else {
  initDashboardWidgets();
}

// --- Syntax Highlighting & Code Examples Formatting ---
function syntaxHighlight(code) {
  if (!code) return "";
  let hl = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  hl = hl.replace(/(\+|-|\*|\/|=|<|>|!)/g, '<span class="hl-operator">$1</span>');
  hl = hl.replace(/(".*?"|'.*?')/g, '<span class="hl-string">$1</span>');
  hl = hl.replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');
  hl = hl.replace(/\b(def|class|if|else|elif|for|while|import|from|return|print|and|or|not|in|True|False|None)\b/g, '<span class="hl-keyword">$1</span>');
  hl = hl.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, '<span class="hl-func">$1</span>');
  hl = hl.replace(/(#.*)/g, '<span class="hl-comment">$1</span>');
  return hl;
}

function formatCodeExamples(text) {
  if (!text) return "";
  return text.replace(/<code>(.*?)<\/code>/g, (match, code) => {
    const lines = code.split('\\n');
    let lineNums = '';
    for(let i=1; i<=lines.length; i++) lineNums += i + '<br>';
    const safeCode = code.replace(/'/g, "\\\\'").replace(/"/g, '&quot;');
    return `
      <div class="premium-code-block">
        <div class="premium-code-header">
          <div class="window-dots">
            <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
          </div>
          <span class="lang-badge">Python</span>
          <button class="btn-copy" onclick="navigator.clipboard.writeText('${safeCode}')">Copy</button>
        </div>
        <div class="premium-code-body">
          <div class="inline-line-numbers">${lineNums}</div>
          <div class="code-content">${syntaxHighlight(code)}</div>
        </div>
      </div>
    `;
  });
}

function updateSandboxHighlight() {
  const editor = document.getElementById("lesson-code-editor");
  const highlight = document.getElementById("lesson-code-highlight");
  const lineNumbers = document.getElementById("sandbox-line-numbers");
  if (!editor || !highlight || !lineNumbers) return;
  const text = editor.value;
  let hlText = syntaxHighlight(text);
  if (text.length > 0 && text[text.length-1] === '\\n') {
    hlText += '\\n';
  }
  highlight.innerHTML = hlText;
  
  const lines = text.split('\\n').length;
  let lineNums = '';
  for(let i=1; i<=lines; i++) lineNums += i + '<br>';
  lineNumbers.innerHTML = lineNums;
}

// Attach event listeners for dual-layer sandbox syncing
document.addEventListener("DOMContentLoaded", () => {
  const sandboxEditor = document.getElementById("lesson-code-editor");
  if (sandboxEditor) {
    sandboxEditor.addEventListener("input", updateSandboxHighlight);
    sandboxEditor.addEventListener("scroll", () => {
      const highlight = document.getElementById("lesson-code-highlight");
      const lineNumbers = document.getElementById("sandbox-line-numbers");
      if (highlight) {
        highlight.scrollTop = sandboxEditor.scrollTop;
        highlight.scrollLeft = sandboxEditor.scrollLeft;
      }
      if (lineNumbers) {
        lineNumbers.scrollTop = sandboxEditor.scrollTop;
      }
    });
    // Init on load
    updateSandboxHighlight();
  }
});

// --- Confetti Engine ---
function fireConfetti() {
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#27c93f', '#ffbd2e', '#ff5f56', '#818cf8', '#f472b6'];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2 + 100,
      r: Math.random() * 6 + 2,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * -10 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncrement: (Math.random() * 0.07) + 0.05,
      tiltAngle: 0
    });
  }

  let animationFrame;
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.tiltAngle += p.tiltAngleIncrement;
      p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle) * 2 + p.dx;
      p.dy += 0.1; // gravity
      p.y += p.dy;
      if (p.y <= canvas.height) active = true;
      
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
      ctx.stroke();
    }
    if (active) {
      animationFrame = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  render();
}

/* ==================================================
   Global Animation System Initialization
   ================================================== */
function initAnimations() {
  // 1. Button Ripples
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const circle = document.createElement('span');
      circle.classList.add('ripple');
      circle.style.left = `${x}px`;
      circle.style.top = `${y}px`;

      const radius = Math.max(btn.clientWidth, btn.clientHeight);
      circle.style.width = circle.style.height = `${radius}px`;
      circle.style.marginLeft = circle.style.marginTop = `-${radius / 2}px`;

      this.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });

  // 2. Scroll Reveal Observer
  const revealElements = document.querySelectorAll('.reveal');
  const revealOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", initAnimations);
if (document.readyState === "complete" || document.readyState === "interactive") {
  initAnimations();
}





/* ==================================================
   Language Toggle System
   ================================================== */
window.switchLanguage = function(lang) {
  if (lessons.length === 0) return;
  const lesson = lessons[currentLessonIndex];
  
  const contentEl = document.getElementById('active-lang-content');
  const iconEl = document.getElementById('active-lang-icon');
  const buttons = document.querySelectorAll('.lang-btn');
  
  buttons.forEach(btn => btn.classList.remove('active'));
  
  let rawHtml = '';
  if (lang === 'tanglish') {
    rawHtml = lesson.tanglishExp;
    iconEl.innerHTML = '<span style="font-size: 1.2rem;">🎭</span> Tanglish';
    buttons[0].classList.add('active');
  } else if (lang === 'english') {
    rawHtml = lesson.englishExp;
    iconEl.innerHTML = '<span style="font-size: 1.2rem;">📘</span> English';
    buttons[1].classList.add('active');
  } else if (lang === 'tamil') {
    rawHtml = lesson.tamilExp || '<em>(தமிழ் விளக்கம் விரைவில் புதுப்பிக்கப்படும்)</em>';
    iconEl.innerHTML = '<span style="font-size: 1.2rem;">🏛️</span> தமிழ்';
    buttons[2].classList.add('active');
  }

  contentEl.innerHTML = window.DOMPurify ? DOMPurify.sanitize(typeof formatCodeExamples === 'function' ? formatCodeExamples(rawHtml) : rawHtml) : (typeof formatCodeExamples === 'function' ? formatCodeExamples(rawHtml) : rawHtml);
}
