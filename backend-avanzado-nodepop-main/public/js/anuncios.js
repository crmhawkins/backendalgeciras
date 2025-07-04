/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

import { obtenerAnuncios, obtenerImagenAnuncio } from './http-providers.js';
import * as CRUD from './crud.js'

const contenedor = document.querySelector('#contenedor');
let correlativo = 0;

export const crearAnunciosHtml = async( anuncio ) => {

    // Obtenemos la imgen del anuncio con una peticion
    const imgPath = await obtenerImagenAnuncio(anuncio);

    let estado;
    if ( anuncio.venta === true ) {
        estado = 'Venta'
    }else{
        estado = 'Buscando'
    }
    correlativo++;

    // Template
    const html = `
    <div class="card animate__delay-1s animate__animated animate__bounce animate__fadeIn" style="width: 400px;">
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

    divAnuncios.innerHTML = html;
    contenedor.append(divAnuncios);
}

export const editarAnuncio = async( id ) => {
    
    contenedor.innerHTML = '';
     
    const anuncio = await CRUD.getAnuncio(id);
    console.log(anuncio);

    const imgPath = await obtenerImagenAnuncio(anuncio);

    let estado;
    if ( anuncio.venta === true ) {
        estado = 'Venta'
    }else{
        estado = 'Buscando'
    }

    console.log(imgPath);

    const html = `
    <div class="card m-auto p-4" style="width: 90%;">
    <img src="${imgPath}" class="card-img-top img-fluid w-50" alt="...">
    <botton id="${anuncio._id}" class="btn btn-outline-info btn-sm my-4 editarImagen">Editar Imagen</botton>
        <div class="card-body">
                <form action="">
                    <div class="mb-3">
                        <label for="nombre" class="form-label">Nombre</label>
                        <input id="nombre" type="text" value="${anuncio.nombre}" name="nombre" class="form-control" aria-describedby="emailHelp">
                    </div><div class="mb-3">
                        <label for="precio" class="form-label">Precio</label>
                        <input type="number" value="${anuncio.precio}" name="precio" class="form-control" id="precio" name="precio">
                    </div>
                    <div class="mb-3">
                        <label for="venta" class="form-label">Venta</label>
                        <select name="venta" id="venta" class="form-select">
                            <option value="true">Venta</option>
                            <option value="false">Buscando</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="tags" class="form-label">Tags</label>
                        <input type="text" value="${anuncio.tags}" name="tags" class="form-control" id="tags">
                    </div>

                    <button class="btn btn-primary btnActualizar" id="${anuncio._id}">Actualizar</button>
                </form>
                </div>
                </div>

    `;

    const divAnuncios = document.createElement('div');
    divAnuncios.classList.add('d-inline-block');
    divAnuncios.classList.add('w-100');
    divAnuncios.id = 'contenedor';

    divAnuncios.innerHTML = html;
    contenedor.append(divAnuncios);

}

export const actualizarImagen = async( id ) => {

    contenedor.innerHTML = '';
    const anuncio = await CRUD.getAnuncio(id);
    console.log(anuncio);

    const imgPath = await obtenerImagenAnuncio(anuncio);

    let estado;
    if ( anuncio.venta === true ) {
        estado = 'Venta'
    }else{
        estado = 'Buscando'
    }

    console.log(imgPath);

    const html = `
    <div class="card m-auto p-4" style="width: 90%;">
        <img src="${imgPath}" class="card-img-top img-fluid w-50" alt="...">
            <div class="card-body">
                <form action="http://localhost:8080/api/uploads/anuncios/${anuncio._id}" method="put">
                    <div class="mb-3">
                        <label for="archivo" class="form-label">Nombre</label>
                        <input id="archivo" type="FILE" name="archivo"/>
                    </div>
                    <button class="btn btn-primary btnActualizarImagen" id="${anuncio._id}">Actualizar</button>
                </form>
                </div>
                </div>

    `;
    const divAnuncios = document.createElement('div');
    divAnuncios.classList.add('d-inline-block');
    divAnuncios.classList.add('w-100');
    divAnuncios.id = 'contenedor';

    divAnuncios.innerHTML = html;
    contenedor.append(divAnuncios);
}

export const init = async() => {
    const data = await obtenerAnuncios();
    data.anuncios.forEach(crearAnunciosHtml);
};

