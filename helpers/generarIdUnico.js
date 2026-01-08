const crypto = require('crypto');

/**
 * Genera un ID único de 64 caracteres (letras y números)
 * @returns {string} ID único de 64 caracteres
 */
function generarIdUnico() {
    // Generar 32 bytes de datos aleatorios (256 bits)
    const randomBytes = crypto.randomBytes(32);
    
    // Convertir a hexadecimal (64 caracteres)
    const id = randomBytes.toString('hex');
    
    return id;
}

module.exports = generarIdUnico;
