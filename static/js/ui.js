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
