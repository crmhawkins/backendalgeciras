const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cote = require('cote');


const subirArchivo = async( files, extensionesValidas = ['png','jpg','jpeg','gif'], carpeta = '' ) => {

    return new Promise((resolve, reject) => {

        console.log(files);
        const { img } = files;
        const nombreCortado = img.name.split('.');
        const extension =  nombreCortado[nombreCortado.length - 1];

        // Validar la extension
        if ( !extensionesValidas.includes( extension ) ) {
            return reject(`La extensión ${ extension } no es permitida - ${ extensionesValidas }.`);
        };

        const nombreTemp = uuidv4() + '.' + extension;
        const uploadPath = path.join( __dirname, '../uploads/', carpeta, nombreTemp);

        const uploadPathThumbnail = path.join( __dirname, '../uploads/thumbnail/');

        const client = new cote.Requester({ name: 'servicio-thumbnail' });

        img.mv(uploadPath, (err) => {
            if (err){
                reject(err)
            };

            client.send({
                type: 'crear-thumbnail',   
    
                path: uploadPath,
                altura: 100,
                ancho: 100,
                nombre: nombreTemp,
                pathThumbnail: uploadPathThumbnail
    
            }, (response) =>{
                console.log('Respuesta Worker ',response);
                resolve( { nombreTemp, response } );   
            });
        });
    })
}


module.exports = {
    subirArchivo
}