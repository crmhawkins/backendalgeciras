const bcryptjs = require('bcryptjs');
const { response } = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Usuario = require('../models/usuario');
const { generarJWT } = require('../helpers/generarJWT');
const WordpressUser = require('../models/usuarioWP');
const {generateRandomPassword} = require('../helpers/password-generator');
const jwt = require('jsonwebtoken');

// Authenticate User
const authenticatePost = async (req, res = response) => {
    const { email, password } = req.body;

    try {
        const usuario = await Usuario.findOne({ where: { email } });

        // Check if the user exists in the MySQL database (futbol_db)
        if (!usuario) {
            const wpUser = await WordpressUser.findOne({ where: { user_email: email } });
        
            if (wpUser) {
                // Solo si lo encuentras en WordPress
                usuario = await Usuario.create({
                    nombre: wpUser.display_name || wpUser.user_nicename,
                    email: wpUser.user_email,
                    dni: null,
                    password: generateRandomPassword, // vacío o puedes generar aleatorio
                    profileImage: null,
                });
            }
        }
        

        // If user not found in both databases
        if (!usuario) {
            return res.status(400).json({ msg: 'Usuario / Password incorrectos - Email' });
        }

        // Validate password for both databases (check bcrypt for app users, plain for WordPress)
        let validPassword = false;
        if (usuario.password) {
            validPassword = bcryptjs.compareSync(password, usuario.password); // For your app's MySQL
        } else {
            validPassword = password === usuario.user_pass; // WordPress passwords are stored in plain text
        }

        if (!validPassword) {
            return res.status(400).json({ msg: 'Usuario / Password incorrectos - password' });
        }

        // Generate JWT token
        const token = await generarJWT(usuario.ID || usuario.id); // For WordPress users, it's `ID` and for app users, it's `id`

        res.json({
            usuario,
            token
        });

    } catch (error) {
        console.log('ERROR LOGIN:', error);  // 👈 Important to log errors for debugging
        return res.status(500).json({
            msg: 'Error del servidor. Contacte al administrador'
        });
    }    
}


const authenticateGoogleUser = async (req, res = response) => {
    let usuario;
    const {payload } = req; // Obtener el uid o los datos del usuario del middleware

    try {  
        
        if (!payload) {
            return res.status(400).json({ msg: 'El token de Google no contiene datos válidos' });
        }

        // Si existe `payload`, estamos trabajando con el token de Google
        if (payload) {
            // Buscamos al usuario por su payload en el payload de Google
            usuario = await Usuario.findOne({ where: { email: payload.email } });

            // Si no encontramos el usuario en nuestra base de datos, lo buscamos en la base de datos de WordPress
            if (!usuario) {
                usuario = await WordpressUser.findOne({ where: { user_email: payload.email } });    
            }
        }

        // Si no encontramos al usuario en ninguna de las bases de datos
        if (!usuario) {
            const password = generateRandomPassword();
            const salt = bcryptjs.genSaltSync();
            const hashedPassword = bcryptjs.hashSync(password, salt);
            usuario = await Usuario.create({
                nombre: payload.name,
                email: payload.email,
                dni: payload.dni? payload.dni : null,
                password: hashedPassword,
            });
        }

        // Generamos el JWT para este usuario
        const token = await generarJWT(usuario.ID || usuario.id); // Usamos `ID` si es de WordPress, o `id` si es de la app

        res.json({
            token
        });

    } catch (error) {
        console.log('ERROR LOGIN:', error);
        return res.status(500).json({
            msg: 'Error del servidor. Contacte al administrador'
        });
    }    
};

const enviarRecuperacion = async (req, res = response) => {
    const { email } = req.body;

    try {
        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario) {
            return res.status(404).json({ msg: 'No existe un usuario con ese email' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiracion = new Date(Date.now() + 60 * 60 * 1000); 

        usuario.resetToken = token;
        usuario.resetTokenExpira = expiracion;
        await usuario.save();

        const resetLink = `${req.protocol}://${req.headers.host}/reset-password.html?token=${token}`;

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_ENCRYPTION === 'ssl',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: 'Algeciras CF <dani.mefle@hawkins.es>',
            to: email,
            subject: 'Recuperación de contraseña - Algeciras CF',
            html: `
                <h2>¿Has olvidado tu contraseña?</h2>
                <p>Haz clic en el siguiente enlace para restablecerla:</p>
                <a href="${resetLink}">Recuperar contraseña</a>
                <p>Este enlace expirará en 1 hora.</p>
            `
        });

        res.json({ msg: 'Correo de recuperación enviado' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al enviar email de recuperación' });
    }
};

const resetPassword = async (req, res = response) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const usuario = await Usuario.findOne({
            where: {
                resetToken: token,
                resetTokenExpira: { [require('sequelize').Op.gt]: new Date() }
            }
        });

        if (!usuario) {
            return res.status(400).json({ msg: 'Token inválido o expirado' });
        }

        const salt = bcryptjs.genSaltSync();
        const hashedPassword = bcryptjs.hashSync(password, salt);

        usuario.password = hashedPassword;
        usuario.resetToken = null;
        usuario.resetTokenExpira = null;

        await usuario.save();

        res.json({ msg: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al actualizar la contraseña' });
    }
};

const logInMysql= async (req, res = response) => {
  const { token } = req.params;

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, usuario.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ msg: 'Contraseña incorrecta' });
    }

    req.uid = usuario.id;
    return res.json({ msg: 'Logueado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al loguear' });
  }
};
const logInWordpress = async (req, res = response) => {
    const uid = req.uid;
  
    try {
      // 1. Buscar usuario
      const usuario = await Usuario.findByPk(uid);
      if (!usuario) {
        return res.status(404).json({ msg: 'Usuario no encontrado' });
      }
  
      // 2. Verificar que el usuario tenga email
      if (!usuario.email) {
        return res.status(400).json({ msg: 'El usuario no tiene email asociado' });
      }
  
      // 3. Generar JWT temporal para WordPress (válido 2 minutos)
      const expiresIn = '2m';
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 2);
      
      const token = jwt.sign(
        {
          email: usuario.email,
          origen: 'app_mobile'
        },
        process.env.SECRET_KEY_WORDPRESS, // Usa una clave diferente a tu auth principal
        {
          expiresIn: expiresIn
        }
      );

      console.log(`✅ JWT temporal generado para WordPress (usuario: ${usuario.email})`);
      console.log(`   Duración: ${expiresIn} (expira el ${expirationDate.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })})`);

      // 4. Crear URL de autologin en WordPress
      const autologinUrl = `https://tienda.algecirasclubdefutbol.com/wp-login-auto?token=${token}`;

      return res.json({ autologinUrl });
  
    } catch (err) {
      console.error('❌ Error en logInWordpress:', err.message);
      return res.status(500).json({ msg: 'Error al generar token para WordPress' });
    }
  };
module.exports = {
    authenticatePost,
    authenticateGoogleUser,
    enviarRecuperacion,
    resetPassword,
    logInWordpress
};
