# Universal Database Editor

A browser-based database editor supporting **SQLite**, **PostgreSQL**, and **MongoDB** through a single interface. Connect to multiple database systems, explore schemas, browse and edit data, run queries, and import/export — all from one web application.

## Features

| Module | Description |
|---|---|
| **Connection Manager** | Create, edit, delete, favorite, and reconnect database connections. Supports SQLite file upload, PostgreSQL host/connection string, and MongoDB URI. |
| **Database Explorer** | Tree view of tables/collections, views, and indexes. Click any item to open it. |
| **Data Viewer** | Paginated data grid with column sorting, filtering, row selection, and inline edit/delete actions. |
| **Record Editor** | Create new records, edit existing ones, and bulk-delete with confirmation dialogs. |
| **Query Playground** | Write and execute SQL or MongoDB queries with Ctrl+Enter shortcut, result grid, query history, dangerous query confirmation, and CSV export. |
| **Schema Viewer** | View column details (name, type, nullable, default, primary key), CREATE TABLE statements, and MongoDB indexes. |
| **Import / Export** | Export tables as CSV, JSON, or SQL dump. Import data from CSV or JSON files. |

## Architecture

- **Frontend:** React + Vite + Tailwind CSS — component-based with reusable UI primitives.
- **Backend:** Node.js + Express — layered architecture: Routes → Controllers → Services → Providers.
- **Provider pattern:** Database-specific logic is isolated in providers (SQLiteProvider, PostgreSQLProvider, MongoProvider). Adding a new database requires implementing one provider and registering it.
- **Security:** Credentials encrypted at rest, dangerous queries require confirmation, no secrets in code.

## Project Structure

```text
client/                         React + Vite + Tailwind frontend
├── src/
│   ├── app/AppShell.jsx        Main layout and view routing
│   ├── components/
│   │   ├── layout/             Sidebar, TopBar (responsive)
│   │   └── ui/                 Button, Modal, Spinner, Toast, ConfirmDialog, EmptyState
│   ├── features/
│   │   ├── connections/        ConnectionManager, ConnectionForm
│   │   ├── data/               DataViewer, RecordEditor
│   │   ├── explorer/           DatabaseExplorer (tree view)
│   │   ├── importExport/       ImportExportPanel
│   │   ├── query/              QueryPlayground
│   │   └── schema/             SchemaViewer
│   └── shared/
│       ├── api/                API modules for each backend route group
│       └── hooks/              useApi, useApiCallback
server/                         Node.js + Express backend
├── src/
│   ├── routes/                 HTTP route definitions
│   ├── controllers/            Request/response translation
│   ├── services/               Business logic and workflows
│   ├── providers/              Database-specific implementations
│   │   ├── sqlite/
│   │   ├── postgres/
│   │   └── mongo/
│   ├── middleware/              Error handling, file uploads
│   └── utils/                  Validation, crypto, query guard
docs/                           Architecture and API documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

```bash
npm install
```

### Create local environment files

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

### Run in development

```bash
npm run dev
```

This starts both the frontend (http://127.0.0.1:5173) and the backend (http://127.0.0.1:4000) concurrently.

### Build for production

```bash
npm run build
```

## API Overview

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/providers` | List available database providers |
| `GET` | `/api/connections` | List all connections |
| `POST` | `/api/connections` | Create a new connection |
| `POST` | `/api/connections/test` | Test connection without saving |
| `GET` | `/api/connections/:id` | Get a single connection |
| `PUT` | `/api/connections/:id` | Update a connection |
| `DELETE` | `/api/connections/:id` | Delete a connection |
| `POST` | `/api/connections/:id/reconnect` | Reconnect |
| `PATCH` | `/api/connections/:id/favorite` | Toggle favorite |
| `GET` | `/api/connections/:id/explorer` | Get database tree (tables, views, indexes) |
| `GET` | `/api/connections/:id/tables/:table/rows` | Get paginated rows |
| `POST` | `/api/connections/:id/tables/:table/rows` | Insert a row |
| `PUT` | `/api/connections/:id/tables/:table/rows/:pk` | Update a row |
| `DELETE` | `/api/connections/:id/tables/:table/rows` | Delete rows |
| `POST` | `/api/connections/:id/query` | Execute a query |
| `GET` | `/api/connections/:id/tables/:table/schema` | Get table schema |
| `GET` | `/api/connections/:id/tables/:table/export` | Export table (CSV/JSON/SQL) |
| `POST` | `/api/connections/:id/tables/:table/import` | Import data (CSV/JSON) |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 3 |
| Backend | Node.js, Express 4 |
| SQLite | better-sqlite3 |
| PostgreSQL | pg |
| MongoDB | mongodb (native driver) |
| Validation | Zod |
| File Upload | Multer |
