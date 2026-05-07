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
