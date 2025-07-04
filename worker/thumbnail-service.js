

const { Responder } = require('cote');
const sharp = require('sharp');
const fs = require ('fs');
const responder = new Responder({ name: 'servicio-thumbnail' })

responder.on('crear-thumbnail', (req, done) => {
    const { path, altura, ancho, nombre, pathThumbnail } = req;

    if (!fs.existsSync(pathThumbnail)) { 
        console.log('No existe la carpeta');
        fs.mkdir(pathThumbnail, { recursive: true }, (err) => {
            if (err) throw err;
        });
    }

    const pathThumbnailImage = pathThumbnail+`${ancho}x${altura}-thumbnail-`+nombre;
    fs.copyFileSync (path, pathThumbnailImage);

    sharp(pathThumbnailImage).resize(ancho, altura).toBuffer(function(err, buffer) {
        fs.writeFile(pathThumbnailImage, buffer, function(e) {
        });
    });
   
    done(pathThumbnailImage);
  

});
