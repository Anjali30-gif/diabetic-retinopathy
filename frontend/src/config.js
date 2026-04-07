const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || API_BASE;

export { SOCKET_BASE };
export default API_BASE;