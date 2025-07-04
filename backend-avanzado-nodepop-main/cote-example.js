'use strict';

const { Responder } = require('cote');

const rates = {

}


const responder = new Responder({ name: 'servicio-thumbnail' })

responder.on('crear-thumbail', (req, done) => {
    const { path, altura, ancho } = req

    console.log('servicio:', path, altura, ancho);

    const resultado = 'abc123';

    done(resultado);
})