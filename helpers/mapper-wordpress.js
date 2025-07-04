const { WordpressUser } = require('../models/usuarioWP');

function mapWordpressToUser (WordpressUser) {
    return {
      id: WordpressUser.ID,
      nombre: WordpressUser.user_login, // 'user_login' de WordPress a 'username'
      email: WordpressUser.user_email,  // 'user_email' de WordPress a 'email'
      profileImage: null, // Lo mismo para la imagen del perfil
    };
};

module.exports = { mapWordpressToUser };