import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

let socket: Socket;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};