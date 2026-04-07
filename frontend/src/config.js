const VITE_API_URL = import.meta.env.VITE_API_URL;
const API_BASE = VITE_API_URL || 'http://127.0.0.1:5000';
const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || API_BASE;
const GH_PAGES_HOSTNAME = typeof window !== 'undefined' && window.location.hostname === 'anjali30-gif.github.io';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || (!VITE_API_URL && GH_PAGES_HOSTNAME);

export { SOCKET_BASE, DEMO_MODE };
export default API_BASE;