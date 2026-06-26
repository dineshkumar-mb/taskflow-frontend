import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.MODE === 'production' ? 'https://taskflow-backend-rust.vercel.app' : 'http://localhost:5001');

const URL = BACKEND_URL;

export const socket = io(URL, {
    autoConnect: false,
    withCredentials: true,
    reconnectionAttempts: 3, // Stop trying after 3 attempts
});

socket.on("connect_error", (err) => {
    console.warn("Socket connection failed. If backend is on Vercel, WebSockets are not supported. Error:", err.message);
    if (socket.io.engine) {
        socket.io.engine.close(); // Stop polling
    }
});
