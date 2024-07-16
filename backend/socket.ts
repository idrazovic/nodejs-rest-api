import { Server } from "socket.io";

let io: Server;

const init = (httpServer: Server) => {
    io = require('socket.io')(httpServer, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        },
        allowEIO3: true
    });
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

export { init, getIO };

