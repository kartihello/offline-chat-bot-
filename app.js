/**
 * NeuralChat — Local AI Chat Interface
 * Connects to Ollama API for streaming LLM conversations.
 */

// ===== State =====
const state = {
    conversations: JSON.parse(localStorage.getItem('nc_conversations') || '[]'),
    activeConversationId: null,
    isStreaming: false,
    abortController: null,
    settings: JSON.parse(localStorage.getItem('nc_settings') || JSON.stringify({
        temperature: 0.7,
        topP: 0.9,
        systemPrompt: 'You are a helpful, knowledgeable, and friendly AI assistant. You provide clear, accurate, and concise answers.'
    })),
    theme: localStorage.getItem('nc_theme') || 'dark',
};

// ===== DOM Elements =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
    sidebar: $('#sidebar'),
    sidebarOpenBtn: $('#sidebarOpenBtn'),
    sidebarCloseBtn: $('#sidebarCloseBtn'),
    newChatBtn: $('#newChatBtn'),
    conversationList: $('#conversationList'),
    connectionStatus: $('#connectionStatus'),
    modelSelector: $('#modelSelector'),
    settingsBtn: $('#settingsBtn'),
    themeToggle: $('#themeToggle'),
    chatContainer: $('#chatContainer'),
    welcomeScreen: $('#welcomeScreen'),
    messages: $('#messages'),
    messageInput: $('#messageInput'),
    sendBtn: $('#sendBtn'),
    charCount: $('#charCount'),
    settingsModal: $('#settingsModal'),
    closeSettingsBtn: $('#closeSettingsBtn'),
    temperatureSlider: $('#temperatureSlider'),
    temperatureValue: $('#temperatureValue'),
    topPSlider: $('#topPSlider'),
    topPValue: $('#topPValue'),
    systemPrompt: $('#systemPrompt'),
};

// ===== Init =====
function init() {
    applyTheme(state.theme);
    loadSettings();
    loadModels();
    renderConversations();
    checkHealth();
    setInterval(checkHealth, 15000);
    bindEvents();
    autoResizeInput();

    // Load last conversation or show welcome
    if (state.conversations.length > 0) {
        const lastId = localStorage.getItem('nc_activeConvId');
        if (lastId && state.conversations.find(c => c.id === lastId)) {
            switchConversation(lastId);
        }
    }
}

// ===== Events =====
function bindEvents() {
    els.sidebarOpenBtn.addEventListener('click', () => els.sidebar.classList.remove('collapsed'));
    els.sidebarCloseBtn.addEventListener('click', () => els.sidebar.classList.add('collapsed'));
    els.newChatBtn.addEventListener('click', newConversation);
    els.themeToggle.addEventListener('click', toggleTheme);
    els.settingsBtn.addEventListener('click', () => els.settingsModal.classList.add('active'));
    els.closeSettingsBtn.addEventListener('click', () => els.settingsModal.classList.remove('active'));
    els.settingsModal.addEventListener('click', (e) => {
        if (e.target === els.settingsModal) els.settingsModal.classList.remove('active');
    });

    els.sendBtn.addEventListener('click', handleSend);
    els.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    els.messageInput.addEventListener('input', () => {
        autoResizeInput();
        els.sendBtn.disabled = !els.messageInput.value.trim() && !state.isStreaming;
        const len = els.messageInput.value.length;
        els.charCount.textContent = len > 0 ? len : '';
    });

    // Settings sliders
    els.temperatureSlider.addEventListener('input', (e) => {
        els.temperatureValue.textContent = e.target.value;
        state.settings.temperature = parseFloat(e.target.value);
        saveSettings();
    });
    els.topPSlider.addEventListener('input', (e) => {
        els.topPValue.textContent = e.target.value;
        state.settings.topP = parseFloat(e.target.value);
        saveSettings();
    });
    els.systemPrompt.addEventListener('change', () => {
        state.settings.systemPrompt = els.systemPrompt.value;
        saveSettings();
    });

    // Welcome card prompts
    $$('.welcome-card').forEach(card => {
        card.addEventListener('click', () => {
            els.messageInput.value = card.dataset.prompt;
            els.sendBtn.disabled = false;
            autoResizeInput();
            handleSend();
        });
    });
}

// ===== Theme =====
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    localStorage.setItem('nc_theme', state.theme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// ===== Settings =====
function loadSettings() {
    els.temperatureSlider.value = state.settings.temperature;
    els.temperatureValue.textContent = state.settings.temperature;
    els.topPSlider.value = state.settings.topP;
    els.topPValue.textContent = state.settings.topP;
    els.systemPrompt.value = state.settings.systemPrompt;
}

function saveSettings() {
    localStorage.setItem('nc_settings', JSON.stringify(state.settings));
}

// ===== Models =====
async function loadModels() {
    try {
        const resp = await fetch('/api/models');
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        els.modelSelector.innerHTML = '';
        data.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name;
            const sizeGB = (m.size / 1e9).toFixed(1);
            opt.textContent = `${m.name} (${sizeGB}GB)`;
            els.modelSelector.appendChild(opt);
        });
        // Default to qwen3.5:4b if available
        const defaultModel = data.models.find(m => m.name === 'qwen3.5:4b');
        if (defaultModel) els.modelSelector.value = defaultModel.name;
    } catch (e) {
        els.modelSelector.innerHTML = '<option value="">No models found</option>';
    }
}

// ===== Health Check =====
async function checkHealth() {
    try {
        const resp = await fetch('/api/health');
        const data = await resp.json();
        const el = els.connectionStatus;
        if (data.ollama) {
            el.className = 'connection-status connected';
            el.querySelector('.status-text').textContent = 'Ollama connected';
        } else {
            el.className = 'connection-status disconnected';
            el.querySelector('.status-text').textContent = 'Ollama offline';
        }
    } catch {
        const el = els.connectionStatus;
        el.className = 'connection-status disconnected';
        el.querySelector('.status-text').textContent = 'Server offline';
    }
}

// ===== Conversations =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function newConversation() {
    const conv = {
        id: generateId(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
    };
    state.conversations.unshift(conv);
    saveConversations();
    switchConversation(conv.id);
}

function switchConversation(id) {
    state.activeConversationId = id;
    localStorage.setItem('nc_activeConvId', id);
    renderConversations();
    renderMessages();
}

function deleteConversation(id) {
    state.conversations = state.conversations.filter(c => c.id !== id);
    saveConversations();
    if (state.activeConversationId === id) {
        state.activeConversationId = null;
        if (state.conversations.length > 0) {
            switchConversation(state.conversations[0].id);
        } else {
            renderConversations();
            els.messages.innerHTML = '';
            els.welcomeScreen.classList.remove('hidden');
        }
    } else {
        renderConversations();
    }
}

function saveConversations() {
    localStorage.setItem('nc_conversations', JSON.stringify(state.conversations));
}

function getActiveConversation() {
    return state.conversations.find(c => c.id === state.activeConversationId);
}

function renderConversations() {
    els.conversationList.innerHTML = '';
    state.conversations.forEach(conv => {
        const btn = document.createElement('button');
        btn.className = 'conversation-item' + (conv.id === state.activeConversationId ? ' active' : '');
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span class="conv-title">${escapeHtml(conv.title)}</span>
            <span class="conv-delete" title="Delete conversation">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </span>
        `;
        btn.addEventListener('click', (e) => {
            if (e.target.closest('.conv-delete')) {
                e.stopPropagation();
                deleteConversation(conv.id);
                return;
            }
            switchConversation(conv.id);
        });
        els.conversationList.appendChild(btn);
    });
}

// ===== Messages =====
function renderMessages() {
    const conv = getActiveConversation();
    els.messages.innerHTML = '';
    if (!conv || conv.messages.length === 0) {
        els.welcomeScreen.classList.remove('hidden');
        return;
    }
    els.welcomeScreen.classList.add('hidden');
    conv.messages.forEach(msg => {
        if (msg.role === 'system') return;
        appendMessageToDOM(msg.role, msg.content, false);
    });
    scrollToBottom();
}

function appendMessageToDOM(role, content, animate = true) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    if (!animate) div.style.animation = 'none';

    const avatarText = role === 'user' ? 'U' : 'AI';
    div.innerHTML = `
        <div class="message-avatar">${avatarText}</div>
        <div class="message-content">${role === 'user' ? escapeHtml(content) : renderMarkdown(content)}</div>
    `;
    els.messages.appendChild(div);
    return div;
}

function scrollToBottom() {
    els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
}

// ===== Send & Stream =====
async function handleSend() {
    if (state.isStreaming) {
        stopStreaming();
        return;
    }

    const text = els.messageInput.value.trim();
    if (!text) return;

    // If no active conversation, create one
    if (!state.activeConversationId) {
        newConversation();
    }

    const conv = getActiveConversation();
    els.welcomeScreen.classList.add('hidden');

    // Add user message
    conv.messages.push({ role: 'user', content: text });
    appendMessageToDOM('user', text);
    scrollToBottom();

    // Update title from first message
    if (conv.messages.filter(m => m.role === 'user').length === 1) {
        conv.title = text.slice(0, 50) + (text.length > 50 ? '...' : '');
        renderConversations();
    }

    // Clear input
    els.messageInput.value = '';
    els.charCount.textContent = '';
    autoResizeInput();
    els.sendBtn.disabled = false;

    // Start streaming
    state.isStreaming = true;
    els.sendBtn.classList.add('is-streaming');

    // Add assistant message placeholder
    const assistantDiv = appendMessageToDOM('assistant', '');
    const contentDiv = assistantDiv.querySelector('.message-content');
    contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    scrollToBottom();

    let fullResponse = '';
    const abortCtrl = new AbortController();
    state.abortController = abortCtrl;

    // Build messages array with system prompt
    const apiMessages = [];
    if (state.settings.systemPrompt) {
        apiMessages.push({ role: 'system', content: state.settings.systemPrompt });
    }
    apiMessages.push(...conv.messages);

    try {
        const resp = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: els.modelSelector.value,
                messages: apiMessages,
                temperature: state.settings.temperature,
                top_p: state.settings.topP,
            }),
            signal: abortCtrl.signal,
        });

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const chunk = JSON.parse(data);
                    if (chunk.error) {
                        contentDiv.innerHTML = `<p style="color:var(--error)">⚠️ ${escapeHtml(chunk.error)}</p>`;
                        break;
                    }
                    if (chunk.message && chunk.message.content) {
                        fullResponse += chunk.message.content;
                        contentDiv.innerHTML = renderMarkdown(fullResponse);
                        scrollToBottom();
                    }
                } catch { /* skip malformed lines */ }
            }
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            contentDiv.innerHTML = `<p style="color:var(--error)">⚠️ ${escapeHtml(e.message)}</p>`;
        }
    }

    // Finalize
    if (fullResponse) {
        conv.messages.push({ role: 'assistant', content: fullResponse });
        contentDiv.innerHTML = renderMarkdown(fullResponse);
        addCopyButtons(contentDiv);
    } else if (!contentDiv.querySelector('[style*="color"]')) {
        contentDiv.innerHTML = '<p style="color:var(--text-tertiary)">No response generated.</p>';
    }

    state.isStreaming = false;
    state.abortController = null;
    els.sendBtn.classList.remove('is-streaming');
    els.sendBtn.disabled = !els.messageInput.value.trim();
    saveConversations();
    scrollToBottom();
}

function stopStreaming() {
    if (state.abortController) {
        state.abortController.abort();
    }
}

// ===== Markdown Renderer (lightweight) =====
function renderMarkdown(text) {
    if (!text) return '';
    let html = text;

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Blockquote
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');

    // Unordered list
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Ordered list
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Paragraphs - split by double newline
    html = html.replace(/\n\n/g, '</p><p>');
    // Single newlines to <br> (except in code blocks which are already handled)
    html = html.replace(/(?<!<\/?\w+[^>]*)\n/g, '<br>');

    if (!html.startsWith('<')) html = '<p>' + html + '</p>';

    return html;
}

function addCopyButtons(container) {
    container.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.copy-code-btn')) return;
        const btn = document.createElement('button');
        btn.className = 'copy-code-btn';
        btn.textContent = 'Copy';
        btn.addEventListener('click', () => {
            const code = pre.querySelector('code')?.textContent || pre.textContent;
            navigator.clipboard.writeText(code).then(() => {
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy', 2000);
            });
        });
        pre.style.position = 'relative';
        pre.appendChild(btn);
    });
}

// ===== Utilities =====
function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return str.replace(/[&<>"']/g, c => map[c]);
}

function autoResizeInput() {
    const ta = els.messageInput;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
}

// ===== Start =====
document.addEventListener('DOMContentLoaded', init);
