/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

import { obtenerAnuncios, obtenerImagenAnuncio } from './http-providers.js';
import * as CRUD from './crud.js'

let correlativo = 0;
const contenedor = document.querySelector('#anunciosFiltro');
const contenedors = document.querySelector('#contenedor');


const crearAnunciosHtmls = async( anuncio ) => {

        const imgPath = await obtenerImagenAnuncio(anuncio);

        let estado;
        if ( anuncio.venta === true ) {
            estado = 'Venta'
        }else{
            estado = 'Buscando'
        }
        correlativo ++;

        const html = `
        <div class="card" style="width: 400px;">
            <img src="${imgPath}" class="card-img-top" alt="...">
            <div class="card-body">
            <botton id="${anuncio._id}" class="btn btn-outline-info btn-sm my-4 editarImagen">Editar Imagen</botton>
                <h5 class="card-title">${anuncio.nombre}</h5>
                <p class="card-text">Precio: ${anuncio.precio}</p>
                <p class="card-text">Estado: ${estado}</p>
                <p class="card-text">Tags: ${anuncio.tags}</p>
                <botton id="${anuncio._id}" class="btn btn-primary btnEditar">Editar Anuncio</botton>
            </div>
        </div>
        `;
        const divAnuncios = document.createElement('div');
        divAnuncios.classList.add('d-inline-block');
        divAnuncios.classList.add('m-2');
        divAnuncios.id='contenedor';
    
        divAnuncios.innerHTML = html;
        contenedors.appendChild(divAnuncios);
}

const obtenerAnunciosFiltrados = async(filtros) => {

    const data = await CRUD.filtrarAnuncios(filtros);
    contenedors.innerHTML = '';

    data.anuncios.forEach(crearAnunciosHtmls );
        if (data.anuncios == 0) {
            const divAnuncios = document.createElement('div');
            divAnuncios.id='contenedor';
            divAnuncios.classList.add('d-inline-block');
            divAnuncios.classList.add('m-2');
        
            divAnuncios.innerHTML = '<h3>No se encontraron anuncios con esas caracteristicas</h3>';
            contenedors.appendChild(divAnuncios);
        }

}



export {
    obtenerAnunciosFiltrados
}