# Fikable - digital protector for office's wellbeingness

Fikable is an AI-powered, privacy-first B2B enterprise platform designed for early burnout detection and intervention. By mapping enterprise telemetry against the 6 pillars of the Maslach Burnout Inventory, Fikable provides personalized employee wellness nudges and macro-level organizational insights.

## Feature
- **Multi-Layer Architecture:** Clean separation of concerns with Data Extraction (Layer 1), AI Analytics & Digital Twin Simulation (Layer 2), and Application Action (Layer 3).
- **Maslach Burnout Inventory Integration:** Telemetry mapped directly to Workload, Control, Reward, Community, Fairness, and Values.

- **Predictive "What-If" Simulations:** Evaluates proposed schedule changes against an employee's current cognitive load.

- **Interactive Slack Integration:** Actionable "Fika" nudges delivered via Slack Block Kit with built-in interactivity.

- **Privacy-First HR Dashboard:** Aggregates and anonymizes data by role to provide macro-level insights to leadership without compromising individual employee privacy.

- **Local LLM Powered:** Fully runs on local LLMs ensuring data never leaves the enterprise environment.

## Tech Stack
- **Backend:** FastAPI, Python, ChromaDB (Vector Search)
- **AI Engine:** Ollama (Gemma4)
- **Frontend:** Lovable Vite/React (Bun/Node)
- **Integrations:** Slack Webhooks (Block Kit)

## Installation & Quick Start
### Prerequisites
- **Ollama** installed with the gemma4 model pulled.
- **Python 3.10+**
- **Bun** (or **npm**/**yarn**) - *recommend to run in local first, test then patch all vulnerabilites before deploying to cloud/public hosted.*

### 1. Boot up the AI Brain

Start your local LLM instance in a dedicated terminal:
```Bash
ollama run gemma4 # or qwen3.5, config in backend via environment variables, or using dotenv for file reading
```

### 2. Start the Backend Server

Navigate to the backend directory, configure your environment, and start the FastAPI server:

```Bash
cd backend
pip install -r requirements.txt

# Configure your environment variables
cp .env.example .env

# Start the server
python main.py
```
The API will be available at `http://localhost:8000`.

### 3. Start the Frontend

Navigate to the project root to spin up the Lovable UI:

```Bash
npm install
npm run dev
```

### 4. Slack Integration Setup (Demo Mode)

To enable interactive Slack nudges during a live presentation:

- Provide your Slack Webhook URL in the backend `.env` file (SLACK_WEBHOOK_URL).

- Expose your local port via ngrok: `ngrok http 8000`.

- Set the ngrok URL + `/api/slack/interactive` as the Interactivity Request URL in your Slack App settings.

## Repository Structure

```text
hiicathon-vinnare/
├── backend/
│   ├── classes/             # Vector DB configurations (ChromaDB)
│   ├── data/                # Mock datasets (mock_profiles.json)
│   ├── modules/
│   │   ├── integrations/    # Slack webhook connectors
│   │   ├── layer_1/         # ETL, Crawlers, and Data Normalizers
│   │   ├── layer_2/         # AI Analytics & Continuous Learning Loop
│   │   └── layer_3/         # Core Application Logic & Admin Aggregation
│   ├── main.py              # FastAPI Application Entrypoint
│   └── demo_trigger.py      # Automated pitch demonstration script
├── frontend/                # Lovable Vite/React Application
├── package.json
└── .gitignore
```

## API Overview

- `POST /api/fikable/full_sync`
Triggers the individual employee ETL pipeline, runs L2 simulations, and pushes L3 actions (like interactive Slack nudges).

- `GET /api/fikable/admin/dashboard`
Generates anonymous, macro-level organizational insights grouped by role for HR teams.

- `POST /api/slack/interactive`
Webhook catcher for processing interactive Slack Block Kit button payloads.