/** Backend origin (scheme + host, no path). Local dev: leave unset to use Vite proxy for /api and /ws. */
const backendOrigin = import.meta.env.VITE_BACKEND_URL?.trim();

export const apiBaseURL = backendOrigin
  ? `${backendOrigin.replace(/\/$/, '')}/api`
  : '/api';

export const wsURL = backendOrigin
  ? `${backendOrigin.replace(/\/$/, '')}/ws`
  : '/ws';
