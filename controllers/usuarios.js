const bcryptjs = require('bcryptjs');
const { response } = require('express');
const { validationResult } = require('express-validator');
const fs = require('fs');
const { mapWordpressToUser } = require('../helpers/mapper-wordpress');
const path = require('path');

const Usuario = require('../models/usuario');
const WordpressUser = require('../models/usuarioWP');

const usuarioGet = async (req, res = response) => {
    const { uid } = req;
    try {
        let usuario = await Usuario.findByPk(uid);
        if (!usuario) {
            let wordpressUser = null;
            try { wordpressUser = await WordpressUser.findOne({ where: { ID: uid } }); } catch (_) {}
            if (!wordpressUser) return res.status(404).json({ msg: `No existe un usuario con el id ${uid}` });
            const mappedUser = mapWordpressToUser(wordpressUser);
            usuario = await Usuario.create({
                id: mappedUser.id, nombre: mappedUser.nombre, email: mappedUser.email,
                dni: mappedUser.dni || null, password: '', profileImage: mappedUser.profileImage || null,
            });
        }
        res.json({ usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, dni: usuario.dni, telefono: usuario.telefono, profileImage: usuario.profileImage } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener o sincronizar el usuario' });
    }
};

const usuarioPost = async (req, res = response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors);

    const { nombre, email, password, dni, telefono } = req.body;
    try {
        const existeEmail = await Usuario.findOne({ where: { email } });
        if (existeEmail) return res.status(400).json({ msg: 'Ese correo ya está registrado' });

        try {
            const existeEmailWP = await WordpressUser.findOne({ where: { user_email: email } });
            if (existeEmailWP) return res.status(400).json({ msg: 'Ese correo ya está registrado' });
        } catch (_) {}

        const salt = bcryptjs.genSaltSync();
        const hashedPassword = bcryptjs.hashSync(password, salt);
        const usuario = await Usuario.create({
            nombre, email, profileImage: 'default_profile_photo.png', password: hashedPassword, dni,
            ...(telefono ? { telefono } : {})
        });
        const { password: _pw, ...usuarioSafe } = usuario.get({ plain: true });
        res.status(201).json({ usuario: usuarioSafe });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al crear el usuario' });
    }
};

const cambiarPassword = async (req, res = response) => {
    const { uid } = req;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors);

    const { passwordActual, passwordNueva } = req.body;
    try {
        const usuario = await Usuario.findByPk(uid);
        if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

        const valido = bcryptjs.compareSync(passwordActual, usuario.password);
        if (!valido) return res.status(400).json({ msg: 'La contraseña actual no es correcta' });

        const salt = bcryptjs.genSaltSync();
        usuario.password = bcryptjs.hashSync(passwordNueva, salt);
        await usuario.save();
        res.json({ msg: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al cambiar la contraseña' });
    }
};

const updateUserImage = async (req, res = response) => {
    const { uid } = req;
    try {
        const usuario = await Usuario.findByPk(uid);
        if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });
        if (!req.file) return res.status(400).json({ msg: 'No se ha subido ninguna imagen' });
        if (usuario.profileImage) {
            const pathAnterior = path.join(__dirname, '../uploads/perfiles', usuario.profileImage);
            if (fs.existsSync(pathAnterior)) fs.unlinkSync(pathAnterior);
        }
        usuario.profileImage = req.file.filename;
        await usuario.save();
        res.json({ msg: 'Imagen actualizada correctamente', profileImage: usuario.profileImage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al actualizar la imagen' });
    }
};

const showUserImage = async (req, res = response) => {
    const safeName = path.basename(req.params.filename);
    if (!safeName || !/^[\w.\-]+$/.test(safeName)) return res.status(400).json({ msg: 'Nombre de archivo inválido' });
    const filePath = path.join(__dirname, '../uploads/perfiles', safeName);
    if (fs.existsSync(filePath)) return res.sendFile(filePath);
    return res.status(404).json({ msg: 'Imagen no encontrada' });
};

const showMyUserImage = async (req, res = response) => {
    try {
        const uid = req.uid;
        const user = await Usuario.findByPk(uid);
        if (!user || !user.profileImage) return res.status(404).json({ msg: 'Imagen no encontrada' });
        const filePath = path.join(__dirname, '../uploads/perfiles', user.profileImage);
        if (fs.existsSync(filePath)) return res.sendFile(filePath);
        return res.status(404).json({ msg: 'Imagen no encontrada en el servidor' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Error del servidor' });
    }
};

const updatePushToken = async (req, res = response) => {
    const { expoPushToken } = req.body;
    try {
        await Usuario.update({ expoPushToken }, { where: { id: req.uid } });
        res.json({ msg: 'Token push actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al actualizar el token push' });
    }
};

const updateProfile = async (req, res = response) => {
    const { uid } = req;
    const { nombre, telefono, dni } = req.body;
    try {
        const usuario = await Usuario.findByPk(uid);
        if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });
        if (nombre !== undefined) usuario.nombre = nombre;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (dni !== undefined) usuario.dni = dni;
        await usuario.save();
        const plain = usuario.get({ plain: true });
        const { password, resetToken, resetTokenExpira, ...safe } = plain;
        res.json({ msg: 'Perfil actualizado', usuario: safe });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al actualizar el perfil', error });
    }
};

module.exports = { usuarioGet, usuarioPost, cambiarPassword, updateUserImage, showUserImage, showMyUserImage, updatePushToken, updateProfile };
