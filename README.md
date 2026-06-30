# TaskFlow - Frontend

A React-based web interface for an AI-powered Sprint Management SaaS platform.

## 🚀 What Was Built

A responsive, Jira-inspired frontend application that enables teams to manage agile sprints, track issues, and orchestrate projects. It connects to a Node.js backend to provide real-time updates and integrates an AI copilot interface allowing users to create tasks and analyze project risk using natural language.

## 💡 Why It's Technically Interesting

The application seamlessly blends standard Kanban board interactions with natural language conversational commands. The UI dynamically responds to structured AI payloads, converting a single user prompt like "estimate story points for this bug" into an interactive, actionable component on the dashboard. 

## 🛠️ Architecture

- **Frontend Stack:** React.js, TailwindCSS (or similar styling framework).
- **Hosting:** Vercel (Live Demo: https://taskflow-frontend-self.vercel.app/).
- **API Integration:** Connects via REST to the Node.js backend, handling authentication and data persistence.
- **Billing Integration:** Client-side routing to Cashfree Subscription Management portals for plan upgrades.

## RBAC & Cashfree Billing Flow

- **Role-Based Access Control:** The frontend dynamically renders UI elements based on the user's role (Admin, Member, Viewer). Permissions dictate whether a user can initiate billing upgrades or edit sprint configurations.
- **Subscription Management:** Clicking "Upgrade" triggers the backend to create a Cashfree Checkout Session. Cashfree webhooks instantly notify the backend of successful payments, which the frontend polls/fetches to instantly unlock 'Pro' features (like unlimited AI Copilot usage).

## Getting Started

### Prerequisites
- Node.js v22

### Installation

```bash
git clone https://github.com/dineshkumar-mb/taskflow-frontend
cd taskflow-frontend
npm install
```

### Running the App

```bash
npm run dev
```

## Environment Variables

Create a `.env` file with the necessary required keys (e.g., backend URL mapping):
- `VITE_API_URL` (or equivalent)

## License
MIT License
