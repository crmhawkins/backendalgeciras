/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const divMostrarAnuncios = document.getElementById('mostrarAnuncios');
const urlAnunciosGet = 'http://localhost:8080/api/anuncios';

export const obtenerAnuncios = async() => {

    try {
        const resp = await fetch( urlAnunciosGet );
        const data = await resp.json();
        console.log(data);
        if ( !resp.ok ) throw alert('No se pudo realizar la petición');

        return await resp.json();

    } catch (error) {
        throw error;
    }

    
}