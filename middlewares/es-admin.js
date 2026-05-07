const esAdmin = (req, res, next) => {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    if (adminEmails.length === 0) return res.status(403).json({ msg: 'Acceso restringido a administradores' });
    // Get uid from req (set by validarJWT)
    const Usuario = require('../models/usuario');
    Usuario.findByPk(req.uid).then(u => {
        if (!u || !adminEmails.includes(u.email)) {
            return res.status(403).json({ msg: 'Acceso restringido a administradores' });
        }
        next();
    }).catch(() => res.status(500).json({ msg: 'Error verificando permisos' }));
};
module.exports = { esAdmin };
