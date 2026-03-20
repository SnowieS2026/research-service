# Agent Dashboard Implementation Tasks

## TASK 1: Enhance Backend (backend/src/app.py)

Replace the entire file with this complete implementation:

```python
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

# Store agents in memory
agents = {}

class Agent:
    def __init__(self, task, model, timeout):
        self.id = f"agent-{str(uuid.uuid4())[:8]}"
        self.task = task
        self.model = model
        self.timeout = timeout
        self.status = "running"  # running, idle, completed, error, stopped
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
        """Simulate agent lifecycle"""
        self.add_log(f"Starting task: {self.task}")
        
        # Simulate work
        while not self._stop_event.is_set() and self.runtime < self.timeout:
            time.sleep(1)
            self.runtime += 1
            self.tokens_used += random.randint(50, 200)
            self.progress = min(int((self.runtime / self.timeout) * 100), 99)
            
            # Random log messages
            if random.random() < 0.3:
                messages = [
                    "Processing data chunk...",
                    "Analyzing patterns...",
                    "Fetching external resources...",
                    "Running subprocess...",
                    "Parsing results...",
                    "Optimizing output..."
                ]
                self.add_log(random.choice(messages))
            
            # Broadcast update
            socketio.emit('agent_update', {'agents': list(agents.values())})
            
        if not self._stop_event.is_set():
            self.status = "completed"
            self.progress = 100
            self.add_log("Task completed successfully")
        else:
            self.status = "stopped"
            self.add_log("Agent stopped by user")
            
        socketio.emit('agent_update', {'agents': list(agents.values())})

def background_monitor():
    """Background thread to monitor agents"""
    while True:
        time.sleep(1)
        for agent in list(agents.values()):
            if agent.status == "running":
                socketio.emit('agent_update', {'agents': [a.to_dict() for a in agents.values()]})

# Start background monitor
monitor_thread = threading.Thread(target=background_monitor, daemon=True)
monitor_thread.start()

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    emit('agent_update', {'agents': [a.to_dict() for a in agents.values()]})

@socketio.on('spawn_agent')
def handle_spawn_agent(data):
    agent = Agent(
        task=data.get('task', 'Unknown task'),
        model=data.get('model', 'default'),
        timeout=data.get('timeout', 300)
    )
    agents[agent.id] = agent
    
    # Start agent in background
    agent_thread = threading.Thread(target=agent.run, daemon=True)
    agent_thread.start()
    
    emit('agent_update', {'agents': [a.to_dict() for a in agents.values()]})

@socketio.on('stop_agent')
def handle_stop_agent(data):
    agent_id = data.get('agent_id')
    if agent_id in agents:
        agents[agent_id]._stop_event.set()
        agents[agent_id].status = "stopped"
        agents[agent_id].add_log("Force stop initiated")
        emit('agent_update', {'agents': [a.to_dict() for a in agents.values()]})

@socketio.on('terminate_agent')
def handle_terminate_agent(data):
    agent_id = data.get('agent_id')
    if agent_id in agents:
        agents[agent_id].status = "completed"
        agents[agent_id].add_log("Terminated gracefully")
        emit('agent_update', {'agents': [a.to_dict() for a in agents.values()]})

@socketio.on('get_logs')
def handle_get_logs(data):
    agent_id = data.get('agent_id')
    if agent_id in agents:
        emit('agent_logs', {
            'agent_id': agent_id,
            'logs': agents[agent_id].logs
        })

@socketio.on('get_desktop')
def handle_get_desktop(data):
    agent_id = data.get('agent_id')
    if agent_id in agents:
        agent = agents[agent_id]
        emit('agent_desktop', {
            'agent_id': agent_id,
            'cwd': agent.cwd,
            'files': agent.files,
            'recent_commands': [
                f"cd {agent.cwd}",
                "ls -la",
                f"echo 'Running: {agent.task}'",
                "python script.py"
            ]
        })

@socketio.on('get_stats')
def handle_get_stats():
    total = len(agents)
    active = len([a for a in agents.values() if a.status == "running"])
    completed = len([a for a in agents.values() if a.status == "completed"])
    errors = len([a for a in agents.values() if a.status == "error"])
    
    emit('dashboard_stats', {
        'total': total,
        'active': active,
        'completed': completed,
        'errors': errors
    })

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
```

## TASK 2: Create Frontend (frontend/src/App.js)

Replace with complete implementation:

```javascript
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, errors: 0 });
  const [showLogs, setShowLogs] = useState(null);
  const [showDesktop, setShowDesktop] = useState(null);
  const [logs, setLogs] = useState([]);
  const [desktop, setDesktop] = useState(null);
  const [newAgent, setNewAgent] = useState({ task: '', model: 'default', timeout: 300 });

  useEffect(() => {
    const s = io('http://localhost:5000');
    setSocket(s);

    s.on('connect', () => {
      console.log('Connected to server');
      s.emit('get_stats');
    });

    s.on('agent_update', (data) => {
      setAgents(data.agents);
    });

    s.on('dashboard_stats', (data) => {
      setStats(data);
    });

    s.on('agent_logs', (data) => {
      setLogs(data.logs);
    });

    s.on('agent_desktop', (data) => {
      setDesktop(data);
    });

    // Refresh stats periodically
    const interval = setInterval(() => {
      s.emit('get_stats');
    }, 1000);

    return () => {
      clearInterval(interval);
      s.disconnect();
    };
  }, []);

  const spawnAgent = () => {
    if (!newAgent.task) return;
    socket.emit('spawn_agent', newAgent);
    setNewAgent({ task: '', model: 'default', timeout: 300 });
  };

  const stopAgent = (agentId) => {
    socket.emit('stop_agent', { agent_id: agentId });
  };

  const terminateAgent = (agentId) => {
    socket.emit('terminate_agent', { agent_id: agentId });
  };

  const viewLogs = (agentId) => {
    setShowLogs(agentId);
    socket.emit('get_logs', { agent_id: agentId });
  };

  const viewDesktop = (agentId) => {
    setShowDesktop(agentId);
    socket.emit('get_desktop', { agent_id: agentId });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return '#4ecca3';
      case 'idle': return '#ffc107';
      case 'error': return '#e74c3c';
      case 'completed': return '#3498db';
      case 'stopped': return '#95a5a6';
      default: return '#fff';
    }
  };

  return (
    <div className="App">
      <header className="dashboard-header">
        <h1>🦞 Agent Dashboard</h1>
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Agents</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{color: '#4ecca3'}}>{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{color: '#3498db'}}>{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{color: '#e74c3c'}}>{stats.errors}</span>
            <span className="stat-label">Errors</span>
          </div>
        </div>
      </header>

      <div className="spawn-section">
        <h2>Spawn New Agent</h2>
        <div className="spawn-form">
          <input
            type="text"
            placeholder="Enter task description..."
            value={newAgent.task}
            onChange={(e) => setNewAgent({...newAgent, task: e.target.value})}
          />
          <select
            value={newAgent.model}
            onChange={(e) => setNewAgent({...newAgent, model: e.target.value})}
          >
            <option value="default">Default Model</option>
            <option value="kimi-k2.5">Kimi K2.5</option>
            <option value="nemotron-3">Nemotron 3</option>
            <option value="claude">Claude</option>
          </select>
          <input
            type="number"
            placeholder="Timeout (seconds)"
            value={newAgent.timeout}
            onChange={(e) => setNewAgent({...newAgent, timeout: parseInt(e.target.value)})}
          />
          <button onClick={spawnAgent} className="spawn-btn">🚀 Spawn Agent</button>
        </div>
      </div>

      <div className="agents-section">
        <h2>Active Agents ({agents.length})</h2>
        <div className="agent-grid">
          {agents.map(agent => (
            <div key={agent.id} className="agent-card" style={{borderLeftColor: getStatusColor(agent.status)}}>
              <div className="agent-header">
                <h3>{agent.id}</h3>
                <span className="status-badge" style={{backgroundColor: getStatusColor(agent.status)}}>
                  {agent.status}
                </span>
              </div>
              
              <div className="agent-info">
                <p><strong>Task:</strong> {agent.task}</p>
                <p><strong>Model:</strong> {agent.model}</p>
                <p><strong>Runtime:</strong> {agent.runtime}s</p>
                <p><strong>Tokens:</strong> {agent.tokens_used.toLocaleString()}</p>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${agent.progress}%`}}></div>
                <span className="progress-text">{agent.progress}%</span>
              </div>

              <div className="agent-controls">
                <button onClick={() => stopAgent(agent.id)} className="btn-stop" title="Force Stop">🔴 Stop</button>
                <button onClick={() => terminateAgent(agent.id)} className="btn-close" title="Graceful Close">🟡 Close</button>
                <button onClick={() => viewLogs(agent.id)} className="btn-logs" title="View Logs">📄 Logs</button>
                <button onClick={() => viewDesktop(agent.id)} className="btn-desktop" title="View Desktop">🖥️ Desktop</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs Modal */}
      {showLogs && (
        <div className="modal" onClick={() => setShowLogs(null)}>
          <div className="modal-content logs-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Agent Logs: {showLogs}</h3>
              <button className="close-btn" onClick={() => setShowLogs(null)}>×</button>
            </div>
            <div className="logs-content">
              {logs.map((log, i) => (
                <div key={i} className="log-line">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Modal */}
      {showDesktop && desktop && (
        <div className="modal" onClick={() => setShowDesktop(null)}>
          <div className="modal-content desktop-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🖥️ Agent Desktop: {showDesktop}</h3>
              <button className="close-btn" onClick={() => setShowDesktop(null)}>×</button>
            </div>
            <div className="desktop-content">
              <div className="desktop-section">
                <h4>Current Directory</h4>
                <code className="cwd">{desktop.cwd}</code>
              </div>
              <div className="desktop-section">
                <h4>Files</h4>
                <ul className="file-list">
                  {desktop.files.map((file, i) => (
                    <li key={i}>📁 {file}</li>
                  ))}
                </ul>
              </div>
              <div className="desktop-section">
                <h4>Recent Commands</h4>
                <div className="terminal">
                  {desktop.recent_commands.map((cmd, i) => (
                    <div key={i} className="terminal-line">
                      <span className="prompt">$</span> {cmd}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
```

## TASK 3: Create Styling (frontend/src/App.css)

Create this file:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #fff;
}

.App {
  min-height: 100vh;
  padding: 20px;
}

/* Header & Stats */
.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stats-bar {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  background: #16213e;
  padding: 20px 30px;
  border-radius: 12px;
  text-align: center;
  min-width: 150px;
}

.stat-value {
  display: block;
  font-size: 2.5rem;
  font-weight: bold;
  color: #fff;
}

.stat-label {
  display: block;
  margin-top: 5px;
  color: #8b9dc3;
  font-size: 0.9rem;
}

/* Spawn Section */
.spawn-section {
  background: #16213e;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.spawn-section h2 {
  margin-bottom: 15px;
  color: #fff;
}

.spawn-form {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.spawn-form input,
.spawn-form select {
  padding: 12px 16px;
  border: 1px solid #2d3561;
  border-radius: 8px;
  background: #0f1538;
  color: #fff;
  font-size: 14px;
  min-width: 200px;
}

.spawn-form input:focus,
.spawn-form select:focus {
  outline: none;
  border-color: #667eea;
}

.spawn-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.spawn-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

/* Agents Section */
.agents-section h2 {
  margin-bottom: 20px;
  color: #fff;
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.agent-card {
  background: #16213e;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid;
  transition: transform 0.2s, box-shadow 0.2s;
}

.agent-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.agent-header h3 {
  font-size: 1.1rem;
  color: #fff;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #1a1a2e;
}

.agent-info p {
  margin: 8px 0;
  color: #a0aec0;
  font-size: 0.9rem;
}

.agent-info strong {
  color: #e2e8f0;
}

/* Progress Bar */
.progress-bar {
  height: 8px;
  background: #0f1538;
  border-radius: 4px;
  margin: 15px 0;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  right: 0;
  top: -20px;
  font-size: 0.75rem;
  color: #8b9dc3;
}

/* Agent Controls */
.agent-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.agent-controls button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-stop {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.btn-stop:hover {
  background: #e74c3c;
  color: white;
}

.btn-close {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.btn-close:hover {
  background: #ffc107;
  color: #1a1a2e;
}

.btn-logs {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.btn-logs:hover {
  background: #3498db;
  color: white;
}

.btn-desktop {
  background: rgba(78, 204, 163, 0.2);
  color: #4ecca3;
}

.btn-desktop:hover {
  background: #4ecca3;
  color: #1a1a2e;
}

/* Modals */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #16213e;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #2d3561;
}

.modal-header h3 {
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: #8b9dc3;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #fff;
}

/* Logs Modal */
.logs-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.log-line {
  padding: 6px 0;
  color: #a0aec0;
  border-bottom: 1px solid #1a2744;
}

.log-line:hover {
  background: #1a2744;
}

/* Desktop Modal */
.desktop-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.desktop-section {
  margin-bottom: 20px;
}

.desktop-section h4 {
  color: #8b9dc3;
  margin-bottom: 10px;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.cwd {
  display: block;
  padding: 10px;
  background: #0f1538;
  border-radius: 6px;
  color: #4ecca3;
  font-family: monospace;
}

.file-list {
  list-style: none;
}

.file-list li {
  padding: 8px;
  color: #a0aec0;
}

.terminal {
  background: #0f1538;
  border-radius: 8px;
  padding: 15px;
  font-family: 'Courier New', monospace;
}

.terminal-line {
  padding: 4px 0;
  color: #a0aec0;
}

.prompt {
  color: #4ecca3;
  margin-right: 8px;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #0f1538;
}

::-webkit-scrollbar-thumb {
  background: #2d3561;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3d4a7a;
}

/* Responsive */
@media (max-width: 768px) {
  .agent-grid {
    grid-template-columns: 1fr;
  }
  
  .spawn-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .spawn-form input,
  .spawn-form select {
    width: 100%;
  }
  
  .stats-bar {
    justify-content: center;
  }
}
```

## TASK 4: Update Requirements (backend/src/requirements.txt)

Make sure it has:
```
flask==2.3.3
flask-socketio==5.3.6
python-socketio==5.9.0
eventlet==0.33.3
```

## TASK 5: Test Everything

1. Install dependencies:
   - Backend: `pip install -r requirements.txt`
   - Frontend: `npm install` (need socket.io-client: `npm install socket.io-client`)

2. Start servers:
   - Backend: `python backend/src/app.py`
   - Frontend: `npm start`

3. Test all features work:
   - Spawn an agent
   - See real-time updates
   - Stop/Close agents
   - View logs
   - View desktop
   - Check dashboard stats update

## DELIVERABLE

A fully working Agent Dashboard with all requested features:
- ✅ Real-time agent monitoring
- ✅ Agent spawning interface
- ✅ Force stop / graceful close controls
- ✅ View logs modal
- ✅ View desktop (virtual environment) modal
- ✅ Dashboard stats overview
- ✅ Dark theme styling
- ✅ WebSocket real-time updates