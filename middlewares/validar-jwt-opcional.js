const jwt = require('jsonwebtoken');

const validarJWTOpcional = (req, res, next) => {
    const token = req.header('x-token');
    if (!token) return next();
    try {
        const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
        req.uid = uid;
    } catch (_) {}
    next();
};

module.exports = { validarJWTOpcional };
