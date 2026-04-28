const jwt = require('jsonwebtoken');

const generarJWT = ( uid = '' ) => {

    return new Promise( (resolve, reject) => {

        const payload = { uid };
        const expiresIn = '1h';
        
        // Calcular fecha de expiración
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 1);
        
        jwt.sign(payload,process.env.SECRETORPRIVATEKEY,{
            expiresIn: expiresIn
        }, (err, token) => {

            if (err) {
                console.log('❌ Error al generar JWT:', err);
                reject('No se pudo generar el token');
            }else{
                console.log(`✅ JWT generado para usuario ID: ${uid}`);
                console.log(`   Duración: ${expiresIn} (expira el ${expirationDate.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })})`);
                resolve( token );
            }
        })

    })

}


module.exports = {
    generarJWT
}