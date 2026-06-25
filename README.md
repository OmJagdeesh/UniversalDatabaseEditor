# Universal Database Editor

Architecture-first scaffold for a browser-based database editor supporting SQLite, PostgreSQL, and MongoDB.

This repository follows the onboarding guidance:

- Clear module boundaries and small responsibilities.
- Express layered architecture: Routes -> Controllers -> Services -> Providers.
- Provider-based database support so new database engines can be added by implementing and registering a provider.
- No hardcoded secrets. Local configuration belongs in `.env` files.

## Project Structure

```text
client/   React + Vite + Tailwind frontend
server/   Node.js + Express backend
docs/     Architecture and API documentation
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create local environment files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Run both apps in development:

```bash
npm run dev
```

Run checks:

```bash
npm run build
```

## Current Scope

This commit initializes the project and implements the basic architecture only. Assignment features such as creating connections, browsing data, editing records, importing/exporting, and query execution are intentionally not implemented yet.
