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
