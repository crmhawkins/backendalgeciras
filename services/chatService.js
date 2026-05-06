/**
 * chatService.js
 * In-memory store: últimos 50 mensajes por partidoId
 */

const { v4: uuidv4 } = require('uuid');

const MAX_MESSAGES = 50;

// Map<partidoId, Message[]>
const rooms = new Map();

function getHistory(partidoId) {
    return rooms.get(String(partidoId)) || [];
}

function addMessage(partidoId, { userName, mensaje }) {
    const key = String(partidoId);
    if (!rooms.has(key)) rooms.set(key, []);

    const msg = {
        id: uuidv4(),
        userName,
        mensaje,
        timestamp: new Date().toISOString(),
    };

    const msgs = rooms.get(key);
    msgs.push(msg);

    // Mantener solo últimos 50
    if (msgs.length > MAX_MESSAGES) {
        msgs.splice(0, msgs.length - MAX_MESSAGES);
    }

    return msg;
}

module.exports = { getHistory, addMessage };
