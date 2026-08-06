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

