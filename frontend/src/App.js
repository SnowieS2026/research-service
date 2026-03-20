import React, { useEffect, useState } from 'react';
import './App.css';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, errors: 0 });
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [logs, setLogs] = useState('');
  const [desktop, setDesktop] = useState({ cwd: '', files: [], recent_commands: [] });

  // Load initial data
  useEffect(() => {
    socket.emit('get_stats');
    socket.emit('get_logs', { agent_id: 'all' });
  }, []);

  // Handle incoming stats
  useEffect(() => {
    socket.on('dashboard_stats', (data) => {
      setStats(data);
    });
  }, [stats]);

  // Handle incoming agent updates
  useEffect(() => {
    socket.on('agent_update', (data) => {
      setAgents(data.agents);
    });
  }, [agents]);

  // Handle logs
  useEffect(() => {
    socket.on('agent_logs', (data) => {
      setLogs(data.logs.join('\n'));
    });
  }, [logs]);

  // Handle desktop info
  useEffect(() => {
    socket.on('agent_desktop', (data) => {
      setDesktop(data);
    });
  }, [desktop]);

  const handleSpawnAgent = () => {
    const task = prompt('Enter agent task:');
    if (task) {
      socket.emit('spawn_agent', { task, model: 'default', timeout: 300 });
    }
  };

  const handleStopAgent = (agentId) => {
    socket.emit('stop_agent', { agent_id: agentId });
  };

  const handleTerminateAgent = (agentId) => {
    socket.emit('terminate_agent', { agent_id: agentId });
  };

  const handleGetLogs = (agentId) => {
    socket.emit('get_logs', { agent_id: agentId });
  };

  const handleGetDesktop = (agentId) => {
    socket.emit('get_desktop', { agent_id: agentId });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Agent Dashboard</h1>
        <button onClick={handleSpawnAgent}>Spawn Agent</button>
      </header>
      <main>
        <section>
          <h2>Agents</h2>
          {agents.map((agent) => (
            <div key={agent.id} className="agent-card">
              <div>
                <strong>ID:</strong> {agent.id} <strong>{'Running' if agent.status === 'running' : agent.status === 'completed' ? 'Completed' : 'Stopped'}</strong>
              </div>
              <div>
                Task: {agent.task}
              </div>
              <div>
                Status: {agent.status}
              </div>
              <div>
                Progress: {agent.progress}%
              </div>
              <div>
                Tokens Used: {agent.tokens_used}
              </div>
              <button onClick={() => handleStopAgent(agent.id)}>Stop</button>
              <button onClick={() => handleTerminateAgent(agent.id)}>Terminate</button>
              <button onClick={() => handleGetLogs(agent.id)}>Get Logs</button>
              <button onClick={() => handleGetDesktop(agent.id)}>Desktop</button>
            </div>
          ))}
        </section>

        <section>
          <h2>Statistics</h2>
          <ul>
            <li>Total Agents: {stats.total}</li>
            <li>Active: {stats.active}</li>
            <li>Completed: {stats.completed}</li>
            <li>Errors: {stats.errors}</li>
          </ul>
        </section>

        <section>
          <h2>Detailed View</h2>
          {selectedAgent && (
            <div>
              <h3>Logs</h3>
              <pre>{logs}</pre>
            </div>
          )}
          <div>
            <h3>Desktop Info</h3>
            <ul>
              <li>CWD: {desktop.cwd}</li>
              <li>Files: {desktop.files.join(', ')}</li>
              <li>Recent Commands: {desktop.recent_commands.join('; ')}</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;