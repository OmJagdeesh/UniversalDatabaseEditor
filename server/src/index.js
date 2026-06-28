import { createApp } from './app.js';
import { env } from './config/env.js';
import { initConnections } from './services/connection.service.js';

const app = createApp();

// Restore persisted connections before accepting requests
await initConnections();

app.listen(env.port, () => {
  console.log(`API server listening on http://127.0.0.1:${env.port}`);
});
