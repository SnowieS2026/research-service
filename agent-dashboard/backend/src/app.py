import sys
import time
import uuid
import threading
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# Mock data for active agents
agents = [
    {"id": "agent-1", "status": "running", "task": "summarize report", "tokens_used": 150, "runtime": 120},
    {"id": "agent-2", "status": "idle", "task": "none", "tokens_used": 0, "runtime": 0},
    {"id": "agent-3", "status": "error", "task": "data fetch failed", "tokens_used": 0, "runtime": 0}
]

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    emit('agent_update', {'agents': agents})

@socketio.on('spawn_agent')
def handle_spawn_agent(data):
    # Create a new agent with a unique ID
    new_agent_id = str(uuid.uuid4())
    new_agent = {
        "id": new_agent_id,
        "status": "running",
        "task": data.get("task", "idle"),
        "tokens_used": 0,
        "runtime": 0,
        "progress": 0,
    }
    agents.append(new_agent)
    emit('agent_update', {'agents': agents})
    
    # Simulate agent lifecycle
    def simulate_agent(agent):
        while agent["status"] == "running":
            time.sleep(1)
            agent["runtime"] += 1
            agent["progress"] = min(agent["runtime"], 100)  # cap at 100%
            # Simulate token usage increase
            agent["tokens_used"] += 5
            # Randomly complete agents after 30-60 seconds
            if 30 <= agent["runtime"] <= 60:
                agent["status"] = "completed"
                emit('agent_update', {'agents': agents})
                return
        # If status changes to something else, emit update
        emit('agent_update', {'agents': agents})

    # Start the simulation thread for the new agent
    thread = threading.Thread(target=simulate_agent, args=(new_agent,))
    thread.daemon = True
    thread.start()

@socketio.on('stop_agent')
def handle_stop_agent(agent_id):
    for agent in agents:
        if agent['id'] == agent_id:
            agent['status'] = 'stopped'
            emit('agent_update', {'agents': agents})
            break

@socketio.on('terminate_agent')
def handle_terminate_agent(agent_id):
    global agents
    agents = [agent for agent in agents if agent['id'] != agent_id]
    emit('agent_update', {'agents': agents})

@socketio.on('get_logs')
def handle_get_logs(agent_id):
    # Return mock logs
    logs = [f"Log entry for {agent_id} at time {i}" for i in range(3)]
    emit('agent_logs', {'agent_id': agent_id, 'logs': logs})

@socketio.on('get_desktop')
def handle_get_desktop(agent_id):
    # Return mock desktop data
    desktop_data = {
        "files": ["file1.txt", "file2.txt", "script.py"],
        "cwd": "/home/agent/{}/workdir".format(agent_id)
    }
    emit('desktop_update', {'agent_id': agent_id, 'desktop': desktop_data})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)