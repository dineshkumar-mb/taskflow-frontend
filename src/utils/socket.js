import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.MODE === 'production' ? 'https://taskflow-backend-rust.vercel.app' : 'http://localhost:5001');

const URL = BACKEND_URL;

export const socket = io(URL, {
    autoConnect: false,
    withCredentials: true,
});
