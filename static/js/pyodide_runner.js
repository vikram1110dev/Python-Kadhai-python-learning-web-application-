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
  
  isPyodideLoading = true;
  if(statusBadge) {
    statusBadge.className = "pyodide-status-badge";
    statusBadge.textContent = "⏳ Loading Python WASM...";
  }

  try {
    if (typeof loadPyodide === "function") {
      pyodideInstance = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
      });
      if(statusBadge) {
        statusBadge.className = "pyodide-status-badge ready";
        statusBadge.textContent = "⚡ Engine Ready";
      }
    } else {
      if(statusBadge) {
        statusBadge.className = "pyodide-status-badge error";
        statusBadge.textContent = "⚠️ Offline Mode";
      }
    }
  } catch (err) {
    console.error("Pyodide loading error:", err);
    if(statusBadge) {
      statusBadge.className = "pyodide-status-badge error";
      statusBadge.textContent = "❌ WASM Load Error";
    }
  } finally {
    isPyodideLoading = false;
  }
}

async function executePythonCode(editorId, terminalId, btnId, isPlayground = false) {
  const codeEditor = document.getElementById(editorId);
  const terminalOutput = document.getElementById(terminalId);
  const runBtn = document.getElementById(btnId);
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

    // Output check against expectedOutput (Only for Learn View)
    if (!isPlayground) {
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

// Wrapper functions for event listeners
function runLessonCode() {
  executePythonCode("lesson-code-editor", "terminal-output", "btn-run-code", false);
}

function runPlaygroundCode() {
  executePythonCode("playground-code-editor", "playground-terminal-output", "btn-run-playground", true);
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

// Enable Tab Key indents in Code Editors
function attachTabIndent(inputId) {
  const codeEditorInput = document.getElementById(inputId);
  if (codeEditorInput) {
    codeEditorInput.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = codeEditorInput.selectionStart;
        const end = codeEditorInput.selectionEnd;
        codeEditorInput.value = codeEditorInput.value.substring(0, start) + "    " + codeEditorInput.value.substring(end);
        codeEditorInput.selectionStart = codeEditorInput.selectionEnd = start + 4;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (inputId === "lesson-code-editor") runLessonCode();
        if (inputId === "playground-code-editor") runPlaygroundCode();
      }
    });
  }
}

attachTabIndent("lesson-code-editor");
attachTabIndent("playground-code-editor");

// Bind Code Runner controls (Learn View)
const runCodeBtn = document.getElementById("btn-run-code");
if (runCodeBtn) runCodeBtn.addEventListener("click", runLessonCode);

const resetCodeBtn = document.getElementById("btn-reset-code");
if (resetCodeBtn) resetCodeBtn.addEventListener("click", resetPythonCode);

const clearTerminalBtn = document.getElementById("btn-clear-terminal");
if (clearTerminalBtn) {
  clearTerminalBtn.addEventListener("click", () => {
    const terminalOutput = document.getElementById("terminal-output");
    if (terminalOutput) {
      terminalOutput.innerHTML = `<span class="terminal-placeholder">Terminal output cleared. Click "▶️ Run Code" to execute.</span>`;
    }
  });
}

// Bind Code Runner controls (Playground View)
const runPlaygroundBtn = document.getElementById("btn-run-playground");
if (runPlaygroundBtn) runPlaygroundBtn.addEventListener("click", runPlaygroundCode);

const clearPlaygroundEditorBtn = document.getElementById("btn-clear-playground-editor");
if (clearPlaygroundEditorBtn) {
  clearPlaygroundEditorBtn.addEventListener("click", () => {
    const codeEditor = document.getElementById("playground-code-editor");
    if (codeEditor) {
      codeEditor.value = "";
    }
  });
}

const clearPlaygroundTerminalBtn = document.getElementById("btn-clear-playground-terminal");
if (clearPlaygroundTerminalBtn) {
  clearPlaygroundTerminalBtn.addEventListener("click", () => {
    const terminalOutput = document.getElementById("playground-terminal-output");
    if (terminalOutput) {
      terminalOutput.innerHTML = `<span class="terminal-placeholder">Ready! Click "▶️ Run Code" to execute your script.</span>`;
    }
  });
}

// Pre-load Pyodide lazily when opening Learn or Playground view
const originalShowView = showView;
showView = function(viewId) {
  originalShowView(viewId);
  if (viewId === "view-learn" || viewId === "view-playground") {
    initPyodideEngine();
  }
};
