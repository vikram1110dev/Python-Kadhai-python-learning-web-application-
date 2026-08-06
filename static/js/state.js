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
