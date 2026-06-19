const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:1005').trim();

// Automatically clean up trailing slashes and '/api' suffix to prevent path duplication
export const BACKEND_URL = rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');
export const API_BASE = `${BACKEND_URL}/api`;

export const getAbsoluteUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/uploads')) {
    return `${BACKEND_URL}${trimmed}`;
  }
  if (trimmed.includes('localhost:1005') && !BACKEND_URL.includes('localhost:1005')) {
    return trimmed.replace(/^https?:\/\/localhost:1005/, BACKEND_URL);
  }
  return trimmed;
};
