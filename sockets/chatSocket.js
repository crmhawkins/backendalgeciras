/**
 * chatSocket.js
 * Configura namespace Socket.io para chat de Fan Zone por partido
 */

const { getHistory, addMessage } = require('../services/chatService');

function initChatSocket(io) {
    io.on('connection', (socket) => {
        console.log(`[Chat] Cliente conectado: ${socket.id}`);

        // Cliente se une a sala de un partido
        socket.on('join_partido', (partidoId) => {
            if (!partidoId) return;

            const room = String(partidoId);
            socket.join(room);
            console.log(`[Chat] ${socket.id} joined room partido_${room}`);

            // Enviar historial al cliente
            const history = getHistory(room);
            socket.emit('history', history);
        });

        // Cliente envía mensaje
        socket.on('send_message', ({ partidoId, mensaje, userName }) => {
            if (!partidoId || !mensaje || !userName) return;

            const msg = addMessage(partidoId, { userName, mensaje });

            // Broadcast a todos en la sala (incluido emisor)
            io.to(String(partidoId)).emit('new_message', msg);
        });

        socket.on('disconnect', () => {
            console.log(`[Chat] Cliente desconectado: ${socket.id}`);
        });
    });
}

module.exports = { initChatSocket };
