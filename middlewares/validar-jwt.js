const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET); // Reemplaza con tu Google Client ID
const { request, response } = require('express');


const validarJWT = async (req = request, res = response, next) => {
    const authHeader = req.header('Authorization');
    const xToken = req.header('x-token');
    const googleToken = req.header('Google-Token');

    let token;

    // 1. Prioridad a Authorization Bearer
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
    } else if (xToken) {
        token = xToken;
    }

    // 2. Verificamos JWT (Bearer o x-token)
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
            req.uid = decoded.uid;
            return next();
        } catch (error) {
            // Diferenciar entre diferentes tipos de errores de JWT
            if (error.name === 'TokenExpiredError') {
                console.log('❌ JWT expirado:', error.message);
                return res.status(401).json({ 
                    msg: 'Token JWT expirado. Por favor, inicia sesión nuevamente.',
                    error: 'jwt_expired',
                    expiredAt: error.expiredAt
                });
            } else if (error.name === 'JsonWebTokenError') {
                console.log('❌ JWT inválido:', error.message);
                return res.status(401).json({ 
                    msg: 'Token JWT inválido',
                    error: 'jwt_invalid'
                });
            } else {
                console.log('❌ Error al verificar JWT:', error.message);
                return res.status(401).json({ 
                    msg: 'Error al verificar el token',
                    error: 'jwt_error'
                });
            }
        }
    }

    // 3. Si no hay JWT válido, intentamos con token de Google
    if (googleToken) {
        try {
            const ticket = await client.verifyIdToken({
                idToken: googleToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            req.uid = payload.sub;
            req.payload = payload;
            return next();
        } catch (error) {
            console.log('❌ Token de Google inválido:', error.message);
            return res.status(401).json({ msg: 'Token de Google inválido' });
        }
    }

    // 4. Si no hay ningún tipo de token válido
    return res.status(401).json({ msg: 'No se encontró un token válido en la petición' });
};

module.exports = { validarJWT };