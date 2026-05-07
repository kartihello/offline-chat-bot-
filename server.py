"""
Ollama Chat Server - Backend proxy for the Ollama API.
Handles streaming responses, model listing, and conversation management.
"""

from flask import Flask, request, Response, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

OLLAMA_BASE_URL = os.environ.get('OLLAMA_BASE_URL', 'http://127.0.0.1:11434')


@app.route('/')
def index():
    """Serve the main chat interface."""
    return send_from_directory('static', 'index.html')


@app.route('/api/models', methods=['GET'])
def list_models():
    """List available Ollama models."""
    try:
        resp = requests.get(f'{OLLAMA_BASE_URL}/api/tags', timeout=10)
        resp.raise_for_status()
        data = resp.json()
        models = [
            {
                'name': m['name'],
                'size': m.get('size', 0),
                'modified_at': m.get('modified_at', ''),
                'details': m.get('details', {})
            }
            for m in data.get('models', [])
        ]
        return jsonify({'models': models})
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Cannot connect to Ollama. Is it running?'}), 503
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    """Stream a chat response from Ollama."""
    data = request.json
    model = data.get('model', 'qwen3.5:4b')
    messages = data.get('messages', [])
    temperature = data.get('temperature', 0.7)
    top_p = data.get('top_p', 0.9)

    payload = {
        'model': model,
        'messages': messages,
        'stream': True,
        'options': {
            'temperature': temperature,
            'top_p': top_p,
        }
    }

    def generate():
        try:
            with requests.post(
                f'{OLLAMA_BASE_URL}/api/chat',
                json=payload,
                stream=True,
                timeout=120
            ) as resp:
                if resp.status_code != 200:
                    try:
                        err_body = resp.json()
                        err_msg = err_body.get('error', resp.text[:200])
                    except Exception:
                        err_msg = resp.text[:200] or f'Ollama returned status {resp.status_code}'
                    yield f"data: {json.dumps({'error': err_msg})}\n\n"
                    return
                for line in resp.iter_lines():
                    if line:
                        chunk = json.loads(line)
                        yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
        except requests.exceptions.ConnectionError:
            yield f"data: {json.dumps({'error': 'Cannot connect to Ollama. Make sure Ollama is running (ollama serve).'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
        }
    )


@app.route('/api/stop', methods=['POST'])
def stop_generation():
    """Stop an ongoing generation (Ollama doesn't have a direct stop, but we signal the frontend)."""
    return jsonify({'status': 'stopped'})


@app.route('/api/health', methods=['GET'])
def health():
    """Check if Ollama is reachable."""
    try:
        resp = requests.get(f'{OLLAMA_BASE_URL}/api/tags', timeout=5)
        resp.raise_for_status()
        return jsonify({'status': 'ok', 'ollama': True})
    except Exception:
        return jsonify({'status': 'degraded', 'ollama': False}), 503


if __name__ == '__main__':
    print("\n[*] Ollama Chat Server starting...")
    print(f"[>] Ollama API: {OLLAMA_BASE_URL}")
    print(f"[>] Open http://localhost:5000 in your browser\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
