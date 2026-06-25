import { env } from '../config/env.js';

export async function getHealthStatus() {
  return {
    status: 'ok',
    environment: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime())
  };
}
