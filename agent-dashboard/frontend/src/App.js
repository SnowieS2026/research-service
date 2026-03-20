import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

// Simple placeholder component for the dashboard
const App = () => {
  const [agents, setAgents] = useState([]);
  const [logsModal, setLogsModal] = useState(null);
  const [desktopModal, setDesktopModal] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Connect to backend via Socket.IO
    const socket = io('http://localhost:5000');

    // Listen for events
    socket.on('agent_update', (data) => {
      console.log('Received agent_update:', data);
      // Update agents state or perform related actions
      setAgents(data.agents || []);
    });

    socket.on('dashboard_stats', (data) => {
      console.log('Received dashboard_stats:', data);
      setStats(data);
    });

    // Emit events
    socket.emit('spawn_agent', { userId: 'me', command: 'SUMMARIZE_COMMANDS' });
    socket.emit('stop_agent', { userId: 'me' });

    // Fetch stats on mount
    socket.emit('get_stats');

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // Updated Stats Header with Dashboard Stats
  const statsBar = (
    <div className="stats-bar">
      <div>Total: {agents.length}</div>
      <div>Active: {agents.filter(a => a.status === 'running').length}</div>
      <div>Completed: {agents.filter(a => a.status === 'completed').length}</div>
      <div>Errors: {agents.filter(a => a.status === 'error').length}</div>
    </div>
  );

  // Spawn Agent Form
  const spawnForm = (
    <div className="spawn-form">
      <input type="text" placeholder="Task description" />
      <select>
        <option value="model1">Model 1</option>
        <option value="model2">Model 2</option>
      </select>
      <button onClick={() => spawnAgent('sample task')}>Spawn Agent</button>
    </div>
  );

  // Enhanced Agent Cards
  const agentCards = agents.map(agent => (
    <div className={`agent-card ${agent.status}`} key={agent.id}>
      <h3>{agent.id}</h3>
      <p>Status: {agent.status}</p>
      <p>Task: {agent.task}</p>
      <p>Runtime: {agent.runtime}s</p>
      <p>Tokens: {agent.tokens_used}</p>
      <div className="progress-bar"><div style={{width: agent.progress + '%'}}></div></div>
      <button onClick={() => stopAgent(agent.id)}>Force Stop</button>
      <button onClick={() => terminateAgent(agent.id)}>Close</button>
      <button onClick={() => viewLogs(agent.id)}>View Logs</button>
      <button onClick={() => viewDesktop(agent.id)}>View Desktop</button>
    </div>
  ));

  // Function to spawn an agent via Socket.IO
  const spawnAgent = (task) => {
    // In a real app, would send message to backend
    console.log('Spawning agent with task:', task);
  };

  // Function to stop an agent
  const stopAgent = (agentId) => {
    console.log('Stopping agent:', agentId);
  };

  // Function to terminate an agent
  const terminateAgent = (agentId) => {
    console.log('Terminating agent:', agentId);
  };

  // Function to view logs
  const viewLogs = (agentId) => {
    console.log('Viewing logs for:', agentId);
  };

  // Function to view desktop
  const viewDesktop = (agentId) => {
    console.log('Viewing desktop for:', agentId);
  };

  return (
    <div className="App">
      {statsBar}
      {spawnForm}
      <div className="agent-grid">{agentCards}</div>
      {logsModal && <div>Logs Modal would be here</div>}
      {desktopModal && <div>Desktop Modal would be here</div>}
    </div>
  );
};

export default App;