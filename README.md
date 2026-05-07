#  Offline Local AI Chatbot (Powered by Qwen 3.5 4B)

A completely offline, privacy-first AI chatbot running locally on Windows 11. This project utilizes the **Qwen 3.5 4B** model via **Ollama** and connects to a custom, lightweight HTML/JS frontend. It requires no internet connection to operate, ensuring 100% data privacy and security.

##  Key Features
* **100% Offline Execution:** Your data never leaves your computer. No cloud APIs, no subscriptions.
* **Lightweight & Fast:** Uses the highly optimized 4B parameter model, capable of running smoothly on standard laptops (8GB RAM).
* **Custom Frontend UI:** A clean, ChatGPT-like interface built with simple HTML/CSS/JS.
* **Custom AI Personality:** Fine-tuned via Prompt Engineering to act as a specialized local assistant.
* **CORS Configured:** Seamlessly connects a local frontend (`index.html`) directly to the Ollama backend engine.

---

##  Tech Stack
* **LLM Engine:** [Ollama](https://ollama.com/)
* **AI Model:** Qwen 3.5 4B (`qwen3.5:4b`)
* **Frontend:** Vanilla HTML, CSS, JavaScript (Localhost/File System)
* **OS Environment:** Windows 11 / Terminal (PowerShell)

# 🛡️ Offline Local AI Assistant (Powered by Qwen 3.5 4B)

![Privacy: 100% Offline](https://img.shields.io/badge/Privacy-100%25_Offline-success)
![Engine: Ollama](https://img.shields.io/badge/Engine-Ollama-blue)
![Model: Qwen 3.5 4B](https://img.shields.io/badge/Model-Qwen_3.5_4B-orange)
![OS: Windows 11](https://img.shields.io/badge/OS-Windows_11-blue)

A completely offline, privacy-first AI chatbot running locally on your hardware. This project utilizes the **Qwen 3.5 4B** model via **Ollama** and connects to a custom, lightweight HTML/JS frontend. It requires no internet connection to operate, ensuring zero data leakage and 100% data privacy.

---

## 🧠 How It Works (In Layman's Terms)
If you are new to local AI, here is how the pieces of this project fit together:

* **The Brain (Qwen 3.5 4B):** This is the AI model itself. It is a 4-billion-parameter neural network developed by Alibaba, compressed down to run on a standard laptop.
* **The Engine (Ollama):** The model can't run on its own. Ollama acts as the engine room. It runs in the background of your computer, loads the model into your system's RAM/GPU, and translates your questions into code the model understands. 
* **The Dashboard (HTML/JS Web UI):** This is the face of the app. Instead of typing into a dark, confusing command terminal, we use a custom `index.html` file to give you a clean, ChatGPT-like interface. 

### 🏗️ System Architecture Flow
```text
[ User Types Prompt ] 
        │
        ▼
[ Custom index.html ] ──(Sends request via Port 11434)──┐
        │                                               │
(Browser Security)                                      ▼
        │                                       [ Ollama Engine ]
        ▼                                               │
[ CORS Bypass Enabled ] ◄───────────────────────────────┘
                                                        │
                                                        ▼
                                              [ Qwen 3.5 4B Model ]
                                                (Generates Answer)

Stage,Goal,The System Prompt Used
1. The Basics,Stop overly long answers.,"""Act as a simple, helpful assistant. Keep your responses short, under three paragraphs, and don't use complicated jargon."""
2. Self-Awareness,Enforce offline boundaries.,"""You are an offline AI. You do not have an internet connection. If asked for live news, remind the user you are offline."""
3. Skill Training,Become a coding tutor.,"""Act as a strict C programming tutor. When given buggy code, do not write the answer. Point out the line error and give a hint."""
4. Project Logic,Contextualize the workflow.,"""You are an assistant for the project group 'The Guardians'. Align all architecture documents with the goal of offline security."""
5. Mentor Mode,Adjust tone for teaching.,"""When asked to explain a difficult concept, switch into 'Mentor Mode'. Explain the topic using simple everyday analogies."""

🛠️ Common Problems & Solutions
Running LLMs locally can sometimes be tricky depending on your hardware. Here are the most common issues you might face and how to fix them.

1. The Web UI says "Connection Refused"
The Problem: Your index.html cannot find the Ollama engine.

The Solution:

Ensure the Ollama app is actually running (check for the icon in your system tray).

Ensure you properly set the OLLAMA_ORIGINS variable to * (See Step 2 of setup). You must completely restart Ollama after setting this variable.

2. The AI gets stuck "Thinking..." forever
The Problem: Qwen 3.5 models have a built-in reasoning structure. Sometimes, on lower-end CPUs, the model gets stuck in a loop generating <think> tags without ever outputting the final answer.

The Solution:

Switch to a standard instruct model by running ollama run qwen2.5 instead.

Update your index.html Javascript to actively hide or collapse text that appears between <think> and </think> tags so the UI doesn't freeze while rendering.

3. My computer freezes when the AI generates text
The Problem: The model is pulling entirely from your CPU (System RAM) instead of your GPU (VRAM).

The Solution: The 4B model requires about 3.5GB to 4GB of RAM. Make sure you have no other heavy applications running. If you have an NVIDIA graphics card, ensure your drivers are updated so Ollama can automatically offload the processing to your GPU for 10x faster generatio
