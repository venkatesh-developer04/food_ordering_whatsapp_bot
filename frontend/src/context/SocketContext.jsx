import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [waStatus, setWaStatus] = useState('connecting');

    useEffect(() => {
        const s = io('http://localhost:5000', { transports: ['websocket'] });
        setSocket(s);

        s.on('connect', () => console.log('Socket connected'));
        s.on('whatsapp-ready', () => setWaStatus('connected'));
        s.on('whatsapp-disconnected', () => setWaStatus('disconnected'));
        s.on('whatsapp-qr', () => setWaStatus('qr'));

        return () => s.disconnect();
    }, []);

    return (
        <SocketContext.Provider value={{ socket, waStatus }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
