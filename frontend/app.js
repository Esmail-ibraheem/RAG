const API_BASE = "http://localhost:8000";

let currentChatId = null;
let currentRagFileNames = [];

const configInput = document.getElementById("api-key-input");
const modelSelect = document.getElementById("model-select");
const configStatus = document.getElementById("config-status");
const saveConfigBtn = document.getElementById("save-config-btn");

const newChatBtn = document.getElementById("new-chat-btn");
const chatListEl = document.getElementById("chat-list");

const ragFilesInput = document.getElementById("rag-files");
const uploadRagBtn = document.getElementById("upload-rag-btn");
const ragFilesInfo = document.getElementById("rag-files-info");

const bm25FilesInput = document.getElementById("bm25-files");
const uploadBm25Btn = document.getElementById("upload-bm25-btn");

const messagesEl = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

const bm25Input = document.getElementById("bm25-input");
const bm25SearchBtn = document.getElementById("bm25-search-btn");
const bm25ResultsEl = document.getElementById("bm25-results");

const tabButtons = document.querySelectorAll(".tab-button");
const tabs = document.querySelectorAll(".tab");

function setActiveTab(tabName) {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.id === `tab-${tabName}`);
  });
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
}

tabButtons.forEach((btn) =>
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab))
);

// ============ CONFIG ============
saveConfigBtn.addEventListener("click", async () => {
  const apiKey = configInput.value.trim();
  const model = modelSelect.value;

  if (!apiKey) {
    configStatus.textContent = "API key required";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, model_name: model }),
    });
    if (!res.ok) throw new Error("Config failed");

    configStatus.textContent = "✅ Config saved";
  } catch (err) {
    console.error(err);
    configStatus.textContent = "❌ Error saving config";
  }
});

// ============ CHATS ============
async function loadChats() {
  const res = await fetch(`${API_BASE}/chats`);
  const chats = await res.json();

  chatListEl.innerHTML = "";
  chats.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = c.name;
    li.dataset.id = c.id;
    li.addEventListener("click", () => selectChat(c.id, li));
    chatListEl.appendChild(li);
  });
}

async function selectChat(id, liEl) {
  currentChatId = id;

  // highlight
  Array.from(chatListEl.children).forEach((li) =>
    li.classList.remove("active")
  );
  liEl.classList.add("active");

  const res = await fetch(`${API_BASE}/chats/${id}/messages`);
  const msgs = await res.json();

  messagesEl.innerHTML = "";
  msgs.forEach((m) => addMessage(m.content, m.role));
}

newChatBtn.addEventListener("click", async () => {
  const res = await fetch(`${API_BASE}/chats`, { method: "POST" });
  const chat = await res.json();
  await loadChats();

  // auto select new chat
  const li = Array.from(chatListEl.children).find(
    (li) => Number(li.dataset.id) === chat.id
  );
  if (li) {
    selectChat(chat.id, li);
  }
});

// ============ MESSAGES ============
function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = chatInput.value.trim();
  if (!query || !currentChatId) return;

  addMessage(query, "user");
  chatInput.value = "";
  chatInput.disabled = true;

  const btn = chatForm.querySelector("button");
  btn.disabled = true;
  btn.textContent = "Thinking...";

  try {
    const res = await fetch(`${API_BASE}/rag/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: currentChatId,
        query,
        file_names: currentRagFileNames,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    addMessage(data.answer, "assistant");
  } catch (err) {
    console.error(err);
    addMessage("Error talking to backend.", "assistant");
  } finally {
    chatInput.disabled = false;
    btn.disabled = false;
    btn.textContent = "Send";
    chatInput.focus();
  }
});

// ============ UPLOADS ============
uploadRagBtn.addEventListener("click", async () => {
  const files = ragFilesInput.files;
  if (!files.length) return;

  const formData = new FormData();
  for (const f of files) {
    formData.append("files", f);
  }

  const res = await fetch(`${API_BASE}/rag/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  currentRagFileNames = data.file_names || [];
  ragFilesInfo.textContent = `Indexed: ${currentRagFileNames.join(", ")}`;
});

uploadBm25Btn.addEventListener("click", async () => {
  const files = bm25FilesInput.files;
  if (!files.length) return;

  const formData = new FormData();
  for (const f of files) {
    formData.append("files", f);
  }

  await fetch(`${API_BASE}/bm25/upload`, {
    method: "POST",
    body: formData,
  });

  // you can show a toast if you want
});

// ============ BM25 SEARCH ============
bm25SearchBtn.addEventListener("click", async () => {
  const q = bm25Input.value.trim();
  if (!q) return;

  const res = await fetch(`${API_BASE}/bm25/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, top_k: 5 }),
  });
  const data = await res.json();
  const results = data.results || [];

  bm25ResultsEl.innerHTML = "";
  results.forEach((r, idx) => {
    const p = document.createElement("p");
    p.textContent = `${idx + 1}. ${r}`;
    bm25ResultsEl.appendChild(p);
  });
});

// init
loadChats();
