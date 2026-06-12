const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:1005').trim();

// Automatically clean up trailing slashes and '/api' suffix to prevent path duplication
export const BACKEND_URL = rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');
export const API_BASE = `${BACKEND_URL}/api`;
