// Use current origin if in production/Vercel (relative path), otherwise localhost for dev
// Actually, for Vercel with rewrites, we can just use relative paths '/api/...'
// But for local dev (vite on 5173, node on 5000), we need the full URL unless we proxy.
// Given the existing setup doesn't use a proxy in vite.config.js, let's use a helper.

const getApiUrl = () => {
    if (import.meta.env.PROD) {
        return ''; // Relative path for production (Vercel rewrites handle /api)
    }
    return 'http://localhost:5000'; // Hardcoded local dev URL
};

export const API_URL = getApiUrl();
