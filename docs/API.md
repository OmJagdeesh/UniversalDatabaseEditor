# API Documentation

Base path: `/api`

## Health

`GET /api/health`

Returns basic server status.

```json
{
  "data": {
    "status": "ok",
    "environment": "development",
    "uptimeSeconds": 12
  }
}
```

## Providers

`GET /api/providers`

Returns registered database provider metadata.

```json
{
  "data": [
    {
      "type": "sqlite",
      "displayName": "SQLite",
      "capabilities": {
        "fileBased": true,
        "connectionString": false,
        "schemas": true,
        "collections": false,
        "sql": true
      }
    }
  ]
}
```

Feature endpoints for connections, explorer data, records, schema inspection, query execution, imports, and exports are intentionally not implemented in the initial scaffold.
