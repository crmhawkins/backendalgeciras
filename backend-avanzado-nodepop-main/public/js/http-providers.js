/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const urlAnunciosGet = 'http://localhost:8080/api/anuncios';
let urlAnunciosImagenGet = 'http://localhost:8080/api/uploads/anuncios/';
let urlAnunciosId = 'http://localhost:8080/api/anuncios/';


const obtenerAnuncios = async() => {

    try {
        const resp = await fetch( urlAnunciosGet );
        const data = await resp.json();
        return data;

    } catch (error) {
        throw error;
    }
};

const obtenerImagenAnuncio = async( anuncio ) => {

    try {
        const resp = await fetch( urlAnunciosImagenGet + anuncio._id );
        return resp.url;

    } catch (error) {
        throw error;
    }
};

const obtenerAnuncioPorId = async( id ) => {

    try {
        const resp = await fetch( `${urlAnunciosId + id}` );

        const data = await resp.json();

        console.log(data);
        return resp;

    } catch (error) {
        throw error;
    }
};


export {
    obtenerAnuncios,
    obtenerImagenAnuncio,
    obtenerAnuncioPorId,
}