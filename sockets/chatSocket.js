/**
 * chatSocket.js
 * Configura namespace Socket.io para chat de Fan Zone por partido
 */

const { getHistory, addMessage } = require('../services/chatService');

const MAX_MSG_LENGTH = 200;
// Rate limit: 1 mensaje/segundo por socket
const lastMessageTime = new Map();

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
            // Validar campos requeridos
            if (!partidoId || !mensaje || !userName) return;

            // Sanitizar mensaje
            const mensajeSanitizado = String(mensaje).trim().slice(0, MAX_MSG_LENGTH);
            if (!mensajeSanitizado) return;

            // Rate limit: 1 msg/segundo por socket
            const now = Date.now();
            const last = lastMessageTime.get(socket.id) || 0;
            if (now - last < 1000) {
                socket.emit('rate_limit', { msg: 'Demasiados mensajes. Espera un momento.' });
                return;
            }
            lastMessageTime.set(socket.id, now);

            const msg = addMessage(partidoId, { userName: String(userName).trim(), mensaje: mensajeSanitizado });

            // Broadcast a todos en la sala (incluido emisor)
            io.to(String(partidoId)).emit('new_message', msg);
        });

        socket.on('disconnect', () => {
            console.log(`[Chat] Cliente desconectado: ${socket.id}`);
            lastMessageTime.delete(socket.id);
        });
    });
}

module.exports = { initChatSocket };
