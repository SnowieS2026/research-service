# Agent Dashboard Prototype

A mock-up of a real-time Agent Dashboard using React (frontend) and FastAPI with Socket.IO (backend).

## Folder Structure

```
agent-dashboard/
├─ frontend/          # React app
│  ├─ public/
│  ├─ src/
│  ├─ package.json
│  └─ README.md
└─ backend/
   ├─ src/
   │   ├─ app.py
   │   └─ requirements.txt
   └─ README.md
```

## Running the Prototype

### Backend

1. Navigate to `backend/src`.
2. Create a virtual environment: `python -m venv venv`.
3. Activate: `venv\\Scripts\\activate`.
4. Install dependencies: `pip install -r requirements.txt`.
5. Run: `python app.py`.

The backend will listen on `http://localhost:5000`.

### Frontend

1. Navigate to `frontend`.
2. Install dependencies: `npm install`.
3. Start dev server: `npm start`.

The UI will be available at `http://localhost:3000`.

Both services communicate via WebSocket (Socket.IO) for real-time updates.

## Features Implemented (Prototype)

- **Agent Spawning Interface**: Placeholder UI to add agents.
- **Real-time Monitoring**: Live updates of agent status via WebSocket.
- **Agent Control Panel**: Buttons to stop/terminate agents (mock actions).
- **Dashboard Overview**: Summary stats displayed on the page.

## Next Steps

- Integrate with OpenClaw subagent system APIs.
- Add authentication for agent control actions.
- Store agent state persistently.
- Enhance UI/UX with charts and detailed logs.
