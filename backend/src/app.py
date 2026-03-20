from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import threading
import time
import random
import uuid
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

agents = {}

class Agent:
    def __init__(self, task, model, timeout):
        self.id = f"agent-{str(uuid.uuid4())[:8]}"
        self.task = task
        self.model = model
        self.timeout = timeout
        self.status = "running"
        self.tokens_used = 0
        self.runtime = 0
        self.progress = 0
        self.created_at = datetime.now()
        self.logs = [f"[{datetime.now().strftime('%H:%M:%S')}] Agent {self.id} spawned"]
        self.files = ["workspace/", "logs/", "output/"]
        self.cwd = f"/home/agents/{self.id}"
        self._stop_event = threading.Event()
        
    def to_dict(self):
        return {
            "id": self.id,
            "task": self.task,
            "model": self.model,
            "status": self.status,
            "tokens_used": self.tokens_used,
            "runtime": self.runtime,
            "progress": self.progress,
            "created_at": self.created_at.isoformat()
        }
        
    def add_log(self, message):
        timestamp = datetime.now().strftime('%H:%M:%S')
        self.logs.append(f"[{timestamp}] {message}")
        
    def run(self):
        self.add_log(f"Starting task: {self.task}")
        while not self._stop_event.is_set() and self.runtime < self.timeout:
            time.sleep(1)
            self.runtime += 1
            self.tokens_used += random.randint(50, 200)
            self.progress = min(int((self.runtime / self.timeout) * 100), 99)
            if random.random() < 0.3:
                messages = ["Processing...", "Analyzing...", "Fetching...", "Running..."]
                self.add_log(random.choice(messages))
            socketio.emit('agent_update', {'agents': [a.to_dict() for a in agents.values()]})
        if not self._stop_event.is_set():
            self.status = "completed"
            self.progress = 100
            self.add_log("Task completed")
        else:
            self.status = "stopped"
            self.add_log("Agent stopped")
        socketio.emit('agent_update', {'agents': [a.to_dict() for a in agents.values()]})

@socketio.on('spawn_agent')
def handle_spawn_agent(data):
    agent = Agent(task=data.get('task'), model=data.get('model'), timeout=data.get('timeout', 300))
    agents[agent.id] = agent
    threading.Thread(target=agent.run, daemon=True).start()
    emit('agent_update', {'agents': [a.to_dict() for a in agents.values()]})

@socketio.on('stop_agent')
def handle_stop_agent(data):
    if data['agent_id'] in agents:
        agents[data['agent_id']]._stop_event.set()
        emit('agent_update', {'agents': [a.to_dict() for a in agents.values()]})

@socketio.on('terminate_agent')
def handle_terminate_agent(data):
    if data['agent_id'] in agents:
        agents[data['agent_id']].status = "completed"
        emit('agent_update', {'agents': [a.to_dict() for a in agents.values()]})

@socketio.on('get_logs')
def handle_get_logs(data):
    if data['agent_id'] in agents:
        emit('agent_logs', {'agent_id': data['agent_id'], 'logs': agents[data['agent_id']].logs})

@socketio.on('get_desktop')
def handle_get_desktop(data):
    if data['agent_id'] in agents:
        agent = agents[data['agent_id']]
        emit('agent_desktop', {'agent_id': data['agent_id'], 'cwd': agent.cwd, 'files': agent.files, 'recent_commands': [f"cd {agent.cwd}", "ls -la", f"echo '{agent.task}'"]})

@socketio.on('get_stats')
def handle_get_stats():
    total = len(agents)
    active = len([a for a in agents.values() if a.status == "running"])
    completed = len([a for a in agents.values() if a.status == "completed"])
    errors = len([a for a in agents.values() if a.status == "error"])
    emit('dashboard_stats', {'total': total, 'active': active, 'completed': completed, 'errors': errors})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)