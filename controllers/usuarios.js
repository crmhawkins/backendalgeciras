const bcryptjs = require('bcryptjs');
const { response } = require('express');
const { validationResult } = require('express-validator');
const fs = require('fs');
const { mapWordpressToUser } = require('../helpers/mapper-wordpress');
const path = require('path');

const Usuario = require('../models/usuario');
const WordpressUser = require('../models/usuarioWP'); // Importamos el modelo de WordPress

// Función para obtener un usuario, primero en la base de datos principal y luego en WordPress
const usuarioGet = async (req, res = response) => {
    const { uid } = req;

    try {
        // Intentamos obtener el usuario desde la base de datos principal
        let usuario = await Usuario.findByPk(uid);

        if (!usuario) {
            // Si no está, lo buscamos en la base de datos de WordPress
            const wordpressUser = await WordpressUser.findOne({ where: { ID: uid } });

            if (!wordpressUser) {
                return res.status(404).json({ msg: `No existe un usuario con el id ${uid}` });
            }

            // Mapeamos los datos de WordPress al formato esperado
            const mappedUser = mapWordpressToUser(wordpressUser);

            // Creamos el usuario en nuestra base de datos principal
            usuario = await Usuario.create({
                id: mappedUser.id,
                nombre: mappedUser.nombre,
                email: mappedUser.email,
                dni: mappedUser.dni || null, // si no hay DNI en WP
                password: '', // en blanco si viene de WP
                profileImage: mappedUser.profileImage || null,
                // puedes agregar más campos si tu modelo los requiere
            });
        }

        res.json({
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                dni: usuario.dni,
                profileImage: usuario.profileImage
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener o sincronizar el usuario' });
    }
};


// Función para crear un nuevo usuario, primero en la base de datos principal y luego en WordPress
const usuarioPost = async (req, res = response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors);

    const { nombre, email, password,dni } = req.body;  // Ahora no necesitamos los campos relacionados con Google

    try {
        // Verificamos si el email ya existe en la base de datos principal (futbol_db)
        const existeEmail = await Usuario.findOne({ where: { email } });

        // Verificamos si el email ya existe en la base de datos de WordPress
        const existeEmailWP = await WordpressUser.findOne({ where: { user_email: email } });

        if (existeEmailWP || existeEmail) {
            return res.status(400).json({ msg: 'Ese correo ya está registrado' });
        }

        // Encriptamos la contraseña
        const salt = bcryptjs.genSaltSync();
        const hashedPassword = bcryptjs.hashSync(password, salt);

        // Creamos el usuario en la base de datos principal (futbol_db)
        const usuario = await Usuario.create({
            nombre,
            email,
            profileImage:'default_profile_photo.png',
            password: hashedPassword,
            dni
        });

        // Respondemos con los datos del usuario recién creado
        res.status(201).json({ usuario });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al crear el usuario' });
    }
};


// Cambiar imagen del usuario
const updateUserImage = async (req, res = response) => {
    const { uid } = req; // uid viene del middleware de validación JWT
    console.log('🧠 req.uid recibido en controlador:', req.uid);

    try {
        const usuario = await Usuario.findByPk(uid);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (!req.file) {
            return res.status(400).json({ msg: 'No se ha subido ninguna imagen' });
        }

        // Eliminar imagen anterior si existe
        if (usuario.profileImage) {
            const pathAnterior = path.join(__dirname, '../uploads/perfiles', usuario.profileImage);
            if (fs.existsSync(pathAnterior)) {
                fs.unlinkSync(pathAnterior);
            }
        }

        // Guardar nuevo nombre de la imagen
        usuario.profileImage = req.file.filename;
        await usuario.save();
       
        res.json({ msg: 'Imagen actualizada correctamente', profileImage: usuario.profileImage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al actualizar la imagen' });
    }
};

const showUserImage = async (req, res = response) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/perfiles', filename);

    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }

    return res.status(404).json({
        msg: 'Imagen no encontrada'
    });
};

const showMyUserImage = async (req, res = response) => {
    try {
        const uid = req.uid;
        const user = await User.findById(uid);

        if (!user || !user.img) {
            return res.status(404).json({ msg: 'Imagen no encontrada o usuario no tiene imagen' });
        }

        const filePath = path.join(__dirname, '../uploads/perfiles', user.img);

        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }

        return res.status(404).json({ msg: 'Imagen no encontrada en el servidor' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Error del servidor' });
    }
};


module.exports = {
    usuarioGet,
    usuarioPost,
    updateUserImage,
    showUserImage,
    showMyUserImage
};
